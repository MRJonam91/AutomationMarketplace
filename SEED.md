# AutomationMarketplace: decision seed / punto di partenza

IT — Scopo: Automazioni domestiche riusabili sono difficili da valutare e condividere. Prima prova: Catalogo di una automazione Home Assistant con manifest, requisiti, rischi e istruzioni di rollback.

EN — Purpose: Reusable home automations are hard to evaluate and share. First trial: Catalog of one Home Assistant automation with manifest, requirements, risks and rollback instructions.

## Decisioni prese / Decisions made (2026-11-06)

- **Prima prova verificabile completata**: Schema formale di manifest (`AutomationManifest`), catalogo verificato per Home Assistant (`thermostat-window-saver`, `night-presence-soft-light`, `fridge-door-alarm-guard`), motore di risk assessment per attuatori fisici, simulatore deterministico e rollback engine.
- **Standard applicati**: `../_repo-kit/REPO-STANDARDS.md` rispettato integralmente (core < 1.500 righe [905 righe], licenza AGPL-3.0-only + commerciale + CLA, LICENSING.md, donazioni, CI bilingue, marker anti-plagio registrati in `_provenance/AutomationMarketplace.json`).
- **Misura di successo osservata**: 36/36 test passati (unit test schema, risk scoring, simulazione deterministica su stati mock senza hardware reale, conflict detector multi-automazione, package bundler HA, esportazione YAML e CLI end-to-end).
- **Traguardo Versione Beta (v0.3.0-beta)**: Analisi dei conflitti cross-automazione (clash di attuatori e loop ricorsivi), simulazione sequenziale a scenari multipli, bundler di package YAML per Home Assistant con helper deduplicati, loader da directory, 7 automazioni certificate a catalogo.
