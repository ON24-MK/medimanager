// backend/routes/dayOverview.ts

import type { Router } from "../deps.ts";
import { loadData, loadIntakes } from "../storage.ts";

export function registerDayOverviewRoutes(router: Router) {
  router.get("/api/day-overview", async (ctx) => {
    try {
      let date = ctx.request.url.searchParams.get("date");

      // Wenn kein Datum angegeben -> heutiges Datum (YYYY-MM-DD)
      if (!date) {
        date = new Date().toISOString().slice(0, 10);
      }

      const medsData = await loadData();
      const meds = medsData.medications ?? [];

      const intakeFile = await loadIntakes();
      const allIntakes = intakeFile.intakes ?? [];

      const intakesForDay = allIntakes.filter((i) => i.date === date);

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
      ctx.response.body = {
        error: "Konnte Tagesübersicht nicht berechnen",
      };
    }
  });
}