export interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  notes?: string;
}

export interface Intake {
  id: string;
  medicationId: string;
  medicationName?: string;  // NEU: Name einfrieren
  date: string;             // "YYYY-MM-DD"
  time?: string;            // z.B. "morgens"
  taken: boolean;
  notes?: string;
  createdAt: string;        // ISO-String
}

export interface User {
  id: string;
  username: string;
  password: string; // für die Übung im Klartext
}

// --- Dateipfade ---

const MEDICATIONS_FILE = "./data/medications.json";
const INTAKES_FILE = "./data/intakes.json";
const USERS_FILE = "./data/users.json";

// --- Medikamente laden/speichern ---

export async function loadData(): Promise<{ medications: Medication[] }> {
  try {
    const text = await Deno.readTextFile(MEDICATIONS_FILE);
    const parsed = JSON.parse(text);
    return {
      medications: parsed.medications ?? [],
    };
  } catch (_err) {
    return { medications: [] };
  }
}

export async function saveData(data: { medications: Medication[] }): Promise<void> {
  const text = JSON.stringify(data, null, 2);
  await Deno.writeTextFile(MEDICATIONS_FILE, text);
}

// --- Intakes laden/speichern ---

export async function loadIntakes(): Promise<{ intakes: Intake[] }> {
  try {
    const text = await Deno.readTextFile(INTAKES_FILE);
    const parsed = JSON.parse(text);
    return {
      intakes: parsed.intakes ?? [],
    };
  } catch (_err) {
    return { intakes: [] };
  }
}

export async function saveIntakes(data: { intakes: Intake[] }): Promise<void> {
  const text = JSON.stringify(data, null, 2);
  await Deno.writeTextFile(INTAKES_FILE, text);
}

// --- User laden ---

export async function loadUsers(): Promise<{ users: User[] }> {
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