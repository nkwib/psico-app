import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import type { Psychologist } from "$lib/utils/validation";

function createPsychologistStore() {
  const { subscribe, set, update } = writable<Psychologist[]>([]);

  // Load from localStorage on client
  if (browser) {
    const stored = localStorage.getItem("psychologists");
    if (stored) set(JSON.parse(stored));
  }

  return {
    subscribe,
    add: (psychologist: Omit<Psychologist, 'id' | 'dataCreazione'>) =>
      update((psychologists) => {
        const newId = Date.now();
        let newPsychologists = [...psychologists, {
          ...psychologist,
          id: newId,
          dataCreazione: new Date().toISOString()
        }];

        // If the new psychologist is marked as preferred, remove preferred status from others
        if (psychologist.isPreferito) {
          newPsychologists = newPsychologists.map((p) => ({
            ...p,
            isPreferito: p.id === newId
          }));
          if (browser) {
            localStorage.setItem("preferredPsychologist", newId.toString());
          }
        }

        if (browser)
          localStorage.setItem("psychologists", JSON.stringify(newPsychologists));
        return newPsychologists;
      }),
    remove: (id: number) =>
      update((psychologists) => {
        const filtered = psychologists.filter((p) => p.id !== id);
        if (browser) localStorage.setItem("psychologists", JSON.stringify(filtered));
        return filtered;
      }),
    update: (id: number, data: Partial<Psychologist>) =>
      update((psychologists) => {
        const updated = psychologists.map((p) =>
          p.id === id ? { ...p, ...data } : p
        );
        if (browser) localStorage.setItem("psychologists", JSON.stringify(updated));
        return updated;
      }),
    setPreferred: (id: number) =>
      update((psychologists) => {
        // Ensure only one psychologist is marked as preferred
        const updated = psychologists.map((p) => ({
          ...p,
          isPreferito: p.id === id
        }));
        if (browser) {
          localStorage.setItem("psychologists", JSON.stringify(updated));
          localStorage.setItem("preferredPsychologist", id.toString());
        }
        return updated;
      }),
    // Function to fix data inconsistencies
    fixPreferredStatus: () =>
      update((psychologists) => {
        // Find the first psychologist marked as preferred
        const preferred = psychologists.find(p => p.isPreferito);
        if (preferred) {
          // Ensure only this one is marked as preferred
          const updated = psychologists.map((p) => ({
            ...p,
            isPreferito: p.id === preferred.id
          }));
          if (browser) {
            localStorage.setItem("psychologists", JSON.stringify(updated));
            localStorage.setItem("preferredPsychologist", preferred.id?.toString() || '');
          }
          return updated;
        }
        return psychologists;
      }),
    clear: () => {
      set([]);
      if (browser) {
        localStorage.removeItem("psychologists");
        localStorage.removeItem("preferredPsychologist");
      }
    }
  };
}

export const psychologists = createPsychologistStore();

// Derived store for preferred psychologist
export const preferredPsychologist = derived(
  psychologists,
  ($psychologists) => $psychologists.find(p => p.isPreferito) || null
);