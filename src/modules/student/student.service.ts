import { prisma } from '../../db/prisma'
import { AppError } from '../../utils/appError'
import { hashPassword } from '../../utils/hash'
import type { CreateStudentInput, UpdateStudentInput } from './student.schema'

export class StudentService {
  // ── Criar aluno (professor) ────────────────────────────────────────────────
  async create(teacherId: string, data: CreateStudentInput) {
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email } })
    if (emailTaken) throw new AppError('E-mail já está em uso.', 409)

    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } })
    if (!teacher) throw new AppError('Professor não encontrado.', 404)

    const hashedPassword = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'STUDENT',
        student: {
          create: {
            teacherId,
            phone: data.phone ?? null,
            birthDate: data.birthDate ? new Date(data.birthDate) : null,
            level: data.level,
            monthlyFree: data.monthlyFree ?? null,
            notes: data.notes ?? null,
          },
        },
      },
      include: {
        student: true,
      },
    })

    return this.formatStudent(user as any)
  }

  // ── Listar todos os alunos do professor ────────────────────────────────────
  async listByTeacher(teacherId: string, active?: boolean) {
    const students = await prisma.student.findMany({
      where: {
        teacherId,
        ...(active !== undefined && { active }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
      },
      orderBy: { user: { name: 'asc' } },
    })

    return students.map((s) => ({
      id: s.id,
      name: s.user.name,
      email: s.user.email,
      phone: s.phone,
      birthDate: s.birthDate,
      level: s.level,
      monthlyFree: s.monthlyFree,
      notes: s.notes,
      active: s.active,
      createdAt: s.user.createdAt,
    }))
  }

  // ── Buscar aluno por ID ────────────────────────────────────────────────────
  async findById(teacherId: string, studentId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, teacherId },
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
        _count: { select: { attendances: true } },
      },
    })

    if (!student) throw new AppError('Aluno não encontrado.', 404)

    // Calcular total de presenças e faltas
    const presentCount = await prisma.attendance.count({
      where: { studentId, present: true },
    })

    return {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      phone: student.phone,
      birthDate: student.birthDate,
      level: student.level,
      monthlyFree: student.monthlyFree,
      notes: student.notes,
      active: student.active,
      createdAt: student.user.createdAt,
      stats: {
        totalLessons: student._count.attendances,
        present: presentCount,
        absent: student._count.attendances - presentCount,
      },
    }
  }

  // ── Atualizar aluno ────────────────────────────────────────────────────────
  async update(teacherId: string, studentId: string, data: UpdateStudentInput) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, teacherId },
      include: { user: true },
    })

    if (!student) throw new AppError('Aluno não encontrado.', 404)

    const { name, ...studentData } = data

    const updateStudentData: Record<string, unknown> = {}
    if (studentData.phone !== undefined) updateStudentData.phone = studentData.phone
    if (studentData.birthDate !== undefined) {
      updateStudentData.birthDate =
        studentData.birthDate === null ? null : new Date(studentData.birthDate)
    }
    if (studentData.level !== undefined) updateStudentData.level = studentData.level
    if (studentData.monthlyFee !== undefined) updateStudentData.monthlyFree = studentData.monthlyFee
    if (studentData.notes !== undefined) updateStudentData.notes = studentData.notes
    if (studentData.active !== undefined) updateStudentData.active = studentData.active

    await prisma.$transaction([
      ...(name
        ? [prisma.user.update({ where: { id: student.userId }, data: { name } })]
        : []),
      prisma.student.update({
        where: { id: studentId },
        data: updateStudentData,
      }),
    ])

    return this.findById(teacherId, studentId)
  }

  // ── Desativar/ativar aluno ─────────────────────────────────────────────────
  async toggleActive(teacherId: string, studentId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, teacherId },
    })

    if (!student) throw new AppError('Aluno não encontrado.', 404)

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { active: !student.active },
    })

    return { active: updated.active }
  }

  // ── Aluno vê seu próprio perfil ────────────────────────────────────────────
  async getOwnProfile(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        teacher: { include: { user: { select: { name: true, email: true } } } },
      },
    })

    if (!student) throw new AppError('Perfil não encontrado.', 404)

    return {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      phone: student.phone,
      birthDate: student.birthDate,
      level: student.level,
      active: student.active,
      teacher: student.teacher
        ? {
            name: student.teacher.user.name,
            email: student.teacher.user.email,
            phone: student.teacher.phone,
            bio: student.teacher.bio,
          }
        : null,
    }
  }

  // ── helper ─────────────────────────────────────────────────────────────────
  private formatStudent(user: {
    id: string
    name: string
    email: string
    createdAt: Date
    student: {
      id: string
      phone: string | null
      birthDate: Date | null
      level: string
      monthlyFree: number | null
      notes: string | null
      active: boolean
    }
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
    }
  }
}

export const studentService = new StudentService()