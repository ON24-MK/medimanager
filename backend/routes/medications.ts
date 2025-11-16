// backend/routes/medications.ts

import type { Router } from "../deps.ts";
import { loadData, saveData, type Medication } from "../storage.ts";

export function registerMedicationRoutes(router: Router) {
  // --- READ ALL ---
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

  // --- READ ONE ---
  router.get("/api/medications/:id", async (ctx) => {
    try {
      const id = ctx.params.id!;
      const data = await loadData();
      const med = (data.medications ?? []).find((m) => m.id === id);

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

  // --- CREATE ---
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

      const newMedication: Medication = {
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

  // --- UPDATE ---
  router.put("/api/medications/:id", async (ctx) => {
    try {
      const id = ctx.params.id!;
      const body = ctx.request.body({ type: "json" });
      const updates = await body.value;

      const data = await loadData();
      const meds = data.medications ?? [];
      const index = meds.findIndex((m) => m.id === id);

      if (index === -1) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Medikament nicht gefunden" };
        return;
      }

      const existing = meds[index];

      const updated: Medication = {
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

  // --- DELETE ---
  router.delete("/api/medications/:id", async (ctx) => {
    try {
      const id = ctx.params.id!;
      const data = await loadData();
      const meds = data.medications ?? [];

      const index = meds.findIndex((m) => m.id === id);

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
}

  