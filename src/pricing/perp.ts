import type { PerpPosition } from "../domain/positions";
import type { Price } from "../types";
import { computeUnrealizedPnl } from "../domain/positions/perp-accounting";

export function perpNotional(pos: PerpPosition, mark?: Price): number {
  const mp = mark ?? pos.markPrice ?? pos.avgEntry;
  return Math.abs(pos.size) * mp;
}

export function perpUnrealized(pos: PerpPosition, mark?: Price): number {
  return computeUnrealizedPnl(pos, mark);
}
