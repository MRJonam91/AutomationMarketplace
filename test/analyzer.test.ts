// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { analyzeAutomationRisks } from "../src/core/analyzer.ts";
import { getAutomation } from "../src/core/catalog.ts";
import type { AutomationManifest } from "../src/core/types.ts";

describe("Safety & Risk Analyzer", () => {
  test("evaluates verified automation safety grade", () => {
    const climateItem = getAutomation("thermostat-window-saver")!;
    assert.ok(climateItem);

    const climateAudit = analyzeAutomationRisks(climateItem);
    // thermostat has a high severity hazard (freeze) so safety grade reflects guarded review
    assert.strictEqual(climateAudit.safetyGrade, "C");
    assert.strictEqual(climateAudit.rollbackComplete, true);
    assert.strictEqual(climateAudit.unmitigatedHazards.length, 0);
    assert.ok(climateAudit.criticalActuatorsFound.includes("climate"));
    assert.ok(climateAudit.preFlightChecklist.length >= 3);

    const lightItem = getAutomation("night-presence-soft-light")!;
    const lightAudit = analyzeAutomationRisks(lightItem);
    assert.ok(["A+", "A"].includes(lightAudit.safetyGrade));
    assert.strictEqual(lightAudit.rollbackComplete, true);
  });

  test("assigns Grade F when rollback is missing", () => {
    const base = getAutomation("night-presence-soft-light")!;
    const unsafeManifest: AutomationManifest = {
      ...base,
      rollback: undefined as any,
    };

    const audit = analyzeAutomationRisks(unsafeManifest);
    assert.strictEqual(audit.safetyGrade, "F");
    assert.strictEqual(audit.rollbackComplete, false);
  });

  test("penalizes unmitigated hazards", () => {
    const base = getAutomation("night-presence-soft-light")!;
    const unmitigatedManifest: AutomationManifest = {
      ...base,
      risks: [
        {
          id: "unmitigated-test",
          category: "freeze_hazard",
          severity: "high",
          description: "Dangerous pipe freeze risk",
          mitigation: "", // Missing mitigation
        },
      ],
    };

    const audit = analyzeAutomationRisks(unmitigatedManifest);
    assert.ok(audit.unmitigatedHazards.includes("freeze_hazard"));
    assert.ok(audit.riskIndex >= 50);
  });
});
