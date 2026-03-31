import z from "zod";

export const registerTeacherSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  email: z.email("O email deve ser válido.").min(1, "O email é obrigatório."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  bio: z.string().optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.email("O email deve ser válido.").min(1, "O email é obrigatório."),
  password: z.string().min(1, "A senha é obrigatória."),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "O refresh token é obrigatório."),
});

export type RegisterTeacherInput = z.infer<typeof registerTeacherSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
