// backend/routes/auth.ts

import type { Router } from "../deps.ts";
import { loadUsers } from "../storage.ts";

// ganz einfacher Session-Speicher: token -> userId
const sessions = new Map<string, string>();

// ---------- Login-Routen registrieren ----------
export function registerAuthRoutes(router: Router) {
  router.post("/api/login", async (ctx) => {
    try {
      const body = ctx.request.body({ type: "json" });
      const { username, password } = await body.value;

      if (!username || !password) {
        ctx.response.status = 400;
        ctx.response.body = { error: "username und password sind Pflichtfelder" };
        return;
      }

      const userFile = await loadUsers();
      const user = userFile.users.find(
        (u) => u.username === username && u.password === password,
      );

      if (!user) {
        ctx.response.status = 401;
        ctx.response.body = { error: "Ungültige Login-Daten" };
        return;
      }

      // Token erzeugen und speichern
      const token = crypto.randomUUID();
      sessions.set(token, user.id);

      ctx.response.body = {
        token,
        user: {
          id: user.id,
          username: user.username,
        },
      };
    } catch (error) {
      console.error("Fehler beim Login:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Login aktuell nicht möglich" };
    }
  });
}

// ---------- Auth Middleware ----------
export async function authMiddleware(ctx: any, next: () => Promise<unknown>) {
  const path = ctx.request.url.pathname;

  // öffentlich:
  if (path === "/api/health" || path === "/api/login") {
    await next();
    return;
  }

  // alle anderen API-Routen brauchen ein Token
  if (path.startsWith("/api/")) {
    const authHeader = ctx.request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Kein oder ungültiger Authorization Header" };
      return;
    }

    const token = authHeader.substring("Bearer ".length).trim();
    const userId = sessions.get(token);

    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Token ungültig oder abgelaufen" };
      return;
    }

    // user info speichern
    ctx.state.userId = userId;
  }

  await next();
}