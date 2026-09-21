import { prisma } from "../lib/prisma.mjs";
import { notFound } from "../lib/errors.mjs";

async function loadOwnedTodo(userId, todoId) {
  const todo = await prisma.todo.findUnique({
    where: { id: todoId },
    include: { project: { select: { userId: true } } },
  });
  if (!todo || todo.project.userId !== userId) throw notFound("할 일을 찾을 수 없습니다.");
  return todo;
}

export async function listTodos(projectId) {
  return prisma.todo.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } });
}

export async function createTodo(projectId, data) {
  return prisma.todo.create({ data: { ...data, projectId } });
}

export async function toggleTodo(userId, todoId) {
  const todo = await loadOwnedTodo(userId, todoId);
  return prisma.todo.update({ where: { id: todoId }, data: { done: !todo.done } });
}

export async function deleteTodo(userId, todoId) {
  await loadOwnedTodo(userId, todoId);
  await prisma.todo.delete({ where: { id: todoId } });
}
