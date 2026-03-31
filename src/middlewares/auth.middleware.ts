import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { verifyAccessToken, type TokenPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user: TokenPayload;
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("Token de autenticação não fornecido", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token as string);
    req.user = payload;
    next();
  } catch {
    throw new AppError("Token de autenticação inválido ou expirado", 401);
  }
}

export function authorizeTeacher(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.user.role !== "TEACHER") {
    throw new AppError(
      "Acesso negado: apenas professores podem acessar este recurso",
      403,
    );
  }
  next();
}

export function authorizeStudent(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.user.role !== "STUDENT") {
    throw new AppError(
      "Acesso negado: apenas estudantes podem acessar este recurso",
      403,
    );
  }
  next();
}
