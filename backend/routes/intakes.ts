// backend/routes/intakes.ts

import type { Router } from "../deps.ts";

export function registerIntakeRoutes(router: Router) {
  router.get("/api/intakes", (ctx) => {
    ctx.response.body = {
      message: "Intakes placeholder – funktioniert 👌",
    };
  });

  router.post("/api/intakes", (ctx) => {
    ctx.response.body = {
      message: "POST /api/intakes placeholder",
    };
  });
}