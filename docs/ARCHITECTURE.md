# Architecture — AutomationMarketplace

`AutomationMarketplace` provides an audited, deterministic catalog and pre-flight safety firewall for smart home automations (focused primarily on Home Assistant).

## High-Level Diagram

```text
  +--------------------------------------------------------------+
  |                   AutomationMarketplace                      |
  +--------------------------------------------------------------+
         |                                           |
         v                                           v
+------------------+                       +-------------------+
| Automation       |                       | Verified Catalog  |
| Manifest Schema  |                       | (Climate, Light,  |
| (JSON / YAML)    |                       |  Safety, Energy)  |
+------------------+                       +-------------------+
         |                                           |
         +--------------------+----------------------+
                              |
                              v
                 +--------------------------+
                 |   Safety & Risk Analyzer |
                 |  - Actuator boundary check|
                 |  - Hazard mitigation test|
                 |  - Rollback completeness |
                 +--------------------------+
                              |
                              v
                 +--------------------------+
                 |  Deterministic Simulator |
                 |  - Mock HA State Engine  |
                 |  - Trigger & service audit|
                 |  - Zero-hardware testbed |
                 +--------------------------+
                              |
                              v
                 +--------------------------+
                 | CLI & Export Adapter     |
                 |  - HA YAML / JSON Export |
                 |  - Rollback safety header|
                 +--------------------------+
```

## Core Modules (< 1,500 LOC)

1. `src/core/constants.ts`:
   - Actuator domain lists, critical services, and anti-plagiarism watermarks.
2. `src/core/types.ts`:
   - Formal schema definitions for manifests, safety grades, simulation traces, and rollback specs.
3. `src/core/manifest.ts`:
   - Strict validation preventing corrupted or unsafe automation descriptions from entering the catalog.
4. `src/core/analyzer.ts`:
   - Risk scoring algorithm, actuator boundary detection, and pre-flight checklist generator.
5. `src/core/simulator.ts`:
   - Deterministic test harness executing automations against simulated entity states without touching physical hardware.
6. `src/core/catalog.ts`:
   - In-memory curated catalog of verified smart home automations.

## Extending the Catalog

To add a new verified automation to the catalog:
1. Define a unique slug ID (e.g. `smart-water-leak-shutoff`).
2. Specify required entity domains and sample entity IDs.
3. List explicit hazards (e.g. valve failure, false alarms) and their mitigations.
4. Provide a step-by-step `rollback` procedure.
5. Provide a deterministic `verification` test fixture with initial states and expected outputs.
6. Run `npm test` to verify automatic passing of validation and simulation tests.
