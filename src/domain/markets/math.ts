import { CoreError, CoreErrorCode } from "../../errors";

function isMultipleOf(step: number, value: number, eps = 1e-10): boolean {
  const q = value / step;
  return Math.abs(q - Math.round(q)) < eps;
}

export function assertTickSize(tickSize: number, price: number): void {
  if (!isMultipleOf(tickSize, price)) {
    throw new CoreError(CoreErrorCode.INVALID_TICK_SIZE, "Price does not match tickSize", { tickSize, price });
  }
}

export function assertLotSize(lotSize: number, qty: number): void {
  if (!isMultipleOf(lotSize, qty)) {
    throw new CoreError(CoreErrorCode.INVALID_LOT_SIZE, "Quantity does not match lotSize", { lotSize, qty });
  }
}
