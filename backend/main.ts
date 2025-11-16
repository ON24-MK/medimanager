import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";


const DATA_FILE = "./data/medications.json";
const INTAKES_FILE = "./data/intakes.json";
const USERS_FILE = "./data/users.json";

// mein Session-Speicher: man hat token und die userId
const sessions = new Map<string, string>();


interface Intake {
  id: string;
  medicationId: string;
  date: string;      // "YYYY-MM-DD"
  time?: string;     // z.B. "morgens"
  taken: boolean;
  notes?: string;
  createdAt: string; // ISO-Datum
}


async function loadData() {
 const text = await Deno.readTextFile(DATA_FILE);
 return JSON.parse(text);
}


async function saveData(data: unknown) {
 const text = JSON.stringify(data, null, 2);
 await Deno.writeTextFile(DATA_FILE, text);
}

async function loadUsers(): Promise<{ users: any[] }> {
  try {
    const text = await Deno.readTextFile(USERS_FILE);
    const parsed = JSON.parse(text);
    return {
      users: parsed.users ?? [],
    };
  } catch (_err) {
    return { users: [] };
  }
}

async function loadIntakes(): Promise<{ intakes: Intake[] }> {
  try {
    const text = await Deno.readTextFile(INTAKES_FILE);
    const parsed = JSON.parse(text);
    return {
      intakes: parsed.intakes ?? [],
    };
  } catch (_err) {
    // Datei existiert noch nicht oder ist ungültig
    return { intakes: [] };
  }
}
async function saveIntakes(data: { intakes: Intake[] }): Promise<void> {
  const text = JSON.stringify(data, null, 2);
  await Deno.writeTextFile(INTAKES_FILE, text);
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


// ---------- alle Medis lesen ----------
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


// ---------- ein Medi lesen ----------
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


// ---------- Medi anlegen ----------
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


// ---------- Medi aktualisieren ----------
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


// ---------- Medi löschen ----------
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

// ---------- Einnahme: CREATE (Einnahme protokollieren) ----------
router.post("/api/intakes", async (ctx) => {
  try {
    const body = ctx.request.body({ type: "json" });
    const intakeData = await body.value;

    if (!intakeData.medicationId || !intakeData.date) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "medicationId und date sind Pflichtfelder",
      };
      return;
    }

    // ---------- Einnahme: READ (optional nach Datum gefiltert) ----------
router.get("/api/intakes", async (ctx) => {
  try {
    const date = ctx.request.url.searchParams.get("date");

    const intakeFile = await loadIntakes();
    const allIntakes = intakeFile.intakes;

    let result = allIntakes;

    if (date) {
      result = allIntakes.filter((i) => i.date === date);
    }

    ctx.response.body = { intakes: result };
  } catch (error) {
    console.error("Fehler beim Laden von Intakes:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Konnte Intakes nicht laden" };
  }
});

    // Medikamente laden - Medikament existiert?
    const medsData = await loadData();
    const meds = medsData.medications ?? [];
    const medExists = meds.some((m: any) => m.id === intakeData.medicationId);

    if (!medExists) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Medikament existiert nicht" };
      return;
    }

    // Intakes laden
    const intakeFile = await loadIntakes();
    const allIntakes = intakeFile.intakes;

    const newIntake: Intake = {
      id: crypto.randomUUID(),
      medicationId: intakeData.medicationId,
      date: intakeData.date,          // "2025-11-16"
      time: intakeData.time ?? null,
      taken: intakeData.taken ?? true,
      notes: intakeData.notes ?? "",
      createdAt: new Date().toISOString(),
    };

    allIntakes.push(newIntake);

    await saveIntakes({ intakes: allIntakes });

    ctx.response.status = 201;
    ctx.response.body = newIntake;
  } catch (error) {
    console.error("Fehler beim Anlegen eines Intakes:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Konnte Intake nicht anlegen" };
  }
});

// ---------- Tagesübersicht: Medikamente + Intakes für einen Tag ----------
router.get("/api/day-overview", async (ctx) => {
  try {
    // Datum aus Query holen, z.B. /api/day-overview?date=2025-11-16
    let date = ctx.request.url.searchParams.get("date");

    // Wenn kein Datum angegeben ist -> heutiges Datum im Format YYYY-MM-DD
    if (!date) {
      date = new Date().toISOString().slice(0, 10);
    }

    // Medikamente laden
    const medsData = await loadData();
    const meds = medsData.medications ?? [];

    // Einnahme laden
    const intakeFile = await loadIntakes();
    const allIntakes = intakeFile.intakes ?? [];

    // Einnahme nur für dieses Datum
    const intakesForDay = allIntakes.filter((i: any) => i.date === date);

    // Übersicht pro Medikament 
    const overview = meds.map((med: any) => {
      const entries = intakesForDay.filter(
        (i: any) => i.medicationId === med.id,
      );

      return {
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        times: med.times ?? [],
        notes: med.notes ?? "",
        intakes: entries,
        taken: entries.some((i: any) => i.taken === true),
      };
    });

    ctx.response.body = {
      date,
      overview,
    };
  } catch (error) {
    console.error("Fehler bei der Tagesübersicht:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Konnte Tagesübersicht nicht berechnen" };
  }
});

// ---------- meine App starten ----------
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());


console.log("MediManager Backend läuft auf http://localhost:8000");
await app.listen({ port: 8000 });
