import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthService, mockVerifyAccessToken } = vi.hoisted(() => ({
  mockAuthService: {
    registerTeacher: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
  mockVerifyAccessToken: vi.fn(),
}));

vi.mock("../src/modules/auth/auth.service", () => {
  class AuthService {}
  return {
    AuthService,
    authService: mockAuthService,
  };
});

vi.mock("../src/utils/jwt", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/utils/jwt")>();
  return {
    ...original,
    verifyAccessToken: mockVerifyAccessToken,
  };
});

import app from "../src/app";

beforeEach(() => {
  mockAuthService.registerTeacher.mockReset();
  mockAuthService.login.mockReset();
  mockAuthService.refresh.mockReset();
  mockAuthService.logout.mockReset();
  mockAuthService.getMe.mockReset();
  mockVerifyAccessToken.mockReset();
});

describe("Rotas públicas", () => {
  it("GET / deve retornar mensagem de boas-vindas", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: "Welcome to the API",
    });
    expect(typeof res.body.timeStamp).toBe("string");
  });

  it("GET /health deve retornar status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "ok",
      message: "Server is healthy",
    });
    expect(typeof res.body.timeStamp).toBe("string");
  });

  it("Rota inexistente deve retornar 404 com path", async () => {
    const res = await request(app).get("/nao-existe");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: "Route not found",
      path: "/nao-existe",
    });
  });
});

describe("Rotas de autenticação (/api/auth)", () => {
  it("POST /api/auth/register deve validar body (422)", async () => {
    const res = await request(app).post("/api/auth/register").send({});
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({
      status: "error",
      message: "Dados inválidos.",
    });
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it("POST /api/auth/register deve retornar 201 com service mockado", async () => {
    mockAuthService.registerTeacher.mockResolvedValueOnce({
      accessToken: "access",
      refreshToken: "refresh",
      user: { id: "u1", name: "Fulano", email: "f@f.com", role: "TEACHER", teacherId: "t1" },
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "Fulano",
      email: "f@f.com",
      password: "123456",
      bio: "bio",
      phone: "999",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      accessToken: "access",
      refreshToken: "refresh",
      user: { id: "u1", role: "TEACHER" },
    });
    expect(mockAuthService.registerTeacher).toHaveBeenCalledTimes(1);
  });

  it("POST /api/auth/login deve validar body (422)", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(422);
  });

  it("POST /api/auth/login deve retornar 200 com service mockado", async () => {
    mockAuthService.login.mockResolvedValueOnce({
      accessToken: "access",
      refreshToken: "refresh",
      user: { id: "u1", name: "Fulano", email: "f@f.com", role: "TEACHER", profileId: "t1" },
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "f@f.com",
      password: "123456",
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "success",
      data: {
        accessToken: "access",
        refreshToken: "refresh",
        user: { id: "u1" },
      },
    });
    expect(mockAuthService.login).toHaveBeenCalledTimes(1);
  });

  it("POST /api/auth/refresh deve validar body (422)", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});
    expect(res.status).toBe(422);
  });

  it("POST /api/auth/refresh deve retornar 200 com service mockado", async () => {
    mockAuthService.refresh.mockResolvedValueOnce({
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });

    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: "refresh",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: "success",
      data: { accessToken: "new-access", refreshToken: "new-refresh" },
    });
    expect(mockAuthService.refresh).toHaveBeenCalledTimes(1);
  });

  it("POST /api/auth/logout deve exigir token (401)", async () => {
    const res = await request(app).post("/api/auth/logout").send();
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      status: "error",
      message: "Token de autenticação não fornecido",
    });
  });

  it("POST /api/auth/logout deve retornar 204 quando autenticado", async () => {
    mockVerifyAccessToken.mockReturnValueOnce({
      sub: "u1",
      role: "TEACHER",
      profileId: "t1",
    });
    mockAuthService.logout.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(204);
    expect(res.text).toBe("");
    expect(mockAuthService.logout).toHaveBeenCalledWith("u1");
  });

  it("GET /api/auth/me deve exigir token (401)", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me deve retornar 200 quando autenticado", async () => {
    mockVerifyAccessToken.mockReturnValueOnce({
      sub: "u1",
      role: "TEACHER",
      profileId: "t1",
    });
    mockAuthService.getMe.mockResolvedValueOnce({
      id: "u1",
      name: "Fulano",
      email: "f@f.com",
      role: "TEACHER",
      createdAt: new Date().toISOString(),
      teacher: { id: "t1", bio: null, phone: null },
      student: null,
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "success",
      data: { id: "u1", role: "TEACHER" },
    });
    expect(mockAuthService.getMe).toHaveBeenCalledWith("u1");
  });
});

