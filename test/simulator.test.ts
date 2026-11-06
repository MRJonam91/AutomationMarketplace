// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { getAutomation } from "../src/core/catalog.ts";
import { simulateAutomation } from "../src/core/simulator.ts";

describe("Deterministic Simulator", () => {
  test("successfully simulates thermostat window saver", () => {
    const item = getAutomation("thermostat-window-saver")!;
    assert.ok(item);

    const trace = simulateAutomation(item);
    assert.strictEqual(trace.success, true);
    assert.strictEqual(trace.discrepancies.length, 0);
    assert.strictEqual(trace.finalState["climate.living_room_thermostat"]?.state, "off");
    assert.strictEqual(trace.serviceCalls[0]?.service, "climate.set_hvac_mode");
    assert.strictEqual(trace.serviceCalls[0]?.targetEntity, "climate.living_room_thermostat");
    assert.ok(trace.steps.length >= 3);
  });

  test("successfully simulates night presence lighting", () => {
    const item = getAutomation("night-presence-soft-light")!;
    assert.ok(item);

    const trace = simulateAutomation(item);
    assert.strictEqual(trace.success, true);
    assert.strictEqual(trace.discrepancies.length, 0);
    assert.strictEqual(trace.finalState["light.hallway_ceiling"]?.state, "on");
    assert.strictEqual(trace.serviceCalls[0]?.service, "light.turn_on");
  });

  test("detects state mismatch discrepancies during simulation", () => {
    const item = getAutomation("thermostat-window-saver")!;
    // Injected invalid initial state where trigger entity is already 'on' instead of 'off'
    const invalidInitialState = {
      "climate.living_room_thermostat": { state: "heat" },
      "binary_sensor.living_room_window_contact": { state: "on" },
    };

    const trace = simulateAutomation(item, invalidInitialState);
    assert.strictEqual(trace.success, false);
    assert.ok(trace.discrepancies.some((d) => d.includes("expected initial state 'off'")));
  });
});
