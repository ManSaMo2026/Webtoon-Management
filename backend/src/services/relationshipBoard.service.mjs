import { prisma } from "../lib/prisma.mjs";
import { conflict } from "../lib/errors.mjs";

function serialize(board) {
  if (!board) return null;
  return {
    projectId: board.projectId,
    nodes: board.nodesJson,
    connections: board.connectionsJson,
    notes: board.notesJson,
    version: board.version,
  };
}

export async function getRelationshipBoard(projectId) {
  const board = await prisma.relationshipBoard.findUnique({ where: { projectId } });
  return serialize(board);
}

// Optimistic locking: the client must send the version it last read. A mismatch
// means someone else saved in between, so we reject instead of overwriting.
export async function saveRelationshipBoard(projectId, { nodes, connections, notes, version }) {
  const existing = await prisma.relationshipBoard.findUnique({ where: { projectId } });

  if (!existing) {
    const created = await prisma.relationshipBoard.create({
      data: { projectId, nodesJson: nodes, connectionsJson: connections, notesJson: notes, version: 1 },
    });
    return serialize(created);
  }

  if (existing.version !== version) {
    throw conflict("다른 곳에서 먼저 저장되어 최신 상태를 다시 불러와야 합니다.");
  }

  const updated = await prisma.relationshipBoard.update({
    where: { projectId },
    data: {
      nodesJson: nodes,
      connectionsJson: connections,
      notesJson: notes,
      version: { increment: 1 },
    },
  });
  return serialize(updated);
}
