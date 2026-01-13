import type { PerpPosition } from "../domain/positions";
import type { Price } from "../types";

export function perpNotional(pos: PerpPosition, markPrice?: Price): number {
  const p = markPrice ?? pos.markPrice ?? pos.entryPrice;
  return Math.abs(pos.size) * p;
}
