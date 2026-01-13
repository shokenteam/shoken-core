import type { EngineState } from "./state";
import { reduce } from "./reducer";

export function resolvePredictionMarket(state: EngineState, input: { marketId: string; outcome: "YES" | "NO"; ts: number }): EngineState {
  return reduce(state, { type: "PREDICTION_MARKET_RESOLVED", marketId: input.marketId as any, resolvedOutcome: input.outcome, ts: input.ts });
}
