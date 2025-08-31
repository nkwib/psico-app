import { superValidate } from "sveltekit-superforms/server";
import { psychologistSchema } from "$lib/utils/validation";
import { zod } from "sveltekit-superforms/adapters";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const psychologistId = params.id;
  
  // For now, we'll return a form with the ID
  // The actual data will be loaded from the store on the client side
  const form = await superValidate(zod(psychologistSchema));
  
  return {
    form,
    psychologistId
  };
};