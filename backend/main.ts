import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";


const DATA_FILE = "./data/medications.json";


async function loadData() {
 const text = await Deno.readTextFile(DATA_FILE);
 return JSON.parse(text);
}


async function saveData(data: unknown) {
 const text = JSON.stringify(data, null, 2);
 await Deno.writeTextFile(DATA_FILE, text);
}


// Router anlegen
const router = new Router();


// ---------- Health-Check ----------
router.get("/api/health", (ctx) => {
 ctx.response.body = {
   status: "ok",
   app: "MediManager",
 };
});


// ---------- Medikamente: READ ALL ----------
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


// ---------- Medikamente: READ ONE ----------
router.get("/api/medications/:id", async (ctx) => {
 try {
   const id = ctx.params.id!;
   const data = await loadData();
   const med = (data.medications ?? []).find((m: any) => m.id === id);


   if (!med) {
     ctx.response.status = 404;
     ctx.response.body = { error: "Medikament nicht gefunden" };
     return;
   }


   ctx.response.body = med;
 } catch (error) {
   console.error("Fehler beim Laden eines Medikaments:", error);
   ctx.response.status = 500;
   ctx.response.body = { error: "Konnte Medikament nicht laden" };
 }
});


// ---------- Medikamente: CREATE ----------
router.post("/api/medications", async (ctx) => {
 try {
   const body = ctx.request.body({ type: "json" });
   const med = await body.value;


   if (!med.name || !med.dosage) {
     ctx.response.status = 400;
     ctx.response.body = { error: "name und dosage sind Pflichtfelder" };
     return;
   }


   const data = await loadData();


   const newMedication = {
     id: crypto.randomUUID(),
     name: med.name,
     dosage: med.dosage,
     times: med.times ?? [],
     notes: med.notes ?? "",
   };


   data.medications = data.medications ?? [];
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


// ---------- Medikamente: UPDATE ----------
router.put("/api/medications/:id", async (ctx) => {
 try {
   const id = ctx.params.id!;
   const body = ctx.request.body({ type: "json" });
   const updates = await body.value;


   const data = await loadData();
   const meds = data.medications ?? [];
   const index = meds.findIndex((m: any) => m.id === id);


   if (index === -1) {
     ctx.response.status = 404;
     ctx.response.body = { error: "Medikament nicht gefunden" };
     return;
   }


   const existing = meds[index];


   const updated = {
     ...existing,
     name: updates.name ?? existing.name,
     dosage: updates.dosage ?? existing.dosage,
     times: updates.times ?? existing.times,
     notes: updates.notes ?? existing.notes,
   };


   meds[index] = updated;
   data.medications = meds;
   await saveData(data);


   ctx.response.body = updated;
 } catch (error) {
   console.error("Fehler beim Aktualisieren eines Medikaments:", error);
   ctx.response.status = 500;
   ctx.response.body = { error: "Konnte Medikament nicht aktualisieren" };
 }
});


// ---------- Medikamente: DELETE ----------
router.delete("/api/medications/:id", async (ctx) => {
 try {
   const id = ctx.params.id!;
   const data = await loadData();
   const meds = data.medications ?? [];


   const index = meds.findIndex((m: any) => m.id === id);


   if (index === -1) {
     ctx.response.status = 404;
     ctx.response.body = { error: "Medikament nicht gefunden" };
     return;
   }


   const removed = meds[index];
   meds.splice(index, 1);
   data.medications = meds;
   await saveData(data);


   ctx.response.body = removed;
 } catch (error) {
   console.error("Fehler beim Löschen eines Medikaments:", error);
   ctx.response.status = 500;
   ctx.response.body = { error: "Konnte Medikament nicht löschen" };
 }
});


// ---------- App starten ----------
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());


console.log("MediManager Backend läuft auf http://localhost:8000");
await app.listen({ port: 8000 });
