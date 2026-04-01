import z from "zod";

export const createStudentSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  email: z.email("O email é inválido."),
  password: z.string().min(6, "A senha deve conter no mínimo 6 caracteres."),
  phone: z.string().optional(),
  birthDate: z.iso.datetime({ offset: true }).optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  monthlyFree: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const updateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  birthDate: z.string().datetime({ offset: true }).optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  monthlyFee: z.number().positive().optional(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
});

export const studentIdParamSchema = z.object({
  id: z.string().min(1, "O ID do aluno é obrigatório."),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;