// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { describe } from "node:test";
import { loadManifestsFromDirectory } from "../src/adapters/loader.ts";
import { getAutomation } from "../src/core/catalog.ts";

describe("Manifest Directory Loader", () => {
  test("loads and registers valid manifest files from temporary directory", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "amp-loader-test-"));
    try {
      const sample = getAutomation("night-presence-soft-light")!;
      const testManifest = {
        ...sample,
        id: "imported-temp-automation",
        name: "Imported Temp Automation",
      };

      fs.writeFileSync(
        path.join(tmpDir, "manifest.json"),
        JSON.stringify(testManifest),
        "utf8"
      );

      const result = loadManifestsFromDirectory(tmpDir);
      assert.strictEqual(result.loaded.length, 1);
      assert.strictEqual(result.errors.length, 0);

      const registered = getAutomation("imported-temp-automation");
      assert.ok(registered);
      assert.strictEqual(registered.name, "Imported Temp Automation");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
