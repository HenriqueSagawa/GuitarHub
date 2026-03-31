import { prisma } from "../../db/prisma";
import { AppError } from "../../utils/appError";
import { hashPassword, comparePassword } from "../../utils/hash";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
} from "../../utils/jwt";
import type { RegisterTeacherInput, LoginInput } from "./auth.schema";

export class AuthService {
  async registerTeacher(data: RegisterTeacherInput) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailTaken) {
      throw new AppError("Email já está em uso.", 409);
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "TEACHER",
        teacher: {
          create: {
            bio: data.bio ?? null,
            phone: data.phone ?? null,
          },
        },
      },
      include: { teacher: true },
    });

    const payload = {
      sub: user.id,
      role: "TEACHER" as const,
      profileId: user.teacher!.id,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        teacherId: user.teacher!.id,
      },
    };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { teacher: true, student: true },
    });

    if (!user) throw new AppError("Credenciais inválidas.", 401);

    const passwordValid = await comparePassword(data.password, user.password);
    if (!passwordValid) throw new AppError("Credenciais inválidas.", 401);

    if (user.role === "STUDENT" && !user.student?.active) {
      throw new AppError(
        "Conta desativada. Entre em contato com o professor.",
        403,
      );
    }

    const profileId =
      user.role === "TEACHER" ? user.teacher!.id : user.student!.id;

    const payload = {
      sub: user.id,
      role: user.role as "TEACHER" | "STUDENT",
      profileId,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileId,
      },
    };
  }

  async refresh(token: string) {
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new AppError("Token inválido.", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.refreshToken !== token) {
      throw new AppError("Token inválido.", 401);
    }

    const newPayload = {
      sub: user.id,
      role: payload.role,
      profileId: payload.profileId,
    };

    const accessToken = signAccessToken(newPayload);
    const refreshToken = signRefreshToken(newPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  }

  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        teacher: { select: { id: true, bio: true, phone: true } },
        student: {
          select: {
            id: true,
            phone: true,
            birthDate: true,
            level: true,
            monthlyFree: true,
            active: true,
          },
        },
      },
    });

    if (!user) throw new AppError("Usuário não encontrado.", 404);
    return user;
  }
}

export const authService = new AuthService();
