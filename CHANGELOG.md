# Changelog — AutomationMarketplace

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-06

### Added
- **Stable v1.0.0 Production Release**.
- Formal Draft-07 JSON Schema export (`automation-marketplace schema`) for IDE autocomplete, validation, and automated CI pipelines.
- Direct Home Assistant Blueprint format export (`automation-marketplace export <id> --format blueprint`).
- Machine-readable `--json` output flags for `check-conflicts` and `test-rollback` for automated CI/CD verification workflows.
- Multi-Automation Conflict & Clash Detector (`src/core/conflicts.ts`) detecting actuator collisions, circular ping-pong loops, and trigger contentions.
- Multi-step Sequential Scenario Simulation (`src/core/simulator.ts`).
- Home Assistant Package Bundler (`src/adapters/bundle.ts`) packaging automations and deduplicated helper definitions (`input_boolean`, `input_number`, `timer`).
- Directory and manifest scanner (`src/adapters/loader.ts`).
- Complete verified catalog with 7 production-ready automations spanning climate, energy, safety, security, lighting, and air quality.
- 40 passing tests across 14 test suites with 100% pass rate.

## [0.3.0-beta] - 2026-11-06

### Added
- Multi-Automation Conflict & Clash Detector (`src/core/conflicts.ts`).
- Multi-step Scenario Simulation (`src/core/simulator.ts`).
- Home Assistant Package Bundler (`src/adapters/bundle.ts`).
- Directory & Manifest Loader (`src/adapters/loader.ts`).
- Extended catalog entries (`away-mode-lock-secure`, `air-quality-ventilation-boost`).

## [0.2.0-alpha] - 2026-11-06

### Added
- Rollback Verification Engine (`src/core/rollback.ts`).
- Home Assistant Blueprint Adapter (`src/adapters/blueprint.ts`).
- Markdown Audit Reporter (`src/adapters/report.ts`).
- Extended catalog entries (`water-leak-main-shutoff`, `solar-excess-water-heater`).
- Dynamic runtime registry in `src/core/catalog.ts`.

## [0.1.0] - 2026-11-06

### Added
- Initial release of `AutomationMarketplace`.
- Core Automation Manifest specification (`AutomationManifest`).
- Built-in verified Home Assistant automations (`thermostat-window-saver`, `night-presence-soft-light`, `fridge-door-alarm-guard`).
- Safety & Risk Analyzer.
- Deterministic simulation engine.
- CLI tool (`automation-marketplace`).
