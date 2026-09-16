// Validates request body, query, and params with zod before a controller runs.
import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../utils/AppError.js';

type Schemas = { body?: ZodType; query?: ZodType; params?: ZodType };

export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const fields: Record<string, string> = {};

    const check = (schema: ZodType | undefined, input: unknown) => {
      if (!schema) return undefined;
      const result = schema.safeParse(input);
      if (result.success) return result.data;
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_';
        fields[key] ??= issue.message;
      }
      return undefined;
    };

    const body = check(schemas.body, req.body ?? {});
    const query = check(schemas.query, req.query);
    const params = check(schemas.params, req.params);

    if (Object.keys(fields).length > 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Some fields are invalid.', fields);
    }

    // Express 5 makes req.query read-only, so parsed values live on res.locals.
    if (schemas.body) req.body = body;
    res.locals.query = query;
    res.locals.params = params;
    next();
  };
}
