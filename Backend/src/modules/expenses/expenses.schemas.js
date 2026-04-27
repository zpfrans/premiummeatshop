import { z } from "zod";

export const expenseSchema = z.object({
  date: z.string().date(),
  category: z.string().trim().min(2).max(50),
  description: z.string().trim().min(2).max(255),
  amount: z.coerce.number().positive()
});
