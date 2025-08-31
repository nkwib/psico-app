import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import type { Patient } from "$lib/utils/validation";

function createPatientStore() {
  const { subscribe, set, update } = writable<Patient[]>([]);

  // Load from localStorage on client
  if (browser) {
    const stored = localStorage.getItem("patients");
    if (stored) set(JSON.parse(stored));
  }

  return {
    subscribe,
    add: (patient: Omit<Patient, 'id' | 'dataCreazione'>) =>
      update((patients) => {
        const newPatients = [...patients, { 
          ...patient, 
          id: Date.now(),
          dataCreazione: new Date().toISOString()
        }];
        if (browser)
          localStorage.setItem("patients", JSON.stringify(newPatients));
        return newPatients;
      }),
    remove: (id: number) =>
      update((patients) => {
        const filtered = patients.filter((p) => p.id !== id);
        if (browser) localStorage.setItem("patients", JSON.stringify(filtered));
        return filtered;
      }),
    update: (id: number, data: Partial<Patient>) =>
      update((patients) => {
        const updated = patients.map((p) =>
          p.id === id ? { ...p, ...data } : p
        );
        if (browser) localStorage.setItem("patients", JSON.stringify(updated));
        return updated;
      }),
    clear: () => {
      set([]);
      if (browser) localStorage.removeItem("patients");
    }
  };
}

export const patients = createPatientStore();

// Search term store
export const searchTerm = writable("");

// Derived store for filtered patients
export const filteredPatients = derived(
  [patients, searchTerm],
  ([$patients, $searchTerm]) =>
    $patients.filter((patient) =>
      `${patient.nome} ${patient.cognome} ${patient.codiceFiscale}`
        .toLowerCase()
        .includes($searchTerm.toLowerCase())
    )
);