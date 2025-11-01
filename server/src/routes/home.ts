import { Router } from "express";

export const homeRouter = Router();

// GET /api/v1/home
homeRouter.get("/home", (_req, res) => {
  res.json({
    title: "Home",
    intro: "Welcome to Digital Twin",
  });
});
