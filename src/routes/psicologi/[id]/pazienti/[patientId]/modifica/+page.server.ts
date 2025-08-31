import { superValidate } from "sveltekit-superforms/server";
import { patientSchema } from "$lib/utils/validation";
import { zod } from "sveltekit-superforms/adapters";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const psychologistId = params.id;
  const patientId = params.patientId;
  
  // Form will be populated client-side from localStorage
  const form = await superValidate(zod(patientSchema));
  
  return {
    form,
    psychologistId,
    patientId
  };
};