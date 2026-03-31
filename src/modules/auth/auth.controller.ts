import type { Request, Response, NextFunction } from "express";
import { authService, AuthService } from "./auth.service";

export class AuthController {
    async registerTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await authService.registerTeacher(req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async login (req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await authService.login(req.body);
            res.status(200).json({ status: "success", data: result });     
        } catch (error){
            next(error);
        }
    }

    async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refresh(refreshToken);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await authService.logout(req.user.sub);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await authService.getMe(req.user.sub);
            res.status(200).json({ status: "success", data: user });
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();