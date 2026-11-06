// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { getAutomation, listAutomations, registerAutomation } from "../src/core/catalog.ts";

describe("Automation Catalog", () => {
  test("retrieves automation by ID", () => {
    const item = getAutomation("thermostat-window-saver");
    assert.ok(item);
    assert.strictEqual(item.id, "thermostat-window-saver");
    assert.strictEqual(item.category, "climate");
  });

  test("retrieves newly added water leak shutoff, solar diverter, away lock, and air quality boost", () => {
    const leak = getAutomation("water-leak-main-shutoff");
    assert.ok(leak);
    assert.strictEqual(leak.category, "safety");
    assert.ok(leak.permissions.actuators.includes("valve"));

    const solar = getAutomation("solar-excess-water-heater");
    assert.ok(solar);
    assert.strictEqual(solar.category, "energy");

    const away = getAutomation("away-mode-lock-secure");
    assert.ok(away);
    assert.strictEqual(away.category, "security");
    assert.ok(away.permissions.actuators.includes("lock"));

    const air = getAutomation("air-quality-ventilation-boost");
    assert.ok(air);
    assert.strictEqual(air.category, "air_quality");
    assert.ok(air.permissions.actuators.includes("fan"));
  });

  test("returns undefined for unknown ID", () => {
    const item = getAutomation("non-existent-automation");
    assert.strictEqual(item, undefined);
  });

  test("filters catalog by category", () => {
    const climateItems = listAutomations({ category: "climate" });
    assert.ok(climateItems.length >= 1);
    assert.ok(climateItems.every((item) => item.category === "climate"));

    const safetyItems = listAutomations({ category: "safety" });
    assert.ok(safetyItems.length >= 2);
    assert.ok(safetyItems.every((item) => item.category === "safety"));
  });

  test("filters catalog by domain requirement", () => {
    const valveItems = listAutomations({ domain: "valve" });
    assert.ok(valveItems.length >= 1);
    assert.ok(valveItems.every((i) => i.requirements.domains.includes("valve")));
  });

  test("searches catalog by query string", () => {
    const results = listAutomations({ query: "ventilation" });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0]?.id, "air-quality-ventilation-boost");
  });

  test("supports dynamic runtime registration of automations", () => {
    const sample = getAutomation("night-presence-soft-light")!;
    registerAutomation({
      ...sample,
      id: "custom-night-light-v2",
      name: "Custom Night Light V2",
    });

    const retrieved = getAutomation("custom-night-light-v2");
    assert.ok(retrieved);
    assert.strictEqual(retrieved.name, "Custom Night Light V2");
  });
});
