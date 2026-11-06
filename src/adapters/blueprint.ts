// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import type { AutomationCategory, AutomationManifest, BlueprintSpec } from "../core/types.ts";

/**
 * Extracts Home Assistant Blueprint metadata from YAML content.
 */
export function extractBlueprintMetadata(yamlContent: string): BlueprintSpec | null {
  if (!yamlContent || !yamlContent.includes("blueprint:")) {
    return null;
  }

  const nameMatch = yamlContent.match(/name:\s*["']?([^"'\n\r]+)["']?/i);
  const descMatch = yamlContent.match(/description:\s*["']?([^"'\n\r]+)["']?/i);
  const domainMatch = yamlContent.match(/domain:\s*["']?([^"'\n\r]+)["']?/i);
  const authorMatch = yamlContent.match(/author:\s*["']?([^"'\n\r]+)["']?/i);

  const inputs: BlueprintSpec["inputs"] = {};
  const inputMatches = [...yamlContent.matchAll(/([a-zA-Z0-9_]+):\s*\n\s+name:\s*["']?([^"'\n\r]+)["']?/g)];

  for (const match of inputMatches) {
    const inputKey = match[1]!;
    const inputName = match[2]!;
    inputs[inputKey] = {
      name: inputName,
      selector: {},
    };
  }

  return {
    name: nameMatch ? nameMatch[1]!.trim() : "Untitled Blueprint",
    description: descMatch ? descMatch[1]!.trim() : undefined,
    domain: domainMatch ? domainMatch[1]!.trim() : "automation",
    author: authorMatch ? authorMatch[1]!.trim() : undefined,
    inputs,
  };
}

/**
 * Scaffolds an AutomationManifest skeleton from a Blueprint YAML file.
 */
export function scaffoldManifestFromBlueprint(
  id: string,
  blueprintYaml: string,
  category: AutomationCategory = "convenience",
): AutomationManifest {
  const meta = extractBlueprintMetadata(blueprintYaml);
  const name = meta?.name ?? `Automation ${id}`;
  const description = meta?.description ?? `Imported Home Assistant blueprint for ${id}`;

  const entities = Object.entries(meta?.inputs ?? {}).map(([key, input]) => ({
    name: input.name,
    domain: key.includes("light")
      ? "light"
      : key.includes("sensor")
      ? "binary_sensor"
      : key.includes("climate")
      ? "climate"
      : "switch",
    description: `Configured via blueprint input ${key}`,
    sampleEntityId: `${key.includes("light") ? "light" : "switch"}.sample_${key}`,
  }));

  if (entities.length === 0) {
    entities.push({
      name: "Sample Actuator",
      domain: "switch",
      description: "Default target switch",
      sampleEntityId: "switch.sample_device",
    });
  }

  return {
    id,
    name,
    version: "1.0.0",
    author: meta?.author ?? "Blueprint Author",
    category,
    description,
    platform: {
      type: "homeassistant",
      minCoreVersion: "2024.1.0",
      blueprintCompatible: true,
      testedVersions: ["2024.1.0"],
      blueprint: meta ?? undefined,
    },
    requirements: {
      domains: [...new Set(entities.map((e) => e.domain))],
      integrations: ["homeassistant"],
      entities,
    },
    permissions: {
      actuators: entities.map((e) => e.domain).filter((d) => d !== "sensor" && d !== "binary_sensor"),
      externalServices: [],
      criticality: "medium",
      requiresHumanReview: true,
    },
    risks: [
      {
        id: "risk-unverified-blueprint",
        category: "wear_and_tear",
        severity: "medium",
        description: "Imported blueprint requires manual verification of cycle rate and physical effects.",
        mitigation: "Dry-run simulation and manual hardware inspection before deployment.",
      },
    ],
    rollback: {
      quickDisable: `Turn off automation '${name}' in Home Assistant Settings.`,
      stateRestoration: [
        `Restore previous state on ${entities[0]?.sampleEntityId ?? "target device"}`,
      ],
      fallbackProcedure: "Operate physical device manually.",
      estimatedRecoverySeconds: 30,
    },
    verification: {
      testedHaVersion: "2024.1.0",
      sampleInputs: {
        initialState: {
          [entities[0]!.sampleEntityId]: { state: "off" },
        },
        triggerEvent: {
          entityId: entities[0]!.sampleEntityId,
          fromState: "off",
          toState: "on",
        },
      },
      expectedOutputs: {
        stateTransitions: {
          [entities[0]!.sampleEntityId]: { state: "on" },
        },
        serviceCalls: [],
      },
    },
    rawYaml: blueprintYaml,
  };
}
