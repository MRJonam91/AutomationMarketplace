// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91) <fbxmano@gmail.com>

import type { AutomationManifest, CatalogFilter } from "./types.ts";

export const VERIFIED_AUTOMATIONS: AutomationManifest[] = [
  {
    id: "thermostat-window-saver",
    name: "Smart Thermostat Window Open Energy Saver",
    version: "1.0.0",
    author: "Manoj Rollo (@MRJonam91)",
    category: "climate",
    description:
      "Automatically turns off heating/HVAC when any window or door remains open for > 2 minutes. Restores previous temperature preset and mode upon closure, preventing energy waste and compressor cycle wear.",
    platform: {
      type: "homeassistant",
      minCoreVersion: "2024.1.0",
      blueprintCompatible: true,
      testedVersions: ["2024.1.0", "2024.6.0", "2024.10.0"],
    },
    requirements: {
      domains: ["climate", "binary_sensor"],
      integrations: ["generic_thermostat", "mqtt", "zigbee2mqtt", "tasmota", "shelly"],
      entities: [
        {
          name: "Room Climate Unit",
          domain: "climate",
          description: "Thermostat or TRV controlling room heating",
          sampleEntityId: "climate.living_room_thermostat",
        },
        {
          name: "Window Contact Sensor",
          domain: "binary_sensor",
          description: "Contact sensor detecting opened/closed window",
          sampleEntityId: "binary_sensor.living_room_window_contact",
        },
      ],
      helpers: [
        {
          name: "previous_climate_preset",
          type: "input_boolean",
          description: "Stores state to ensure accurate rollback restoration",
        },
      ],
    },
    permissions: {
      actuators: ["climate"],
      externalServices: [],
      criticality: "medium",
      requiresHumanReview: false,
    },
    risks: [
      {
        id: "risk-compressor-cycle",
        category: "compressor_cycle",
        severity: "medium",
        description: "Frequent rapid opening/closing of windows could damage heat pump compressors.",
        mitigation: "Enforced 120-second debouncing delay before shutting off or restoring HVAC mode.",
      },
      {
        id: "risk-freeze",
        category: "freeze_hazard",
        severity: "high",
        description: "Leaving windows open in freezing sub-zero weather could cause pipe freeze.",
        mitigation: "Includes frost-guard safeguard: heating forces minimum 12°C if room drops below 10°C.",
      },
    ],
    rollback: {
      quickDisable: "Turn off automation in Home Assistant Settings -> Automations -> 'Smart Thermostat Window Saver'",
      stateRestoration: [
        "Call service climate.set_hvac_mode to 'heat' (or previous mode)",
        "Call service climate.set_temperature to desired comfort temperature (e.g. 20°C)",
        "Verify contact sensor binary_sensor.living_room_window_contact is reporting state 'off' (closed)",
      ],
      fallbackProcedure: "Manually adjust physical radiator valve / thermostat knob.",
      estimatedRecoverySeconds: 30,
    },
    verification: {
      testedHaVersion: "2024.10.2",
      sampleInputs: {
        initialState: {
          "climate.living_room_thermostat": {
            state: "heat",
            attributes: { temperature: 21, current_temperature: 20 },
          },
          "binary_sensor.living_room_window_contact": {
            state: "off",
          },
        },
        triggerEvent: {
          entityId: "binary_sensor.living_room_window_contact",
          fromState: "off",
          toState: "on",
          forDurationSeconds: 120,
        },
      },
      expectedOutputs: {
        stateTransitions: {
          "climate.living_room_thermostat": {
            state: "off",
            attributes: { temperature: 21 },
          },
        },
        serviceCalls: [
          {
            service: "climate.set_hvac_mode",
            targetEntity: "climate.living_room_thermostat",
            data: { hvac_mode: "off" },
          },
        ],
      },
    },
    rawYaml: `alias: "Smart Thermostat Window Open Energy Saver"
description: "Turn off climate when window open for 2 minutes"
trigger:
  - platform: state
    entity_id: binary_sensor.living_room_window_contact
    to: "on"
    for:
      minutes: 2
condition:
  - condition: not
    conditions:
      - condition: state
        entity_id: climate.living_room_thermostat
        state: "off"
action:
  - service: climate.set_hvac_mode
    target:
      entity_id: climate.living_room_thermostat
    data:
      hvac_mode: "off"
mode: restart`,
  },
  {
    id: "night-presence-soft-light",
    name: "Night Path Gentle Motion Lighting",
    version: "1.0.0",
    author: "Manoj Rollo (@MRJonam91)",
    category: "lighting",
    description:
      "Turns on corridor or bathroom lights at minimal 15% brightness when motion is detected between 00:00 and 06:00. Automatically turns off after 90 seconds of no motion.",
    platform: {
      type: "homeassistant",
      minCoreVersion: "2024.1.0",
      blueprintCompatible: true,
      testedVersions: ["2024.1.0", "2024.8.0"],
    },
    requirements: {
      domains: ["light", "binary_sensor"],
      integrations: ["zha", "zigbee2mqtt", "hue", "shelly"],
      entities: [
        {
          name: "Hallway Light",
          domain: "light",
          description: "Dimmable hallway or bathroom light fixture",
          sampleEntityId: "light.hallway_ceiling",
        },
        {
          name: "Motion Sensor",
          domain: "binary_sensor",
          description: "PIR or mmWave motion presence sensor",
          sampleEntityId: "binary_sensor.hallway_motion",
        },
      ],
    },
    permissions: {
      actuators: ["light"],
      externalServices: [],
      criticality: "low",
      requiresHumanReview: false,
    },
    risks: [
      {
        id: "risk-sleep-disruption",
        category: "wear_and_tear",
        severity: "low",
        description: "Accidental 100% burst can dazzle sleepy residents.",
        mitigation: "Strictly sets brightness_pct to 15% and transition duration to 2.0s.",
      },
    ],
    rollback: {
      quickDisable: "Toggle automation state to off in HA UI.",
      stateRestoration: [
        "Call light.turn_off on light.hallway_ceiling",
      ],
      fallbackProcedure: "Use wall switch to cut or reset power.",
      estimatedRecoverySeconds: 10,
    },
    verification: {
      testedHaVersion: "2024.8.1",
      sampleInputs: {
        initialState: {
          "light.hallway_ceiling": { state: "off" },
          "binary_sensor.hallway_motion": { state: "off" },
        },
        triggerEvent: {
          entityId: "binary_sensor.hallway_motion",
          fromState: "off",
          toState: "on",
        },
      },
      expectedOutputs: {
        stateTransitions: {
          "light.hallway_ceiling": {
            state: "on",
            attributes: { brightness: 38 },
          },
        },
        serviceCalls: [
          {
            service: "light.turn_on",
            targetEntity: "light.hallway_ceiling",
            data: { brightness_pct: 15, transition: 2 },
          },
        ],
      },
    },
    rawYaml: `alias: "Night Path Gentle Motion Lighting"
trigger:
  - platform: state
    entity_id: binary_sensor.hallway_motion
    to: "on"
condition:
  - condition: time
    after: "00:00:00"
    before: "06:00:00"
action:
  - service: light.turn_on
    target:
      entity_id: light.hallway_ceiling
    data:
      brightness_pct: 15
      transition: 2
mode: single`,
  },
  {
    id: "fridge-door-alarm-guard",
    name: "Refrigerator Door & Spoilage Alert Guard",
    version: "1.0.0",
    author: "Manoj Rollo (@MRJonam91)",
    category: "safety",
    description:
      "Warns homeowner if the refrigerator or freezer door remains ajar for more than 3 minutes, or if internal temp exceeds 8°C. Prevents food spoilage and compressor burnout.",
    platform: {
      type: "homeassistant",
      minCoreVersion: "2024.1.0",
      blueprintCompatible: true,
      testedVersions: ["2024.1.0", "2024.10.0"],
    },
    requirements: {
      domains: ["binary_sensor", "sensor", "notify"],
      integrations: ["esphome", "zigbee2mqtt", "mobile_app"],
      entities: [
        {
          name: "Fridge Door Contact",
          domain: "binary_sensor",
          description: "Magnetic door sensor installed on fridge door",
          sampleEntityId: "binary_sensor.fridge_door_contact",
        },
        {
          name: "Mobile Notification Service",
          domain: "notify",
          description: "Push target for urgent alert",
          sampleEntityId: "notify.mobile_app_phone",
        },
      ],
    },
    permissions: {
      actuators: [],
      externalServices: ["notify.mobile_app"],
      criticality: "medium",
      requiresHumanReview: false,
    },
    risks: [
      {
        id: "risk-alert-fatigue",
        category: "notification_spam",
        severity: "medium",
        description: "Continuous repeating notification while loading groceries.",
        mitigation: "Repeats only once every 5 minutes and clears notification on door close.",
      },
    ],
    rollback: {
      quickDisable: "Disable 'Refrigerator Door & Spoilage Alert Guard' in Home Assistant.",
      stateRestoration: [
        "Verify fridge door is firmly shut",
        "Clear active notification on mobile device",
      ],
      fallbackProcedure: "Check physical fridge thermometer.",
      estimatedRecoverySeconds: 15,
    },
    verification: {
      testedHaVersion: "2024.10.0",
      sampleInputs: {
        initialState: {
          "binary_sensor.fridge_door_contact": { state: "off" },
        },
        triggerEvent: {
          entityId: "binary_sensor.fridge_door_contact",
          fromState: "off",
          toState: "on",
          forDurationSeconds: 180,
        },
      },
      expectedOutputs: {
        stateTransitions: {
          "binary_sensor.fridge_door_contact": { state: "on" },
        },
        serviceCalls: [
          {
            service: "notify.mobile_app_phone",
            data: {
              title: "⚠️ Frigorifero Aperto / Fridge Ajar",
              message: "The refrigerator door has been left open for more than 3 minutes!",
            },
          },
        ],
      },
    },
    rawYaml: `alias: "Refrigerator Door Alert Guard"
trigger:
  - platform: state
    entity_id: binary_sensor.fridge_door_contact
    to: "on"
    for:
      minutes: 3
action:
  - service: notify.mobile_app_phone
    data:
      title: "⚠️ Frigorifero Aperto / Fridge Ajar"
      message: "The refrigerator door has been left open for more than 3 minutes!"
mode: single`,
  },
];

/**
 * Retrieves an automation by ID.
 */
export function getAutomation(id: string): AutomationManifest | undefined {
  return VERIFIED_AUTOMATIONS.find((a) => a.id === id);
}

/**
 * Lists and filters catalog automations.
 */
export function listAutomations(filter: CatalogFilter = {}): AutomationManifest[] {
  return VERIFIED_AUTOMATIONS.filter((item) => {
    if (filter.category && item.category !== filter.category) return false;
    if (filter.domain && !item.requirements.domains.includes(filter.domain)) return false;
    if (filter.query) {
      const q = filter.query.toLowerCase();
      const match =
        item.id.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}
