// backend/routes/intakes.ts

import type { Router } from "../deps.ts";
import {
  loadData,
  loadIntakes,
  saveIntakes,
  type Intake,
} from "../storage.ts";

export function registerIntakeRoutes(router: Router) {
  // --- CREATE Intake (Einnahme dokumentieren) ---
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

      // prüfen: Medikament existiert + Name holen
      const medsData = await loadData();
      const meds = medsData.medications ?? [];
      const med = meds.find((m) => m.id === intakeData.medicationId);

      if (!med) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Medikament existiert nicht" };
        return;
      }

      const intakeFile = await loadIntakes();
      const allIntakes = intakeFile.intakes ?? [];

      const newIntake: Intake = {
        id: crypto.randomUUID(),
        medicationId: intakeData.medicationId,
        medicationName: med.name,        // 🔥 Name einfrieren
        date: intakeData.date,           // "YYYY-MM-DD"
        time: intakeData.time ?? null,   // z.B. "morgens"
        taken: intakeData.taken ?? true, // Standard: true
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

  // --- READ Intakes (optional mit Datum-Filter) ---
  router.get("/api/intakes", async (ctx) => {
    try {
      const date = ctx.request.url.searchParams.get("date");
      const intakeFile = await loadIntakes();
      const allIntakes = intakeFile.intakes ?? [];

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
}


