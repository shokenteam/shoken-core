import { CoreErrorCode } from "./codes";

export class CoreError extends Error {
  public readonly code: CoreErrorCode;
  public readonly meta?: Record<string, unknown>;

  constructor(code: CoreErrorCode, message: string, meta?: Record<string, unknown>) {
    super(message);
    this.name = "CoreError";
    this.code = code;
    this.meta = meta;
  }
}
