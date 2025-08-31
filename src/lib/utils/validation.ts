import { z } from "zod";

// Validazione Codice Fiscale italiano
const codiceFiscaleRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;

// Validazione Partita IVA italiana
const partitaIvaRegex = /^[0-9]{11}$/;

export const patientSchema = z.object({
  nome: z.string().min(2, "Il nome deve essere di almeno 2 caratteri"),
  cognome: z.string().min(2, "Il cognome deve essere di almeno 2 caratteri"),
  codiceFiscale: z
    .string()
    .regex(codiceFiscaleRegex, "Formato del codice fiscale non valido"),
  email: z.string().email("Formato email non valido").optional(),
  telefono: z
    .string()
    .regex(/^\+?[\d\s-()]{10,}$/, "Numero di telefono non valido")
    .optional(),
  dataNascita: z.string().min(1, "Data di nascita obbligatoria"),
  contattoEmergenza: z.object({
    nome: z.string().min(2, "Nome del contatto di emergenza obbligatorio"),
    telefono: z
      .string()
      .min(10, "Telefono del contatto di emergenza obbligatorio"),
    parentela: z.string().min(1, "Parentela obbligatoria"),
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
  consensoTrattamentoDati: z
    .boolean()
    .refine(
      (val) => val === true,
      "Il consenso al trattamento dati è obbligatorio"
    ),
});

export const psychologistSchema = z.object({
  nome: z.string().min(2, "Il nome deve essere di almeno 2 caratteri"),
  cognome: z.string().min(2, "Il cognome deve essere di almeno 2 caratteri"),
  codiceFiscale: z
    .string()
    .regex(codiceFiscaleRegex, "Formato del codice fiscale non valido"),
  partitaIva: z
    .string()
    .regex(partitaIvaRegex, "Formato della partita IVA non valido"),
  indirizzo: z.string().min(5, "Indirizzo obbligatorio"),
  telefono: z
    .string()
    .regex(/^\+?[\d\s-()]{10,}$/, "Numero di telefono non valido"),
  email: z.string().email("Formato email non valido"),
  numeroOrdine: z
    .string()
    .min(1, "Numero di iscrizione all'Ordine degli Psicologi obbligatorio")
    .optional(),
  isPreferito: z.boolean().optional(),
});

export const invoiceSchema = z.object({
  idPaziente: z.string().min(1, "Selezione paziente obbligatoria"),
  idPsicologo: z.string().min(1, "Selezione psicologo obbligatoria"),
  numeroFattura: z.string().min(1, "Numero fattura obbligatorio"),
  data: z.string().min(1, "Data obbligatoria"),
  descrizione: z.string().min(5, "Descrizione del servizio obbligatoria"),
  importo: z.number().min(0.01, "L'importo deve essere maggiore di 0"),
  aliquotaIva: z
    .number()
    .min(0)
    .max(100, "L'aliquota IVA deve essere tra 0-100%"),
  note: z.string().optional(),
});

export type PatientSchema = typeof patientSchema;
export type PsychologistSchema = typeof psychologistSchema;
export type InvoiceSchema = typeof invoiceSchema;

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
  stato?: 'bozza' | 'emessa' | 'pagata';
};