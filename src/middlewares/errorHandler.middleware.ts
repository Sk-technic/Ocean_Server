import { Request, Response, NextFunction } from "express";
import { ApiError } from "utils/ApiError";

/**
 * Centralized Error Handling Middleware
 * Catches all errors thrown in controllers and sends formatted JSON response
 */
export interface AppError extends ApiError {
  status?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    status:statusCode,
    success: false,
    message,
  });
};