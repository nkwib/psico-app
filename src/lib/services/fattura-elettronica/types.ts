// Types for FatturaPA XML structure and electronic invoicing

export type ElectronicInvoiceStatus = 'pending' | 'sent' | 'accepted' | 'rejected' | 'delivered';

export interface SDIError {
  code: string;
  description: string;
  severity?: 'error' | 'warning';
}

export interface SDIHistoryEntry {
  date: string;
  status: ElectronicInvoiceStatus;
  note?: string;
  errors?: SDIError[];
}

export interface ElectronicInvoiceData {
  fatturazioneElettronica: boolean;
  xmlData?: string;
  xmlHash?: string;
  sdiId?: string;
  sdiStatus?: ElectronicInvoiceStatus;
  sdiErrors?: SDIError[];
  sdiHistory?: SDIHistoryEntry[];
  sdiSubmissionDate?: string;
  sdiLastCheck?: string;
}

// FatturaPA XML interfaces (simplified for key structures)
export interface FatturaPA {
  FatturaElettronica: {
    '@_versione': string;
    '@_xmlns': string;
    FatturaElettronicaHeader: FatturaElettronicaHeader;
    FatturaElettronicaBody: FatturaElettronicaBody;
  };
}

export interface FatturaElettronicaHeader {
  DatiTrasmissione: DatiTrasmissione;
  CedentePrestatore: CedentePrestatore;
  CessionarioCommittente: CessionarioCommittente;
}

export interface DatiTrasmissione {
  IdTrasmittente: {
    IdPaese: string;
    IdCodice: string;
  };
  ProgressivoInvio: string;
  FormatoTrasmissione: string;
  CodiceDestinatario?: string;
  PECDestinatario?: string;
}

export interface CedentePrestatore {
  DatiAnagrafici: {
    IdFiscaleIVA: {
      IdPaese: string;
      IdCodice: string;
    };
    CodiceFiscale?: string;
    Anagrafica: {
      Denominazione?: string;
      Nome?: string;
      Cognome?: string;
      Titolo?: string;
    };
    RegimeFiscale: string;
  };
  Sede: {
    Indirizzo: string;
    CAP: string;
    Comune: string;
    Provincia: string;
    Nazione: string;
  };
  IscrizioneREA?: {
    Ufficio: string;
    NumeroREA: string;
  };
  Contatti?: {
    Telefono?: string;
    Email?: string;
    PEC?: string;
  };
}

export interface CessionarioCommittente {
  DatiAnagrafici: {
    CodiceFiscale: string;
    Anagrafica: {
      Denominazione?: string;
      Nome?: string;
      Cognome?: string;
    };
  };
  Sede?: {
    Indirizzo: string;
    CAP: string;
    Comune: string;
    Provincia: string;
    Nazione: string;
  };
}

export interface FatturaElettronicaBody {
  DatiGenerali: {
    DatiGeneraliDocumento: {
      TipoDocumento: string;
      Divisa: string;
      Data: string;
      Numero: string;
      ImportoTotaleDocumento: string;
      Causale?: string[];
    };
  };
  DatiBeniServizi: {
    DettaglioLinee: DettaglioLinea[];
    DatiRiepilogo: DatiRiepilogo[];
  };
}

export interface DettaglioLinea {
  NumeroLinea: number;
  Descrizione: string;
  Quantita?: string;
  PrezzoUnitario: string;
  PrezzoTotale: string;
  AliquotaIVA: string;
  Natura?: string; // For VAT exempt items
}

export interface DatiRiepilogo {
  AliquotaIVA: string;
  Natura?: string;
  ImponibileImporto: string;
  Imposta: string;
  EsigibilitaIVA?: string;
  RiferimentoNormativo?: string | null;
}

// Regime fiscale codes for FatturaPA
export const REGIME_FISCALE_CODES = {
  RF01: 'Regime ordinario',
  RF02: 'Regime dei contribuenti minimi',
  RF04: 'Regime forfettario (art. 1, c. 54-89 L. 190/2014)',
  RF05: 'Regime delle nuove iniziative produttive',
  RF16: 'Regime forfettario con sconto'
} as const;

// VAT nature codes (Natura IVA)
export const VAT_NATURE_CODES = {
  N1: 'Escluse ex art. 15',
  N2: 'Non soggette',
  N3: 'Non imponibili',
  N4: 'Esenti',
  N5: 'Regime del margine/IVA non esposta',
  N6: 'Inversione contabile',
  N7: 'IVA assolta in altro stato UE'
} as const;

// Document type codes
export const DOCUMENT_TYPE_CODES = {
  TD01: 'Fattura',
  TD02: 'Acconto/anticipo su fattura',
  TD03: 'Acconto/anticipo su parcella',
  TD04: 'Nota di credito',
  TD05: 'Nota di debito',
  TD06: 'Parcella'
} as const;