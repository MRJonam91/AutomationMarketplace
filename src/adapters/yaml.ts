// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import type { AutomationManifest } from "../core/types.ts";

/**
 * Basic safe YAML formatting and extraction helper for Home Assistant automations.
 */
export function formatHaAutomationYaml(manifest: AutomationManifest): string {
  const header = [
    `# Automation: ${manifest.name} (v${manifest.version})`,
    `# Author: ${manifest.author}`,
    `# Category: ${manifest.category}`,
    `# Verified with Home Assistant: >= ${manifest.platform.minCoreVersion}`,
    `# Safety Grade: see 'automation-marketplace show ${manifest.id}'`,
    `# Rollback instructions:`,
    `#   ${manifest.rollback.quickDisable}`,
    ...manifest.rollback.stateRestoration.map((r) => `#   - ${r}`),
    `# -------------------------------------------------------------`,
  ].join("\n");

  return `${header}\n\n${manifest.rawYaml.trim()}\n`;
}

/**
 * Checks if a string contains minimal valid Home Assistant automation markers.
 */
export function validateBasicHaYaml(yamlContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!yamlContent || typeof yamlContent !== "string") {
    return { valid: false, errors: ["Empty or non-string YAML content"] };
  }

  const hasTrigger = /(^|\n)\s*trigger\s*:/i.test(yamlContent);
  const hasAction = /(^|\n)\s*action\s*:/i.test(yamlContent);

  if (!hasTrigger) {
    errors.push("Missing required 'trigger:' block in Home Assistant automation");
  }
  if (!hasAction) {
    errors.push("Missing required 'action:' block in Home Assistant automation");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
