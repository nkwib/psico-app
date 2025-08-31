import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ params }) => {
  const psychologistId = params.id;
  
  // Validate that the ID is a number
  if (!psychologistId || isNaN(Number(psychologistId))) {
    throw error(404, 'Psicologo non trovato');
  }
  
  return {
    psychologistId
  };
};