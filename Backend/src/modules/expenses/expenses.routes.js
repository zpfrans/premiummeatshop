import express from "express";
import { runQuery } from "../../db/pool.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { expenseSchema } from "./expenses.schemas.js";

const router = express.Router();
router.use(requireAuth, requireRole("admin"));

router.get("/", async (_req, res) => {
  const result = await runQuery(
    `SELECT id, expense_date AS date, category, description, amount, created_at AS "createdAt"
     FROM expenses ORDER BY expense_date DESC, id DESC`
  );
  return res.json({ expenses: result.rows });
});

router.post("/", validateBody(expenseSchema), async (req, res) => {
  const { date, category, description, amount } = req.validatedBody;
  const result = await runQuery(
    `INSERT INTO expenses(expense_date, category, description, amount)
     VALUES($1, $2, $3, $4)
     RETURNING id, expense_date AS date, category, description, amount, created_at AS "createdAt"`,
    [date, category, description, amount]
  );
  return res.status(201).json({ expense: result.rows[0] });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: "Invalid expense id" });
  }

  await runQuery("DELETE FROM expenses WHERE id = $1", [id]);
  return res.status(204).send();
});

export default router;
