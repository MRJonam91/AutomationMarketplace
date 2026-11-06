// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { getAutomation } from "../src/core/catalog.ts";
import { detectAutomationConflicts } from "../src/core/conflicts.ts";
import type { AutomationManifest } from "../src/core/types.ts";

describe("Cross-Automation Conflict Detector", () => {
  test("detects zero conflicts between harmonious automations", () => {
    const light = getAutomation("night-presence-soft-light")!;
    const leak = getAutomation("water-leak-main-shutoff")!;

    const report = detectAutomationConflicts([light, leak]);
    assert.strictEqual(report.hasConflicts, false);
    assert.strictEqual(report.clashes.length, 0);
    assert.strictEqual(report.crossTriggerLoops.length, 0);
  });

  test("detects actuator clash when two automations command opposing states on same actuator", () => {
    const auto1 = getAutomation("thermostat-window-saver")!;
    // Conflicting automation that commands climate back to 'heat'
    const auto2: AutomationManifest = {
      ...auto1,
      id: "thermostat-boost-heater",
      verification: {
        ...auto1.verification,
        sampleInputs: {
          ...auto1.verification.sampleInputs,
          triggerEvent: {
            entityId: "sensor.outdoor_temperature",
            fromState: "15",
            toState: "2",
          },
        },
        expectedOutputs: {
          stateTransitions: {
            "climate.living_room_thermostat": { state: "heat" },
          },
          serviceCalls: [],
        },
      },
    };

    const report = detectAutomationConflicts([auto1, auto2]);
    assert.strictEqual(report.hasConflicts, true);
    assert.ok(report.clashes.length >= 1);
    assert.strictEqual(report.clashes[0]?.actuatorEntity, "climate.living_room_thermostat");
    assert.ok(report.clashes[0]?.conflictingStates.includes("off"));
    assert.ok(report.clashes[0]?.conflictingStates.includes("heat"));
  });

  test("detects circular ping-pong loop between two cross-triggering automations", () => {
    const autoA = getAutomation("night-presence-soft-light")!;
    const autoB: AutomationManifest = {
      ...autoA,
      id: "motion-sensor-light-feedback",
      rawYaml: "trigger: light.hallway_ceiling action: binary_sensor.hallway_motion",
      verification: {
        testedHaVersion: "2024.1.0",
        sampleInputs: {
          initialState: {},
          triggerEvent: {
            entityId: "light.hallway_ceiling",
            fromState: "off",
            toState: "on",
          },
        },
        expectedOutputs: {
          stateTransitions: {
            "binary_sensor.hallway_motion": { state: "off" },
          },
          serviceCalls: [],
        },
      },
    };

    const report = detectAutomationConflicts([autoA, autoB]);
    assert.strictEqual(report.hasConflicts, true);
    assert.ok(report.crossTriggerLoops.length >= 1);
    assert.ok(report.crossTriggerLoops[0]?.description.includes("Circular cross-trigger"));
  });
});
