import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import type { Invoice, Patient, Psychologist } from "$lib/utils/validation";

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
          stato: invoice.stato || 'bozza'
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
    updateStatus: (id: number, stato: 'bozza' | 'emessa' | 'pagata') =>
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
      return `${year}-${String(nextNumber).padStart(4, '0')}`;
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
      sum + (i.importo * (1 + i.aliquotaIva / 100)), 0
    );

    return {
      total: $invoices.length,
      monthly: monthlyInvoices.length,
      revenue: totalRevenue,
      pending: $invoices.filter(i => i.stato === 'emessa').length,
      paid: $invoices.filter(i => i.stato === 'pagata').length
    };
  }
);