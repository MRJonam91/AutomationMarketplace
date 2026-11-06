# AutomationMarketplace: decision seed / punto di partenza

IT — Scopo: Automazioni domestiche riusabili sono difficili da valutare e condividere. Prima prova: Catalogo di automazioni Home Assistant con manifest formale, requisiti, rischi, analisi dei conflitti e istruzioni di rollback.

EN — Purpose: Reusable home automations are hard to evaluate and share. First trial: Catalog of Home Assistant automations with manifest schema, requirements, risks, cross-automation conflict analysis and rollback instructions.

## Decisioni prese / Decisions made (2026-11-06)

- **Traguardo Versione 1.0 (v1.0.0)**: Rilasciata la prima versione stabile pronta per la produzione.
- **Specifiche complete**: Schema formale JSON Draft-07 (`AutomationManifest`), catalogo curato con 7 automazioni verificate (clima, sicurezza, illuminazione, fotovoltaico, salvaguardia idrica, qualità dell'aria), rilevatore di conflitti e collisioni tra attuatori, simulatore deterministico sequenziale multi-step e motore di rollback.
- **Standard applicati**: `../_repo-kit/REPO-STANDARDS.md` rispettato integralmente (core < 1.500 righe [1.075 righe], licenza AGPL-3.0-only + commerciale + CLA, LICENSING.md, donazioni, CI bilingue).
- **Misura di successo osservata**: 40/40 test passati (unit test schema, risk scoring, conflict detection, simulazione deterministica su stati mock senza hardware reale, package bundler HA, esportazione Blueprint e CLI end-to-end).
