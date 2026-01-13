# shoken-core

Core domain logic for SHOKEN trading engine — markets, orderbook models, and portfolio calculations.  
This package is intentionally UI-agnostic and chain-agnostic: it defines the primitives that the rest of the SHOKEN stack builds on.

## Why this repo exists

SHOKEN has multiple modules (perps, spot CLOB, prediction markets). Without a shared core, each module tends to implement:
- its own orderbook math
- its own portfolio / PnL logic
- its own state transitions and edge cases
- its own types and error handling

That leads to inconsistent behavior across the app.

`shoken-core` solves this by centralizing:
- Domain types (orders, positions, markets, fills)
- Deterministic portfolio calculations
- Orderbook primitives and normalization
- Risk / margin primitives (where applicable)
- Validation + error model

## Non-goals

This repo is NOT:
- a UI library
- an API server
- a wallet / signing layer
- an on-chain program
- a single market integration implementation

Those belong in:
- `shoken-web` (UI)
- `shoken-api` (services/adapters)
- `shoken-sdk` (typed client)
- integration repos / adapters

## High-level architecture

`shoken-core` is written as a pure domain package:

- **Pure functions first**: portfolio math, orderbook transforms, PnL computations
- **Deterministic state transitions**: order lifecycle and position lifecycle
- **Stable types**: typed primitives shared across services and UI

## Modules

Documentation lives in `docs/`.

- `docs/02-domain-model.md` — core entities and invariants
- `docs/03-markets.md` — market types (perps, spot, prediction)
- `docs/04-orderbook.md` — CLOB primitives and depth normalization
- `docs/05-portfolio-risk.md` — portfolio, risk, exposure (beta-safe)
- `docs/06-pricing-pnl.md` — PnL math and mark prices
- `docs/07-adapters-integration.md` — how services should integrate
- `docs/08-error-model.md` — error codes & validation rules
- `docs/09-testing.md` — testing strategy & fixtures

## Status

This repo is active and evolving alongside SHOKEN mainnet beta.
Breaking changes may occur until v1.

## License

MIT
