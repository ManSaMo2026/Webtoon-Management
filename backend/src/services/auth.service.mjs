import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { prisma } from "../lib/prisma.mjs";
import { AppError } from "../lib/errors.mjs";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    penName: user.penName,
    role: user.role,
    createdAt: user.createdAt,
  };
}

async function createSession(userId) {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

export async function signup({ email, password, name, penName = "" }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedName = String(name || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new AppError("올바른 이메일을 입력해주세요.", 400);
  if (String(password || "").length < 8) throw new AppError("비밀번호는 8자 이상이어야 합니다.", 400);
  if (normalizedName.length < 2) throw new AppError("이름은 2자 이상 입력해주세요.", 400);

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw new AppError("이미 가입된 이메일입니다.", 409);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: hashPassword(String(password)),
      name: normalizedName,
      penName: String(penName).trim(),
    },
  });

  return { token: await createSession(user.id), user: publicUser(user) };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email: String(email || "").trim().toLowerCase() } });
  if (!user || !verifyPassword(String(password || ""), user.passwordHash)) {
    throw new AppError("이메일 또는 비밀번호를 확인해주세요.", 401);
  }
  return { token: await createSession(user.id), user: publicUser(user) };
}

export async function getUserByToken(token) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date()) return null;
  return session.user;
}

export async function revokeSession(token) {
  if (!token) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function updateProfile(userId, { name, penName = "", currentPassword, newPassword }) {
  const normalizedName = String(name || "").trim();
  if (normalizedName.length < 2) throw new AppError("이름은 2자 이상 입력해주세요.", 400);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const data = { name: normalizedName, penName: String(penName).trim() };
  if (newPassword) {
    if (!verifyPassword(String(currentPassword || ""), user.passwordHash)) {
      throw new AppError("현재 비밀번호가 일치하지 않습니다.", 400);
    }
    if (String(newPassword).length < 8) throw new AppError("새 비밀번호는 8자 이상이어야 합니다.", 400);
    data.passwordHash = hashPassword(String(newPassword));
  }

  const updated = await prisma.user.update({ where: { id: userId }, data });
  return publicUser(updated);
}
