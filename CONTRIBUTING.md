# Contribuire / Contributing — AutomationMarketplace

## 🇮🇹 Italiano

Grazie! Il progetto è pensato per essere capito e verificato in un'ora: il **core** (`src/core/`) resta sotto le
**1.500 righe** e tutto il resto (adapter, cataloghi, formati di esportazione) vive in moduli dedicati.

1. Apri una issue per discutere modifiche importanti o nuove automazioni certificate.
2. `npm test && npm run typecheck` devono essere verdi (Node ≥ 22.18, zero dipendenze esterne a runtime).
3. Un test per ogni bug risolto, regola di rischio o automazione aggiunta.
4. Header SPDX in ogni nuovo file sorgente (`// SPDX-License-Identifier: AGPL-3.0-only`).
5. Messaggi di commit in stile [Conventional Commits](https://www.conventionalcommits.org/it/).
6. Firma il [CLA](CLA.md) commentando la PR con `I have read the CLA and I hereby sign it.`

Aggiungere un'automazione al catalogo: vedi [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), sezione "Estendere il catalogo".

## 🇬🇧 English

Thanks! The project is designed to be understood and audited in one hour: the **core** (`src/core/`) stays under
**1,500 lines** and everything else (adapters, catalog data, format exporters) lives in dedicated modules.

1. Open an issue to discuss significant changes or newly certified automations.
2. `npm test && npm run typecheck` must pass (Node ≥ 22.18, zero runtime dependencies).
3. One test for every fixed bug, risk rule, or cataloged automation.
4. SPDX header in every new source file (`// SPDX-License-Identifier: AGPL-3.0-only`).
5. [Conventional Commits](https://www.conventionalcommits.org/) messages.
6. Sign the [CLA](CLA.md) by commenting on the PR with `I have read the CLA and I hereby sign it.`

Adding an automation to the catalog: see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), "Extending the catalog".
