import { superValidate } from "sveltekit-superforms/server";
import { patientSchema } from "$lib/utils/validation";
import { zod } from "sveltekit-superforms/adapters";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const psychologistId = params.id;
  
  // Initialize with default values
  const defaultData = {
    nome: '',
    cognome: '',
    codiceFiscale: '',
    email: '',
    telefono: '',
    dataNascita: '',
    contattoEmergenza: {
      nome: '',
      telefono: '',
      parentela: ''
    },
    anamnesi: '',
    consensoTrattamentoDati: false
  };
  
  const form = await superValidate(defaultData, zod(patientSchema));
  
  return {
    form,
    psychologistId
  };
};