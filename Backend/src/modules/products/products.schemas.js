import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(["Premium", "Poultry", "Pork", "Beef"]),
  price: z.coerce.number().positive(),
  unit: z.string().trim().min(1).max(20),
  image: z.string().trim().max(255).optional().or(z.literal('')),
  inStock: z.boolean().default(true)
});

export const updateProductSchema = productSchema.partial();
