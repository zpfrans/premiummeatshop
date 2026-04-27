import { z } from "zod";

export const adminLoginSchema = z.object({
  username: z.string().trim().min(3).max(60),
  password: z.string().min(8).max(120)
});
