import { Router } from "express";
export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  // always succeed for now
  res.json({ ok: true, token: "demo-token", email });
});

authRouter.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  // pretend registration succeeded
  res.json({ ok: true });
});
