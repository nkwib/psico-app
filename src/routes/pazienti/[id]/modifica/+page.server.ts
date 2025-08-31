import { superValidate } from "sveltekit-superforms/server";
import { patientSchema } from "$lib/utils/validation";
import { zod } from "sveltekit-superforms/adapters";

export async function load({ params }) {
  // Validate that the ID parameter exists
  if (!params.id) {
    throw new Error('ID paziente mancante');
  }

  // Create an empty form - the client will populate it with patient data
  const form = await superValidate({}, zod(patientSchema));

  return {
    form,
    patientId: params.id
  };
}
