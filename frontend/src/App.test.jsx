import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./api/client", () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: { products: [] } }),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  },
  getPublicAssetUrl: vi.fn((value) => value || "")
}));

describe("App", () => {
  it("renders storefront title", async () => {
    render(<App />);
    expect(await screen.findByText("Order Fresh Meats")).toBeInTheDocument();
  });
});
