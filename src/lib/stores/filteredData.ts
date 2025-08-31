import { derived } from "svelte/store";
import { patients } from "./patients";
import { invoices } from "./invoices";
import { selectedPsychologistId, isAllPsychologistsMode } from "./selectedPsychologist";
import type { Patient } from "$lib/utils/validation";
import type { InvoiceWithDetails } from "./invoices";

// Patients filtered by selected psychologist (based on invoice history)
export const patientsForSelectedPsychologist = derived(
  [patients, invoices, selectedPsychologistId, isAllPsychologistsMode],
  ([$patients, $invoices, $selectedId, $isAllMode]) => {
    if ($isAllMode) {
      // Return all patients if no psychologist is selected
      return $patients;
    }

    // Get unique patient IDs from invoices for the selected psychologist
    const patientIds = new Set(
      $invoices
        .filter(invoice => parseInt(invoice.idPsicologo) === $selectedId)
        .map(invoice => parseInt(invoice.idPaziente))
    );

    // Return patients who have had invoices with the selected psychologist
    return $patients.filter(patient => 
      patient.id && patientIds.has(patient.id)
    );
  }
);

// Count of sessions each patient had with the selected psychologist
export const patientSessionCounts = derived(
  [invoices, selectedPsychologistId],
  ([$invoices, $selectedId]) => {
    const counts = new Map<number, number>();
    
    if ($selectedId === null) {
      // Count all sessions per patient
      $invoices.forEach(invoice => {
        const patientId = parseInt(invoice.idPaziente);
        counts.set(patientId, (counts.get(patientId) || 0) + 1);
      });
    } else {
      // Count sessions with selected psychologist
      $invoices
        .filter(invoice => parseInt(invoice.idPsicologo) === $selectedId)
        .forEach(invoice => {
          const patientId = parseInt(invoice.idPaziente);
          counts.set(patientId, (counts.get(patientId) || 0) + 1);
        });
    }
    
    return counts;
  }
);

// Invoices filtered by selected psychologist
export const invoicesForSelectedPsychologist = derived(
  [invoices, selectedPsychologistId, isAllPsychologistsMode],
  ([$invoices, $selectedId, $isAllMode]) => {
    if ($isAllMode) {
      return $invoices;
    }
    
    return $invoices.filter(invoice => 
      parseInt(invoice.idPsicologo) === $selectedId
    );
  }
);

// Statistics for the selected psychologist
export const selectedPsychologistStats = derived(
  [invoicesForSelectedPsychologist],
  ([$filteredInvoices]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyInvoices = $filteredInvoices.filter(i => {
      const invoiceDate = new Date(i.data);
      return invoiceDate.getMonth() === currentMonth &&
        invoiceDate.getFullYear() === currentYear;
    });

    const totalRevenue = monthlyInvoices.reduce((sum, i) =>
      sum + i.importo, 0
    );

    return {
      total: $filteredInvoices.length,
      monthly: monthlyInvoices.length,
      revenue: totalRevenue,
      pending: $filteredInvoices.filter(i => i.stato === 'emessa').length,
      paid: $filteredInvoices.filter(i => i.stato === 'pagata').length,
      patients: new Set($filteredInvoices.map(i => i.idPaziente)).size
    };
  }
);