export type Price = number;     // quote per base (or probability for prediction)
export type Quantity = number;  // base units (or shares)
export type Notional = number;  // quote units

export function isFiniteNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

export function assertPositive(name: string, x: number): void {
  if (!Number.isFinite(x) || x <= 0) throw new Error(`${name} must be > 0`);
}
