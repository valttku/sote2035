import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  
  // log full error for debugging
  console.error("Error:", err);

  const status = err?.status ?? 500;
  const message =
    typeof err?.message === "string"
      ? err.message
      : "Server error";

  // always return a simple string error
  res.status(status).json({ error: message });
}
