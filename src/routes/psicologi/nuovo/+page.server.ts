import { superValidate } from "sveltekit-superforms/server";
import { psychologistSchema } from "$lib/utils/validation";
import { zod } from "sveltekit-superforms/adapters";

export async function load() {
  // Initialize with default values
  const defaultData = {
    nome: '',
    cognome: '',
    codiceFiscale: '',
    partitaIva: '',
    indirizzo: '',
    telefono: '',
    email: '',
    numeroOrdine: '',
    isPreferito: false
  };
  
  const form = await superValidate(defaultData, zod(psychologistSchema));
  
  return {
    form,
  };
}