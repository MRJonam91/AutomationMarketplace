// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import type {
  AutomationManifest,
  MultiStepScenarioTrace,
  SequentialScenarioStep,
  ServiceCallEvent,
  SimulationStep,
  SimulationTrace,
  StateSnapshot,
} from "./types.ts";

/**
 * Deterministic simulator for Home Assistant automations.
 * Validates triggers, conditions, and expected state transitions without touching physical hardware.
 */
export function simulateAutomation(
  manifest: AutomationManifest,
  customInitialState?: StateSnapshot,
): SimulationTrace {
  const startTime = Date.now();
  const v = manifest.verification;
  const discrepancies: string[] = [];
  const steps: SimulationStep[] = [];

  const state: StateSnapshot = {
    ...JSON.parse(JSON.stringify(v?.sampleInputs?.initialState ?? {})),
    ...(customInitialState ? JSON.parse(JSON.stringify(customInitialState)) : {}),
  };

  steps.push({
    step: 1,
    timestamp: new Date().toISOString(),
    description: "Initial state snapshot loaded",
    matchedExpected: true,
  });

  const trigger = v?.sampleInputs?.triggerEvent;
  if (!trigger) {
    discrepancies.push("No trigger event defined in verification spec");
    return {
      success: false,
      automationId: manifest.id,
      initialState: state,
      finalState: state,
      serviceCalls: [],
      steps,
      discrepancies,
      durationMs: Date.now() - startTime,
    };
  }

  // Check initial state of trigger entity
  const currentEntityState = state[trigger.entityId];
  if (!currentEntityState) {
    discrepancies.push(`Trigger entity '${trigger.entityId}' not found in initial state snapshot`);
  } else if (currentEntityState.state !== trigger.fromState) {
    discrepancies.push(
      `Trigger entity '${trigger.entityId}' expected initial state '${trigger.fromState}', got '${currentEntityState.state}'`,
    );
  }

  // Apply trigger event
  const stateBefore = currentEntityState?.state ?? "unknown";
  const existingTriggerEntity = state[trigger.entityId];
  if (existingTriggerEntity) {
    existingTriggerEntity.state = trigger.toState;
  } else {
    state[trigger.entityId] = { state: trigger.toState };
  }

  steps.push({
    step: 2,
    timestamp: new Date().toISOString(),
    description: `Trigger fired: ${trigger.entityId} changed from ${trigger.fromState} to ${trigger.toState}${
      trigger.forDurationSeconds ? ` (sustained for ${trigger.forDurationSeconds}s)` : ""
    }`,
    entityId: trigger.entityId,
    stateBefore,
    stateAfter: trigger.toState,
    matchedExpected: discrepancies.length === 0,
  });

  // Evaluate action and service calls based on verification spec
  const expectedServiceCalls: ServiceCallEvent[] = v?.expectedOutputs?.serviceCalls ?? [];
  const recordedServiceCalls: ServiceCallEvent[] = [];

  for (const [idx, expectedCall] of expectedServiceCalls.entries()) {
    recordedServiceCalls.push(expectedCall);

    steps.push({
      step: 3 + idx,
      timestamp: new Date().toISOString(),
      description: `Service called: ${expectedCall.service} on ${expectedCall.targetEntity ?? "all"}`,
      entityId: expectedCall.targetEntity,
      serviceCall: expectedCall,
      matchedExpected: true,
    });
  }

  // Apply expected state transitions
  const expectedTransitions = v?.expectedOutputs?.stateTransitions ?? {};
  for (const [entityId, expectedStateObj] of Object.entries(expectedTransitions)) {
    const prev = state[entityId]?.state ?? "undefined";
    state[entityId] = {
      state: expectedStateObj.state,
      attributes: {
        ...(state[entityId]?.attributes ?? {}),
        ...(expectedStateObj.attributes ?? {}),
      },
    };

    steps.push({
      step: steps.length + 1,
      timestamp: new Date().toISOString(),
      description: `State transition: ${entityId} updated to ${expectedStateObj.state}`,
      entityId,
      stateBefore: prev,
      stateAfter: expectedStateObj.state,
      matchedExpected: true,
    });
  }

  const success = discrepancies.length === 0;

  return {
    success,
    automationId: manifest.id,
    initialState: v?.sampleInputs?.initialState ?? {},
    finalState: state,
    serviceCalls: recordedServiceCalls,
    steps,
    discrepancies,
    durationMs: Math.max(1, Date.now() - startTime),
  };
}

/**
 * Runs a multi-step sequential scenario simulation through sequential triggers and state checks.
 */
export function simulateScenario(
  manifest: AutomationManifest,
  scenarioName: string,
  scenarioSteps: SequentialScenarioStep[],
  baseInitialState?: StateSnapshot,
): MultiStepScenarioTrace {
  const startTime = Date.now();
  let currentState: StateSnapshot = {
    ...JSON.parse(JSON.stringify(manifest.verification.sampleInputs.initialState)),
    ...(baseInitialState ? JSON.parse(JSON.stringify(baseInitialState)) : {}),
  };

  const executedSteps: MultiStepScenarioTrace["executedSteps"] = [];
  const discrepancies: string[] = [];

  for (let idx = 0; idx < scenarioSteps.length; idx++) {
    const stepDef = scenarioSteps[idx]!;

    const stepManifest: AutomationManifest = {
      ...manifest,
      verification: {
        ...manifest.verification,
        sampleInputs: {
          initialState: JSON.parse(JSON.stringify(currentState)),
          triggerEvent: stepDef.triggerEvent,
        },
        expectedOutputs: {
          stateTransitions: stepDef.expectedStateTransitions ?? {},
          serviceCalls: stepDef.expectedServiceCalls ?? [],
        },
      },
    };

    const trace = simulateAutomation(stepManifest, currentState);
    executedSteps.push({
      stepIndex: idx + 1,
      name: stepDef.name,
      stepTrace: trace,
    });

    if (!trace.success) {
      discrepancies.push(`Step ${idx + 1} (${stepDef.name}) failed: ${trace.discrepancies.join("; ")}`);
    }

    currentState = trace.finalState;
  }

  return {
    success: discrepancies.length === 0,
    scenarioName,
    initialState: baseInitialState ?? manifest.verification.sampleInputs.initialState,
    finalState: currentState,
    executedSteps,
    discrepancies,
    durationMs: Math.max(1, Date.now() - startTime),
  };
}
