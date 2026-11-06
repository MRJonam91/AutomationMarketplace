// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import type { AutomationManifest } from "../core/types.ts";

/**
 * Bundles multiple automations and their required Home Assistant helpers into a unified Package YAML.
 * Ready to drop into Home Assistant's 'packages/' directory.
 */
export function generateHaPackageBundle(
  packageName: string,
  automations: AutomationManifest[],
): string {
  const header = [
    `# ===================================================================`,
    `# Home Assistant Package: ${packageName}`,
    `# Bundled by AutomationMarketplace (https://github.com/MRJonam91/AutomationMarketplace)`,
    `# Contains ${automations.length} certified automations`,
    `# ===================================================================`,
    ``,
  ];

  // 1. Collect and deduplicate helpers
  const helpersByType: Record<string, Array<{ name: string; type: string; description: string }>> = {};

  for (const auto of automations) {
    for (const helper of auto.requirements.helpers ?? []) {
      const list = helpersByType[helper.type] ?? [];
      if (!list.some((h) => h.name === helper.name)) {
        list.push(helper);
      }
      helpersByType[helper.type] = list;
    }
  }

  const helperSections: string[] = [];
  for (const [helperType, items] of Object.entries(helpersByType)) {
    helperSections.push(`${helperType}:`);
    for (const item of items) {
      helperSections.push(`  ${item.name}:`);
      helperSections.push(`    name: "${item.name.replace(/_/g, " ")}"`);
      helperSections.push(`    icon: mdi:cog`);
    }
    helperSections.push(``);
  }

  // 2. Format automations section
  const automationSection: string[] = [`automation:`];

  for (const auto of automations) {
    automationSection.push(`  # -------------------------------------------------------------`);
    automationSection.push(`  # Automation: ${auto.name} (v${auto.version})`);
    automationSection.push(`  # Category: ${auto.category}`);
    automationSection.push(`  # Rollback: ${auto.rollback.quickDisable}`);
    automationSection.push(`  # -------------------------------------------------------------`);

    const indentedYaml = auto.rawYaml
      .split("\n")
      .map((line, idx) => (idx === 0 ? `  - ${line}` : `    ${line}`))
      .join("\n");

    automationSection.push(indentedYaml);
    automationSection.push(``);
  }

  return [...header, ...helperSections, ...automationSection].join("\n") + "\n";
}
