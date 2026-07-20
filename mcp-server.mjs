// ============================================================
// eimaths-infra MCP server  (remote, Streamable HTTP)
// ให้ Claude คุมเซิร์ฟเวอร์นี้ตรงๆ ผ่าน custom connector บน claude.ai
//
// Auth: secret อยู่ใน URL path (/mcp/<SECRET>) — ผิด secret = 404
//       + ควร allowlist IP ของ Anthropic ที่ reverse proxy อีกชั้น (ดู DEPLOY.md)
// รัน:  MCP_SECRET=<hex 48+> MCP_PORT=8848 node server.mjs
// ============================================================
import express from "express";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const SECRET = process.env.MCP_SECRET || "";
const PORT = Number(process.env.MCP_PORT || 8848);
if (SECRET.length < 24) {
  console.error("❌ ต้องตั้ง MCP_SECRET ยาว >= 24 ตัว (เช่น openssl rand -hex 32)");
  process.exit(1);
}

function runShell(cmd, cwd, timeoutMs) {
  return new Promise((resolve) => {
    const p = spawn("bash", ["-lc", cmd], { cwd: cwd || os.homedir() });
    let out = "", err = "", killed = false;
    const timer = setTimeout(() => { killed = true; p.kill("SIGKILL"); }, timeoutMs);
    p.stdout.on("data", d => { out += d; if (out.length > 500000) { killed = true; p.kill("SIGKILL"); } });
    p.stderr.on("data", d => { err += d; });
    p.on("close", code => {
      clearTimeout(timer);
      resolve(`$ ${cmd}\n--- stdout ---\n${out}\n--- stderr ---\n${err}\n--- exit: ${killed ? "TIMEOUT/KILLED" : code} ---`);
    });
    p.on("error", e => { clearTimeout(timer); resolve("spawn error: " + e.message); });
  });
}
const ok = (t) => ({ content: [{ type: "text", text: t }] });
const bad = (t) => ({ content: [{ type: "text", text: "ERROR: " + t }], isError: true });

function buildServer() {
  const s = new McpServer({ name: "eimaths-infra", version: "1.0.0" });

  s.tool("run_command", "รันคำสั่ง shell (bash) บนเซิร์ฟเวอร์ คืน stdout/stderr/exit",
    { command: z.string(), cwd: z.string().optional(), timeout_sec: z.number().optional() },
    async ({ command, cwd, timeout_sec }) => ok(await runShell(command, cwd, (timeout_sec || 120) * 1000)));

  s.tool("read_file", "อ่านไฟล์ (สูงสุด ~200KB)",
    { path: z.string() },
    async ({ path }) => { try { return ok((await fs.readFile(path, "utf8")).slice(0, 200000)); } catch (e) { return bad(e.message); } });

  s.tool("write_file", "เขียนไฟล์ (สร้าง/ทับ)",
    { path: z.string(), content: z.string() },
    async ({ path, content }) => { try { await fs.writeFile(path, content); return ok(`written ${content.length} bytes -> ${path}`); } catch (e) { return bad(e.message); } });

  s.tool("list_dir", "ดูรายชื่อไฟล์/โฟลเดอร์",
    { path: z.string() },
    async ({ path }) => { try { const e = await fs.readdir(path, { withFileTypes: true }); return ok(e.map(d => (d.isDirectory() ? "[d] " : "    ") + d.name).join("\n") || "(ว่าง)"); } catch (e) { return bad(e.message); } });

  return s;
}

const app = express();
app.use(express.json({ limit: "25mb" }));
const MCP_PATH = `/mcp/${SECRET}`;

async function handle(req, res) {
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined }); // stateless (single-user)
  res.on("close", () => { transport.close(); server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: String(e) });
  }
}
app.post(MCP_PATH, handle);
app.get(MCP_PATH, handle);
app.delete(MCP_PATH, handle);
app.use((_req, res) => res.status(404).end()); // ผิด path/secret = 404

app.listen(PORT, "127.0.0.1", () => console.log(`✅ eimaths-mcp ฟังที่ 127.0.0.1:${PORT}  path: /mcp/<secret>`));
