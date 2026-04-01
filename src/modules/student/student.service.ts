import { prisma } from "../../db/prisma";
import { AppError } from "../../utils/appError";
import { hashPassword } from "../../utils/hash";
import type { CreateStudentInput, UpdateStudentInput } from "./student.schema";

export class StudentService {
  async create(teacherId: string, data: CreateStudentInput) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailTaken) throw new AppError("Email já está em uso.", 400);

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) throw new AppError("Professor não encontrado.", 404);

    const hashedPassaword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassaword,
        role: "STUDENT",
        student: {
          create: {
            teacherId,
            phone: data.phone,
            birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
            level: data.level,
            monthlyFree: data.monthlyFree,
            notes: data.notes,
          },
        },
      },
      include: {
        student: true,
      },
    });

    return this.formatStudent(user as any);
  }

  async listByTeacher(teacherId: string, active?: boolean) {
    const students = await prisma.user.findMany({
      where: {
        teacherId,
        ...(active !== undefined && { student: { active } }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
      },
      orderBy: {
        user: { name: "asc" },
      },
    });

    return students.map(
      (s: {
        id: string;
        user: { name: string; email: string; createdAt: Date };
        phone: string | null;
        birthDate: Date | null;
        level: string;
        monthlyFee: number | null;
        notes: string | null;
        active: boolean;
      }) => ({
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        phone: s.phone,
        birthDate: s.birthDate,
        level: s.level,
        monthlyFee: s.monthlyFee,
        notes: s.notes,
        active: s.active,
        createdAt: s.user.createdAt,
      }),
    );
  }

  async findById(teacherId: string, studentId: string) {
    const student = await prisma.user.findFirst({
      where: { id: studentId, teacherId },
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
        _count: { select: { attendences: true } },
      },
    });

    if (!student) throw new AppError("Aluno não encontrado.", 404);

    const presentCount = await prisma.attendence.count({
      where: { studentId, present: true },
    });

    return {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      phone: student.phone,
      birthDate: student.birthDate,
      level: student.level,
      monthlyFee: student.monthlyFee,
      notes: student.notes,
      active: student.active,
      createdAt: student.user.createdAt,
      stats: {
        totalLessons: student._count.attendances,
        present: presentCount,
        absent: student._count.attendances - presentCount,
      },
    };
  }

  async update(teacherId: string, studentId: string, data: UpdateStudentInput) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, teacherId },
      include: { user: true },
    });

    if (!student) throw new AppError("Aluno não encontrado.", 404);

    const { name, ...studentData } = data;

    await prisma.$transaction([
      ...(name
        ? [
            prisma.user.update({
              where: { id: student.userId },
              data: { name },
            }),
          ]
        : []),
      prisma.student.update({
        where: { id: studentId },
        data: {
          phone: studentData.phone,
          birthDate: studentData.birthDate
            ? new Date(studentData.birthDate)
            : undefined,
          level: studentData.level,
          monthlyFee: studentData.monthlyFee,
          notes: studentData.notes,
          active: studentData.active,
        },
      }),
    ]);

    return this.findById(teacherId, studentId);
  }

  async toggleActive(teacherId: string, studentId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, teacherId },
    });

    if (!student) throw new AppError("Aluno não encontrado.", 404);

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { active: !student.active },
    });

    return { active: updated.active };
  }

  async getOwnProfile(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        teacher: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    if (!student) throw new AppError("Perfil não encontrado.", 404);

    return {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      phone: student.phone,
      birthDate: student.birthDate,
      level: student.level,
      active: student.active,
      teacher: {
        name: student.teacher.user.name,
        email: student.teacher.user.email,
        phone: student.teacher.phone,
        bio: student.teacher.bio,
      },
    };
  }

  private formatStudent(user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    student: {
      id: string;
      phone: string | null;
      birthDate: Date | null;
      level: string;
      monthlyFree: number | null;
      notes: string | null;
      active: boolean;
    };
  }) {
    return {
      id: user.student.id,
      name: user.name,
      email: user.email,
      phone: user.student.phone,
      birthDate: user.student.birthDate,
      level: user.student.level,
      monthlyFree: user.student.monthlyFree,
      notes: user.student.notes,
      active: user.student.active,
      createdAt: user.createdAt,
    };
  }
}

export const studentService = new StudentService();