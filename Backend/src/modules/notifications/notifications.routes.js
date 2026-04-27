import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { runQuery } from "../../db/pool.js";

const router = express.Router();
router.use(requireAuth, requireRole("admin"));

router.get("/", async (_req, res) => {
  const result = await runQuery(
    `SELECT n.id, o.order_ref AS "orderRef", n.title, n.body, n.status, n.read, n.created_at AS "createdAt"
     FROM notifications n
     JOIN orders o ON o.id = n.order_id
     WHERE n.status != 'delivered'
     ORDER BY n.created_at DESC`
  );
  return res.json({ notifications: result.rows });
});

router.patch("/:id/read", async (req, res) => {
  const id = Number(req.params.id);
  await runQuery("UPDATE notifications SET read = true, updated_at = NOW() WHERE id = $1", [id]);
  return res.json({ message: "Notification marked as read" });
});

router.delete("/clear", async (_req, res) => {
  await runQuery("DELETE FROM notifications");
  return res.status(204).send();
});

export default router;
