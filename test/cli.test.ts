// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test, { describe } from "node:test";

describe("CLI End-to-End", () => {
  const cliPath = "src/cli/index.ts";

  test("prints version flag", () => {
    const output = execFileSync(process.execPath, [cliPath, "--version"], {
      encoding: "utf8",
    });
    assert.match(output, /^v0\.1\.0/);
  });

  test("lists catalog entries in json mode", () => {
    const output = execFileSync(process.execPath, [cliPath, "list", "--json"], {
      encoding: "utf8",
    });
    const parsed = JSON.parse(output);
    assert.ok(Array.isArray(parsed));
    assert.ok(parsed.length >= 3);
  });

  test("simulates automation execution successfully via CLI", () => {
    const output = execFileSync(
      process.execPath,
      [cliPath, "simulate", "thermostat-window-saver"],
      {
        encoding: "utf8",
      },
    );
    assert.match(output, /Simulation status: .*PASSED/);
    assert.match(output, /Step 1/);
  });
});
