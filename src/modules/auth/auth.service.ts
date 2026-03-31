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
}
