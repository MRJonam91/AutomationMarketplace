// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import fs from "node:fs";
import path from "node:path";
import { registerAutomation } from "../core/catalog.ts";
import { validateManifest } from "../core/manifest.ts";
import type { AutomationManifest } from "../core/types.ts";
import { scaffoldManifestFromBlueprint } from "./blueprint.ts";

export interface LoadResult {
  loaded: AutomationManifest[];
  errors: Array<{ file: string; message: string }>;
}

/**
 * Scans a directory and loads valid automation manifests (.json or .yaml blueprints).
 */
export function loadManifestsFromDirectory(dirPath: string): LoadResult {
  const loaded: AutomationManifest[] = [];
  const errors: Array<{ file: string; message: string }> = [];

  if (!fs.existsSync(dirPath)) {
    return { loaded, errors: [{ file: dirPath, message: "Directory does not exist" }] };
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    const fullPath = path.join(dirPath, entry.name);
    const ext = path.extname(entry.name).toLowerCase();

    try {
      const content = fs.readFileSync(fullPath, "utf8");

      if (ext === ".json") {
        const parsed = JSON.parse(content) as AutomationManifest;
        const validation = validateManifest(parsed);
        if (validation.valid) {
          registerAutomation(parsed);
          loaded.push(parsed);
        } else {
          errors.push({ file: entry.name, message: validation.errors.join("; ") });
        }
      } else if (ext === ".yaml" || ext === ".yml") {
        if (content.includes("blueprint:")) {
          const slug = path.basename(entry.name, ext);
          const scaffolded = scaffoldManifestFromBlueprint(slug, content);
          registerAutomation(scaffolded);
          loaded.push(scaffolded);
        }
      }
    } catch (err) {
      errors.push({ file: entry.name, message: (err as Error).message });
    }
  }

  return { loaded, errors };
}
