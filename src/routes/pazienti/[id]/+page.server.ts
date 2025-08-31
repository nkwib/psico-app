import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  // Validate that the ID parameter exists
  if (!params.id) {
    throw new Error('ID paziente mancante');
  }

  return {
    patientId: params.id
  };
};
