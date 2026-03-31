process.env.NODE_ENV = "test";

// Garante que o import de `src/config/env.ts` não falhe durante os testes,
// mesmo fora do ambiente local.
process.env.DATABASE_URL ??= "mongodb://localhost:27017/test";
process.env.PORT ??= "0";
process.env.JWT_SECRET ??= "test-jwt-secret";
process.env.JWT_REFRESH_SECRET ??= "test-jwt-refresh-secret";
process.env.JWT_EXPIRES_IN ??= "15m";
process.env.JWT_REFRESH_EXPIRES_IN ??= "7d";

