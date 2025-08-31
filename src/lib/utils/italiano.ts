export const formattatoreData = new Intl.DateTimeFormat("it-IT", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const formattatoreValuta = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export const formattatoreNumero = new Intl.NumberFormat("it-IT");

export const validaCodiceFiscale = (cf: string): boolean => {
  // Implementazione validazione codice fiscale italiano
  const regex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  return regex.test(cf.toUpperCase());
};

export const validaPartitaIva = (piva: string): boolean => {
  // Implementazione validazione partita IVA italiana
  const regex = /^[0-9]{11}$/;
  if (!regex.test(piva)) return false;

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
};

export const etichette = {
  // Etichette comuni dell'applicazione
  paziente: "Paziente",
  pazienti: "Pazienti",
  psicologo: "Psicologo",
  psicologi: "Psicologi",
  fattura: "Fattura",
  fatture: "Fatture",
  nome: "Nome",
  cognome: "Cognome",
  codiceFiscale: "Codice Fiscale",
  partitaIva: "Partita IVA",
  telefono: "Telefono",
  email: "Email",
  indirizzo: "Indirizzo",
  data: "Data",
  importo: "Importo",
  descrizione: "Descrizione",
  note: "Note",
  salva: "Salva",
  annulla: "Annulla",
  elimina: "Elimina",
  modifica: "Modifica",
  crea: "Crea",
  nuovo: "Nuovo",
  nuova: "Nuova",
  cerca: "Cerca",
  conferma: "Conferma",
  attenzione: "Attenzione",
  successo: "Successo",
  errore: "Errore",
  caricamento: "Caricamento...",
  nessunRisultato: "Nessun risultato trovato",
  dataCreazione: "Data Creazione",
  ultimaModifica: "Ultima Modifica",
  panoramica: "Panoramica",
  impostazioni: "Impostazioni",
  backup: "Backup",
  ripristina: "Ripristina",
  esporta: "Esporta",
  importa: "Importa",
  totale: "Totale",
  subtotale: "Subtotale",
  iva: "IVA",
  stato: "Stato",
  bozza: "Bozza",
  emessa: "Emessa",
  pagata: "Pagata",
  azioni: "Azioni",
  dettagli: "Dettagli",
  dataNascita: "Data di Nascita",
  contattoEmergenza: "Contatto di Emergenza",
  parentela: "Parentela",
  anamnesi: "Anamnesi",
  farmaci: "Farmaci",
  dosaggio: "Dosaggio",
  frequenza: "Frequenza",
  consensoTrattamentoDati: "Consenso al Trattamento Dati",
  numeroOrdine: "Numero Ordine",
  numeroFattura: "Numero Fattura",
  aliquotaIva: "Aliquota IVA",
};