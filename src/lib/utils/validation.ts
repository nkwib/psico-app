import { z } from "zod";

// Validazione Codice Fiscale italiano
const codiceFiscaleRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;

// Validazione Partita IVA italiana
const partitaIvaRegex = /^[0-9]{11}$/;



// Schema per Psicologo
export const psychologistSchema = z.object({
  nome: z.string().min(2, 'Il nome deve essere di almeno 2 caratteri'),
  cognome: z.string().min(2, 'Il cognome deve essere di almeno 2 caratteri'),
  sesso: z.enum(['M', 'F']).optional(), // Per determinare Dott. o Dott.ssa
  codiceFiscale: z
    .string()
    .regex(codiceFiscaleRegex, 'Formato del codice fiscale non valido'),
  partitaIva: z
    .string()
    .regex(partitaIvaRegex, 'Formato della partita IVA non valido'),
  indirizzo: z.string().min(5, 'Indirizzo obbligatorio'),
  cap: z.string().regex(/^[0-9]{5}$/, 'CAP deve essere di 5 cifre').optional(),
  citta: z.string().min(2, 'Città obbligatoria').optional(),
  provincia: z.string().length(2, 'Provincia deve essere di 2 caratteri').optional(),
  telefono: z
    .string()
    .regex(/^\+?[\d\s-()]{10,}$/, 'Numero di telefono non valido'),
  email: z.string().email('Formato email non valido'),
  numeroOrdine: z
    .string()
    .min(1, "Numero di iscrizione all'Ordine degli Psicologi")
    .optional(),
  regioneOrdine: z.string().optional(), // es. "Lazio", "Lombardia"
  pec: z.string().email('Formato PEC non valido').optional(),
  codiceUnivoco: z.string().optional(), // Per fatturazione elettronica
  isPreferito: z.boolean().optional(),

  // Fatturazione elettronica
  fatturaElettronicaAbilitata: z.boolean().optional().default(false),
  pecFatturazione: z.string().email('Formato PEC non valido').optional(), // PEC per fatturazione elettronica
  codiceDestinatario: z.string().length(7, 'Il codice destinatario deve essere di 7 caratteri').optional(), // Per B2B
  regimeFiscale: z.enum(['forfettario', 'ordinario', 'minimi']).optional().default('forfettario'),
});

// Schema per Paziente
export const patientSchema = z.object({
  nome: z.string().min(2, 'Il nome deve essere di almeno 2 caratteri'),
  cognome: z.string().min(2, 'Il cognome deve essere di almeno 2 caratteri'),
  codiceFiscale: z
    .string()
    .regex(codiceFiscaleRegex, 'Formato del codice fiscale non valido'),
  dataNascita: z.string().min(1, 'Data di nascita obbligatoria'),
  luogoNascita: z.string().optional(),
  indirizzo: z.string().optional(),
  cap: z.string().regex(/^[0-9]{5}$/, 'CAP deve essere di 5 cifre').optional(),
  citta: z.string().optional(),
  provincia: z.string().length(2, 'Provincia deve essere di 2 caratteri').optional(),
  telefono: z
    .string()
    .regex(/^\+?[\d\s-()]{10,}$/, 'Numero di telefono non valido')
    .optional(),
  email: z.string().email('Formato email non valido').optional(),
  contattoEmergenza: z.object({
    nome: z.string().min(2, 'Nome del contatto di emergenza obbligatorio'),
    telefono: z.string().min(10, 'Telefono del contatto di emergenza obbligatorio'),
    parentela: z.string().min(1, 'Parentela obbligatoria'),
  }),
  anamnesi: z.string().optional(),
  farmaci: z
    .array(
      z.object({
        nome: z.string(),
        dosaggio: z.string(),
        frequenza: z.string(),
      })
    )
    .optional(),
  note: z.string().optional(),
  consensoTrattamentoDati: z
    .boolean()
    .refine(val => val === true, 'Il consenso al trattamento dati è obbligatorio'),
  dataConsenso: z.string().optional(),
  // Pricing preferences for invoices
  prezziPreferiti: z.object({
    importo: z.number().positive().optional(),
    aliquotaIva: z.number().min(0).max(100).optional(),
    prezzoIncludeIva: z.boolean().optional(),
  }).optional(),

  // Fatturazione elettronica
  codiceDestinatario: z.string().length(7, 'Il codice destinatario deve essere di 7 caratteri').optional(), // Per B2B
  pec: z.string().email('Formato PEC non valido').optional(), // PEC per fatturazione elettronica B2C
});

// Schema per Fattura/Parcella
export const invoiceSchema = z.object({
  idPaziente: z.string().min(1, 'Selezione paziente obbligatoria'),
  idPsicologo: z.string().min(1, 'Selezione psicologo obbligatoria'),
  numeroFattura: z.string().min(1, 'Numero parcella obbligatorio'),
  data: z.string().min(1, 'Data obbligatoria'),

  // Descrizione prestazione
  descrizione: z.string().optional().default('Ci pregiamo rimetterVi fattura per prestazioni professionali relative a :'),
  dettaglioSedute: z.boolean().optional().default(true),
  numeroSedute: z.number().min(1).optional().default(1),
  tipoPrestazione: z.enum([
    'sostegno_psicologico',
    'psicoterapia',
    'consulenza',
    'valutazione_psicodiagnostica',
    'relazione_psicologica',
    'altro'
  ]).optional().default('sostegno_psicologico'),

  // Importi
  importo: z.number().min(0.01, "L'importo deve essere maggiore di 0"),
  aliquotaIva: z.number().min(0).max(100, "L'aliquota IVA deve essere tra 0-100%"),
  speseAnticipate: z.number().min(0).optional().default(0),

  // Note e opzioni
  note: z.string().optional(),
  mostraPrivacy: z.boolean().optional().default(false), // Oscura dati sensibili

  // Modalità pagamento
  modalitaPagamento: z.enum([
    'contanti',
    'bonifico',
    'assegno',
    'carta',
    'altro'
  ]).optional().default('bonifico'),

  // Stato fattura
  stato: z.enum(['emessa', 'pagata', 'annullata']).optional().default('emessa'),
  dataPagamento: z.string().optional(),

  // Regime fiscale
  regimeFiscale: z.enum([
    'forfettario', // Art. 1, c. 54-89 L. 190/2014
    'ordinario',
    'minimi'
  ]).optional().default('forfettario'),

  // Marca da bollo
  marcaDaBollo: z.boolean().optional().default(false), // Per importi > 77,47€ in regime forfettario
  importoMarcaDaBollo: z.number().optional().default(2.00),

  // Fatturazione elettronica
  fatturazioneElettronica: z.boolean().optional().default(false),
  xmlData: z.string().optional(), // Cached FatturaPA XML
  xmlHash: z.string().optional(), // Hash of XML for integrity check
  sdiId: z.string().optional(), // Sistema di Interscambio ID
  sdiStatus: z.enum(['pending', 'sent', 'accepted', 'rejected', 'delivered']).optional(),
  sdiErrors: z.array(z.object({
    code: z.string(),
    description: z.string(),
    severity: z.enum(['error', 'warning']).optional()
  })).optional(),
  sdiHistory: z.array(z.object({
    date: z.string(),
    status: z.enum(['pending', 'sent', 'accepted', 'rejected', 'delivered']),
    note: z.string().optional(),
    errors: z.array(z.object({
      code: z.string(),
      description: z.string(),
      severity: z.enum(['error', 'warning']).optional()
    })).optional()
  })).optional(),
  sdiSubmissionDate: z.string().optional(),
  sdiLastCheck: z.string().optional(),
  uploadFilename: z.string().optional(), // Aruba upload filename
});

// Schema per impostazioni studio
export const studioSettingsSchema = z.object({
  nomeStudio: z.string().optional(),
  logoUrl: z.string().url().optional(),

  // Dati fiscali predefiniti
  aliquotaENPAP: z.number().min(0).max(100).default(2), // Contributo ENPAP standard 2%
  esenzIVA: z.boolean().default(true), // Esente IVA per regime forfettario
  articoloEsenzione: z.string().default("art. 1, comma da 54 a 89 della legge 190/2014"),

  // Formato numerazione fatture
  formatoNumeroFattura: z.enum([
    'progressivo/anno', // es. 1/2024
    'anno-progressivo', // es. 2024-001
    'progressivo'      // es. 001
  ]).default('progressivo/anno'),

  // Testi predefiniti
  intestazioneFattura: z.string().optional(),
  piePaginaFattura: z.string().optional(),

  // Preferenze
  includiNumeroOrdine: z.boolean().default(true),
  includiPEC: z.boolean().default(false),
  includiCodiceUnivoco: z.boolean().default(false),
});

// Schema per backup/export
export const backupSchema = z.object({
  versione: z.string(),
  dataBackup: z.string(),
  psicologi: z.array(psychologistSchema),
  pazienti: z.array(patientSchema),
  fatture: z.array(invoiceSchema),
  impostazioni: studioSettingsSchema.optional(),
  psicologoPreferito: z.string().optional(),
});

// Helper per validazione Codice Fiscale completa
export function validaCodiceFiscaleCompleto(cf: string) {
  if (!codiceFiscaleRegex.test(cf.toUpperCase())) {
    return false;
  }

  // Qui potresti aggiungere l'algoritmo completo di validazione del CF
  // che verifica anche il carattere di controllo
  return true;
}

// Helper per validazione Partita IVA completa  
export function validaPartitaIvaCompleta(piva: string) {
  if (!partitaIvaRegex.test(piva)) {
    return false;
  }

  // Algoritmo di controllo partita IVA
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let digit = parseInt(piva[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(piva[10]);
}

// Export types
export type PatientSchema = typeof patientSchema;
export type PsychologistSchema = typeof psychologistSchema;
export type InvoiceSchema = typeof invoiceSchema;
export type StudioSettingsSchema = typeof studioSettingsSchema;
export type BackupSchema = typeof backupSchema;

export type Patient = z.infer<typeof patientSchema> & {
  id?: number;
  dataCreazione?: string;
};

export type Psychologist = z.infer<typeof psychologistSchema> & {
  id?: number;
  dataCreazione?: string;
};

export type Invoice = z.infer<typeof invoiceSchema> & {
  id?: number;
  dataCreazione?: string;
  stato?: 'emessa' | 'pagata' | 'annullata';
};