import express from "express";
import { runQuery } from "../../db/pool.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { productSchema, updateProductSchema } from "./products.schemas.js";
import { HttpError } from "../../utils/httpError.js";
import { productUpload, uploadProductImage } from "./upload.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const result = await runQuery(
    'SELECT id, name, category, price, unit, image, in_stock AS "inStock" FROM products ORDER BY id ASC'
  );
  return res.json({ products: result.rows });
});

router.post("/", requireAuth, requireRole("admin"), productUpload.single("image"), validateBody(productSchema), async (req, res) => {
  const { name, category, price, unit, inStock } = req.validatedBody;
  const imageUrl = req.file ? await uploadProductImage(req.file) : null;
  
  const result = await runQuery(
    `INSERT INTO products(name, category, price, unit, image, in_stock)
     VALUES($1, $2, $3, $4, $5, $6)
     RETURNING id, name, category, price, unit, image, in_stock AS "inStock"`,
    [name, category, price, unit, imageUrl || "", inStock]
  );
  return res.status(201).json({ product: result.rows[0] });
});

router.put("/:id", requireAuth, requireRole("admin"), productUpload.single("image"), validateBody(updateProductSchema), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "Invalid product id");

  const currentResult = await runQuery("SELECT * FROM products WHERE id = $1", [id]);
  const current = currentResult.rows[0];
  if (!current) throw new HttpError(404, "Product not found");

  const imageUrl = req.file ? await uploadProductImage(req.file) : undefined;
  
  const next = {
    name: req.validatedBody.name ?? current.name,
    category: req.validatedBody.category ?? current.category,
    price: req.validatedBody.price ?? current.price,
    unit: req.validatedBody.unit ?? current.unit,
    image: imageUrl !== undefined ? imageUrl : current.image,
    inStock: req.validatedBody.inStock ?? current.in_stock
  };

  const result = await runQuery(
    `UPDATE products
     SET name = $1, category = $2, price = $3, unit = $4, image = $5, in_stock = $6, updated_at = NOW()
     WHERE id = $7
     RETURNING id, name, category, price, unit, image, in_stock AS "inStock"`,
    [next.name, next.category, next.price, next.unit, next.image, next.inStock, id]
  );

  return res.json({ product: result.rows[0] });
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "Invalid product id");

  await runQuery("DELETE FROM products WHERE id = $1", [id]);
  return res.status(204).send();
});

export default router;
