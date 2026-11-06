// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { VERIFIED_AUTOMATIONS } from "../src/core/catalog.ts";
import { validateManifest } from "../src/core/manifest.ts";

describe("Manifest Validation", () => {
  test("all built-in catalog automations have valid manifests", () => {
    for (const item of VERIFIED_AUTOMATIONS) {
      const result = validateManifest(item);
      assert.strictEqual(
        result.valid,
        true,
        `Built-in automation ${item.id} failed validation: ${result.errors.join(", ")}`,
      );
      assert.strictEqual(result.errors.length, 0);
    }
  });

  test("rejects null or non-object manifests", () => {
    const resNull = validateManifest(null);
    assert.strictEqual(resNull.valid, false);

    const resStr = validateManifest("invalid");
    assert.strictEqual(resStr.valid, false);
  });

  test("catches invalid slug, short descriptions, and missing rollback", () => {
    const invalidManifest = {
      id: "INVALID ID WITH SPACES",
      name: "X",
      version: "not-semver",
      category: "invalid_category",
      description: "too short",
      platform: { type: "other" },
    };

    const result = validateManifest(invalidManifest);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("slug")));
    assert.ok(result.errors.some((e) => e.includes("semver")));
    assert.ok(result.errors.some((e) => e.includes("category")));
    assert.ok(result.errors.some((e) => e.includes("rollback")));
  });
});
