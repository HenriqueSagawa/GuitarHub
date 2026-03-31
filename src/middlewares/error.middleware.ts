import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/appError";
import { env } from "../config/env";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const errors = err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    res.status(422).json({
      status: "error",
      message: "Dados inválidos.",
      errors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
    return;
  }

  console.error("Erro inesperado:", err);
  res.status(500).json({
    status: "error",
    message:
      env.NODE_ENV === "production"
        ? "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde."
        : err.message,
  });
}
