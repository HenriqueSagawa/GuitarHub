import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

interface Schemas {
  body?: ZodType<any>;
  params?: ZodType<any>;
  query?: ZodType<any>;
}

export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.query) req.query = schemas.query.parse(req.query);
    next();
  };
}
