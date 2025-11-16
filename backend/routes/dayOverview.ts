// backend/routes/dayOverview.ts

import type { Router } from "../deps.ts";

export function registerDayOverviewRoutes(router: Router) {
  router.get("/api/day-overview", (ctx) => {
    ctx.response.body = {
      message: "Day overview placeholder – funktioniert 👌",
    };
  });
}