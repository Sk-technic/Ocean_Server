import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * catchAsync
 * Utility to wrap async controller functions
 * Ensures all errors are passed to Express error handling middleware
 */
export const asyncHandler = <
  Req = Request,
  Res = Response,
  Next = NextFunction
>(
  fn: (req: Req, res: Res, next: Next) => Promise<any>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as Req, res as Res, next as Next)).catch(next);
  };
};
