import { Router } from "express";
export const authRouter = Router();

authRouter.post("/login", (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    // placeholder login success
    res.json({ ok: true, token: "demo-token", email });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/register", (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    // placeholder registration success
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
