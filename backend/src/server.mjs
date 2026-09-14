import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const currentDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(currentDir, "..", "data");
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(join(dataDir, "webtoon-maker.db"));
db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    pen_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT '작가',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

const PORT = Number(process.env.PORT || 4000);
const allowedOrigins = new Set(["http://localhost:5173", "http://127.0.0.1:5173"]);

function json(res, status, body, origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  };
  if (allowedOrigins.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  res.writeHead(status, headers);
  res.end(status === 204 ? undefined : JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error("요청 데이터가 너무 큽니다.");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("올바른 JSON 형식이 아닙니다.");
  }
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password, stored) {
  const [salt, key] = stored.split(":");
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(key, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function publicUser(row) {
  return {
    id: Number(row.id),
    email: row.email,
    name: row.name,
    penName: row.pen_name,
    role: row.role,
    createdAt: row.created_at,
  };
}

function createSession(userId) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)").run(userId, tokenHash, expiresAt);
  return token;
}

function currentUser(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return db.prepare(`
    SELECT users.* FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(tokenHash, new Date().toISOString());
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  if (req.method === "OPTIONS") return json(res, 204, {}, origin);
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      return json(res, 200, { status: "ok" }, origin);
    }

    if (req.method === "POST" && url.pathname === "/api/auth/signup") {
      const { email, password, name, penName = "" } = await readBody(req);
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const normalizedName = String(name || "").trim();
      if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return json(res, 400, { message: "올바른 이메일을 입력해주세요." }, origin);
      if (String(password || "").length < 8) return json(res, 400, { message: "비밀번호는 8자 이상이어야 합니다." }, origin);
      if (normalizedName.length < 2) return json(res, 400, { message: "이름은 2자 이상 입력해주세요." }, origin);
      if (db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail)) {
        return json(res, 409, { message: "이미 가입된 이메일입니다." }, origin);
      }
      const result = db.prepare("INSERT INTO users (email, password_hash, name, pen_name) VALUES (?, ?, ?, ?)")
        .run(normalizedEmail, hashPassword(String(password)), normalizedName, String(penName).trim());
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      return json(res, 201, { token: createSession(user.id), user: publicUser(user) }, origin);
    }

    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const { email, password } = await readBody(req);
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email || "").trim().toLowerCase());
      if (!user || !verifyPassword(String(password || ""), user.password_hash)) {
        return json(res, 401, { message: "이메일 또는 비밀번호를 확인해주세요." }, origin);
      }
      return json(res, 200, { token: createSession(user.id), user: publicUser(user) }, origin);
    }

    if (req.method === "GET" && url.pathname === "/api/members/me") {
      const user = currentUser(req);
      if (!user) return json(res, 401, { message: "로그인이 필요합니다." }, origin);
      return json(res, 200, { user: publicUser(user) }, origin);
    }

    if (req.method === "PUT" && url.pathname === "/api/members/me") {
      const user = currentUser(req);
      if (!user) return json(res, 401, { message: "로그인이 필요합니다." }, origin);
      const { name, penName = "", currentPassword, newPassword } = await readBody(req);
      const normalizedName = String(name || "").trim();
      if (normalizedName.length < 2) return json(res, 400, { message: "이름은 2자 이상 입력해주세요." }, origin);
      if (newPassword) {
        if (!verifyPassword(String(currentPassword || ""), user.password_hash)) {
          return json(res, 400, { message: "현재 비밀번호가 일치하지 않습니다." }, origin);
        }
        if (String(newPassword).length < 8) return json(res, 400, { message: "새 비밀번호는 8자 이상이어야 합니다." }, origin);
        db.prepare("UPDATE users SET name = ?, pen_name = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .run(normalizedName, String(penName).trim(), hashPassword(String(newPassword)), user.id);
      } else {
        db.prepare("UPDATE users SET name = ?, pen_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .run(normalizedName, String(penName).trim(), user.id);
      }
      const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
      return json(res, 200, { user: publicUser(updated) }, origin);
    }

    return json(res, 404, { message: "요청한 API를 찾을 수 없습니다." }, origin);
  } catch (error) {
    console.error(error);
    return json(res, 500, { message: error.message || "서버 오류가 발생했습니다." }, origin);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Webtoon Maker API: http://127.0.0.1:${PORT}`);
});
