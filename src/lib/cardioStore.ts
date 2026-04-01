export interface CardioEntry {
  id: string;
  name: string;
  duration: number; // minutes
  distance?: number; // km
  calories?: number;
  date: string;
}

const STORAGE_KEY = "cardio_entries";

export function getCardioEntries(): CardioEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function saveCardioEntry(entry: CardioEntry) {
  const entries = getCardioEntries();
  entries.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function deleteCardioEntry(id: string) {
  const entries = getCardioEntries().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
