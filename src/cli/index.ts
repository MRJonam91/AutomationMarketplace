#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import fs from "node:fs";
import path from "node:path";
import { formatHaBlueprintYaml, scaffoldManifestFromBlueprint } from "../adapters/blueprint.ts";
import { generateHaPackageBundle } from "../adapters/bundle.ts";
import { loadManifestsFromDirectory } from "../adapters/loader.ts";
import { generateMarkdownAuditReport } from "../adapters/report.ts";
import { formatHaAutomationYaml, validateBasicHaYaml } from "../adapters/yaml.ts";
import { analyzeAutomationRisks } from "../core/analyzer.ts";
import { getAutomation, listAutomations } from "../core/catalog.ts";
import { detectAutomationConflicts } from "../core/conflicts.ts";
import { validateManifest } from "../core/manifest.ts";
import { verifyRollbackProcedure } from "../core/rollback.ts";
import { getManifestJsonSchema } from "../core/schema.ts";
import { simulateAutomation, simulateScenario } from "../core/simulator.ts";
import type { AutomationCategory, AutomationManifest, SequentialScenarioStep } from "../core/types.ts";
import { SPONSOR_HELP_LINE, sponsorFooter } from "../sponsor.ts";

const VERSION = "1.0.0";

const HELP_TEXT = `AutomationMarketplace v${VERSION} — Curated Smart Home Automation Catalog & Safety Guard

Usage:
  automation-marketplace <command> [options]

Commands:
  list                     List verified smart home automations in catalog
  show <id>                Inspect automation manifest, requirements, risks & rollback
  validate <file>          Audit and lint a manifest JSON or Home Assistant YAML file
  simulate <id>            Run deterministic execution trace & state simulation
  simulate-scenario <id>   Run multi-step sequential scenario simulation
  test-rollback <id>       Verify restoration of baseline states after simulated execution
  check-conflicts <ids>    Detect actuator clashes & circular loops between automations
  bundle <ids>             Bundle multiple automations & helpers into Home Assistant package
  import <dir>             Import and register all manifests/blueprints from a directory
  audit <file>             Run in-depth safety audit report on manifest or blueprint
  scaffold <id>            Generate a verified manifest skeleton (from blueprint or scratch)
  export <id>              Export ready-to-import Home Assistant YAML, Blueprint or JSON
  schema                   Output formal JSON Schema for AutomationManifest specification

Options for list:
  --category <category>    Filter by category (climate, energy, security, lighting, safety, air_quality)
  --query <text>           Search name, slug, or description
  --json                   Output list as raw JSON

Options for check-conflicts / test-rollback:
  --json                   Output result in machine-readable JSON format for CI/CD

Options for export:
  --format <yaml|json|blueprint>  Export format (default: yaml)
  -o, --output <file>             Write output directly to file

Options for audit:
  --report-md <file>       Write detailed GitHub Flavored Markdown audit report to file

Options for scaffold:
  --blueprint <file>       Scaffold from existing Home Assistant Blueprint YAML
  -o, --output <file>      Target output JSON file path

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

      if (flags["json"]) {
        console.log(JSON.stringify(trace, null, 2));
        return;
      }

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

    case "simulate-scenario": {
      const id = positional[1];
      if (!id) {
        console.error("Error: Please specify an automation ID.");
        process.exit(1);
      }

      const item = getAutomation(id);
      if (!item) {
        console.error(`Error: Automation '${id}' not found in catalog.`);
        process.exit(1);
      }

      const stepsFile = flags["steps"] as string | undefined;
      let steps: SequentialScenarioStep[] = [];

      if (stepsFile && fs.existsSync(stepsFile)) {
        steps = JSON.parse(fs.readFileSync(stepsFile, "utf8"));
      } else {
        steps = [
          {
            name: "Initial Event Trigger",
            triggerEvent: item.verification.sampleInputs.triggerEvent,
            expectedStateTransitions: item.verification.expectedOutputs.stateTransitions,
            expectedServiceCalls: item.verification.expectedOutputs.serviceCalls,
          },
        ];
      }

      console.log(`\nRunning multi-step scenario simulation for '${item.name}' (${steps.length} steps)...`);
      const scenarioTrace = simulateScenario(item, `Scenario for ${item.id}`, steps);

      if (flags["json"]) {
        console.log(JSON.stringify(scenarioTrace, null, 2));
        return;
      }

      console.log(`Scenario status: ${scenarioTrace.success ? "\x1b[32mPASSED\x1b[0m" : "\x1b[31mFAILED\x1b[0m"} (${scenarioTrace.durationMs}ms)`);
      for (const step of scenarioTrace.executedSteps) {
        console.log(`  [Step ${step.stepIndex}] ${step.name}: ${step.stepTrace.success ? "✔ OK" : "✗ FAILED"}`);
      }

      if (!scenarioTrace.success) {
        console.error("Scenario discrepancies:", scenarioTrace.discrepancies.join("; "));
        process.exit(1);
      }
      sponsorFooter();
      break;
    }

    case "test-rollback": {
      const id = positional[1];
      if (!id) {
        console.error("Error: Please specify an automation ID to verify rollback for.");
        process.exit(1);
      }

      const item = getAutomation(id);
      if (!item) {
        console.error(`Error: Automation '${id}' not found in catalog.`);
        process.exit(1);
      }

      const simTrace = simulateAutomation(item);
      const rollbackResult = verifyRollbackProcedure(item, simTrace.finalState);

      if (flags["json"]) {
        console.log(JSON.stringify(rollbackResult, null, 2));
        return;
      }

      console.log(`\nTesting rollback procedure for '${item.name}'...`);
      console.log(`Rollback Status: ${rollbackResult.success ? "\x1b[32mVERIFIED SAFE\x1b[0m" : "\x1b[31mRESTORATION DEFICIENT\x1b[0m"}`);
      console.log(`Restored Entities (${rollbackResult.restoredEntities.length}): ${rollbackResult.restoredEntities.join(", ") || "none"}`);
      if (rollbackResult.unrestoredEntities.length > 0) {
        console.log(`\x1b[31mUnrestored Entities (${rollbackResult.unrestoredEntities.length}): ${rollbackResult.unrestoredEntities.join(", ")}\x1b[0m`);
      }
      for (const note of rollbackResult.notes) {
        console.log(`  • ${note}`);
      }

      if (!rollbackResult.success) {
        process.exit(1);
      }
      sponsorFooter();
      break;
    }

    case "check-conflicts": {
      const idsArg = positional[1] || "all";
      let candidates: AutomationManifest[] = [];

      if (idsArg.toLowerCase() === "all") {
        candidates = listAutomations();
      } else {
        const idList = idsArg.split(",").map((s) => s.trim());
        for (const id of idList) {
          const item = getAutomation(id);
          if (item) candidates.push(item);
        }
      }

      const report = detectAutomationConflicts(candidates);

      if (flags["json"]) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      console.log(`\nChecking cross-automation conflicts across ${candidates.length} automations...`);
      console.log(`Conflict Status: ${report.hasConflicts ? "\x1b[31mCONFLICTS DETECTED\x1b[0m" : "\x1b[32mNO HAZARDOUS CLASHES\x1b[0m"} (Risk score: ${report.conflictIndex}/100)`);
      if (report.clashes.length > 0) {
        console.log(`\nActuator Clashes (${report.clashes.length}):`);
        for (const c of report.clashes) {
          console.log(`  ⚠️ [${c.severity.toUpperCase()}] ${c.description}`);
        }
      }
      if (report.crossTriggerLoops.length > 0) {
        console.log(`\nCircular Ping-Pong Loops (${report.crossTriggerLoops.length}):`);
        for (const loop of report.crossTriggerLoops) {
          console.log(`  🚨 ${loop.description}`);
        }
      }
      if (report.recommendations.length > 0) {
        console.log(`\nRecommendations:`);
        for (const rec of report.recommendations) {
          console.log(`  • ${rec}`);
        }
      }
      sponsorFooter();
      break;
    }

    case "bundle": {
      const idsArg = positional[1];
      if (!idsArg) {
        console.error("Error: Please provide comma-separated automation IDs to bundle (or 'all').");
        process.exit(1);
      }

      let candidates: AutomationManifest[] = [];
      if (idsArg.toLowerCase() === "all") {
        candidates = listAutomations();
      } else {
        const idList = idsArg.split(",").map((s) => s.trim());
        for (const id of idList) {
          const item = getAutomation(id);
          if (item) candidates.push(item);
        }
      }

      if (candidates.length === 0) {
        console.error("Error: No matching automations found to bundle.");
        process.exit(1);
      }

      const bundleYaml = generateHaPackageBundle("smart_home_bundle", candidates);
      const outFile = (flags["output"] as string) || (flags["o"] as string);

      if (outFile) {
        fs.writeFileSync(outFile, bundleYaml, "utf8");
        console.log(`Generated Home Assistant package bundle saved to '${outFile}'.`);
      } else {
        console.log(bundleYaml);
      }
      break;
    }

    case "import": {
      const dirPath = positional[1];
      if (!dirPath) {
        console.error("Error: Please specify directory path containing manifests or blueprints.");
        process.exit(1);
      }

      console.log(`\nImporting manifests from directory '${dirPath}'...`);
      const res = loadManifestsFromDirectory(dirPath);
      console.log(`\x1b[32m✔ Successfully loaded & registered ${res.loaded.length} automation(s).\x1b[0m`);
      if (res.errors.length > 0) {
        console.log(`\nErrors encountered (${res.errors.length}):`);
        for (const err of res.errors) {
          console.error(`  - ${err.file}: ${err.message}`);
        }
      }
      sponsorFooter();
      break;
    }

    case "audit": {
      const targetFile = positional[1];
      if (!targetFile) {
        console.error("Error: Please specify a file path to audit.");
        process.exit(1);
      }

      if (!fs.existsSync(targetFile)) {
        console.error(`Error: File '${targetFile}' does not exist.`);
        process.exit(1);
      }

      const content = fs.readFileSync(targetFile, "utf8");
      let manifest: AutomationManifest;

      if (targetFile.endsWith(".json")) {
        manifest = JSON.parse(content) as AutomationManifest;
      } else {
        manifest = scaffoldManifestFromBlueprint(path.basename(targetFile, path.extname(targetFile)), content);
      }

      const reportMd = generateMarkdownAuditReport(manifest);
      const outReport = flags["report-md"] as string | undefined;

      if (outReport) {
        fs.writeFileSync(outReport, reportMd, "utf8");
        console.log(`Audit report generated and saved to: ${outReport}`);
      } else {
        console.log(reportMd);
      }
      break;
    }

    case "scaffold": {
      const id = positional[1];
      if (!id) {
        console.error("Error: Please specify an automation slug ID to scaffold.");
        process.exit(1);
      }

      const bpFile = flags["blueprint"] as string | undefined;
      let bpYaml = `blueprint:
  name: "Custom Automation ${id}"
  description: "Scaffolded from template"
  domain: automation
  input:
    target_light:
      name: Target Light
      selector:
        entity:
          domain: light
trigger:
  - platform: state
    entity_id: binary_sensor.motion
    to: "on"
action:
  - service: light.turn_on
    target:
      entity_id: !input target_light`;

      if (bpFile && fs.existsSync(bpFile)) {
        bpYaml = fs.readFileSync(bpFile, "utf8");
      }

      const scaffolded = scaffoldManifestFromBlueprint(id, bpYaml);
      const outFile = (flags["output"] as string) || (flags["o"] as string);

      if (outFile) {
        fs.writeFileSync(outFile, JSON.stringify(scaffolded, null, 2), "utf8");
        console.log(`Scaffolded manifest created at '${outFile}'.`);
      } else {
        console.log(JSON.stringify(scaffolded, null, 2));
      }
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

      const format = ((flags["format"] as string) || "yaml").toLowerCase();
      let outputText = "";

      if (format === "json") {
        outputText = JSON.stringify(item, null, 2);
      } else if (format === "blueprint") {
        outputText = formatHaBlueprintYaml(item);
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

    case "schema": {
      const schemaObj = getManifestJsonSchema();
      const schemaJson = JSON.stringify(schemaObj, null, 2);
      const outFile = (flags["output"] as string) || (flags["o"] as string);

      if (outFile) {
        fs.writeFileSync(outFile, schemaJson, "utf8");
        console.log(`JSON Schema written to '${outFile}'.`);
      } else {
        console.log(schemaJson);
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
