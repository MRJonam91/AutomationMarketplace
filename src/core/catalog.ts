// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import { BUILTIN_AUTOMATIONS } from "../catalog/builtins.ts";
import type { AutomationManifest, CatalogFilter } from "./types.ts";

export const VERIFIED_AUTOMATIONS: AutomationManifest[] = [...BUILTIN_AUTOMATIONS];

const customRegistry: Map<string, AutomationManifest> = new Map();

/**
 * Registers an automation manifest in the in-memory registry.
 */
export function registerAutomation(manifest: AutomationManifest): void {
  customRegistry.set(manifest.id, manifest);
}

/**
 * Retrieves an automation by ID from both built-in and registered collections.
 */
export function getAutomation(id: string): AutomationManifest | undefined {
  return customRegistry.get(id) ?? VERIFIED_AUTOMATIONS.find((a) => a.id === id);
}

/**
 * Lists and filters all catalog automations.
 */
export function listAutomations(filter: CatalogFilter = {}): AutomationManifest[] {
  const all = [...VERIFIED_AUTOMATIONS, ...customRegistry.values()];

  return all.filter((item) => {
    if (filter.category && item.category !== filter.category) return false;
    if (filter.domain && !item.requirements.domains.includes(filter.domain)) return false;
    if (filter.query) {
      const q = filter.query.toLowerCase();
      const match =
        item.id.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}
