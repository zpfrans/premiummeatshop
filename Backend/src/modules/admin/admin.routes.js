import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { runQuery } from "../../db/pool.js";

const router = express.Router();
router.use(requireAuth, requireRole("admin"));

router.get("/dashboard", async (_req, res) => {
  const [salesResult, orderStatusResult, expensesResult] = await Promise.all([
    runQuery("SELECT COALESCE(SUM(total), 0) AS gross_sales FROM orders"),
    runQuery(
      `SELECT status, COUNT(*)::int AS count, COALESCE(SUM(total),0) AS total
       FROM orders GROUP BY status`
    ),
    runQuery("SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses")
  ]);

  const grossSales = Number(salesResult.rows[0].gross_sales);
  const totalExpenses = Number(expensesResult.rows[0].total_expenses);
  const statuses = orderStatusResult.rows;
  const deliveredTotal = Number(statuses.find((row) => row.status === "delivered")?.total ?? 0);

  return res.json({
    summary: {
      grossSales,
      collectedRevenue: deliveredTotal,
      receivables: grossSales - deliveredTotal,
      totalExpenses,
      netBalance: deliveredTotal - totalExpenses
    },
    statuses
  });
});

router.get("/exports/orders.csv", async (_req, res) => {
  const result = await runQuery(
    "SELECT order_ref, customer_name, phone, address, status, total, created_at FROM orders ORDER BY created_at DESC"
  );
  const rows = result.rows;
  const header = "order_ref,customer_name,phone,address,status,total,created_at";
  const csvLines = rows.map((row) =>
    [
      row.order_ref,
      row.customer_name,
      row.phone,
      row.address.replaceAll(",", " "),
      row.status,
      row.total,
      row.created_at.toISOString()
    ].join(",")
  );
  const csv = [header, ...csvLines].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=orders-export.csv");
  return res.send(csv);
});

router.get("/exports/expenses.json", async (_req, res) => {
  const result = await runQuery("SELECT * FROM expenses ORDER BY expense_date DESC");
  return res.json({ expenses: result.rows });
});

export default router;
