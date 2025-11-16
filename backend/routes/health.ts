// backend/routes/health.ts

import type { Router } from "../deps.ts";

export function registerHealthRoutes(router: Router) {
  router.get("/api/health", (ctx) => {
    ctx.response.body = {
      status: "ok",
      app: "MediManager",
    };
  });
}