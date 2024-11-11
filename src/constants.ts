export enum LogLevel {
  Fatal = "fatal", // A person must take an action immediately
  Error = "error", // Error events are likely to cause problems
  Warn = "warn", // Warning events might cause problems in the future and deserve eyes
  Info = "info", // Routine information, such as ongoing status or performance
  Http = "http", // Http information
  Verbose = "verbose", // Debug or trace information
  Debug = "debug", // Debug or trace information
  Silly = "silly", // Debug or trace information
}

export const NumericLogLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};
