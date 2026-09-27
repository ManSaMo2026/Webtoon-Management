import { Router } from "express";
import { asyncRoute } from "../middleware/errorHandler.mjs";
import * as todoService from "../services/todo.service.mjs";
import { todoSchema } from "../validators/todo.schema.mjs";

// Mounted at /api/projects/:projectId/todos, after requireAuth + requireProjectOwnership.
export const nestedTodosRouter = Router({ mergeParams: true });

nestedTodosRouter.get("/", asyncRoute(async (req, res) => {
  res.json(await todoService.listTodos(req.params.projectId));
}));

nestedTodosRouter.post("/", asyncRoute(async (req, res) => {
  const data = todoSchema.parse(req.body);
  res.status(201).json(await todoService.createTodo(req.params.projectId, data));
}));

// Mounted at /api/todos, after requireAuth.
export const todosRouter = Router();

todosRouter.patch("/:todoId", asyncRoute(async (req, res) => {
  res.json(await todoService.toggleTodo(req.user.id, req.params.todoId));
}));

todosRouter.delete("/:todoId", asyncRoute(async (req, res) => {
  await todoService.deleteTodo(req.user.id, req.params.todoId);
  res.status(204).end();
}));
