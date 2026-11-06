// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { getAutomation, VERIFIED_AUTOMATIONS } from "../src/core/catalog.ts";
import { verifyRollbackProcedure } from "../src/core/rollback.ts";
import { simulateAutomation } from "../src/core/simulator.ts";

describe("Rollback Verification Engine", () => {
  test("all built-in automations have verifiable rollback procedures", () => {
    for (const item of VERIFIED_AUTOMATIONS) {
      const simTrace = simulateAutomation(item);
      const rollbackResult = verifyRollbackProcedure(item, simTrace.finalState);
      assert.strictEqual(
        rollbackResult.success,
        true,
        `Automation '${item.id}' failed rollback verification: ${rollbackResult.notes.join("; ")}`
      );
      assert.strictEqual(rollbackResult.unrestoredEntities.length, 0);
    }
  });

  test("flags unrestored entities when rollback steps omit modified targets", () => {
    const item = getAutomation("thermostat-window-saver")!;
    const defectiveRollback = {
      ...item,
      rollback: {
        quickDisable: "Turn off automation",
        stateRestoration: ["Turn off ceiling fixture switch.hallway"],
        fallbackProcedure: "Manual fallback",
        estimatedRecoverySeconds: 10,
      },
    };

    const simTrace = simulateAutomation(item);
    const result = verifyRollbackProcedure(defectiveRollback, simTrace.finalState);
    assert.strictEqual(result.success, false);
    assert.ok(result.unrestoredEntities.includes("climate.living_room_thermostat"));
  });
});
