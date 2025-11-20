import { Application, Router } from "./deps.ts";
import { oakCors } from "./deps.ts";

import { registerHealthRoutes } from "./routes/health.ts";
import { registerAuthRoutes, authMiddleware } from "./routes/auth.ts";
import { registerMedicationRoutes } from "./routes/medications.ts";
import { registerIntakeRoutes } from "./routes/intakes.ts";
import { registerDayOverviewRoutes } from "./routes/dayOverview.ts";

const app = new Application();
const router = new Router();

app.use(async (ctx, next) => {
  console.log(`${ctx.request.method} ${ctx.request.url.pathname}`);
  await next();
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error("Unerwarteter Fehler:", err);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal Server Error" };
  }
});

app.use(oakCors());

app.use(authMiddleware);

registerHealthRoutes(router);
registerAuthRoutes(router);
registerMedicationRoutes(router);
registerIntakeRoutes(router);
registerDayOverviewRoutes(router);

app.use(router.routes());
app.use(router.allowedMethods());

console.log("MediManager Backend läuft auf http://localhost:8000");
await app.listen({ port: 8000 });