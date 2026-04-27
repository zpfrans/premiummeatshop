import { HttpError } from "../utils/httpError.js";

export function validateBody(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Validation failed", parsed.error.flatten().fieldErrors);
    }
    req.validatedBody = parsed.data;
    return next();
  };
}
