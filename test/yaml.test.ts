// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { formatHaAutomationYaml, validateBasicHaYaml } from "../src/adapters/yaml.ts";
import { getAutomation } from "../src/core/catalog.ts";

describe("YAML Adapter", () => {
  test("formats clean Home Assistant automation YAML with rollback headers", () => {
    const item = getAutomation("thermostat-window-saver")!;
    assert.ok(item);

    const formatted = formatHaAutomationYaml(item);
    assert.ok(formatted.includes("# Automation: Smart Thermostat Window Open Energy Saver"));
    assert.ok(formatted.includes("# Rollback instructions:"));
    assert.ok(formatted.includes("trigger:"));
    assert.ok(formatted.includes("action:"));
  });

  test("validates valid and invalid HA YAML automation snippets", () => {
    const validYaml = `
trigger:
  - platform: state
    entity_id: binary_sensor.door
action:
  - service: light.turn_on
`;
    assert.strictEqual(validateBasicHaYaml(validYaml).valid, true);

    const missingAction = `
trigger:
  - platform: state
    entity_id: binary_sensor.door
`;
    const checkAction = validateBasicHaYaml(missingAction);
    assert.strictEqual(checkAction.valid, false);
    assert.ok(checkAction.errors.some((e) => e.includes("action:")));

    const missingTrigger = `
action:
  - service: light.turn_on
`;
    const checkTrigger = validateBasicHaYaml(missingTrigger);
    assert.strictEqual(checkTrigger.valid, false);
    assert.ok(checkTrigger.errors.some((e) => e.includes("trigger:")));
  });
});
