// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { generateHaPackageBundle } from "../src/adapters/bundle.ts";
import { getAutomation } from "../src/core/catalog.ts";

describe("Home Assistant Package Bundler", () => {
  test("bundles multiple automations and helpers into a single package YAML", () => {
    const auto1 = getAutomation("thermostat-window-saver")!;
    const auto2 = getAutomation("night-presence-soft-light")!;

    const bundle = generateHaPackageBundle("living_room_pack", [auto1, auto2]);
    assert.ok(bundle.includes("# Home Assistant Package: living_room_pack"));
    assert.ok(bundle.includes("input_boolean:"));
    assert.ok(bundle.includes("previous_climate_preset:"));
    assert.ok(bundle.includes("automation:"));
    assert.ok(bundle.includes("Smart Thermostat Window Open Energy Saver"));
    assert.ok(bundle.includes("Night Path Gentle Motion Lighting"));
  });
});
