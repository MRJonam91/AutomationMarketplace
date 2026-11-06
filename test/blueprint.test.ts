// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
  extractBlueprintMetadata,
  scaffoldManifestFromBlueprint,
} from "../src/adapters/blueprint.ts";
import { validateManifest } from "../src/core/manifest.ts";

describe("Home Assistant Blueprint Adapter", () => {
  const sampleBlueprint = `
blueprint:
  name: "Motion Activated Light Switch"
  description: "Turn on a light when motion is detected."
  domain: automation
  author: "CommunityDev"
  input:
    motion_entity:
      name: Motion Sensor
      selector:
        entity:
          domain: binary_sensor
    target_light:
      name: Light
      selector:
        target:
          entity:
            domain: light
trigger:
  - platform: state
    entity_id: !input motion_entity
    to: "on"
action:
  - service: light.turn_on
    target: !input target_light
`;

  test("extracts blueprint metadata correctly", () => {
    const meta = extractBlueprintMetadata(sampleBlueprint);
    assert.ok(meta);
    assert.strictEqual(meta.name, "Motion Activated Light Switch");
    assert.strictEqual(meta.domain, "automation");
    assert.strictEqual(meta.author, "CommunityDev");
    assert.ok(meta.inputs["motion_entity"]);
    assert.ok(meta.inputs["target_light"]);
  });

  test("scaffolds a valid manifest from blueprint YAML", () => {
    const manifest = scaffoldManifestFromBlueprint("motion-activated-light", sampleBlueprint, "lighting");
    assert.strictEqual(manifest.id, "motion-activated-light");
    assert.strictEqual(manifest.category, "lighting");
    assert.ok(manifest.requirements.entities.length >= 2);

    const validation = validateManifest(manifest);
    assert.strictEqual(
      validation.valid,
      true,
      `Scaffolded manifest validation failed: ${validation.errors.join("; ")}`
    );
  });
});
