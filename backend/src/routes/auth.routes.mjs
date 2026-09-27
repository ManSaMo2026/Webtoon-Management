import { Router } from "express";
import { requireAuth } from "../middleware/auth.mjs";
import { asyncRoute } from "../middleware/errorHandler.mjs";
import * as authService from "../services/auth.service.mjs";

export const authRouter = Router();

authRouter.post("/signup", asyncRoute(async (req, res) => {
  const result = await authService.signup(req.body);
  res.status(201).json(result);
}));

authRouter.post("/login", asyncRoute(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json(result);
}));

authRouter.delete("/session", requireAuth, asyncRoute(async (req, res) => {
  await authService.revokeSession(req.authToken);
  res.status(204).end();
}));

export const membersRouter = Router();

membersRouter.get("/me", requireAuth, asyncRoute(async (req, res) => {
  res.status(200).json({ user: authService.publicUser(req.user) });
}));

membersRouter.put("/me", requireAuth, asyncRoute(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.status(200).json({ user });
}));
