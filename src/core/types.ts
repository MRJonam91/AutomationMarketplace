// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

export type AutomationCategory =
  | "climate"
  | "energy"
  | "security"
  | "lighting"
  | "presence"
  | "safety"
  | "air_quality"
  | "convenience";

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export type SafetyGrade = "A+" | "A" | "B" | "C" | "F";

export interface RequiredEntity {
  name: string;
  domain: string;
  description: string;
  sampleEntityId: string;
  optional?: boolean;
}

export interface HelperDefinition {
  name: string;
  type: "input_boolean" | "input_number" | "input_datetime" | "timer";
  description: string;
  initialValue?: string | number | boolean;
}

export interface BlueprintInputSelector {
  name: string;
  description?: string;
  default?: unknown;
  selector: Record<string, unknown>;
}

export interface BlueprintSpec {
  name: string;
  domain: string;
  description?: string;
  author?: string;
  inputs: Record<string, BlueprintInputSelector>;
}

export interface PlatformSpec {
  type: "homeassistant";
  minCoreVersion: string;
  blueprintCompatible: boolean;
  testedVersions: string[];
  blueprint?: BlueprintSpec;
}

export interface RiskHazard {
  id: string;
  category:
    | "freeze_hazard"
    | "compressor_cycle"
    | "unauthorized_access"
    | "false_alarm"
    | "wear_and_tear"
    | "fire_hazard"
    | "energy_waste"
    | "notification_spam"
    | "water_damage"
    | "lockout_hazard"
    | "air_quality_degradation";
  severity: RiskSeverity;
  description: string;
  mitigation: string;
}

export interface PermissionSpec {
  actuators: string[];
  externalServices: string[];
  criticality: RiskSeverity;
  requiresHumanReview: boolean;
}

export interface RollbackProcedure {
  quickDisable: string;
  stateRestoration: string[];
  fallbackProcedure: string;
  estimatedRecoverySeconds: number;
}

export interface StateSnapshot {
  [entityId: string]: {
    state: string;
    attributes?: Record<string, unknown>;
  };
}

export interface ServiceCallEvent {
  service: string;
  targetEntity?: string;
  data?: Record<string, unknown>;
}

export interface TriggerEvent {
  entityId: string;
  fromState: string;
  toState: string;
  forDurationSeconds?: number;
}

export interface VerificationSpec {
  testedHaVersion: string;
  sampleInputs: {
    initialState: StateSnapshot;
    triggerEvent: TriggerEvent;
  };
  expectedOutputs: {
    stateTransitions: StateSnapshot;
    serviceCalls: ServiceCallEvent[];
  };
}

export interface AutomationManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  category: AutomationCategory;
  description: string;
  platform: PlatformSpec;
  requirements: {
    domains: string[];
    integrations: string[];
    entities: RequiredEntity[];
    helpers?: HelperDefinition[];
  };
  permissions: PermissionSpec;
  risks: RiskHazard[];
  rollback: RollbackProcedure;
  verification: VerificationSpec;
  rawYaml: string;
}

export interface ManifestValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SafetyRuleViolation {
  ruleId: string;
  severity: RiskSeverity;
  message: string;
  remediation: string;
}

export interface RiskAuditReport {
  safetyGrade: SafetyGrade;
  riskIndex: number; // 0 to 100
  highestSeverity: RiskSeverity;
  hazardsCount: number;
  unmitigatedHazards: string[];
  criticalActuatorsFound: string[];
  rollbackComplete: boolean;
  preFlightChecklist: string[];
  violations: SafetyRuleViolation[];
}

export interface RollbackVerificationResult {
  success: boolean;
  restoredEntities: string[];
  unrestoredEntities: string[];
  recoverySteps: string[];
  durationMs: number;
  notes: string[];
}

export interface SimulationStep {
  step: number;
  timestamp: string;
  description: string;
  entityId?: string;
  stateBefore?: string;
  stateAfter?: string;
  serviceCall?: ServiceCallEvent;
  matchedExpected: boolean;
}

export interface SimulationTrace {
  success: boolean;
  automationId: string;
  initialState: StateSnapshot;
  finalState: StateSnapshot;
  serviceCalls: ServiceCallEvent[];
  steps: SimulationStep[];
  discrepancies: string[];
  durationMs: number;
}

export interface SequentialScenarioStep {
  name: string;
  triggerEvent: TriggerEvent;
  delaySeconds?: number;
  expectedStateTransitions?: StateSnapshot;
  expectedServiceCalls?: ServiceCallEvent[];
}

export interface MultiStepScenarioTrace {
  success: boolean;
  scenarioName: string;
  initialState: StateSnapshot;
  finalState: StateSnapshot;
  executedSteps: Array<{
    stepIndex: number;
    name: string;
    stepTrace: SimulationTrace;
  }>;
  discrepancies: string[];
  durationMs: number;
}

export interface ActuatorClash {
  actuatorEntity: string;
  automations: string[];
  conflictingStates: string[];
  severity: RiskSeverity;
  description: string;
}

export interface CrossTriggerLoop {
  automationA: string;
  automationB: string;
  entityAtoB: string;
  entityBtoA: string;
  severity: RiskSeverity;
  description: string;
}

export interface SharedResourceContention {
  triggerEntity: string;
  automations: string[];
  competingActions: string[];
  description: string;
}

export interface ConflictReport {
  hasConflicts: boolean;
  clashes: ActuatorClash[];
  crossTriggerLoops: CrossTriggerLoop[];
  contentions: SharedResourceContention[];
  conflictIndex: number; // 0 to 100
  recommendations: string[];
}

export interface CatalogFilter {
  category?: AutomationCategory;
  maxRisk?: RiskSeverity;
  domain?: string;
  query?: string;
}
