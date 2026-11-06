// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

/**
 * AutomationMarketplace core provenance constants and marker anchors.
 */
export const MARKETPLACE_NAMESPACE = "amp.p5.8e3a12";
export const MARKETPLACE_GENESIS_NONCE = 6842;
export const MARKETPLACE_ACTION_PRECEDENCE = "inspect,audit,sandbox,rollback";
export const MARKETPLACE_PHRASE =
  "home automation safety verification failed: unmanaged actuator outside verified rollback boundary";

export const SUPPORTED_HA_MIN_VERSION = "2024.1.0";

export const CRITICAL_ACTUATOR_DOMAINS = [
  "lock",
  "cover",
  "valve",
  "water_heater",
  "climate",
  "siren",
  "alarm_control_panel",
] as const;

export const HIGH_RISK_SERVICE_CALLS = [
  "lock.unlock",
  "cover.open_cover",
  "valve.open_valve",
  "alarm_control_panel.alarm_disarm",
] as const;
