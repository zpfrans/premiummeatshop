import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { runQuery, pool } from "../../db/pool.js";
import { validateBody } from "../../middleware/validate.js";
import { createOrderSchema, updateStatusSchema } from "./orders.schemas.js";
import { HttpError } from "../../utils/httpError.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { env } from "../../config/env.js";

const router = express.Router();
const maxUploadSizeBytes = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  limits: { fileSize: maxUploadSizeBytes },
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    }
  }),
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      cb(new HttpError(400, "Only PNG, JPEG, and WEBP files are allowed"));
      return;
    }
    cb(null, true);
  }
});

function nextStatusIsAllowed(current, next) {
  const map = {
    pending_payment_review: ["confirmed"],
    confirmed: ["delivered"],
    delivered: []
  };
  return map[current]?.includes(next);
}

function createOrderReference() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${random}`;
}

router.post("/", validateBody(createOrderSchema), async function (req, res, next) {
  const payload = req.validatedBody;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const orderRef = createOrderReference();

    const productIds = payload.items.map((item) => item.productId);
    const productsResult = await client.query(
      "SELECT id, name, price, in_stock FROM products WHERE id = ANY($1::int[])",
      [productIds]
    );
    const productsById = new Map(productsResult.rows.map((p) => [p.id, p]));

    let total = 0;
    for (const item of payload.items) {
      const product = productsById.get(item.productId);
      if (!product) throw new HttpError(400, `Product ${item.productId} not found`);
      if (!product.in_stock) throw new HttpError(400, `${product.name} is out of stock`);
      total += Number(product.price) * item.quantity;
    }

    const orderResult = await client.query(
      `INSERT INTO orders(order_ref, customer_name, phone, address, status, total)
       VALUES($1, $2, $3, $4, $5, $6)
       RETURNING id, order_ref AS "orderRef", customer_name AS customer, phone, address, status, total, created_at AS "createdAt"`,
      [orderRef, payload.customer, payload.phone, payload.address, "pending_payment_review", total]
    );
    const order = orderResult.rows[0];

    for (const item of payload.items) {
      const product = productsById.get(item.productId);
      await client.query(
        `INSERT INTO order_items(order_id, product_id, quantity, unit_price, line_total)
         VALUES($1, $2, $3, $4, $5)`,
        [order.id, item.productId, item.quantity, product.price, Number(product.price) * item.quantity]
      );
    }

    await client.query(
      "INSERT INTO order_status_history(order_id, from_status, to_status, note) VALUES($1, $2, $3, $4)",
      [order.id, null, "pending_payment_review", "Customer submitted order"]
    );

    await client.query(
      `INSERT INTO notifications(order_id, title, body, status, read)
       VALUES($1, $2, $3, $4, $5)`,
      [order.id, `New Order ${order.orderRef}`, `New order from ${payload.customer}`, "pending_payment_review", false]
    );

    await client.query("COMMIT");
    return res.status(201).json({ order });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Rollback error:", rollbackError);
    }
    next(error);
  } finally {
    client.release();
  }
});

router.get("/track/:orderRef", async (req, res) => {
  const { orderRef } = req.params;
  const orderResult = await runQuery(
    `SELECT id, order_ref AS "orderRef", customer_name AS customer, phone, address, status, total, payment_proof_path AS "paymentProofPath", created_at AS "createdAt"
     FROM orders WHERE order_ref = $1 LIMIT 1`,
    [orderRef]
  );
  const order = orderResult.rows[0];
  if (!order) throw new HttpError(404, "Order not found");

  const itemsResult = await runQuery(
    `SELECT oi.product_id AS "productId", p.name, oi.quantity, oi.unit_price AS "unitPrice", oi.line_total AS "lineTotal"
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [order.id]
  );

  return res.json({ order: { ...order, items: itemsResult.rows } });
});

router.post("/:orderRef/payment-proof", upload.single("paymentProof"), async (req, res) => {
  const { orderRef } = req.params;
  if (!req.file) throw new HttpError(400, "Payment proof file is required");
  const relativePath = path.relative(process.cwd(), req.file.path).replaceAll("\\", "/");

  const result = await runQuery(
    `UPDATE orders
     SET payment_proof_path = $1, updated_at = NOW()
     WHERE order_ref = $2
     RETURNING id, order_ref AS "orderRef", status`,
    [relativePath, orderRef]
  );
  if (!result.rows[0]) throw new HttpError(404, "Order not found");

  return res.json({ order: result.rows[0] });
});

router.get("/admin/list", requireAuth, requireRole("admin"), async (req, res) => {
  const status = req.query.status;
  const params = [];
  let filter = "";
  if (status) {
    params.push(status);
    filter = "WHERE status = $1";
  }
  const result = await runQuery(
    `SELECT id, order_ref AS "orderRef", customer_name AS customer, phone, address, status, total, payment_proof_path AS "paymentProofPath", created_at AS "createdAt"
     FROM orders ${filter}
     ORDER BY created_at DESC`,
    params
  );
  return res.json({ orders: result.rows });
});

router.patch("/:orderRef/status", requireAuth, requireRole("admin"), validateBody(updateStatusSchema), async (req, res) => {
  const { orderRef } = req.params;
  const { status, note } = req.validatedBody;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      "SELECT id, order_ref, status FROM orders WHERE order_ref = $1 FOR UPDATE",
      [orderRef]
    );
    const currentOrder = currentResult.rows[0];
    if (!currentOrder) throw new HttpError(404, "Order not found");
    if (currentOrder.status === status) throw new HttpError(400, "Order already in selected status");
    if (!nextStatusIsAllowed(currentOrder.status, status)) {
      throw new HttpError(400, `Invalid status transition from ${currentOrder.status} to ${status}`);
    }

    const updateResult = await client.query(
      `UPDATE orders SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, order_ref AS "orderRef", status`,
      [status, currentOrder.id]
    );

    await client.query(
      "INSERT INTO order_status_history(order_id, from_status, to_status, changed_by, note) VALUES($1, $2, $3, $4, $5)",
      [currentOrder.id, currentOrder.status, status, req.user.sub, note || null]
    );

    await client.query(
      "UPDATE notifications SET status = $1::order_status, read = CASE WHEN $1::order_status = 'delivered'::order_status THEN true ELSE read END, updated_at = NOW() WHERE order_id = $2",
      [status, currentOrder.id]
    );

    await client.query(
      "INSERT INTO audit_logs(actor_id, action, entity_type, entity_id, metadata) VALUES($1, $2, $3, $4, $5)",
      [req.user.sub, "order.status_changed", "orders", currentOrder.id, { from: currentOrder.status, to: status }]
    );

    await client.query("COMMIT");
    return res.json({ order: updateResult.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

export default router;
