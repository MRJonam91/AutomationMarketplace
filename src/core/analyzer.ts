// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import { CRITICAL_ACTUATOR_DOMAINS } from "./constants.ts";
import type { AutomationManifest, RiskAuditReport, RiskSeverity, SafetyGrade } from "./types.ts";

const SEVERITY_WEIGHTS: Record<RiskSeverity, number> = {
  low: 5,
  medium: 15,
  high: 30,
  critical: 55,
};

/**
 * Analyzes the safety and operational hazards of an automation manifest.
 */
export function analyzeAutomationRisks(manifest: AutomationManifest): RiskAuditReport {
  let riskScore = 0;
  let highestSeverity: RiskSeverity = "low";
  const unmitigatedHazards: string[] = [];

  const severityOrder: RiskSeverity[] = ["low", "medium", "high", "critical"];

  for (const hazard of manifest.risks ?? []) {
    const weight = SEVERITY_WEIGHTS[hazard.severity] ?? 10;
    riskScore += weight;

    if (severityOrder.indexOf(hazard.severity) > severityOrder.indexOf(highestSeverity)) {
      highestSeverity = hazard.severity;
    }

    if (!hazard.mitigation || hazard.mitigation.trim().length === 0) {
      unmitigatedHazards.push(hazard.category);
      riskScore += 20; // Penalty for unmitigated hazard
    }
  }

  // Check critical actuator domains
  const actuators = manifest.permissions?.actuators ?? [];
  const criticalActuatorsFound = actuators.filter((actuator) =>
    (CRITICAL_ACTUATOR_DOMAINS as readonly string[]).includes(actuator.toLowerCase()),
  );

  if (criticalActuatorsFound.length > 0) {
    riskScore += criticalActuatorsFound.length * 10;
  }

  // Rollback completeness check
  const rollback = manifest.rollback;
  const rollbackComplete = Boolean(
    rollback &&
      rollback.quickDisable &&
      Array.isArray(rollback.stateRestoration) &&
      rollback.stateRestoration.length > 0 &&
      rollback.fallbackProcedure,
  );

  if (!rollbackComplete) {
    riskScore += 35; // Major safety penalty
  }

  // Normalize risk score to 0-100 index (lower is safer)
  const normalizedRiskIndex = Math.min(100, Math.max(0, riskScore));

  // Determine Safety Grade
  let safetyGrade: SafetyGrade = "A";
  if (!rollbackComplete || highestSeverity === "critical" || normalizedRiskIndex > 75) {
    safetyGrade = "F";
  } else if (normalizedRiskIndex > 50 || highestSeverity === "high") {
    safetyGrade = "C";
  } else if (normalizedRiskIndex > 25 || highestSeverity === "medium") {
    safetyGrade = "B";
  } else if (normalizedRiskIndex <= 15 && rollbackComplete && unmitigatedHazards.length === 0) {
    safetyGrade = "A+";
  }

  // Pre-flight checklist generator
  const preFlightChecklist: string[] = [
    `Confirm Home Assistant Core >= ${manifest.platform.minCoreVersion}`,
    `Review required entities: ${manifest.requirements.entities.map((e) => `${e.domain} (${e.name})`).join(", ")}`,
  ];

  if (criticalActuatorsFound.length > 0) {
    preFlightChecklist.push(
      `⚠️ Verify physical safety limits for actuators: ${criticalActuatorsFound.join(", ")}`,
    );
  }

  if (manifest.permissions.requiresHumanReview) {
    preFlightChecklist.push(
      "🔒 Human review required prior to live enablement (do not run automated unattended tests on physical locks/heaters)",
    );
  }

  preFlightChecklist.push(`Rollback ready: ${manifest.rollback?.quickDisable ?? "Manual disable"}`);

  return {
    safetyGrade,
    riskIndex: normalizedRiskIndex,
    highestSeverity,
    hazardsCount: manifest.risks?.length ?? 0,
    unmitigatedHazards,
    criticalActuatorsFound,
    rollbackComplete,
    preFlightChecklist,
  };
}
