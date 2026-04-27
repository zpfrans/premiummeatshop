import { z } from "zod";

const itemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().max(100)
});

export const createOrderSchema = z.object({
  customer: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[A-Za-z][A-Za-z\s.'-]+$/, "Invalid customer name"),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+63|0)9\d{9}$/, "Invalid phone number"),
  address: z.string().trim().min(10).max(180),
  items: z.array(itemSchema).min(1)
});

export const updateStatusSchema = z.object({
  status: z.enum(["pending_payment_review", "confirmed", "delivered"]),
  note: z.string().trim().max(255).optional()
});
