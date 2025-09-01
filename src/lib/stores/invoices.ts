import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import type { Invoice, Patient, Psychologist } from "$lib/utils/validation";
import type { ElectronicInvoiceStatus, SDIError, SDIHistoryEntry } from "$lib/services/fattura-elettronica/types";

export interface InvoiceWithDetails extends Invoice {
  paziente?: Patient;
  psicologo?: Psychologist;
}

function createInvoiceStore() {
  const { subscribe, set, update } = writable<InvoiceWithDetails[]>([]);

  // Load from localStorage on client
  if (browser) {
    const stored = localStorage.getItem("invoices");
    if (stored) set(JSON.parse(stored));
  }

  return {
    subscribe,
    add: (invoice: Omit<InvoiceWithDetails, 'id' | 'dataCreazione'>) =>
      update((invoices) => {
        const newInvoices = [...invoices, {
          ...invoice,
          id: Date.now(),
          dataCreazione: new Date().toISOString(),
          stato: invoice.stato || 'emessa'
        }];
        if (browser)
          localStorage.setItem("invoices", JSON.stringify(newInvoices));
        return newInvoices;
      }),
    remove: (id: number) =>
      update((invoices) => {
        const filtered = invoices.filter((i) => i.id !== id);
        if (browser) localStorage.setItem("invoices", JSON.stringify(filtered));
        return filtered;
      }),
    update: (id: number, data: Partial<InvoiceWithDetails>) =>
      update((invoices) => {
        const updated = invoices.map((i) =>
          i.id === id ? { ...i, ...data } : i
        );
        if (browser) localStorage.setItem("invoices", JSON.stringify(updated));
        return updated;
      }),
    updateStatus: (id: number, stato: 'emessa' | 'pagata' | 'annullata') =>
      update((invoices) => {
        const updated = invoices.map((i) =>
          i.id === id ? { ...i, stato } : i
        );
        if (browser) localStorage.setItem("invoices", JSON.stringify(updated));
        return updated;
      }),
    clear: () => {
      set([]);
      if (browser) localStorage.removeItem("invoices");
    },
    getNextInvoiceNumber: () => {
      const year = new Date().getFullYear();
      const stored = browser ? localStorage.getItem("invoices") : null;
      const invoices = stored ? JSON.parse(stored) : [];
      const currentYearInvoices = invoices.filter((i: InvoiceWithDetails) =>
        i.numeroFattura?.includes(year.toString())
      );
      const nextNumber = currentYearInvoices.length + 1;
      return `${nextNumber}/${year}`;
    },
    
    // Electronic invoicing specific methods
    updateElectronicStatus: (id: number, status: ElectronicInvoiceStatus, errors?: SDIError[], sdiId?: string) =>
      update((invoices) => {
        const updated = invoices.map((i) => {
          if (i.id === id) {
            const historyEntry: SDIHistoryEntry = {
              date: new Date().toISOString(),
              status,
              errors
            };
            
            return {
              ...i,
              sdiStatus: status,
              sdiErrors: errors || [],
              sdiHistory: [...(i.sdiHistory || []), historyEntry],
              sdiLastCheck: new Date().toISOString(),
              ...(sdiId && { sdiId })
            };
          }
          return i;
        });
        if (browser) localStorage.setItem("invoices", JSON.stringify(updated));
        return updated;
      }),
    
    updateXMLData: (id: number, xmlData: string, xmlHash: string, uploadFilename?: string) =>
      update((invoices) => {
        const updated = invoices.map((i) =>
          i.id === id ? { 
            ...i, 
            xmlData, 
            xmlHash, 
            ...(uploadFilename && { uploadFilename })
          } : i
        );
        if (browser) localStorage.setItem("invoices", JSON.stringify(updated));
        return updated;
      }),
    
    markAsSentToSDI: (id: number, uploadFilename: string) =>
      update((invoices) => {
        const updated = invoices.map((i) => {
          if (i.id === id) {
            const historyEntry: SDIHistoryEntry = {
              date: new Date().toISOString(),
              status: 'sent',
              note: 'Inviata al Sistema di Interscambio tramite Aruba'
            };
            
            return {
              ...i,
              sdiStatus: 'sent' as const,
              uploadFilename,
              sdiSubmissionDate: new Date().toISOString(),
              sdiHistory: [...(i.sdiHistory || []), historyEntry],
              sdiLastCheck: new Date().toISOString()
            };
          }
          return i;
        });
        if (browser) localStorage.setItem("invoices", JSON.stringify(updated));
        return updated;
      }),
    
    getElectronicInvoices: () => {
      const stored = browser ? localStorage.getItem("invoices") : null;
      const allInvoices = stored ? JSON.parse(stored) : [];
      return allInvoices.filter((i: InvoiceWithDetails) => i.fatturazioneElettronica === true);
    },
    
    getPendingElectronicInvoices: () => {
      const stored = browser ? localStorage.getItem("invoices") : null;
      const allInvoices = stored ? JSON.parse(stored) : [];
      return allInvoices.filter((i: InvoiceWithDetails) => 
        i.fatturazioneElettronica === true && 
        (!i.sdiStatus || i.sdiStatus === 'pending')
      );
    }
  };
}

export const invoices = createInvoiceStore();

// Derived stores for statistics
export const invoiceStats = derived(
  invoices,
  ($invoices) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyInvoices = $invoices.filter(i => {
      const invoiceDate = new Date(i.data);
      return invoiceDate.getMonth() === currentMonth &&
        invoiceDate.getFullYear() === currentYear;
    });

    const totalRevenue = monthlyInvoices.reduce((sum, i) =>
      sum + i.importo, 0
    );

    const electronicInvoices = $invoices.filter(i => i.fatturazioneElettronica === true);
    const monthlyElectronicInvoices = monthlyInvoices.filter(i => i.fatturazioneElettronica === true);

    return {
      total: $invoices.length,
      monthly: monthlyInvoices.length,
      revenue: totalRevenue,
      pending: $invoices.filter(i => i.stato === 'emessa').length,
      paid: $invoices.filter(i => i.stato === 'pagata').length,
      // Electronic invoicing statistics
      electronic: {
        total: electronicInvoices.length,
        monthly: monthlyElectronicInvoices.length,
        pending: electronicInvoices.filter(i => !i.sdiStatus || i.sdiStatus === 'pending').length,
        sent: electronicInvoices.filter(i => i.sdiStatus === 'sent').length,
        accepted: electronicInvoices.filter(i => i.sdiStatus === 'accepted').length,
        delivered: electronicInvoices.filter(i => i.sdiStatus === 'delivered').length,
        rejected: electronicInvoices.filter(i => i.sdiStatus === 'rejected').length,
        withErrors: electronicInvoices.filter(i => i.sdiErrors && i.sdiErrors.length > 0).length
      }
    };
  }
);