import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

const router = new Router();

router.get("/api/health", (ctx) => {
  ctx.response.body = {
    status: "ok",
    app: "MediManager",
  };
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

console.log("MediManager Backend läuft auf http://localhost:8000");
await app.listen({ port: 8000 });

