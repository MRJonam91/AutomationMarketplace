// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test, { describe } from "node:test";

describe("CLI End-to-End", () => {
  const cliPath = "src/cli/index.ts";

  test("prints version flag matching beta release", () => {
    const output = execFileSync(process.execPath, [cliPath, "--version"], {
      encoding: "utf8",
    });
    assert.match(output, /^v0\.3\.0-beta/);
  });

  test("lists catalog entries in json mode", () => {
    const output = execFileSync(process.execPath, [cliPath, "list", "--json"], {
      encoding: "utf8",
    });
    const parsed = JSON.parse(output);
    assert.ok(Array.isArray(parsed));
    assert.ok(parsed.length >= 7);
  });

  test("simulates automation execution successfully via CLI", () => {
    const output = execFileSync(
      process.execPath,
      [cliPath, "simulate", "water-leak-main-shutoff"],
      {
        encoding: "utf8",
      },
    );
    assert.match(output, /Simulation status: .*PASSED/);
    assert.match(output, /valve\.close_valve/);
  });

  test("tests rollback verification command via CLI", () => {
    const output = execFileSync(
      process.execPath,
      [cliPath, "test-rollback", "thermostat-window-saver"],
      {
        encoding: "utf8",
      },
    );
    assert.match(output, /Rollback Status: .*VERIFIED SAFE/);
    assert.match(output, /climate\.living_room_thermostat/);
  });

  test("checks conflicts across automations via CLI", () => {
    const output = execFileSync(
      process.execPath,
      [cliPath, "check-conflicts", "night-presence-soft-light,water-leak-main-shutoff"],
      {
        encoding: "utf8",
      },
    );
    assert.match(output, /Conflict Status: .*NO HAZARDOUS CLASHES/);
  });

  test("bundles automations into Home Assistant package via CLI", () => {
    const output = execFileSync(
      process.execPath,
      [cliPath, "bundle", "thermostat-window-saver,solar-excess-water-heater"],
      {
        encoding: "utf8",
      },
    );
    assert.match(output, /Home Assistant Package:/);
    assert.match(output, /Smart Thermostat Window Open Energy Saver/);
  });

  test("scaffolds a manifest from template via CLI", () => {
    const output = execFileSync(
      process.execPath,
      [cliPath, "scaffold", "bedroom-presence-dimmer"],
      {
        encoding: "utf8",
      },
    );
    const parsed = JSON.parse(output);
    assert.strictEqual(parsed.id, "bedroom-presence-dimmer");
    assert.ok(parsed.requirements.entities.length >= 1);
  });
});
