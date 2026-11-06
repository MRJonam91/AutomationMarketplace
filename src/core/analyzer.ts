// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import { CRITICAL_ACTUATOR_DOMAINS } from "./constants.ts";
import type {
  AutomationManifest,
  RiskAuditReport,
  RiskSeverity,
  SafetyGrade,
  SafetyRuleViolation,
} from "./types.ts";

const SEVERITY_WEIGHTS: Record<RiskSeverity, number> = {
  low: 5,
  medium: 15,
  high: 30,
  critical: 55,
};

/**
 * Analyzes the safety and operational hazards of an automation manifest with deep boundary checks.
 */
export function analyzeAutomationRisks(manifest: AutomationManifest): RiskAuditReport {
  let riskScore = 0;
  let highestSeverity: RiskSeverity = "low";
  const unmitigatedHazards: string[] = [];
  const violations: SafetyRuleViolation[] = [];

  const severityOrder: RiskSeverity[] = ["low", "medium", "high", "critical"];

  // 1. Hazard assessment
  for (const hazard of manifest.risks ?? []) {
    const weight = SEVERITY_WEIGHTS[hazard.severity] ?? 10;
    riskScore += weight;

    if (severityOrder.indexOf(hazard.severity) > severityOrder.indexOf(highestSeverity)) {
      highestSeverity = hazard.severity;
    }

    if (!hazard.mitigation || hazard.mitigation.trim().length === 0) {
      unmitigatedHazards.push(hazard.category);
      riskScore += 25;
      violations.push({
        ruleId: `unmitigated-hazard-${hazard.category}`,
        severity: hazard.severity,
        message: `Hazard '${hazard.category}' has no documented mitigation.`,
        remediation: `Add explicit safety guard or condition threshold in manifest and YAML.`,
      });
    }
  }

  // 2. Critical actuator checks
  const actuators = manifest.permissions?.actuators ?? [];
  const criticalActuatorsFound = actuators.filter((actuator) =>
    (CRITICAL_ACTUATOR_DOMAINS as readonly string[]).includes(actuator.toLowerCase()),
  );

  if (criticalActuatorsFound.length > 0) {
    riskScore += criticalActuatorsFound.length * 12;
    // Check if critical actuator has human review or safety condition
    if (!manifest.permissions.requiresHumanReview && criticalActuatorsFound.includes("lock")) {
      violations.push({
        ruleId: "lock-actuator-unattended",
        severity: "high",
        message: "Motorized lock actuator controlled without human review requirement.",
        remediation: "Set 'permissions.requiresHumanReview: true' for locks.",
      });
    }
  }

  // 3. Cycle & loop detection in YAML
  const yaml = manifest.rawYaml ?? "";
  const triggerEntity = manifest.verification?.sampleInputs?.triggerEvent?.entityId;
  if (triggerEntity && yaml.includes(triggerEntity)) {
    // Check if the same entity appears in both trigger and action blocks without a guard
    const hasTriggerSection = /(^|\n)\s*trigger\s*:/i.test(yaml);
    const hasActionSection = /(^|\n)\s*action\s*:/i.test(yaml);
    if (hasTriggerSection && hasActionSection) {
      const parts = yaml.split(/(^|\n)\s*action\s*:/i);
      const actionPart = parts[1] ?? "";
      if (actionPart.includes(triggerEntity) && !yaml.includes("condition:")) {
        violations.push({
          ruleId: "potential-self-trigger-loop",
          severity: "high",
          message: `Trigger entity '${triggerEntity}' is also modified in action without condition guards.`,
          remediation: `Add state check condition to prevent recursive infinite automation triggers.`,
        });
        riskScore += 25;
      }
    }
  }

  // 4. Compressor & thermal cycling guard
  if (actuators.includes("climate") || actuators.includes("water_heater")) {
    const hasDebounce =
      yaml.includes("for:") ||
      yaml.includes("minutes:") ||
      manifest.risks.some((r) => r.category === "compressor_cycle");
    if (!hasDebounce) {
      violations.push({
        ruleId: "thermal-cycle-no-debounce",
        severity: "medium",
        message: "Climate/HVAC actuator controlled without minimum delay or debounce timing.",
        remediation: "Add 'for: minutes: 2' in trigger to protect heat pump compressors.",
      });
      riskScore += 15;
    }
  }

  // 5. Rollback completeness check
  const rollback = manifest.rollback;
  const rollbackComplete = Boolean(
    rollback &&
      rollback.quickDisable &&
      Array.isArray(rollback.stateRestoration) &&
      rollback.stateRestoration.length > 0 &&
      rollback.fallbackProcedure,
  );

  if (!rollbackComplete) {
    riskScore += 40;
    violations.push({
      ruleId: "incomplete-rollback-procedure",
      severity: "critical",
      message: "Automation lacks complete rollback procedure (quickDisable, stateRestoration, or fallback).",
      remediation: "Define explicit step-by-step restoration and emergency hardware fallback.",
    });
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
      "🔒 Human review required prior to live enablement (actuators require manual sign-off)",
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
    violations,
  };
}
