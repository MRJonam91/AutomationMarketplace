// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { getManifestJsonSchema } from "../src/core/schema.ts";

describe("Manifest JSON Schema", () => {
  test("generates valid Draft-07 JSON Schema with all required manifest properties", () => {
    const schema = getManifestJsonSchema() as Record<string, any>;
    assert.strictEqual(schema.$schema, "http://json-schema.org/draft-07/schema#");
    assert.strictEqual(schema.title, "AutomationManifest");
    assert.ok(Array.isArray(schema.required));
    assert.ok(schema.required.includes("id"));
    assert.ok(schema.required.includes("platform"));
    assert.ok(schema.required.includes("rollback"));
    assert.ok(schema.required.includes("verification"));
    assert.ok(schema.properties.category.enum.includes("climate"));
    assert.ok(schema.properties.category.enum.includes("air_quality"));
  });
});
