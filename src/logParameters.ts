import { LogLevel } from "./constants";
import { LogMeta, LoggingConfig } from "./types";

export type LogParameterPayload = {
  config: LoggingConfig;
  level: LogLevel;
  context: string[];
  timestamp?: string;
  app?: string;
  separator?: string;
  correlationId?: string;
  rawMessage: string;
  filteredMessage: string;
  meta?: LogMeta;
  metaString?: string;
  stack?: string;
  stackLabel?: string;
  applyTheme(value: string, type: string): string;
};

export interface LogParameterDescriptor {
  key: string;
  render(payload: LogParameterPayload): string | undefined;
  style?(rendered: string, payload: LogParameterPayload): string;
  shouldInclude?(payload: LogParameterPayload): boolean;
}

export interface LogPatternLiteralSegment {
  type: "literal";
  value: string;
}

export interface LogPatternParameterSegment {
  type: "parameter";
  key: string;
}

export interface LogPatternOptionalSegment {
  type: "optional";
  prefix: string;
  suffix: string;
  children: LogPatternSegment[];
}

export type LogPatternSegment =
  | LogPatternLiteralSegment
  | LogPatternParameterSegment
  | LogPatternOptionalSegment;

export type LogPatternDefinition = {
  pattern: string;
  segments: LogPatternSegment[];
  keys: string[];
  includesMeta: boolean;
};

export class LogParameterRegistry {
  private readonly descriptors = new Map<string, LogParameterDescriptor>();

  register(descriptor: LogParameterDescriptor) {
    this.descriptors.set(descriptor.key, descriptor);
    return this;
  }

  unregister(key: string) {
    this.descriptors.delete(key);
    return this;
  }

  get(key: string): LogParameterDescriptor | undefined {
    return this.descriptors.get(key);
  }

  render(payload: LogParameterPayload, keys: string[]) {
    const rendered: Record<string, string> = {};
    const seen = new Set<string>();
    keys.forEach((key) => {
      if (seen.has(key)) return;
      seen.add(key);
      const descriptor = this.descriptors.get(key);
      if (!descriptor) return;
      if (descriptor.shouldInclude && !descriptor.shouldInclude(payload)) {
        return;
      }
      const raw = descriptor.render(payload);
      if (raw === undefined) return;
      const styled = descriptor.style ? descriptor.style(raw, payload) : raw;
      rendered[key] = styled;
    });
    return rendered;
  }

  keys() {
    return Array.from(this.descriptors.keys());
  }
}

const patternCache = new Map<string, LogPatternDefinition>();

export function compileLogPattern(pattern: string): LogPatternDefinition {
  if (patternCache.has(pattern)) {
    return patternCache.get(pattern)!;
  }
  const segments = parsePatternSegments(pattern || "");
  const seen = new Set<string>();
  const orderedKeys: string[] = [];
  collectPatternKeys(segments, seen, orderedKeys);
  const definition: LogPatternDefinition = {
    pattern,
    segments,
    keys: orderedKeys,
    includesMeta: seen.has("meta"),
  };
  patternCache.set(pattern, definition);
  return definition;
}

export function renderPattern(
  definition: LogPatternDefinition,
  rendered: Record<string, string>
): string {
  return renderPatternSegments(definition.segments, rendered).text;
}

function parsePatternSegments(pattern: string): LogPatternSegment[] {
  const segments: LogPatternSegment[] = [];
  let index = 0;
  while (index < pattern.length) {
    const char = pattern[index];
    if (char === "[") {
      const closingIndex = findClosingBracket(pattern, index, "[", "]");
      if (closingIndex === -1) {
        segments.push({ type: "literal", value: "[" });
        index++;
        continue;
      }
      const inner = pattern.slice(index + 1, closingIndex);
      segments.push({
        type: "optional",
        prefix: "[",
        suffix: "]",
        children: parsePatternSegments(inner),
      });
      index = closingIndex + 1;
      continue;
    }
    if (char === "{") {
      const closingIndex = pattern.indexOf("}", index + 1);
      if (closingIndex === -1) {
        segments.push({ type: "literal", value: "{" });
        index++;
        continue;
      }
      const key = pattern.slice(index + 1, closingIndex).trim();
      segments.push({ type: "parameter", key });
      index = closingIndex + 1;
      continue;
    }
    let literalEnd = index;
    while (
      literalEnd < pattern.length &&
      pattern[literalEnd] !== "[" &&
      pattern[literalEnd] !== "{"
    ) {
      literalEnd++;
    }
    const literal = pattern.slice(index, literalEnd);
    if (literal.length) {
      segments.push({ type: "literal", value: literal });
    }
    index = literalEnd;
  }
  return segments;
}

function findClosingBracket(
  input: string,
  startIndex: number,
  open: string,
  close: string
): number {
  let depth = 0;
  for (let idx = startIndex; idx < input.length; idx++) {
    const char = input[idx];
    if (char === open) {
      depth++;
    } else if (char === close) {
      depth--;
      if (depth === 0) return idx;
    }
  }
  return -1;
}

function collectPatternKeys(
  segments: LogPatternSegment[],
  seen: Set<string>,
  orderedKeys: string[]
) {
  for (const segment of segments) {
    if (segment.type === "parameter") {
      if (!seen.has(segment.key)) {
        seen.add(segment.key);
        orderedKeys.push(segment.key);
      }
    }
    if (segment.type === "optional") {
      collectPatternKeys(segment.children, seen, orderedKeys);
    }
  }
}

type PatternRenderResult = {
  text: string;
  hasValue: boolean;
};

function renderPatternSegments(
  segments: LogPatternSegment[],
  rendered: Record<string, string>
): PatternRenderResult {
  const buffer: string[] = [];
  let hasValue = false;
  for (const segment of segments) {
    const result = renderSegment(segment, rendered);
    if (result.text.length) {
      buffer.push(result.text);
    }
    hasValue = hasValue || result.hasValue;
  }
  return { text: buffer.join(""), hasValue };
}

function renderSegment(
  segment: LogPatternSegment,
  rendered: Record<string, string>
): PatternRenderResult {
  if (segment.type === "literal") {
    return { text: segment.value, hasValue: false };
  }
  if (segment.type === "parameter") {
    const value = rendered[segment.key] ?? "";
    return { text: value, hasValue: value.length > 0 };
  }
  const childResult = renderPatternSegments(segment.children, rendered);
  if (!childResult.hasValue) {
    return { text: "", hasValue: false };
  }
  return {
    text: `${segment.prefix}${childResult.text}${segment.suffix}`,
    hasValue: true,
  };
}

const registry = new LogParameterRegistry();

const registerDefault = () => {
  registry
    .register({
      key: "level",
      render(payload) {
        if (payload.config.logLevel === false) return undefined;
        return payload.level.toUpperCase();
      },
      style(rendered, payload) {
        return payload.applyTheme(rendered, "logLevel");
      },
    })
    .register({
      key: "timestamp",
      shouldInclude(payload) {
        return Boolean(payload.config.timestamp && payload.timestamp);
      },
      render(payload) {
        return payload.timestamp;
      },
      style(rendered, payload) {
        return payload.applyTheme(rendered, "timestamp");
      },
    })
    .register({
      key: "app",
      shouldInclude(payload) {
        return Boolean(payload.app);
      },
      render(payload) {
        return payload.app;
      },
      style(rendered, payload) {
        return payload.applyTheme(rendered, "app");
      },
    })
    .register({
      key: "context",
      shouldInclude(payload) {
        return payload.config.context !== false && payload.context.length > 0;
      },
      render(payload) {
        const separator = payload.config.contextSeparator || ".";
        return payload.context.join(separator);
      },
      style(rendered, payload) {
        return payload.applyTheme(rendered, "class");
      },
    })
    .register({
      key: "separator",
      shouldInclude(payload) {
        return Boolean(payload.separator);
      },
      render(payload) {
        return payload.separator;
      },
      style(rendered, payload) {
        return payload.applyTheme(rendered, "separator");
      },
    })
    .register({
      key: "message",
      render(payload) {
        return payload.filteredMessage;
      },
      style(rendered, payload) {
        return payload.applyTheme(rendered, "message");
      },
    })
    .register({
      key: "stack",
      shouldInclude(payload) {
        return Boolean(payload.stack);
      },
      render(payload) {
        return payload.stack;
      },
      style(rendered, payload) {
        return payload.applyTheme(rendered, "stack");
      },
    })
    .register({
      key: "meta",
      shouldInclude(payload) {
        return Boolean(payload.metaString);
      },
      render(payload) {
        return payload.metaString;
      },
    })
    .register({
      key: "correlationId",
      shouldInclude(payload) {
        return Boolean(payload.correlationId);
      },
      render(payload) {
        return payload.correlationId;
      },
      style(rendered, payload) {
        return payload.applyTheme(rendered, "id");
      },
    });
};

registerDefault();

export const logParameterRegistry = registry;
