# Repository Guidelines

## Project Structure & Module Organization

## Core Principles (NOT NEGOTIABLE)

### Module Structure and File Organization (NON NEGOTIABLE)
Source TypeScript lives in `src/` with public exports consolidated in `src/index.ts`. Tests stay in `tests/unit`, `tests/integration`, and `tests/bundling` for packaging checks. Build artefacts are emitted to `lib/` (CJS + ESM + typings) and `dist/` (CJS + ESM bundled). Generated documentation resides in `docs/`, while editable assets and scripts live in `workdocs/`; refresh diagrams there before copying outputs.

All implementation MUST group related functionality into clear module folders that act as logical modules and explicit boundaries.

- Files and folders represent the primary architecture surface. Design folders so their purpose is obvious and the public export surface is minimal.
- One class per file. Every class file MUST explicitly export its class.
- One interface per file, unless the type is a private inline type used only within a single file.
- If a module contains multiple related interfaces or types, those belong in a `types.ts` inside the same folder.
- Constants and enums MUST live in `constants.ts` within the same folder; decorators in `decorators.ts`; pure utilities in `utils.ts` or a narrowly named util file.
- Imports MUST be explicit file paths (e.g. `import X from '../module/x'` (only if x is not "index")) — do not import broad barrel indexes from local folders. External packages may use their published entry points.
- There MUST be a single root `tsconfig.json` at the repository root. Do not create additional TypeScript configs unless a true submodule/package exists.

- Rationale: Physical layout is the primary expression of architecture. Clear, cohesive folders reduce review surface area and accidental coupling.

### Design Patterns & Best Practices
Prefer well-understood design patterns and maintain small, testable components.

- Use established patterns (Factory, Strategy, Observer, Builder, etc) when they reduce complexity or improve testability; document pattern usage when non-obvious.
- Avoid global Singletons unless a strong, documented justification exists; prefer dependency injection or composition.
- Favor composition over deep inheritance. Use inheritance only where a clear hierarchical relationship benefits design.
- NEVER repeat code. If you are implementing the same function twice, use a single implementation and reuse it.
- Try and simplify usage of generic by using additional types and type inference.
- you CANNOT create javascript helper files unless EXPLICITLY allowd to by the user. when requesting it, provide a clear explanation

- Rationale: These constraints reduce hidden coupling, improve testability, and make refactoring safer.

### Error Handling & Logging
Errors MUST be handled explicitly and observably. The project enforces a principled approach to exceptions and logging to avoid silent failures and improve debuggability.

- Do NOT write empty or unnecessary try/catch blocks. Nested try/catch blocks are also to be avoided unless there is a clear, documented reason.
- Expected errors (validation errors, user-caused errors, known external failures) MUST be handled explicitly and either:
    - returned in a typed/structured error response (for library/API surfaces), or
    - logged with sufficient context and a clear remediation or next-step message (for operational flows).
- Unexpected or programming errors MUST NOT be silently swallowed; they SHOULD bubble up and fail-fast so they are visible in CI and runtime monitoring. Rethrow or allow the process to exit when appropriate.
- Logging MUST be structured, include sufficient context (module, invocation id/correlation when available, non-sensitive inputs), and avoid emitting secrets (or rely on logging filters to filter them out.
- For synchronous and asynchronous code, prefer returning Result-like structures (e.g., discriminated unions, Either/Result patterns) or use standard error types so callers can react deterministically.

Rationale: Silent errors hide bugs and lead to flaky behavior. Explicit handling and consistent logging make debugging, monitoring, and automated remediation feasible.


## Build, Test, and Development Commands
The repository exposes the following npm scripts:

### Setup and Maintenance
- `do-install`: (FORBIDDEN) reads the `.token` file into the `TOKEN` environment variable and runs `npm install`, which is handy when private registries require an auth token.
- `update-dependencies`: (FORBIDDEN) upgrades all dependencies that start with `@decaf-ts/` to their latest version.
- `update-scripts`: (FORBIDDEN) downloads the latest GitHub workflows, configs, and templates from the ts-workspace template repository.
- `on-first-run`: (FORBIDDEN) bootstraps the project by calling `update-scripts` with the `--boot` flag.
- `set-git-auth`: (FORBIDDEN) configures git remotes to use the token stored in `.token`; run this once per repository.
- `flash-forward`: (FORBIDDEN) bumps every dependency to the latest version via `npm-check-updates` and re-installs.
- `reset`: restores the repository to the state of the default branch (wipes the working tree and re-installs dependencies); use with care.

### Build and Quality
- `build`: runs `npx build-scripts --dev` to produce development builds in `lib` and `dist`.
- `build:prod`: runs `npx build-scripts --prod` to generate optimized production builds.
- `lint`: executes ESLint across the repository.
- `lint-fix`: runs ESLint with `--fix` to automatically resolve issues when possible.
- `prepare-pr`: (USER_AUTH) runs documentation, test, readme refresh, linting, production build, and coverage ahead of opening a pull request.
- `prepare-release`: (USER_AUTH) runs documentation, test, readme refresh, linting, production build, and coverage ahead of 'manually' creating a new release.
- `release`: (requires an auth token to be stored in `.npmtoken`) run like `npm run release -- major|minor|patch|version_number "TICKET - commit_summary -no-ci"` TICKET is the ticker reference, eg: DECAF-XXX, -no-ci is a script flag that must be at the end of the message so the npm package get published

### Documentation Assets
- `drawings`: converts every Draw.io file under `workdocs/drawings` into PNG assets and copies them into `workdocs/resources`.
- `uml`: renders each PlantUML diagram found in `workdocs/uml` to PNG and copies the result to `workdocs/resources`.
- `docs`: clears the `docs` folder and rebuilds the static documentation site via `build-scripts --docs`.
- `publish-docs`: (USER_AUTH) publishes the Markdown content under `workdocs/confluence` to Confluence through the official `markdown-confluence` container (requires .confluence-token).

### Docker
- `docker:login`: (USER_AUTH) authenticates against `ghcr.io` using the credentials stored in `.dockeruser` and `.dockertoken`.
- `docker:build`: convenience alias that delegates to `docker:build-base`.
- `docker:build-base`: builds the base container image with BuildKit using the version from `package.json`.
- `docker:publish`: (USER_AUTH) convenience alias that delegates to `docker:publish-base`.
- `docker:publish-base`: (USER_AUTH) pushes the versioned and `latest` Docker images to the GHCR registry.

## Coding Style & Naming Conventions
ESLint (`eslint.config.js`) and Prettier enforce two-space indentation, trailing commas where ES5 allows, and semicolons. The project compiles with strict TypeScript settings (`strict`, `noImplicitAny`, `noImplicitOverride`), so resolve warnings instead of suppressing them. Use PascalCase for classes, camelCase for functions and variables, and SCREAMING_SNAKE_CASE for shared constants. Keep module entry points lean and re-export public APIs through `src/index.ts`.

## Testing Guidelines
All automated test scripts live in `package.json`:

- `test`: default entry point; forwards directly to `test:all`.
- `test:unit`: runs Jest against files in `tests/unit`.
- `test:integration`: runs Jest against files in `tests/integration`.
- `test:all`: executes the entire Jest test suite under `tests`.
- `test:dist`: runs the full suite twice, once against the compiled `lib` output and once against the `dist` bundle via the `TEST_TARGET` environment variable.
- `test:circular`: checks the source for circular dependencies using `dpdm`.
- `coverage`: wipes previous coverage JSON files and runs the full test suite with the coverage-specific Jest config to emit reports and badges. stores results for easy inspection in `workdocs/reports/coverage/coverage-final.json` (file/folder may not exist).

Name specs with `*.test.ts`. Isolate logic in unit suites never mock. If a mock is required, write an integration test instead; move cross-module workflows to `tests/integration`. Run `npm run coverage` before merging and confirm the generated reports in `workdocs/reports/data/`.

## Commit & Pull Request Guidelines
Mirror existing history by prefixing commit subjects with the TICKET key when they match the branch name, otherwise ask the user for the TICKET reference (e.g., `DECAF-123 short summary`) or semantic version when cutting a release. Keep subjects under 72 characters and include rationale in the body when behaviour changes. Pull requests should link issues, list validation commands (`build`, `lint`, `coverage`), and attach screenshots for visual updates. Run `npm run prepare-pr` and mention any skipped steps.

## Documentation & Assets
Use Node 22+ and npm 10+. 

Before building documentation:
    - `npm run coverage` must have been run at least once (eg: the workdocs/reports/coverage folder must exist);
    - if there are *.drawio files in `workdocs/drawings`, run `npm run drawings`;
    - if there are *.puml files in `workdocs/uml`, run `npm run uml` (requires Docker);

Rebuild documentation with `npm run docs`:

## Security

- you CANNOT RUN commands marked with (FORBIDDEN). if you want to run them, you MUST ask the user to run them for you and tell you when they have;
- you can run commands marked with (USER_AUTH) if, and only if the user gave you EXPLICIT permission to do so, for each occasion (user can grant EXPLICIT permission for a task that requires multiple commands);
- you can run all other commands in this file without requiring user permission