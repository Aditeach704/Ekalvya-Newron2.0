import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { generateWithGemini as generateWithGeminiService } from "./services/google-search.js";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { randomBytes, createHmac, timingSafeEqual, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const scrypt = promisify(scryptCallback);

const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "127.0.0.1";
const PUBLIC_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const publicDir = path.join(__dirname, "public");
const allowedOrigins = (process.env.ALLOWED_ORIGIN || "")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

if (!process.env.SESSION_SECRET) {
  console.warn("SESSION_SECRET is not set. Sessions will be invalidated when this server restarts. Set a long random secret in .env.");
}
if (IS_PRODUCTION && !process.env.SESSION_SECRET) {
  console.error("WARNING: Set SESSION_SECRET before deploying to production.");
}

app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : 1);
app.use(helmet({ contentSecurityPolicy: false }));
if (allowedOrigins.length) {
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
  }));
}
app.use(express.json({ limit: "12mb", strict: true }));
app.use(morgan("tiny"));

const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a moment and try again." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Please wait 15 minutes and try again." },
});
app.use("/api/", apiLimiter);

const SYSTEM_PROMPT = `You are Ekalyva Newron ANI, a helpful, capable, friendly AI assistant.\nBe clear, accurate, and honest. If uncertain, say so.\nFor code requests, provide complete, safe, well-structured examples.\nNever claim you performed actions you did not perform.`;

async function generateWithGemini(options) {
  if (typeof generateWithGeminiService !== "function") {
    throw new Error("Gemini service export is missing. Check services/google-search.js.");
  }
  return generateWithGeminiService(options);
}

async function readUsers() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(USERS_FILE, "[]\n", { mode: 0o600 });
      return [];
    }
    throw error;
  }
}
async function writeUsers(users) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temp = `${USERS_FILE}.${randomBytes(6).toString("hex")}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(users, null, 2)}\n`, { mode: 0o600 });
  await fs.rename(temp, USERS_FILE);
}
function safeUser(user) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
}
function sign(value) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}
function makeSession(user) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
function readCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";
  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) return decodeURIComponent(part.slice(index + 1).trim());
  }
  return null;
}
function getSession(req) {
  const token = readCookie(req, "newron_session");
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.id || !Number.isFinite(data.exp) || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch { return null; }
}
function setSessionCookie(res, user) {
  const secure = IS_PRODUCTION || PUBLIC_URL.startsWith("https://");
  res.cookie("newron_session", makeSession(user), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
}
function clearSessionCookie(res) {
  res.clearCookie("newron_session", {
    httpOnly: true,
    secure: IS_PRODUCTION || PUBLIC_URL.startsWith("https://"),
    sameSite: "lax",
    path: "/",
  });
}
async function findSessionUser(req) {
  const session = getSession(req);
  if (!session) return null;
  const users = await readUsers();
  return users.find((user) => user.id === session.id) || null;
}
async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const derived = await scrypt(password, salt, 64);
  return { salt, passwordHash: derived.toString("hex") };
}
async function passwordMatches(password, user) {
  const derived = await scrypt(password, user.salt, 64);
  const saved = Buffer.from(user.passwordHash, "hex");
  return saved.length === derived.length && timingSafeEqual(saved, derived);
}

// -------------------------------------------------------------
// System & Authentication APIs
// -------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "Ekalyva Newron ANI",
    chatConfigured: Boolean(process.env.GEMINI_API_KEY?.trim() && process.env.GEMINI_API_KEY !== "your_google_ai_studio_api_key_here")
  });
});

app.get("/api/config", (_req, res) => {
  res.json({
    name: "Ekalyva Newron ANI",
    configured: Boolean(process.env.GEMINI_API_KEY?.trim() && process.env.GEMINI_API_KEY !== "your_google_ai_studio_api_key_here")
  });
});

app.post("/api/auth/register", authLimiter, async (req, res, next) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (name.length < 1 || name.length > 80) return res.status(400).json({ error: "Enter a name between 1 and 80 characters." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ error: "Enter a valid email address." });
    if (password.length < 8 || password.length > 128) return res.status(400).json({ error: "Password must be 8–128 characters long." });
    const users = await readUsers();
    if (users.some((user) => user.email === email)) return res.status(409).json({ error: "An account with that email already exists. Try signing in instead." });
    const { salt, passwordHash } = await hashPassword(password);
    const user = { id: randomBytes(16).toString("hex"), name, email, salt, passwordHash, createdAt: new Date().toISOString() };
    users.push(user);
    await writeUsers(users);
    setSessionCookie(res, user);
    return res.status(201).json({ ok: true, user: safeUser(user) });
  } catch (error) { return next(error); }
});

app.post("/api/auth/login", authLimiter, async (req, res, next) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !password || password.length > 128) return res.status(400).json({ error: "Enter your email and password." });
    const users = await readUsers();
    const user = users.find((item) => item.email === email);
    if (!user || !(await passwordMatches(password, user))) return res.status(401).json({ error: "Email or password is incorrect." });
    setSessionCookie(res, user);
    return res.json({ ok: true, user: safeUser(user) });
  } catch (error) { return next(error); }
});

app.get("/api/auth/me", async (req, res, next) => {
  try {
    const user = await findSessionUser(req);
    if (!user) return res.status(401).json({ error: "You are not signed in." });
    return res.json({ user: safeUser(user) });
  } catch (error) { return next(error); }
});

app.post("/api/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  return res.json({ ok: true });
});

app.post("/api/auth/forgot-password", (_req, res) => {
  return res.status(501).json({ error: "Password reset email is not configured yet. Add a trusted email delivery service before enabling password resets." });
});

app.post("/api/chat", async (req, res) => {
  try {
    const authenticatedUser = await findSessionUser(req);
    if (!authenticatedUser) return res.status(401).json({ error: "Please sign in to use Newron AI Chat." });
    const { message, history = [], image, useGoogleSearch = false } = req.body ?? {};
    if (typeof message !== "string" || !message.trim()) return res.status(400).json({ error: "Please enter a message." });
    if (message.length > 20_000) return res.status(413).json({ error: "Message is too long (20,000 characters maximum)." });
    if (!Array.isArray(history) || history.length > 24) return res.status(400).json({ error: "Conversation history is invalid or too long." });
    if (typeof useGoogleSearch !== "boolean") return res.status(400).json({ error: "Google Search setting is invalid." });

    try {
      const result = await generateWithGemini({
        message: message.trim(),
        history,
        image,
        useGoogleSearch,
        systemInstruction: SYSTEM_PROMPT,
      });
      const reply = typeof result === "string"
        ? result.trim()
        : typeof result?.reply === "string"
          ? result.reply.trim()
          : typeof result?.text === "string"
            ? result.text.trim()
            : typeof result?.response === "string"
              ? result.response.trim()
              : "";
      if (!reply) {
        return res.status(502).json({ error: "Gemini returned an empty response. Check the server logs and try again." });
      }
      return res.json({
        reply,
        citations: Array.isArray(result?.citations) ? result.citations : [],
        searchQueries: Array.isArray(result?.searchQueries) ? result.searchQueries : [],
        provider: result?.provider || "google-gemini",
      });
    } catch (error) {
      if (error?.statusCode) return res.status(error.statusCode).json({ error: error.message });
      const detail = String(error?.message || "");
      if (/429|quota|rate limit|RESOURCE_EXHAUSTED/i.test(detail)) return res.status(429).json({ error: "Google Gemini quota or rate limit reached." });
      if (/401|403|API key|permission|unauthorized/i.test(detail)) return res.status(502).json({ error: "Google Gemini authentication failed. Check GEMINI_API_KEY in .env." });
      if (/timeout|deadline/i.test(detail)) return res.status(504).json({ error: "The response took too long. Please try again." });
      return res.status(502).json({ error: "Gemini could not complete this request." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Could not complete the chat request. Please try again shortly." });
  }
});

// -------------------------------------------------------------
// Clean URL Mapping & Page Routing
// -------------------------------------------------------------
const routeFileMap = {
  "/": "index.html",
  "/login": "login.html",
  "/signup": "signup.html",
  "/forgot-password": "forgot-password.html",
  "/chat": "chat.html",
  "/profile": "profile.html",
  "/settings": "settings.html",
  "/help": "help.html"
};

const protectedRoutes = new Set(["/chat", "/profile", "/settings", "/help"]);
const guestRoutes = new Set(["/login", "/signup", "/forgot-password"]);

// Canonical clean URL enforcer (redirect /page.html to /page)
app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  const lowerPath = req.path.toLowerCase();
  for (const [cleanRoute, file] of Object.entries(routeFileMap)) {
    if (lowerPath === `/${file}`) {
      const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
      return res.redirect(301, cleanRoute + qs);
    }
  }
  return next();
});

// Serve application routes with authentication handling
for (const [routePath, fileName] of Object.entries(routeFileMap)) {
  app.get(routePath, async (req, res, next) => {
    try {
      const user = await findSessionUser(req);

      // Authenticated users visiting login/signup/forgot-password -> redirect to /chat
      if (user && guestRoutes.has(routePath)) {
        return res.redirect(302, "/chat");
      }

      // Unauthenticated users visiting protected pages -> redirect to /login
      if (!user && protectedRoutes.has(routePath)) {
        const dest = req.originalUrl || routePath;
        return res.redirect(302, `/login?next=${encodeURIComponent(dest)}`);
      }

      return res.sendFile(path.join(publicDir, fileName));
    } catch (err) {
      return next(err);
    }
  });
}

// Static asset handler (scripts, styles, assets)
app.use(express.static(publicDir, {
  index: false,
  maxAge: IS_PRODUCTION ? "1h" : 0
}));

// Handle 404 for unknown resources
app.use((_req, res) => {
  res.status(404).send("Not found");
});

// Global error handler
app.use((error, _req, res, _next) => {
  if (error?.message === "Origin not allowed by CORS") return res.status(403).json({ error: "This origin is not allowed." });
  if (error?.type === "entity.too.large") return res.status(413).json({ error: "Request body is too large." });
  if (error instanceof SyntaxError && "body" in error) return res.status(400).json({ error: "Request body must be valid JSON." });
  console.error("Server error:", error?.message || error);
  return res.status(500).json({ error: "An unexpected server error occurred." });
});

app.listen(PORT, HOST, () => {
  console.log(`Ekalyva Newron ANI ready at http://${HOST}:${PORT}`);
});