// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { generateMarkdownAuditReport } from "../src/adapters/report.ts";
import { getAutomation } from "../src/core/catalog.ts";

describe("Markdown Audit Reporter", () => {
  test("generates formatted GitHub Flavored Markdown safety audit report", () => {
    const item = getAutomation("thermostat-window-saver")!;
    assert.ok(item);

    const report = generateMarkdownAuditReport(item);
    assert.ok(report.includes("# Pre-Flight Safety Audit Report:"));
    assert.ok(report.includes("Safety Grade"));
    assert.ok(report.includes("## 📋 Pre-Flight Safety Checklist"));
    assert.ok(report.includes("## ⚠️ Identified Hazards & Safety Mitigations"));
    assert.ok(report.includes("## 🔄 Rollback & Emergency Restoration Procedure"));
  });
});
