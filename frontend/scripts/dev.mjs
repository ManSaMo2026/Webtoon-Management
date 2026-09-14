import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backendEntry = resolve(frontendDir, "..", "backend", "src", "server.mjs");
const viteEntry = resolve(frontendDir, "node_modules", "vite", "bin", "vite.js");
const viteArgs = process.argv.slice(2);
let backendProcess = null;
let viteProcess = null;
let stopping = false;

async function backendIsReady() {
  try {
    const response = await fetch("http://127.0.0.1:4000/api/health", {
      signal: AbortSignal.timeout(700),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForBackend() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await backendIsReady()) return;
    if (backendProcess?.exitCode !== null) {
      throw new Error("회원 서버가 시작되지 않았습니다.");
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 150));
  }
  throw new Error("회원 서버 시작 시간이 초과되었습니다.");
}

function stopChildren(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  if (viteProcess && viteProcess.exitCode === null) viteProcess.kill();
  if (backendProcess && backendProcess.exitCode === null) backendProcess.kill();
  process.exit(exitCode);
}

process.on("SIGINT", () => stopChildren(0));
process.on("SIGTERM", () => stopChildren(0));

try {
  if (await backendIsReady()) {
    console.log("[dev] 기존 회원 서버를 사용합니다: http://127.0.0.1:4000");
  } else {
    console.log("[dev] 회원 서버를 시작합니다: http://127.0.0.1:4000");
    backendProcess = spawn(process.execPath, [backendEntry], {
      cwd: resolve(frontendDir, "..", "backend"),
      stdio: "inherit",
    });
    await waitForBackend();
  }

  viteProcess = spawn(process.execPath, [viteEntry, ...viteArgs], {
    cwd: frontendDir,
    stdio: "inherit",
  });

  viteProcess.on("exit", (code) => stopChildren(code ?? 0));
} catch (error) {
  console.error(`[dev] ${error instanceof Error ? error.message : "개발 서버 실행에 실패했습니다."}`);
  stopChildren(1);
}
