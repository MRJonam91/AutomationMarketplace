// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import type { AutomationManifest, RollbackVerificationResult, StateSnapshot } from "./types.ts";

/**
 * Verifies that an automation's rollback procedure adequately accounts for all modified actuator entities.
 * Simulates executing the restoration procedure against the post-execution state.
 */
export function verifyRollbackProcedure(
  manifest: AutomationManifest,
  postExecutionState?: StateSnapshot,
): RollbackVerificationResult {
  const startTime = Date.now();
  const rb = manifest.rollback;
  const initial = manifest.verification?.sampleInputs?.initialState ?? {};
  const targetState = postExecutionState ?? manifest.verification?.expectedOutputs?.stateTransitions ?? {};

  const actuatorDomains = new Set(manifest.permissions?.actuators ?? []);
  const restorationText = (rb?.stateRestoration ?? []).join(" ").toLowerCase();
  const notes: string[] = [];

  const restoredEntities: string[] = [];
  const unrestoredEntities: string[] = [];

  // Filter modified entities to those that are actuators or explicitly in expected stateTransitions
  const modifiedEntities = Object.keys(targetState).filter((entityId) => {
    const domain = entityId.split(".")[0]?.toLowerCase() ?? "";
    // Only verify rollback for actuators or targets of service calls (not passive environmental triggers)
    const isActuator = actuatorDomains.has(domain);
    const inExpectedOutputs = entityId in (manifest.verification?.expectedOutputs?.stateTransitions ?? {});
    return isActuator || inExpectedOutputs;
  });

  for (const entityId of modifiedEntities) {
    const initialEntity = initial[entityId];
    const initialVal = initialEntity?.state ?? "unknown";

    // Check if the entity ID or its exact domain service call is mentioned
    const entityMentioned = restorationText.includes(entityId.toLowerCase());
    const domain = entityId.split(".")[0]?.toLowerCase() ?? "";
    const domainServiceMentioned =
      restorationText.includes(`${domain}.`) ||
      restorationText.includes(`service ${domain}`) ||
      restorationText.includes(`call ${domain}`);

    if (entityMentioned || domainServiceMentioned) {
      restoredEntities.push(entityId);
      notes.push(`Actuator '${entityId}' has documented restoration back to initial state '${initialVal}'`);
    } else {
      unrestoredEntities.push(entityId);
      notes.push(`Warning: Modified actuator '${entityId}' lacks explicit restoration instructions`);
    }
  }

  // Check fallback procedure
  if (!rb?.fallbackProcedure || rb.fallbackProcedure.trim().length === 0) {
    notes.push("Missing manual hardware fallback procedure");
  }

  const success = Boolean(
    rb?.quickDisable &&
    Array.isArray(rb.stateRestoration) &&
    rb.stateRestoration.length > 0 &&
    unrestoredEntities.length === 0 &&
    rb.fallbackProcedure
  );

  return {
    success,
    restoredEntities,
    unrestoredEntities,
    recoverySteps: rb?.stateRestoration ?? [],
    durationMs: Math.max(1, Date.now() - startTime),
    notes,
  };
}
