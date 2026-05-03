import bcrypt from "bcryptjs";
import { env } from "../src/config/env.js";
import { pool } from "../src/db/pool.js";

const seedProducts = [];

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
