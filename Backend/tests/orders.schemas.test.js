import { describe, expect, it } from "vitest";
import { createOrderSchema, updateStatusSchema } from "../src/modules/orders/orders.schemas.js";

describe("createOrderSchema", () => {
  it("accepts valid payload", () => {
    const payload = {
      customer: "Juan Dela Cruz",
      phone: "09171234567",
      address: "123 Main Street, Quezon City",
      items: [{ productId: 1, quantity: 2 }]
    };
    const result = createOrderSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("rejects invalid phone", () => {
    const payload = {
      customer: "Juan Dela Cruz",
      phone: "12345",
      address: "123 Main Street, Quezon City",
      items: [{ productId: 1, quantity: 1 }]
    };
    const result = createOrderSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});

describe("updateStatusSchema", () => {
  it("accepts valid status", () => {
    expect(updateStatusSchema.safeParse({ status: "confirmed" }).success).toBe(true);
  });
});
