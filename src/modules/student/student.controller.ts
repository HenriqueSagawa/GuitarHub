import type { Request, Response, NextFunction } from "express";
import { studentService } from "./student.service";

export class StudentController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await studentService.create(req.user.profileId, req.body);
      res.status(201).json({ status: "success", data: student });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const active =
        req.query.active !== undefined
          ? req.query.active === "true"
          : undefined;
      const students = await studentService.listByTeacher(
        req.user.profileId,
        active,
      );
      res.status(200).json({ status: "success", data: students });
    } catch (error) {
      next(error);
    }
  }

  async findById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const student = await studentService.findById(
        req.user.profileId,
        req.params["studentId"] as string,
      );
      res.status(200).json({ status: "success", data: student });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await studentService.update(
        req.user.profileId,
        req.params["studentId"] as string,
        req.body,
      );
      res.status(200).json({ status: "success", data: student });
    } catch (error) {
      next(error);
    }
  }

  async toggleActive(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await studentService.toggleActive(
        req.user.profileId,
        req.params["studentId"] as string,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  async getOwnProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const profile = await studentService.getOwnProfile(req.user.profileId);
        res.status(200).json({ status: "success", data: profile });
    } catch (error) {
        next(error);
    }
  }
}

export const studentController = new StudentController();