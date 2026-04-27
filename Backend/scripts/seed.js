import bcrypt from "bcryptjs";
import { env } from "../src/config/env.js";
import { pool } from "../src/db/pool.js";

const seedProducts = [
  { name: "Wagyu Chuck Roll", category: "Premium", price: 1150, unit: "500G", image: "🥩" },
  { name: "USDA Ribeye", category: "Premium", price: 900, unit: "500G", image: "🥩" },
  { name: "Whole Chicken", category: "Poultry", price: 210, unit: "KG", image: "🍗" },
  { name: "Pork Sukiyaki", category: "Pork", price: 420, unit: "KG", image: "🥓" },
  { name: "Beef Sukiyaki", category: "Beef", price: 490, unit: "KG", image: "🥩" }
];

async function seed() {
  const passwordHash = await bcrypt.hash(env.ADMIN_SEED_PASSWORD, 10);
  await pool.query(
    `INSERT INTO users(username, password_hash, role)
     VALUES($1, $2, 'admin')
     ON CONFLICT(username) DO NOTHING`,
    [env.ADMIN_SEED_USERNAME, passwordHash]
  );

  for (const product of seedProducts) {
    await pool.query(
      `INSERT INTO products(name, category, price, unit, image, in_stock)
       VALUES($1, $2, $3, $4, $5, true)
       ON CONFLICT DO NOTHING`,
      [product.name, product.category, product.price, product.unit, product.image]
    );
  }
}

seed()
  .then(() => {
    console.log("Seed completed");
    return pool.end();
  })
  .catch((error) => {
    console.error(error);
    pool.end();
    process.exit(1);
  });
