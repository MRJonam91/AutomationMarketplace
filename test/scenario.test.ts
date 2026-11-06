// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { getAutomation } from "../src/core/catalog.ts";
import { simulateScenario } from "../src/core/simulator.ts";
import type { SequentialScenarioStep } from "../src/core/types.ts";

describe("Multi-Step Scenario Simulation", () => {
  test("runs sequential multi-step scenario simulation", () => {
    const item = getAutomation("thermostat-window-saver")!;
    assert.ok(item);

    const steps: SequentialScenarioStep[] = [
      {
        name: "Window Opened",
        triggerEvent: {
          entityId: "binary_sensor.living_room_window_contact",
          fromState: "off",
          toState: "on",
          forDurationSeconds: 120,
        },
        expectedStateTransitions: {
          "climate.living_room_thermostat": { state: "off" },
        },
      },
    ];

    const scenarioTrace = simulateScenario(item, "Window Open Scenario", steps);
    assert.strictEqual(scenarioTrace.success, true);
    assert.strictEqual(scenarioTrace.executedSteps.length, 1);
    assert.strictEqual(scenarioTrace.finalState["climate.living_room_thermostat"]?.state, "off");
  });
});
