// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { getAutomation, listAutomations } from "../src/core/catalog.ts";

describe("Automation Catalog", () => {
  test("retrieves automation by ID", () => {
    const item = getAutomation("thermostat-window-saver");
    assert.ok(item);
    assert.strictEqual(item.id, "thermostat-window-saver");
    assert.strictEqual(item.category, "climate");
  });

  test("returns undefined for unknown ID", () => {
    const item = getAutomation("non-existent-automation");
    assert.strictEqual(item, undefined);
  });

  test("filters catalog by category", () => {
    const climateItems = listAutomations({ category: "climate" });
    assert.ok(climateItems.length >= 1);
    assert.ok(climateItems.every((item) => item.category === "climate"));

    const lightingItems = listAutomations({ category: "lighting" });
    assert.ok(lightingItems.length >= 1);
    assert.ok(lightingItems.every((item) => item.category === "lighting"));
  });

  test("filters catalog by domain requirement", () => {
    const lightDomainItems = listAutomations({ domain: "light" });
    assert.ok(lightDomainItems.length >= 1);
    assert.ok(lightDomainItems.every((i) => i.requirements.domains.includes("light")));
  });

  test("searches catalog by query string", () => {
    const results = listAutomations({ query: "refrigerator" });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0]?.id, "fridge-door-alarm-guard");
  });
});
