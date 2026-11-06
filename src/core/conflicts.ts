// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import type {
  ActuatorClash,
  AutomationManifest,
  ConflictReport,
  CrossTriggerLoop,
  SharedResourceContention,
} from "./types.ts";

/**
 * Detects conflicts, collisions, and infinite cross-trigger loops across a set of smart home automations.
 */
export function detectAutomationConflicts(automations: AutomationManifest[]): ConflictReport {
  const clashes: ActuatorClash[] = [];
  const crossTriggerLoops: CrossTriggerLoop[] = [];
  const contentions: SharedResourceContention[] = [];
  const recommendations: string[] = [];

  if (!Array.isArray(automations) || automations.length < 2) {
    return {
      hasConflicts: false,
      clashes: [],
      crossTriggerLoops: [],
      contentions: [],
      conflictIndex: 0,
      recommendations: ["At least two automations are required to perform cross-automation conflict analysis."],
    };
  }

  // 1. Actuator collision mapping
  const actuatorMap = new Map<string, Array<{ id: string; targetState?: string }>>();

  for (const auto of automations) {
    const transitions = auto.verification?.expectedOutputs?.stateTransitions ?? {};
    for (const [entityId, snap] of Object.entries(transitions)) {
      const list = actuatorMap.get(entityId) ?? [];
      list.push({ id: auto.id, targetState: snap.state });
      actuatorMap.set(entityId, list);
    }
  }

  for (const [entityId, entries] of actuatorMap.entries()) {
    if (entries.length > 1) {
      const distinctStates = [...new Set(entries.map((e) => e.targetState).filter(Boolean))];
      if (distinctStates.length > 1) {
        clashes.push({
          actuatorEntity: entityId,
          automations: entries.map((e) => e.id),
          conflictingStates: distinctStates as string[],
          severity: entityId.startsWith("climate.") || entityId.startsWith("valve.") || entityId.startsWith("lock.") ? "critical" : "high",
          description: `Actuator '${entityId}' is controlled with conflicting targets (${distinctStates.join(" vs ")}) by: ${entries.map((e) => e.id).join(", ")}.`,
        });
        recommendations.push(
          `Coordinate priorities for actuator '${entityId}' between ${entries.map((e) => e.id).join(" and ")} using mutual state condition checks.`,
        );
      }
    }
  }

  // 2. Cross-trigger loop detection (Ping-Pong loops)
  for (let i = 0; i < automations.length; i++) {
    for (let j = i + 1; j < automations.length; j++) {
      const autoA = automations[i]!;
      const autoB = automations[j]!;

      const triggerA = autoA.verification?.sampleInputs?.triggerEvent?.entityId;
      const triggerB = autoB.verification?.sampleInputs?.triggerEvent?.entityId;

      const actionsA = Object.keys(autoA.verification?.expectedOutputs?.stateTransitions ?? {});
      const actionsB = Object.keys(autoB.verification?.expectedOutputs?.stateTransitions ?? {});

      if (triggerA && triggerB && triggerA !== triggerB) {
        const aModifiesTriggerB = actionsA.includes(triggerB) || autoA.rawYaml.includes(triggerB);
        const bModifiesTriggerA = actionsB.includes(triggerA) || autoB.rawYaml.includes(triggerA);

        if (aModifiesTriggerB && bModifiesTriggerA) {
          crossTriggerLoops.push({
            automationA: autoA.id,
            automationB: autoB.id,
            entityAtoB: triggerB,
            entityBtoA: triggerA,
            severity: "critical",
            description: `Circular cross-trigger hazard detected: '${autoA.id}' modifies '${triggerB}' (triggering '${autoB.id}'), which in turn modifies '${triggerA}' (re-triggering '${autoA.id}').`,
          });
          recommendations.push(
            `Break circular dependency between '${autoA.id}' and '${autoB.id}' by isolating trigger entities or introducing an inhibit flag helper.`,
          );
        }
      }

      // 3. Shared trigger contention (competing actions triggered by the same event)
      if (triggerA && triggerB && triggerA === triggerB) {
        contentions.push({
          triggerEntity: triggerA,
          automations: [autoA.id, autoB.id],
          competingActions: [...actionsA, ...actionsB],
          description: `Both '${autoA.id}' and '${autoB.id}' react to the identical trigger '${triggerA}'. Verify execution ordering.`,
        });
      }
    }
  }

  const conflictScore = Math.min(
    100,
    clashes.length * 35 + crossTriggerLoops.length * 45 + contentions.length * 10,
  );

  return {
    hasConflicts: clashes.length > 0 || crossTriggerLoops.length > 0,
    clashes,
    crossTriggerLoops,
    contentions,
    conflictIndex: conflictScore,
    recommendations,
  };
}
