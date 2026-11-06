# Changelog — AutomationMarketplace

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
