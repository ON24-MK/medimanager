import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

const DATA_FILE = "./data/medications.json";

async function loadData() {
  const text = await Deno.readTextFile(DATA_FILE);
  return JSON.parse(text);
}

async function saveData(data: unknown) {
  const text = JSON.stringify(data, null, 2); // formatierte JSON
  await Deno.writeTextFile(DATA_FILE, text);
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

router.post("/api/medications", async (ctx) => {
  try {
    // Request-Body als JSON lesen
    const body = ctx.request.body({ type: "json" });
    const med = await body.value;

    // einfache Validierung
    if (!med.name || !med.dosage) {
      ctx.response.status = 400;
      ctx.response.body = { error: "name und dosage sind Pflichtfelder" };
      return;
    }

    const data = await loadData();

    const newMedication = {
      id: crypto.randomUUID(), // eindeutige ID
      name: med.name,
      dosage: med.dosage,
      times: med.times ?? [],   // z.B. ["morgens", "abends"]
    };

    data.medications.push(newMedication);
    await saveData(data);

    ctx.response.status = 201;
    ctx.response.body = newMedication;
  } catch (error) {
    console.error("Fehler beim Anlegen eines Medikaments:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Konnte Medikament nicht anlegen" };
  }
});



const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

console.log("MediManager Backend läuft auf http://localhost:8000");
await app.listen({ port: 8000 });

