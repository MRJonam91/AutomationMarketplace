#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import fs from "node:fs";
import path from "node:path";
import { formatHaAutomationYaml, validateBasicHaYaml } from "../adapters/yaml.ts";
import { analyzeAutomationRisks } from "../core/analyzer.ts";
import { getAutomation, listAutomations } from "../core/catalog.ts";
import { validateManifest } from "../core/manifest.ts";
import { simulateAutomation } from "../core/simulator.ts";
import type { AutomationCategory, AutomationManifest } from "../core/types.ts";
import { SPONSOR_HELP_LINE, sponsorFooter } from "../sponsor.ts";

const VERSION = "0.1.0";

const HELP_TEXT = `AutomationMarketplace v${VERSION} — Curated Smart Home Automation Catalog & Safety Guard

Usage:
  automation-marketplace <command> [options]

Commands:
  list                     List verified smart home automations in catalog
  show <id>                Inspect automation manifest, requirements, risks & rollback
  validate <file>          Audit and lint a manifest JSON or Home Assistant YAML file
  simulate <id>            Run deterministic execution trace & state simulation
  export <id>              Export ready-to-import Home Assistant YAML or manifest JSON

Options for list:
  --category <category>    Filter by category (climate, energy, security, lighting, safety)
  --query <text>           Search name, slug, or description
  --json                   Output list as raw JSON

Options for show:
  --yaml                   Display raw Home Assistant YAML alongside manifest
  --json                   Output full manifest as JSON

Options for export:
  --format <yaml|json>     Export format (default: yaml)
  -o, --output <file>      Write output directly to file

General options:
  -v, --version            Show version
  -h, --help               Show this help message

${SPONSOR_HELP_LINE}
`;

function parseArgs(args: string[]) {
  const result: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const item = args[i]!;
    if (item.startsWith("--")) {
      const key = item.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("-")) {
        result[key] = next;
        i++;
      } else {
        result[key] = true;
      }
    } else if (item.startsWith("-")) {
      const key = item.slice(1);
      if (key === "o") {
        const next = args[i + 1];
        if (next && !next.startsWith("-")) {
          result["output"] = next;
          i++;
        }
      } else {
        result[key] = true;
      }
    } else {
      positional.push(item);
    }
  }

  return { flags: result, positional };
}

function printGradeBadge(grade: string): string {
  switch (grade) {
    case "A+":
      return "\x1b[32;1m[A+ Certified Safe]\x1b[0m";
    case "A":
      return "\x1b[32m[Grade A Safe]\x1b[0m";
    case "B":
      return "\x1b[33m[Grade B Guarded]\x1b[0m";
    case "C":
      return "\x1b[33;1m[Grade C Review Advised]\x1b[0m";
    case "F":
      return "\x1b[31;1m[Grade F High Risk]\x1b[0m";
    default:
      return `[Grade ${grade}]`;
  }
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const { flags, positional } = parseArgs(rawArgs);

  if (flags["version"] || flags["v"]) {
    console.log(`v${VERSION}`);
    return;
  }

  if (flags["help"] || flags["h"] || positional.length === 0) {
    console.log(HELP_TEXT);
    return;
  }

  const command = positional[0]!.toLowerCase();

  switch (command) {
    case "list": {
      const category = flags["category"] as AutomationCategory | undefined;
      const query = flags["query"] as string | undefined;
      const items = listAutomations({ category, query });

      if (flags["json"]) {
        console.log(JSON.stringify(items, null, 2));
        return;
      }

      console.log(`\nVerified Automations Catalog (${items.length} entries):\n`);
      for (const item of items) {
        const audit = analyzeAutomationRisks(item);
        console.log(`• \x1b[1m${item.id}\x1b[0m — ${item.name} (v${item.version})`);
        console.log(`  Category: ${item.category} | Platform: HA >= ${item.platform.minCoreVersion} | Safety: ${printGradeBadge(audit.safetyGrade)}`);
        console.log(`  Domains: ${item.requirements.domains.join(", ")} | Actuators: ${item.permissions.actuators.join(", ") || "none"}`);
        console.log(`  Description: ${item.description.slice(0, 110)}...`);
        console.log();
      }

      console.log("Use 'automation-marketplace show <id>' for full manifest and rollback instructions.");
      sponsorFooter();
      break;
    }

    case "show": {
      const id = positional[1];
      if (!id) {
        console.error("Error: Please specify an automation ID. Example: automation-marketplace show thermostat-window-saver");
        process.exit(1);
      }

      const item = getAutomation(id);
      if (!item) {
        console.error(`Error: Automation '${id}' not found in verified catalog.`);
        process.exit(1);
      }

      if (flags["json"]) {
        console.log(JSON.stringify(item, null, 2));
        return;
      }

      const audit = analyzeAutomationRisks(item);

      console.log(`\n======================================================`);
      console.log(`\x1b[1m${item.name}\x1b[0m (ID: ${item.id})`);
      console.log(`======================================================`);
      console.log(`Version:    ${item.version}`);
      console.log(`Author:     ${item.author}`);
      console.log(`Category:   ${item.category}`);
      console.log(`Safety:     ${printGradeBadge(audit.safetyGrade)} (Risk index: ${audit.riskIndex}/100)`);
      console.log(`HA Target:  >= ${item.platform.minCoreVersion}`);
      console.log(`\nDescription:\n  ${item.description}`);

      console.log(`\nRequired Entities:`);
      for (const ent of item.requirements.entities) {
        console.log(`  - [${ent.domain}] ${ent.name} (e.g. ${ent.sampleEntityId})`);
      }

      console.log(`\nIdentified Hazards & Mitigations:`);
      for (const r of item.risks) {
        console.log(`  - [${r.severity.toUpperCase()}] ${r.category}: ${r.description}`);
        console.log(`    Mitigation: ${r.mitigation}`);
      }

      console.log(`\nRollback Instructions:`);
      console.log(`  • Quick disable: ${item.rollback.quickDisable}`);
      console.log(`  • Restoration steps:`);
      for (const step of item.rollback.stateRestoration) {
        console.log(`    1. ${step}`);
      }
      console.log(`  • Fallback: ${item.rollback.fallbackProcedure}`);

      if (flags["yaml"]) {
        console.log(`\nHome Assistant YAML Code:\n`);
        console.log(formatHaAutomationYaml(item));
      } else {
        console.log(`\nTip: Run with --yaml to preview the Home Assistant YAML automation code.`);
      }

      sponsorFooter();
      break;
    }

    case "validate": {
      const targetFile = positional[1];
      if (!targetFile) {
        console.error("Error: Please specify a file path to validate (JSON manifest or YAML automation).");
        process.exit(1);
      }

      if (!fs.existsSync(targetFile)) {
        console.error(`Error: File '${targetFile}' does not exist.`);
        process.exit(1);
      }

      const content = fs.readFileSync(targetFile, "utf8");
      const ext = path.extname(targetFile).toLowerCase();

      console.log(`\nAuditing '${targetFile}'...`);

      if (ext === ".json") {
        try {
          const parsed = JSON.parse(content);
          const validation = validateManifest(parsed);
          if (!validation.valid) {
            console.error(`\x1b[31mValidation failed with ${validation.errors.length} error(s):\x1b[0m`);
            for (const err of validation.errors) {
              console.error(`  - ${err}`);
            }
            process.exit(1);
          }

          const audit = analyzeAutomationRisks(parsed as AutomationManifest);
          console.log(`\x1b[32m✔ Manifest schema is valid!\x1b[0m`);
          console.log(`Safety Grade: ${printGradeBadge(audit.safetyGrade)} (Risk index: ${audit.riskIndex}/100)`);
          console.log(`Rollback completeness: ${audit.rollbackComplete ? "✔ Complete" : "⚠️ Incomplete"}`);
          if (audit.criticalActuatorsFound.length > 0) {
            console.log(`Critical actuators present: ${audit.criticalActuatorsFound.join(", ")}`);
          }
        } catch (e) {
          console.error("Error: Failed to parse JSON manifest:", (e as Error).message);
          process.exit(1);
        }
      } else if (ext === ".yaml" || ext === ".yml") {
        const yamlCheck = validateBasicHaYaml(content);
        if (!yamlCheck.valid) {
          console.error(`\x1b[31mYAML automation structure invalid:\x1b[0m`);
          for (const err of yamlCheck.errors) {
            console.error(`  - ${err}`);
          }
          process.exit(1);
        }
        console.log(`\x1b[32m✔ YAML automation structure valid.\x1b[0m`);
        console.log(`Contains trigger and action blocks.`);
      } else {
        console.error("Error: Unsupported file format. Please provide a .json manifest or .yaml automation.");
        process.exit(1);
      }

      sponsorFooter();
      break;
    }

    case "simulate": {
      const id = positional[1];
      if (!id) {
        console.error("Error: Please specify an automation ID to simulate.");
        process.exit(1);
      }

      const item = getAutomation(id);
      if (!item) {
        console.error(`Error: Automation '${id}' not found in catalog.`);
        process.exit(1);
      }

      console.log(`\nRunning deterministic simulation for '${item.name}'...`);
      const trace = simulateAutomation(item);

      console.log(`Simulation status: ${trace.success ? "\x1b[32mPASSED\x1b[0m" : "\x1b[31mFAILED\x1b[0m"} (${trace.durationMs}ms)\n`);
      for (const step of trace.steps) {
        console.log(`[Step ${step.step}] ${step.description}`);
      }

      if (trace.discrepancies.length > 0) {
        console.log(`\nDiscrepancies:`);
        for (const disc of trace.discrepancies) {
          console.log(`  ⚠️ ${disc}`);
        }
        process.exit(1);
      }

      console.log(`\n\x1b[32m✔ Verification complete: state transitions and service calls matched expectations deterministically.\x1b[0m`);
      sponsorFooter();
      break;
    }

    case "export": {
      const id = positional[1];
      if (!id) {
        console.error("Error: Please specify an automation ID to export.");
        process.exit(1);
      }

      const item = getAutomation(id);
      if (!item) {
        console.error(`Error: Automation '${id}' not found in catalog.`);
        process.exit(1);
      }

      const format = (flags["format"] as string) || "yaml";
      let outputText = "";

      if (format.toLowerCase() === "json") {
        outputText = JSON.stringify(item, null, 2);
      } else {
        outputText = formatHaAutomationYaml(item);
      }

      const outFile = flags["output"] as string | undefined;
      if (outFile) {
        fs.writeFileSync(outFile, outputText, "utf8");
        console.log(`Exported '${item.id}' to '${outFile}'.`);
      } else {
        console.log(outputText);
      }
      break;
    }

    default: {
      console.error(`Unknown command: '${command}'. Run 'automation-marketplace --help' for usage.`);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
