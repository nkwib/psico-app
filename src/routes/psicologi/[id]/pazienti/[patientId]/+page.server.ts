import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  return {
    psychologistId: params.id,
    patientId: params.patientId
  };
};