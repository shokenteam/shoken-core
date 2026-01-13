import type { PortfolioState } from "../domain/portfolio";
import type { OrderState } from "../domain/orders";

export interface EngineState extends PortfolioState {
  orders: Record<string, OrderState>; // open + partially filled + etc.
}

export function createEmptyEngineState(walletAddress: string): EngineState {
  return {
    walletAddress,
    balances: { USDC: 0 },
    perps: {},
    predictions: {},
    orders: {},
  };
}
