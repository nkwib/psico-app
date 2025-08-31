import { writable, derived, get } from "svelte/store";
import { browser } from "$app/environment";
import { psychologists } from "./psychologists";
import type { Psychologist } from "$lib/utils/validation";

// Create a store for the selected psychologist context
function createSelectedPsychologistStore() {
  const { subscribe, set, update } = writable<number | null>(null);

  // Load from localStorage on client
  if (browser) {
    const stored = localStorage.getItem("selectedPsychologistId");
    if (stored) {
      const id = parseInt(stored);
      // Verify the psychologist still exists
      const allPsychologists = get(psychologists);
      if (allPsychologists.find(p => p.id === id)) {
        set(id);
      } else {
        // Clean up invalid selection
        localStorage.removeItem("selectedPsychologistId");
      }
    }
  }

  return {
    subscribe,
    set: (id: number | null) => {
      if (browser) {
        if (id === null) {
          localStorage.removeItem("selectedPsychologistId");
        } else {
          localStorage.setItem("selectedPsychologistId", id.toString());
        }
      }
      set(id);
    },
    clear: () => {
      if (browser) {
        localStorage.removeItem("selectedPsychologistId");
      }
      set(null);
    }
  };
}

export const selectedPsychologistId = createSelectedPsychologistStore();

// Derived store for the actual selected psychologist object
export const selectedPsychologist = derived(
  [selectedPsychologistId, psychologists],
  ([$selectedId, $psychologists]) => {
    if ($selectedId === null) return null;
    return $psychologists.find(p => p.id === $selectedId) || null;
  }
);

// Helper to check if we're in "all psychologists" mode
export const isAllPsychologistsMode = derived(
  selectedPsychologistId,
  $id => $id === null
);