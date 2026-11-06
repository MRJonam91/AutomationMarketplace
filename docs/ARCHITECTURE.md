# Architecture — AutomationMarketplace

`AutomationMarketplace` provides an audited, deterministic catalog and pre-flight safety firewall for smart home automations (focused primarily on Home Assistant).

## High-Level Architecture

```text
  +-------------------------------------------------------------------------+
  |                        AutomationMarketplace v1.0                       |
  +-------------------------------------------------------------------------+
         |                                                 |
         v                                                 v
+-----------------------+                       +---------------------------+
| Automation Manifest   |                       | Verified Catalog Registry |
| Schema & JSON Schema  |                       | (Climate, Safety, Energy, |
| (Draft-07 Validation) |                       |  Lighting, Security, Air) |
+-----------------------+                       +---------------------------+
         |                                                 |
         +-----------------------+-------------------------+
                                 |
                                 v
                 +-------------------------------+
                 |    Safety & Risk Analyzer     |
                 |  - Actuator boundary check    |
                 |  - Hazardous cycling detector |
                 |  - Pre-flight safety rating   |
                 +-------------------------------+
                                 |
                                 v
                 +-------------------------------+
                 |   Cross-Conflict Detector     |
                 |  - Actuator state clashes     |
                 |  - Circular ping-pong loops   |
                 |  - Simultaneous contentions   |
                 +-------------------------------+
                                 |
                                 v
                 +-------------------------------+
                 |    Deterministic Simulator    |
                 |  - Mock HA state engine       |
                 |  - Multi-step scenarios       |
                 |  - Rollback restoration check |
                 +-------------------------------+
                                 |
                                 v
                 +-------------------------------+
                 |      Adapters & Bundler       |
                 |  - HA YAML / Blueprint export |
                 |  - Multi-automation Packages  |
                 |  - Markdown Audit Reports     |
                 +-------------------------------+
```

## Core Modules (< 1,500 LOC)

1. `src/core/constants.ts`:
   - System constants, actuator domain classifications, critical services, and minimum Home Assistant requirements.
2. `src/core/types.ts`:
   - Formal TypeScript interfaces for manifests, safety grades, simulation traces, conflict reports, and rollback specs.
3. `src/core/manifest.ts`:
   - Schema validation preventing malformed or unverified automation declarations from entering the catalog.
4. `src/core/analyzer.ts`:
   - Safety risk scoring algorithm, actuator boundary detection, and automated pre-flight checklist generator.
5. `src/core/conflicts.ts`:
   - Multi-automation collision detection: discovers contradictory actuator commands and circular trigger loops across installed automations.
6. `src/core/simulator.ts`:
   - Deterministic test harness executing single and multi-step scenarios against mock state snapshots without physical hardware.
7. `src/core/rollback.ts`:
   - Rollback verification engine ensuring modified actuators have clear, complete restoration procedures.
8. `src/core/schema.ts`:
   - Draft-07 JSON Schema generator for manifest specification.
9. `src/core/catalog.ts`:
   - Dynamic registry for verified built-ins and custom runtime automations.

## Adapters

- `src/adapters/blueprint.ts`: Home Assistant Blueprint parser, scaffolder, and exporter.
- `src/adapters/bundle.ts`: Packages multiple automations and deduplicated helper entities into unified HA YAML packages.
- `src/adapters/loader.ts`: Scans local folders for manifest JSON and Blueprint YAML files.
- `src/adapters/report.ts`: Generates GitHub Flavored Markdown audit reports for PR review.
- `src/adapters/yaml.ts`: Safe Home Assistant YAML automation formatting and validation.
