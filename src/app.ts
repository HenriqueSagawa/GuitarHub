import express, { type Request, type Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { errorHandler } from "./middlewares/error.middleware";

import authRoutes from "./modules/auth/auth.routes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use(limiter);

app.get("/health", (req: Request, res: Response) => {
  return res.status(200).json({
    status: "ok",
    message: "Server is healthy",
    timeStamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);

app.get("/", (req: Request, res: Response) => {
  return res.json({
    message: "Welcome to the API",
    timeStamp: new Date().toISOString(),
  });
});

app.use((req: Request, res: Response) => {
  return res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

app.use(errorHandler);

export default app;
