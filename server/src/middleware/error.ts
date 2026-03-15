import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  
  // log full error for debugging
  console.error("Error:", err);

  const status = err?.status ?? 500;

  // in production, hide internal error details from the client
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "Internal server error"
      : typeof err?.message === "string"
        ? err.message
        : "Server error";

  // always return a simple string error
  res.status(status).json({ error: message });
}