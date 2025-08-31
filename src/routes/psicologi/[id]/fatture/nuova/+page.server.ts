import { superValidate } from "sveltekit-superforms/server";
import { invoiceSchema } from "$lib/utils/validation";
import { zod } from "sveltekit-superforms/adapters";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
  const psychologistId = params.id;
  const patientId = url.searchParams.get('paziente');
  
  // Initialize with default values
  const defaultData = {
    idPaziente: patientId || '',
    idPsicologo: psychologistId, // Pre-set from URL
    numeroFattura: '',
    data: new Date().toISOString().split('T')[0],
    descrizione: 'Ci pregiamo rimetterVi fattura per prestazioni professionali relative a :',
    importo: 0,
    aliquotaIva: 0,
    note: ''
  };
  
  const form = await superValidate(defaultData, zod(invoiceSchema));
  
  return {
    form,
    psychologistId,
    preselectedPatientId: patientId
  };
};