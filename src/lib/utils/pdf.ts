import { formattatoreData, formattatoreValuta } from "./italiano";
import type { InvoiceWithDetails } from "$lib/stores/invoices";

export function generaFatturaPDF(fattura: InvoiceWithDetails) {
  const imponibile = fattura.importo;
  const iva = (fattura.importo * fattura.aliquotaIva) / 100;
  const totale = imponibile + iva;

  const contenuto = `
================================================================================
                              FATTURA PROFESSIONALE
================================================================================

FATTURA N. ${fattura.numeroFattura}
Data: ${formattatoreData.format(new Date(fattura.data))}

--------------------------------------------------------------------------------
PRESTATORE DI SERVIZI:
--------------------------------------------------------------------------------
Dott. ${fattura.psicologo?.nome} ${fattura.psicologo?.cognome}
Codice Fiscale: ${fattura.psicologo?.codiceFiscale}
Partita IVA: ${fattura.psicologo?.partitaIva}
Indirizzo: ${fattura.psicologo?.indirizzo}
Telefono: ${fattura.psicologo?.telefono}
Email: ${fattura.psicologo?.email}
${fattura.psicologo?.numeroOrdine ? `Iscrizione Ordine: ${fattura.psicologo.numeroOrdine}` : ''}

--------------------------------------------------------------------------------
CLIENTE:
--------------------------------------------------------------------------------
${fattura.paziente?.nome} ${fattura.paziente?.cognome}
Codice Fiscale: ${fattura.paziente?.codiceFiscale}
${fattura.paziente?.telefono ? `Telefono: ${fattura.paziente.telefono}` : ''}
${fattura.paziente?.email ? `Email: ${fattura.paziente.email}` : ''}

--------------------------------------------------------------------------------
DETTAGLI PRESTAZIONE:
--------------------------------------------------------------------------------
Descrizione: ${fattura.descrizione}

Imponibile:                              ${formattatoreValuta.format(imponibile)}
Aliquota IVA:                            ${fattura.aliquotaIva}%
IVA:                                     ${formattatoreValuta.format(iva)}
--------------------------------------------------------------------------------
TOTALE FATTURA:                          ${formattatoreValuta.format(totale)}
--------------------------------------------------------------------------------

${fattura.note ? `Note: ${fattura.note}\n` : ''}
${fattura.aliquotaIva === 0 ? `
Operazione in regime forfettario ex art.1, c. 54-89 L.190/2014.
Non soggetta a ritenuta d'acconto.
Imposta di bollo non dovuta.
` : `
Fattura elettronica non soggetta a marca da bollo ai sensi dell'art. 15 del DPR 642/72.
`}

================================================================================
                     Documento generato automaticamente
                        Gestionale Studio Psicologico
================================================================================
`;

  // Create a Blob from the text content
  const blob = new Blob([contenuto], { type: "text/plain;charset=utf-8" });
  
  // Create a download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Fattura_${fattura.numeroFattura}_${fattura.paziente?.cognome || 'Cliente'}.txt`;
  
  // Trigger download
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Clean up
  URL.revokeObjectURL(url);
}

export function generaRicevutaPDF(fattura: InvoiceWithDetails) {
  const totale = fattura.importo; // Senza IVA per prestazioni sanitarie

  const contenuto = `
================================================================================
                              RICEVUTA PRESTAZIONE
================================================================================

RICEVUTA N. ${fattura.numeroFattura}
Data: ${formattatoreData.format(new Date(fattura.data))}

--------------------------------------------------------------------------------
PROFESSIONISTA:
--------------------------------------------------------------------------------
Dott. ${fattura.psicologo?.nome} ${fattura.psicologo?.cognome}
Codice Fiscale: ${fattura.psicologo?.codiceFiscale}
${fattura.psicologo?.numeroOrdine ? `Iscrizione Ordine degli Psicologi: ${fattura.psicologo.numeroOrdine}` : ''}

--------------------------------------------------------------------------------
RICEVUTA RILASCIATA A:
--------------------------------------------------------------------------------
${fattura.paziente?.nome} ${fattura.paziente?.cognome}
Codice Fiscale: ${fattura.paziente?.codiceFiscale}

--------------------------------------------------------------------------------
PRESTAZIONE:
--------------------------------------------------------------------------------
${fattura.descrizione}

Importo:                                 ${formattatoreValuta.format(totale)}

--------------------------------------------------------------------------------

Prestazione sanitaria esente IVA ai sensi dell'art. 10 n. 18 DPR 633/72.
Esente da bollo ai sensi dell'art. 5 Tab. B DPR 642/72.

Il sottoscritto dichiara di aver ricevuto la somma sopra indicata.

Firma _________________________

================================================================================
                     Documento generato automaticamente
                        Gestionale Studio Psicologico
================================================================================
`;

  // Create a Blob from the text content
  const blob = new Blob([contenuto], { type: "text/plain;charset=utf-8" });
  
  // Create a download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Ricevuta_${fattura.numeroFattura}_${fattura.paziente?.cognome || 'Cliente'}.txt`;
  
  // Trigger download
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Clean up
  URL.revokeObjectURL(url);
}