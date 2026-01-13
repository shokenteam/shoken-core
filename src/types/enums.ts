export enum MarketType {
  PERP = "PERP",
  SPOT = "SPOT",
  PREDICTION = "PREDICTION",
}

export enum MarketStatus {
  ACTIVE = "ACTIVE",
  HALTED = "HALTED",
  CLOSED = "CLOSED",
}

export enum Side {
  BUY = "BUY",
  SELL = "SELL",
}

export enum OrderType {
  LIMIT = "LIMIT",
  MARKET = "MARKET",
}

export enum TimeInForce {
  GTC = "GTC",
  IOC = "IOC",
  FOK = "FOK",
}
