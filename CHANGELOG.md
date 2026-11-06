# Changelog — AutomationMarketplace

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0-beta] - 2026-11-06

### Added
- Multi-Automation Conflict & Clash Detector (`src/core/conflicts.ts`):
  - Detects actuator collisions when multiple automations command opposing states on shared devices (`ActuatorClash`).
  - Detects infinite circular ping-pong loops between cross-triggering automations (`CrossTriggerLoop`).
  - Detects shared resource contention on simultaneous triggers.
- Multi-step Scenario Simulation (`src/core/simulator.ts`):
  - `simulateScenario` allows defining and testing complex sequential triggers with state verification.
- Home Assistant Package Bundler (`src/adapters/bundle.ts`):
  - Packages multiple automations and deduplicated helpers (`input_boolean`, `input_number`, `timer`) into a clean `packages/*.yaml` file ready for Home Assistant deployment.
- Directory & Manifest Loader (`src/adapters/loader.ts`):
  - Recursively discovers, validates, and registers manifests and blueprints from local directories.
- Extended Catalog entries:
  - `away-mode-lock-secure`: deadbolt motorized lock automation with departure debounce and perimeter check.
  - `air-quality-ventilation-boost`: heat recovery ventilator (HRV/VMC) speed control on CO2 threshold with hysteresis.
- New CLI commands: `check-conflicts <ids>`, `bundle <ids>`, `simulate-scenario <id>`, and `import <dir>`.
- Expanded test suite to 36 tests across 13 suites with 100% pass rate.

## [0.2.0-alpha] - 2026-11-06

### Added
- Rollback Verification Engine (`src/core/rollback.ts`): verifies that documented rollback procedures completely restore initial baseline states after simulated execution.
- Home Assistant Blueprint Adapter (`src/adapters/blueprint.ts`): parses blueprint headers, extracts inputs, and auto-scaffolds marketplace manifests.
- Markdown Audit Reporter (`src/adapters/report.ts`): generates formatted GitHub Flavored Markdown pre-flight audit reports.
- Extended verified catalog in `src/catalog/builtins.ts`:
  - `water-leak-main-shutoff`: emergency main plumbing shutoff valve with critical push alert.
  - `solar-excess-water-heater`: photovoltaic surplus diverter for boiler immersion heating element with 5-minute sustain debounce.
- Dynamic runtime registry in `src/core/catalog.ts` via `registerAutomation`.
- Deep safety risk boundary rules in `src/core/analyzer.ts`: recursive trigger loop detection, thermal cycling debounce verification, unattended lock checks.
- CLI commands: `test-rollback <id>`, `audit <file> [--report-md]`, and `scaffold <id> [--blueprint]`.
- Expanded test suite to 28 tests across 9 test suites with 100% pass rate.

## [0.1.0] - 2026-11-06

### Added
- Initial MVP release of `AutomationMarketplace`.
- Core Automation Manifest specification (`AutomationManifest`) with strict schema validation.
- Built-in verified Home Assistant automation catalog:
  - `thermostat-window-saver`: HVAC/radiator shutdown on open window with frost-protection and compressor debounce.
  - `night-presence-soft-light`: Low-intensity path lighting with automatic timeout and manual bypass.
  - `fridge-door-alarm-guard`: Escalated notification guard on fridge door ajar or high temperature.
- Safety & Risk Analyzer with actuator boundary checks, severity rating, and automated pre-flight checklist.
- Deterministic simulation engine verifying state transitions, triggers, and expected service calls without real hardware.
- Native CLI tool (`automation-marketplace`) with `list`, `show`, `validate`, `simulate`, and `export` commands.
- Dual licensing setup: AGPL-3.0-only and Commercial License.
- Complete documentation, architecture guide, launch checklist, CI workflow, and test suite.
