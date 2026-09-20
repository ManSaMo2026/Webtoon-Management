import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MousePointer2, Plus, StickyNote, Trash2, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { relationshipBoardsApi } from "../../api/relationshipBoards";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import type { Character, RelationshipArrowDirection, RelationshipBoard as RelationshipBoardData, RelationshipConnectionSide, RelationshipNode } from "../../types";

interface RelationshipBoardProps {
  projectId: string;
  characters: Character[];
  onCreateCharacter: () => void;
}

type DragTarget = { kind: "node" | "note"; id: string; offsetX: number; offsetY: number; startClientX: number; startClientY: number; moved: boolean };
type ConnectorDrag = { sourceId: string; sourceSide: RelationshipConnectionSide; sourceAnchor: number; startX: number; startY: number; currentX: number; currentY: number };
type LineControlDrag = { connectionId: string; midpointX: number; midpointY: number };
type EndpointDrag = { connectionId: string; endpoint: "from" | "to"; currentX: number; currentY: number };

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 720;
const NODE_WIDTH = 170;
const NODE_HEIGHT = 112;
const NOTE_WIDTH = 190;
const NOTE_HEIGHT = 120;

function emptyBoard(projectId: string): RelationshipBoardData {
  return { projectId, nodes: [], connections: [], notes: [] };
}

function CharacterThumb({ character }: { character: Character }) {
  if (character.imageUrl) return <img src={character.imageUrl} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-border object-cover" />;
  return <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-base font-bold text-primary">{character.name.trim().charAt(0) || "?"}</span>;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function connectionPoint(node: RelationshipNode, side: RelationshipConnectionSide, anchor = 0.5) {
  const safeAnchor = clamp(anchor, 0.08, 0.92);
  if (side === "top") return { x: node.x + NODE_WIDTH * safeAnchor, y: node.y };
  if (side === "right") return { x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT * safeAnchor };
  if (side === "bottom") return { x: node.x + NODE_WIDTH * safeAnchor, y: node.y + NODE_HEIGHT };
  return { x: node.x, y: node.y + NODE_HEIGHT * safeAnchor };
}

function nearestSide(node: RelationshipNode, x: number, y: number): RelationshipConnectionSide {
  const distances: Array<[RelationshipConnectionSide, number]> = [
    ["top", Math.abs(y - node.y)],
    ["right", Math.abs(x - (node.x + NODE_WIDTH))],
    ["bottom", Math.abs(y - (node.y + NODE_HEIGHT))],
    ["left", Math.abs(x - node.x)],
  ];
  return distances.sort((a, b) => a[1] - b[1])[0][0];
}

function anchorAtPoint(node: RelationshipNode, side: RelationshipConnectionSide, x: number, y: number) {
  return side === "top" || side === "bottom" ? clamp((x - node.x) / NODE_WIDTH, 0.08, 0.92) : clamp((y - node.y) / NODE_HEIGHT, 0.08, 0.92);
}

function findSnapTarget(nodes: RelationshipNode[], x: number, y: number, excludedCharacterId: string, tolerance = 28) {
  return nodes
    .filter((node) => node.characterId !== excludedCharacterId && x >= node.x - tolerance && x <= node.x + NODE_WIDTH + tolerance && y >= node.y - tolerance && y <= node.y + NODE_HEIGHT + tolerance)
    .sort((a, b) => {
      const aDistance = Math.hypot(x - (a.x + NODE_WIDTH / 2), y - (a.y + NODE_HEIGHT / 2));
      const bDistance = Math.hypot(x - (b.x + NODE_WIDTH / 2), y - (b.y + NODE_HEIGHT / 2));
      return aDistance - bDistance;
    })[0];
}

function automaticSides(from: RelationshipNode, to: RelationshipNode): [RelationshipConnectionSide, RelationshipConnectionSide] {
  const horizontal = Math.abs(to.x - from.x) >= Math.abs(to.y - from.y);
  if (horizontal) return to.x >= from.x ? ["right", "left"] : ["left", "right"];
  return to.y >= from.y ? ["bottom", "top"] : ["top", "bottom"];
}

export function RelationshipBoard({ projectId, characters, onCreateCharacter }: RelationshipBoardProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<RelationshipBoardData>(emptyBoard(projectId));
  const dragRef = useRef<DragTarget | null>(null);
  const connectorDragRef = useRef<ConnectorDrag | null>(null);
  const lineControlDragRef = useRef<LineControlDrag | null>(null);
  const endpointDragRef = useRef<EndpointDrag | null>(null);
  const [board, setBoard] = useState<RelationshipBoardData>(() => emptyBoard(projectId));
  const [connectorPreview, setConnectorPreview] = useState<ConnectorDrag | null>(null);
  const [endpointPreview, setEndpointPreview] = useState<EndpointDrag | null>(null);
  const [snapTargetId, setSnapTargetId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["relationship-board", projectId],
    queryFn: () => relationshipBoardsApi.get(projectId),
  });

  useEffect(() => {
    if (data === undefined) return;
    const loaded = data ?? emptyBoard(projectId);
    const next = { ...loaded, connections: loaded.connections.map((connection) => ({ ...connection, label: connection.label === "관계" ? "" : connection.label })) };
    boardRef.current = next;
    setBoard(next);
  }, [data, projectId]);

  const saveMutation = useMutation({
    mutationFn: relationshipBoardsApi.save,
    onError: () => toast.error("인물관계도를 저장하지 못했습니다."),
  });

  const updateBoard = (next: RelationshipBoardData, persist = true) => {
    boardRef.current = next;
    setBoard(next);
    if (persist) saveMutation.mutate(next);
  };

  const addCharacterNode = (characterId: string) => {
    if (board.nodes.some((node) => node.characterId === characterId)) return;
    const index = board.nodes.length;
    const next = {
      ...board,
      nodes: [...board.nodes, { characterId, x: 56 + (index % 4) * 230, y: 70 + Math.floor(index / 4) * 165 }],
    };
    updateBoard(next);
  };

  const removeCharacterNode = (characterId: string) => {
    updateBoard({
      ...board,
      nodes: board.nodes.filter((node) => node.characterId !== characterId),
      connections: board.connections.filter((connection) => connection.fromCharacterId !== characterId && connection.toCharacterId !== characterId),
    });
  };

  const addNote = () => {
    const count = board.notes.length;
    updateBoard({ ...board, notes: [...board.notes, { id: `note-${Date.now()}`, text: "메모를 입력하세요", x: 70 + (count % 4) * 220, y: 500 + (count % 2) * 130 }] });
  };

  const deleteSelectedConnection = () => {
    if (!selectedConnectionId) return;
    updateBoard({ ...board, connections: board.connections.filter((connection) => connection.id !== selectedConnectionId) });
    setSelectedConnectionId(null);
    setEditingConnectionId(null);
    setEditingLabel("");
  };

  const selectConnection = (id: string) => {
    setSelectedConnectionId(id);
  };

  const editConnectionLabel = (id: string) => {
    const connection = boardRef.current.connections.find((item) => item.id === id);
    setSelectedConnectionId(id);
    setEditingConnectionId(id);
    setEditingLabel(connection?.label ?? "");
  };

  const saveConnectionLabel = () => {
    if (!editingConnectionId) return;
    const label = editingLabel.trim();
    if (!label) return toast.error("관계명을 입력해주세요.");
    const current = boardRef.current;
    updateBoard({ ...current, connections: current.connections.map((connection) => connection.id === editingConnectionId ? { ...connection, label } : connection) });
    setEditingConnectionId(null);
  };

  const changeArrowDirection = (arrowDirection: RelationshipArrowDirection) => {
    if (!selectedConnectionId) return;
    const current = boardRef.current;
    updateBoard({ ...current, connections: current.connections.map((connection) => connection.id === selectedConnectionId ? { ...connection, arrowDirection } : connection) });
  };

  const resetSelectedLineShape = () => {
    if (!selectedConnectionId) return;
    const current = boardRef.current;
    updateBoard({ ...current, connections: current.connections.map((connection) => connection.id === selectedConnectionId ? { ...connection, controlOffsetX: undefined, controlOffsetY: undefined } : connection) });
  };

  const beginDrag = (event: ReactPointerEvent<HTMLElement>, kind: DragTarget["kind"], id: string, x: number, y: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { kind, id, offsetX: event.clientX - rect.left - x, offsetY: event.clientY - rect.top - y, startClientX: event.clientX, startClientY: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    if (Math.abs(event.clientX - drag.startClientX) > 3 || Math.abs(event.clientY - drag.startClientY) > 3) drag.moved = true;
    const width = drag.kind === "node" ? NODE_WIDTH : NOTE_WIDTH;
    const height = drag.kind === "node" ? NODE_HEIGHT : NOTE_HEIGHT;
    const x = Math.max(0, Math.min(CANVAS_WIDTH - width, event.clientX - rect.left - drag.offsetX));
    const y = Math.max(0, Math.min(CANVAS_HEIGHT - height, event.clientY - rect.top - drag.offsetY));
    const current = boardRef.current;
    const next = drag.kind === "node"
      ? { ...current, nodes: current.nodes.map((node) => node.characterId === drag.id ? { ...node, x, y } : node) }
      : { ...current, notes: current.notes.map((note) => note.id === drag.id ? { ...note, x, y } : note) };
    updateBoard(next, false);
  };

  const endDrag = () => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (drag.moved) saveMutation.mutate(boardRef.current);
  };

  const beginConnector = (event: ReactPointerEvent<HTMLButtonElement>, node: RelationshipNode, side: RelationshipConnectionSide) => {
    event.stopPropagation();
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const sourceAnchor = anchorAtPoint(node, side, x, y);
    const point = connectionPoint(node, side, sourceAnchor);
    const drag = { sourceId: node.characterId, sourceSide: side, sourceAnchor, startX: point.x, startY: point.y, currentX: point.x, currentY: point.y };
    connectorDragRef.current = drag;
    setConnectorPreview(drag);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveConnector = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = connectorDragRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const nodes = boardRef.current.nodes.filter((node) => characters.some((character) => character.id === node.characterId));
    const target = findSnapTarget(nodes, x, y, drag.sourceId);
    const targetSide = target ? nearestSide(target, x, y) : null;
    const targetPoint = target && targetSide ? connectionPoint(target, targetSide, anchorAtPoint(target, targetSide, x, y)) : null;
    const next = { ...drag, currentX: targetPoint?.x ?? x, currentY: targetPoint?.y ?? y };
    connectorDragRef.current = next;
    setConnectorPreview(next);
    setSnapTargetId(target?.characterId ?? null);
  };

  const endConnector = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = connectorDragRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    connectorDragRef.current = null;
    setConnectorPreview(null);
    setSnapTargetId(null);
    if (!drag || !rect) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const nodes = boardRef.current.nodes.filter((node) => characters.some((character) => character.id === node.characterId));
    const target = findSnapTarget(nodes, x, y, drag.sourceId);
    if (!target) return;
    const toSide = nearestSide(target, x, y);
    const id = `connection-${Date.now()}`;
    const current = boardRef.current;
    updateBoard({ ...current, connections: [...current.connections, { id, fromCharacterId: drag.sourceId, toCharacterId: target.characterId, fromSide: drag.sourceSide, fromAnchor: drag.sourceAnchor, toSide, toAnchor: anchorAtPoint(target, toSide, x, y), label: "", arrowDirection: "forward" }] });
    setSelectedConnectionId(id);
    setEditingConnectionId(id);
    setEditingLabel("");
  };

  const beginLineControl = (event: ReactPointerEvent<SVGCircleElement>, connectionId: string, midpointX: number, midpointY: number) => {
    event.stopPropagation();
    lineControlDragRef.current = { connectionId, midpointX, midpointY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveLineControl = (event: ReactPointerEvent<SVGCircleElement>) => {
    const drag = lineControlDragRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    const controlOffsetX = event.clientX - rect.left - drag.midpointX;
    const controlOffsetY = event.clientY - rect.top - drag.midpointY;
    const current = boardRef.current;
    updateBoard({ ...current, connections: current.connections.map((connection) => connection.id === drag.connectionId ? { ...connection, controlOffsetX, controlOffsetY } : connection) }, false);
  };

  const endLineControl = () => {
    if (!lineControlDragRef.current) return;
    lineControlDragRef.current = null;
    saveMutation.mutate(boardRef.current);
  };

  const beginEndpointDrag = (event: ReactPointerEvent<SVGCircleElement>, connectionId: string, endpoint: "from" | "to", x: number, y: number) => {
    event.stopPropagation();
    const drag = { connectionId, endpoint, currentX: x, currentY: y };
    endpointDragRef.current = drag;
    setEndpointPreview(drag);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveEndpointDrag = (event: ReactPointerEvent<SVGCircleElement>) => {
    const drag = endpointDragRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const connection = boardRef.current.connections.find((item) => item.id === drag.connectionId);
    const oppositeCharacterId = connection && (drag.endpoint === "from" ? connection.toCharacterId : connection.fromCharacterId);
    const nodes = boardRef.current.nodes.filter((node) => characters.some((character) => character.id === node.characterId));
    const target = oppositeCharacterId ? findSnapTarget(nodes, x, y, oppositeCharacterId) : undefined;
    const targetSide = target ? nearestSide(target, x, y) : null;
    const targetPoint = target && targetSide ? connectionPoint(target, targetSide, anchorAtPoint(target, targetSide, x, y)) : null;
    const next = { ...drag, currentX: targetPoint?.x ?? x, currentY: targetPoint?.y ?? y };
    endpointDragRef.current = next;
    setEndpointPreview(next);
    setSnapTargetId(target?.characterId ?? null);
  };

  const endEndpointDrag = (event: ReactPointerEvent<SVGCircleElement>) => {
    const drag = endpointDragRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    endpointDragRef.current = null;
    setEndpointPreview(null);
    setSnapTargetId(null);
    if (!drag || !rect) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const current = boardRef.current;
    const connection = current.connections.find((item) => item.id === drag.connectionId);
    if (!connection) return;
    const oppositeCharacterId = drag.endpoint === "from" ? connection.toCharacterId : connection.fromCharacterId;
    const nodes = current.nodes.filter((node) => characters.some((character) => character.id === node.characterId));
    const target = findSnapTarget(nodes, x, y, oppositeCharacterId);
    if (!target) return;
    const side = nearestSide(target, x, y);
    const anchor = anchorAtPoint(target, side, x, y);
    updateBoard({
      ...current,
      connections: current.connections.map((item) => item.id !== drag.connectionId ? item : drag.endpoint === "from"
        ? { ...item, fromCharacterId: target.characterId, fromSide: side, fromAnchor: anchor }
        : { ...item, toCharacterId: target.characterId, toSide: side, toAnchor: anchor }),
    });
  };

  const placedCharacterIds = new Set(board.nodes.map((node) => node.characterId));
  const validNodes = board.nodes.filter((node) => characters.some((character) => character.id === node.characterId));
  const selectedConnection = board.connections.find((connection) => connection.id === selectedConnectionId);
  const selectedFromName = characters.find((character) => character.id === selectedConnection?.fromCharacterId)?.name;
  const selectedToName = characters.find((character) => character.id === selectedConnection?.toCharacterId)?.name;

  if (isLoading) return <Card className="min-h-96 animate-pulse bg-muted/40" />;

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 className="text-base font-bold text-text">인물관계도</h2><p className="mt-1 text-xs leading-5 text-text-muted">상자의 네 테두리 어디에서든 다른 캐릭터까지 끌어 선을 만들고, 선 위에 관계명을 입력하세요.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={addNote}><StickyNote size={14} />텍스트 상자</Button>
          {selectedConnectionId && <Button size="sm" variant="danger" onClick={deleteSelectedConnection}><Trash2 size={14} />선택한 연결선 삭제</Button>}
        </div>
      </div>

      {selectedConnection && (
        <div className="flex flex-col gap-3 border-b border-primary/15 bg-accent/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold text-primary">선택한 연결선</p>
            <p className="mt-1 text-sm font-semibold text-text">{selectedFromName || "시작 인물"} <span className="text-primary">{selectedConnection.arrowDirection === "reverse" ? "←" : selectedConnection.arrowDirection === "both" ? "↔" : selectedConnection.arrowDirection === "none" ? "—" : "→"}</span> {selectedToName || "도착 인물"}</p>
            <p className="mt-1 text-xs text-text-muted">선 양끝의 큰 보라색 원을 다른 캐릭터 상자 가까이 끌면 가장 가까운 테두리에 붙습니다.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-text-body">화살표 방향
              <select value={selectedConnection.arrowDirection ?? "forward"} onChange={(event) => changeArrowDirection(event.target.value as RelationshipArrowDirection)} className="rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-text outline-none focus:ring-2 focus:ring-primary">
                <option value="forward">시작 → 도착</option>
                <option value="reverse">시작 ← 도착</option>
                <option value="both">양방향 ↔</option>
                <option value="none">화살표 없음 —</option>
              </select>
            </label>
            <Button size="sm" variant="outline" onClick={resetSelectedLineShape}>선 모양 초기화</Button>
          </div>
        </div>
      )}

      <div className="flex min-h-[720px] flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-border bg-input-background p-4 lg:w-60 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-1.5 text-sm font-bold text-text"><Users size={15} />캐릭터</h3><span className="text-xs font-semibold text-primary">{placedCharacterIds.size}/{characters.length}</span></div>
          <p className="mb-4 text-xs leading-5 text-text-muted">추가한 캐릭터를 관계도 위로 불러오세요.</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {characters.map((character) => {
              const isPlaced = placedCharacterIds.has(character.id);
              return <button key={character.id} type="button" disabled={isPlaced} onClick={() => addCharacterNode(character.id)} className="flex items-center gap-2 rounded-lg border border-border bg-white p-2 text-left transition-colors hover:border-primary/40 disabled:cursor-default disabled:bg-muted/40 disabled:opacity-60"><CharacterThumb character={character} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-text">{character.name}</span><span className="mt-0.5 block truncate text-[11px] text-text-muted">{isPlaced ? "관계도에 추가됨" : character.role || character.roleGroup || "역할 미정"}</span></span>{!isPlaced && <Plus size={14} className="shrink-0 text-primary" />}</button>;
            })}
          </div>
          {!characters.length && <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-text-muted">먼저 캐릭터를 만들어주세요.</p>}
          <Button className="mt-4 w-full" size="sm" variant="outline" onClick={onCreateCharacter}><UserPlus size={14} />새 캐릭터 만들기</Button>
          <div className="mt-5 border-t border-border pt-4 text-xs leading-5 text-text-muted"><p className="flex items-start gap-1.5"><MousePointer2 size={13} className="mt-0.5 shrink-0" />캐릭터 상자는 잡아서 이동할 수 있습니다.</p><p className="mt-2">상자의 네 테두리 어디에서든 끌어 연결하세요. 상자 근처에 놓아도 가장 가까운 테두리에 자동으로 붙습니다.</p><p className="mt-2">선을 선택한 뒤 나타나는 보라색 손잡이를 움직여 곡선을 조절할 수 있습니다.</p><p className="mt-2">같은 두 인물도 여러 번 연결해 서로 다른 관계와 방향을 기록할 수 있습니다.</p><p className="mt-2">선 위 관계명을 누르면 그 자리에서 바로 수정됩니다.</p></div>
        </aside>

        <div className="min-w-0 flex-1 overflow-auto bg-white">
          <div ref={canvasRef} className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, backgroundImage: "radial-gradient(var(--color-border) 1px, transparent 1px)", backgroundSize: "20px 20px" }} onClick={() => setSelectedConnectionId(null)}>
            <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-label="캐릭터 관계 연결선">
              <defs><marker id="relationship-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-text-muted)" /></marker></defs>
              {connectorPreview && <line x1={connectorPreview.startX} y1={connectorPreview.startY} x2={connectorPreview.currentX} y2={connectorPreview.currentY} stroke="var(--color-primary)" strokeWidth="2.5" strokeDasharray="5 4" markerEnd="url(#relationship-arrow)" />}
              {board.connections.map((connection) => {
                const from = validNodes.find((node) => node.characterId === connection.fromCharacterId);
                const to = validNodes.find((node) => node.characterId === connection.toCharacterId);
                if (!from || !to) return null;
                const [automaticFromSide, automaticToSide] = automaticSides(from, to);
                const baseFromPoint = connectionPoint(from, connection.fromSide ?? automaticFromSide, connection.fromAnchor ?? 0.5);
                const baseToPoint = connectionPoint(to, connection.toSide ?? automaticToSide, connection.toAnchor ?? 0.5);
                const activeEndpointPreview = endpointPreview?.connectionId === connection.id ? endpointPreview : null;
                const fromPoint = activeEndpointPreview?.endpoint === "from" ? { x: activeEndpointPreview.currentX, y: activeEndpointPreview.currentY } : baseFromPoint;
                const toPoint = activeEndpointPreview?.endpoint === "to" ? { x: activeEndpointPreview.currentX, y: activeEndpointPreview.currentY } : baseToPoint;
                const x1 = fromPoint.x;
                const y1 = fromPoint.y;
                const x2 = toPoint.x;
                const y2 = toPoint.y;
                const pairConnections = board.connections.filter((item) =>
                  (item.fromCharacterId === connection.fromCharacterId && item.toCharacterId === connection.toCharacterId)
                  || (item.fromCharacterId === connection.toCharacterId && item.toCharacterId === connection.fromCharacterId));
                const pairIndex = pairConnections.findIndex((item) => item.id === connection.id);
                const curveOffset = (pairIndex - (pairConnections.length - 1) / 2) * 72 * (connection.fromCharacterId < connection.toCharacterId ? 1 : -1);
                const dx = x2 - x1;
                const dy = y2 - y1;
                const length = Math.max(1, Math.hypot(dx, dy));
                const midpointX = (x1 + x2) / 2;
                const midpointY = (y1 + y2) / 2;
                const controlX = connection.controlOffsetX === undefined ? midpointX - (dy / length) * curveOffset : midpointX + connection.controlOffsetX;
                const controlY = connection.controlOffsetY === undefined ? midpointY + (dx / length) * curveOffset : midpointY + connection.controlOffsetY;
                const centerX = 0.25 * x1 + 0.5 * controlX + 0.25 * x2;
                const centerY = 0.25 * y1 + 0.5 * controlY + 0.25 * y2;
                const path = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
                const selected = selectedConnectionId === connection.id;
                const editing = editingConnectionId === connection.id;
                return <g key={connection.id} className="pointer-events-auto cursor-pointer" onClick={(event) => { event.stopPropagation(); selectConnection(connection.id); }} onDoubleClick={(event) => { event.stopPropagation(); editConnectionLabel(connection.id); }}>
                  <path d={path} fill="none" stroke="transparent" strokeWidth="16" />
                  <path d={path} fill="none" stroke={selected ? "var(--color-primary)" : "var(--color-text-muted)"} strokeWidth={selected ? "3" : "2"} markerStart={connection.arrowDirection === "reverse" || connection.arrowDirection === "both" ? "url(#relationship-arrow)" : undefined} markerEnd={(connection.arrowDirection ?? "forward") === "forward" || connection.arrowDirection === "both" ? "url(#relationship-arrow)" : undefined} />
                  {selected && <><line x1={midpointX} y1={midpointY} x2={controlX} y2={controlY} stroke="var(--color-primary)" strokeWidth="1" strokeDasharray="3 3" opacity="0.55" /><circle cx={controlX} cy={controlY} r="8" fill="var(--color-primary)" stroke="white" strokeWidth="3" className="pointer-events-auto cursor-move" onPointerDown={(event) => beginLineControl(event, connection.id, midpointX, midpointY)} onPointerMove={moveLineControl} onPointerUp={endLineControl} onPointerCancel={endLineControl} /></>}
                  {selected && <><circle cx={x1} cy={y1} r="18" fill="transparent" className="pointer-events-auto cursor-grab touch-none active:cursor-grabbing" onPointerDown={(event) => beginEndpointDrag(event, connection.id, "from", x1, y1)} onPointerMove={moveEndpointDrag} onPointerUp={endEndpointDrag} onPointerCancel={() => { endpointDragRef.current = null; setEndpointPreview(null); setSnapTargetId(null); }} /><circle cx={x1} cy={y1} r="7" fill="white" stroke="var(--color-primary)" strokeWidth="3" className="pointer-events-none" /><circle cx={x2} cy={y2} r="18" fill="transparent" className="pointer-events-auto cursor-grab touch-none active:cursor-grabbing" onPointerDown={(event) => beginEndpointDrag(event, connection.id, "to", x2, y2)} onPointerMove={moveEndpointDrag} onPointerUp={endEndpointDrag} onPointerCancel={() => { endpointDragRef.current = null; setEndpointPreview(null); setSnapTargetId(null); }} /><circle cx={x2} cy={y2} r="7" fill="white" stroke="var(--color-primary)" strokeWidth="3" className="pointer-events-none" /></>}
                  <foreignObject x={centerX - 70} y={centerY - 17} width="140" height="34" className="pointer-events-auto overflow-visible">
                    <div xmlns="http://www.w3.org/1999/xhtml" className="flex h-full items-center justify-center">
                      {editing ? <input autoFocus value={editingLabel} onChange={(event) => setEditingLabel(event.target.value)} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === "Enter") saveConnectionLabel(); if (event.key === "Escape") setEditingConnectionId(null); }} onBlur={() => editingLabel.trim() && saveConnectionLabel()} maxLength={30} placeholder="관계명 입력" className="h-8 w-full rounded-md border-2 border-primary bg-white px-2 text-center text-xs font-bold text-text outline-none" /> : <button type="button" onClick={(event) => { event.stopPropagation(); editConnectionLabel(connection.id); }} className={`max-w-full truncate rounded-md border bg-white px-2.5 py-1.5 text-xs font-bold shadow-sm ${selected ? "border-primary text-primary" : "border-border text-text"}`}>{connection.label || "관계명 입력"}</button>}
                    </div>
                  </foreignObject>
                </g>;
              })}
            </svg>

            {validNodes.map((node) => {
              const character = characters.find((item) => item.id === node.characterId)!;
              const edgeHandleClasses: Record<RelationshipConnectionSide, string> = { top: "-top-3 left-3 right-3 h-6", right: "-right-3 bottom-3 top-3 w-6", bottom: "-bottom-3 left-3 right-3 h-6", left: "-left-3 bottom-3 top-3 w-6" };
              const handleLineClasses: Record<RelationshipConnectionSide, string> = { top: "left-0 right-0 top-1/2 h-1 -translate-y-1/2", right: "bottom-0 left-1/2 top-0 w-1 -translate-x-1/2", bottom: "bottom-1/2 left-0 right-0 h-1 translate-y-1/2", left: "bottom-0 left-1/2 top-0 w-1 -translate-x-1/2" };
              return <article key={character.id} style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }} onPointerDown={(event) => beginDrag(event, "node", character.id, node.x, node.y)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} className={`group absolute z-20 touch-none select-none rounded-xl border bg-white p-3 shadow-sm transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-md ${snapTargetId === character.id ? "border-primary ring-4 ring-primary/15 shadow-md" : "border-border"} ${connectorPreview || endpointPreview ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}>
                <button type="button" aria-label={`${character.name} 관계도에서 제거`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); removeCharacterNode(character.id); }} className="absolute right-1.5 top-1.5 rounded p-1 text-text-muted opacity-0 hover:bg-destructive/10 hover:text-destructive focus:opacity-100 group-hover:opacity-100"><X size={12} /></button>
                {(["top", "right", "bottom", "left"] as RelationshipConnectionSide[]).map((side) => <button key={side} type="button" aria-label={`${character.name} ${side} 테두리에서 선 만들기`} title="이 테두리의 원하는 위치에서 끌어 연결" onPointerDown={(event) => beginConnector(event, node, side)} onPointerMove={moveConnector} onPointerUp={endConnector} onPointerCancel={() => { connectorDragRef.current = null; setConnectorPreview(null); setSnapTargetId(null); }} className={`absolute z-30 touch-none cursor-crosshair rounded-full opacity-0 outline-none transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary group-hover:opacity-100 ${edgeHandleClasses[side]}`}><span aria-hidden="true" className={`absolute rounded-full bg-primary/65 transition-colors group-hover:bg-primary ${handleLineClasses[side]}`} /></button>)}
                <div className="flex items-center gap-2"><CharacterThumb character={character} /><div className="min-w-0"><p className="truncate text-sm font-bold text-text">{character.name}</p><p className="mt-0.5 truncate text-xs text-text-muted">{character.role || "역할 미정"}</p></div></div>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2"><Badge variant="neutral">{character.roleGroup || "기타"}</Badge><span className="max-w-[85px] truncate text-[10px] text-text-muted">{character.personality || "성격 미작성"}</span></div>
              </article>;
            })}

            {board.notes.map((note) => <article key={note.id} style={{ left: note.x, top: note.y, width: NOTE_WIDTH, height: NOTE_HEIGHT }} className="absolute z-30 overflow-hidden rounded-lg border border-primary/25 bg-accent shadow-sm">
              <div onPointerDown={(event) => beginDrag(event, "note", note.id, note.x, note.y)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} className="flex h-8 cursor-grab items-center justify-between border-b border-primary/15 px-2 text-[11px] font-bold text-primary active:cursor-grabbing"><span className="flex items-center gap-1"><StickyNote size={11} />텍스트 메모</span><button type="button" aria-label="메모 삭제" onPointerDown={(event) => event.stopPropagation()} onClick={() => updateBoard({ ...boardRef.current, notes: boardRef.current.notes.filter((item) => item.id !== note.id) })} className="rounded p-0.5 hover:bg-white/70 hover:text-destructive"><Trash2 size={11} /></button></div>
              <textarea value={note.text} onChange={(event) => { const current = boardRef.current; updateBoard({ ...current, notes: current.notes.map((item) => item.id === note.id ? { ...item, text: event.target.value } : item) }, false); }} onBlur={() => saveMutation.mutate(boardRef.current)} maxLength={180} aria-label="관계도 텍스트 메모" className="h-[88px] w-full resize-none bg-transparent px-2.5 py-2 text-xs leading-5 text-text outline-none placeholder:text-text-muted" />
            </article>)}

            {!validNodes.length && !board.notes.length && <div className="absolute inset-0 flex items-center justify-center"><div className="rounded-xl border border-dashed border-border bg-white/90 px-8 py-7 text-center"><Users size={28} className="mx-auto text-primary/50" /><p className="mt-3 text-sm font-bold text-text">관계도가 비어 있습니다</p><p className="mt-1 text-xs text-text-muted">왼쪽에서 캐릭터를 추가하거나 텍스트 상자를 만들어보세요.</p></div></div>}
          </div>
        </div>
      </div>
    </Card>
  );
}
