import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error("Error:", err.message || err);
  const status = err.status ?? 500;
  res.status(status).json({ error: { message: err.message ?? "Server error" } });
}
