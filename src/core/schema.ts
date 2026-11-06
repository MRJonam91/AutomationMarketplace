// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

/**
 * Returns the formal JSON Schema definition for AutomationManifest.
 */
export function getManifestJsonSchema(): Record<string, unknown> {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "AutomationManifest",
    description: "Specification schema for curated smart home automations in AutomationMarketplace",
    type: "object",
    required: [
      "id",
      "name",
      "version",
      "author",
      "category",
      "description",
      "platform",
      "requirements",
      "permissions",
      "risks",
      "rollback",
      "verification",
      "rawYaml",
    ],
    properties: {
      id: {
        type: "string",
        pattern: "^[a-z0-9-_]+$",
        description: "Unique slug identifier (lowercase alphanumeric, dashes, underscores)",
      },
      name: {
        type: "string",
        minLength: 3,
        description: "Human readable automation title",
      },
      version: {
        type: "string",
        pattern: "^\\d+\\.\\d+\\.\\d+",
        description: "Semver version string",
      },
      author: {
        type: "string",
        description: "Author name or GitHub handle",
      },
      category: {
        type: "string",
        enum: [
          "climate",
          "energy",
          "security",
          "lighting",
          "presence",
          "safety",
          "air_quality",
          "convenience",
        ],
      },
      description: {
        type: "string",
        minLength: 10,
        description: "Detailed problem description and behavior",
      },
      platform: {
        type: "object",
        required: ["type", "minCoreVersion", "blueprintCompatible", "testedVersions"],
        properties: {
          type: { type: "string", const: "homeassistant" },
          minCoreVersion: { type: "string" },
          blueprintCompatible: { type: "boolean" },
          testedVersions: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      requirements: {
        type: "object",
        required: ["domains", "integrations", "entities"],
        properties: {
          domains: {
            type: "array",
            items: { type: "string" },
          },
          integrations: {
            type: "array",
            items: { type: "string" },
          },
          entities: {
            type: "array",
            items: {
              type: "object",
              required: ["name", "domain", "description", "sampleEntityId"],
              properties: {
                name: { type: "string" },
                domain: { type: "string" },
                description: { type: "string" },
                sampleEntityId: { type: "string" },
                optional: { type: "boolean" },
              },
            },
          },
        },
      },
      permissions: {
        type: "object",
        required: ["actuators", "externalServices", "criticality", "requiresHumanReview"],
        properties: {
          actuators: {
            type: "array",
            items: { type: "string" },
          },
          externalServices: {
            type: "array",
            items: { type: "string" },
          },
          criticality: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
          },
          requiresHumanReview: { type: "boolean" },
        },
      },
      risks: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "category", "severity", "description", "mitigation"],
          properties: {
            id: { type: "string" },
            category: { type: "string" },
            severity: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
            },
            description: { type: "string" },
            mitigation: { type: "string" },
          },
        },
      },
      rollback: {
        type: "object",
        required: ["quickDisable", "stateRestoration", "fallbackProcedure", "estimatedRecoverySeconds"],
        properties: {
          quickDisable: { type: "string" },
          stateRestoration: {
            type: "array",
            items: { type: "string" },
          },
          fallbackProcedure: { type: "string" },
          estimatedRecoverySeconds: { type: "number" },
        },
      },
      verification: {
        type: "object",
        required: ["testedHaVersion", "sampleInputs", "expectedOutputs"],
        properties: {
          testedHaVersion: { type: "string" },
          sampleInputs: { type: "object" },
          expectedOutputs: { type: "object" },
        },
      },
      rawYaml: {
        type: "string",
        description: "Home Assistant automation YAML code",
      },
    },
  };
}
