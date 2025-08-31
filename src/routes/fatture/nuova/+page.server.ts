import { superValidate } from "sveltekit-superforms/server";
import { invoiceSchema } from "$lib/utils/validation";
import { zod } from "sveltekit-superforms/adapters";

export async function load() {
  // Initialize with default values
  const today = new Date().toISOString().split('T')[0];
  const year = new Date().getFullYear();
  const defaultData = {
    idPaziente: '',
    idPsicologo: '',
    numeroFattura: `${year}-0001`,
    data: today,
    descrizione: '',
    importo: 80,
    aliquotaIva: 0,
    note: ''
  };
  
  const form = await superValidate(defaultData, zod(invoiceSchema));
  
  return {
    form,
  };
}