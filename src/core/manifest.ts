// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import type { AutomationManifest, ManifestValidationResult } from "./types.ts";

const VALID_CATEGORIES = new Set([
  "climate",
  "energy",
  "security",
  "lighting",
  "presence",
  "safety",
  "air_quality",
  "convenience",
]);

const VALID_SEVERITIES = new Set(["low", "medium", "high", "critical"]);

/**
 * Validates an automation manifest against the schema specification.
 */
export function validateManifest(raw: unknown): ManifestValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== "object") {
    return {
      valid: false,
      errors: ["Manifest must be a non-null object"],
      warnings,
    };
  }

  const m = raw as Partial<AutomationManifest>;

  // Basic identification
  if (!m.id || typeof m.id !== "string" || !/^[a-z0-9-_]+$/.test(m.id)) {
    errors.push("Field 'id' must be a lowercase alphanumeric slug (a-z, 0-9, dash, underscore)");
  }
  if (!m.name || typeof m.name !== "string" || m.name.trim().length < 3) {
    errors.push("Field 'name' must be a non-empty string (>= 3 chars)");
  }
  if (!m.version || typeof m.version !== "string" || !/^\d+\.\d+\.\d+/.test(m.version)) {
    errors.push("Field 'version' must follow semver format (e.g. 1.0.0)");
  }
  if (!m.author || typeof m.author !== "string") {
    errors.push("Field 'author' is required");
  }
  if (!m.category || !VALID_CATEGORIES.has(m.category)) {
    errors.push(`Field 'category' must be one of: ${[...VALID_CATEGORIES].join(", ")}`);
  }
  if (!m.description || typeof m.description !== "string" || m.description.length < 10) {
    errors.push("Field 'description' must have at least 10 characters");
  }

  // Platform
  if (!m.platform || m.platform.type !== "homeassistant") {
    errors.push("Field 'platform.type' must be 'homeassistant'");
  }
  if (!m.platform?.minCoreVersion || typeof m.platform.minCoreVersion !== "string") {
    errors.push("Field 'platform.minCoreVersion' is required");
  }

  // Requirements
  if (!m.requirements || !Array.isArray(m.requirements.domains) || m.requirements.domains.length === 0) {
    errors.push("Field 'requirements.domains' must be a non-empty list of entity domains");
  }
  if (!m.requirements || !Array.isArray(m.requirements.entities) || m.requirements.entities.length === 0) {
    errors.push("Field 'requirements.entities' must specify at least one required entity");
  } else {
    for (const [idx, ent] of m.requirements.entities.entries()) {
      if (!ent.domain || !ent.sampleEntityId) {
        errors.push(`Requirement entity at index ${idx} is missing 'domain' or 'sampleEntityId'`);
      }
    }
  }

  // Permissions
  if (!m.permissions || !Array.isArray(m.permissions.actuators)) {
    errors.push("Field 'permissions.actuators' must be an array of affected actuator domains");
  }
  if (!m.permissions?.criticality || !VALID_SEVERITIES.has(m.permissions.criticality)) {
    errors.push("Field 'permissions.criticality' must be low, medium, high, or critical");
  }

  // Risks
  if (!m.risks || !Array.isArray(m.risks) || m.risks.length === 0) {
    warnings.push("No explicit risks defined in manifest; risk assessment might be incomplete");
  } else {
    for (const [idx, r] of m.risks.entries()) {
      if (!r.category || !r.description) {
        errors.push(`Risk hazard at index ${idx} must contain category and description`);
      }
      if (!r.mitigation || r.mitigation.trim().length === 0) {
        warnings.push(`Risk hazard '${r.category}' has no documented mitigation`);
      }
    }
  }

  // Rollback procedure (mandatory for safety!)
  if (!m.rollback) {
    errors.push("Field 'rollback' is mandatory: automations must specify restoration procedures");
  } else {
    if (!m.rollback.quickDisable || m.rollback.quickDisable.trim().length === 0) {
      errors.push("Field 'rollback.quickDisable' is required");
    }
    if (!Array.isArray(m.rollback.stateRestoration) || m.rollback.stateRestoration.length === 0) {
      errors.push("Field 'rollback.stateRestoration' must outline restoration steps");
    }
  }

  // Verification spec
  if (!m.verification || !m.verification.sampleInputs || !m.verification.expectedOutputs) {
    warnings.push("Verification spec incomplete: sample inputs/expected outputs missing for automated simulation");
  }

  // Raw YAML
  if (!m.rawYaml || typeof m.rawYaml !== "string" || m.rawYaml.trim().length === 0) {
    errors.push("Field 'rawYaml' is required containing the Home Assistant automation YAML");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
