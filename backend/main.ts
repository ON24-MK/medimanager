import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

const DATA_FILE = "./data/medications.json";

async function loadData() {
  const text = await Deno.readTextFile(DATA_FILE);
  return JSON.parse(text);
}

const router = new Router();

router.get("/api/health", (ctx) => {
  ctx.response.body = {
    status: "ok",
    app: "MediManager",
  };
});

router.get("/api/medications", async (ctx) => {
  try {
    const data = await loadData();
    ctx.response.body = {
      medications: data.medications ?? [],
    };
  } catch (error) {
    console.error("Fehler beim Laden der Daten:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Konnte Medikamentendaten nicht laden" };
  }
});


const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

console.log("MediManager Backend läuft auf http://localhost:8000");
await app.listen({ port: 8000 });

