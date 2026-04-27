import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { runQuery } from "../../db/pool.js";
import { env } from "../../config/env.js";
import { validateBody } from "../../middleware/validate.js";
import { adminLoginSchema } from "./auth.schemas.js";
import { requireAuth } from "../../middleware/auth.js";
import { HttpError } from "../../utils/httpError.js";

const router = express.Router();

router.post("/login", validateBody(adminLoginSchema), async (req, res) => {
  const { username, password } = req.validatedBody;
  const result = await runQuery(
    "SELECT id, username, password_hash, role FROM users WHERE username = $1 LIMIT 1",
    [username]
  );
  const user = result.rows[0];
  if (!user) {
    throw new HttpError(401, "Invalid username or password");
  }

  const matched = await bcrypt.compare(password, user.password_hash);
  if (!matched) {
    throw new HttpError(401, "Invalid username or password");
  }

  const token = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 8
  });

  await runQuery(
    "INSERT INTO audit_logs(actor_id, action, entity_type, entity_id, metadata) VALUES($1, $2, $3, $4, $5)",
    [user.id, "auth.login", "users", user.id, { username: user.username }]
  );

  return res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

router.post("/logout", requireAuth, async (req, res) => {
  res.clearCookie("accessToken");
  await runQuery(
    "INSERT INTO audit_logs(actor_id, action, entity_type, entity_id, metadata) VALUES($1, $2, $3, $4, $5)",
    [req.user.sub, "auth.logout", "users", req.user.sub, {}]
  );
  return res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, async (req, res) => {
  const result = await runQuery("SELECT id, username, role FROM users WHERE id = $1 LIMIT 1", [req.user.sub]);
  const user = result.rows[0];
  if (!user) throw new HttpError(404, "User not found");
  return res.json({ user });
});

export default router;
