import { Router } from "express";
import bcrypt from "bcrypt";
import {
  createUser,
  findUserByEmail,
  updateLastLogin,
} from "../db/users/repo.js";

export const authRouter = Router();

// Register
authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const existing = await findUserByEmail(email);
    if (existing)
      return res.status(409).json({ error: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await createUser(email, hash, displayName ?? null);

    res.status(201).json({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      created_at: user.created_at,
    });
  } catch (e) {
    next(e);
  }
});

// Login
authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    await updateLastLogin(user.id);

    res.json({
      message: "Login successful",
      email: user.email,
      display_name: user.display_name,
      last_login: new Date().toISOString(),
    });
  } catch (e) {
    next(e);
  }
});
