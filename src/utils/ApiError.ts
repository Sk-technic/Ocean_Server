
export class ApiError extends Error {
  public statusCode: number;
  public error: any[];
  public data: any;
  public success: boolean;

  constructor( statusCode: number, message: string, error: any[] = [], stack?: string) {
    super(message);

    this.statusCode = statusCode;
    this.error = error;
    this.data = null;
    this.success = false;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
