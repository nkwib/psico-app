import jsPDF from 'jspdf';
import { formattatoreData, formattatoreValuta } from "./italiano";
import type { InvoiceWithDetails } from "$lib/stores/invoices";

export function generaFatturaPDF(fattura: InvoiceWithDetails) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set default font
  doc.setFont('helvetica');

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return amount.toFixed(2).replace('.', ',') + ' €';
  };

  // Helper function to calculate positions
  const pageWidth = 210;
  const leftMargin = 25;
  const rightMargin = 25;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  // Header - Professional details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const title = `Dott.${fattura.psicologo?.sesso === 'F' ? 'ssa' : ''} ${fattura.psicologo?.nome} ${fattura.psicologo?.cognome}`;
  doc.text(title, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(fattura.psicologo?.indirizzo || '', pageWidth / 2, 37, { align: 'center' });
  doc.text(`C.f. ${fattura.psicologo?.codiceFiscale}`, pageWidth / 2, 43, { align: 'center' });
  doc.text(`Partita Iva ${fattura.psicologo?.partitaIva}`, pageWidth / 2, 49, { align: 'center' });

  // Professional registration details if available
  if (fattura.psicologo?.numeroOrdine) {
    doc.text(`Iscrizione Ordine Psicologi n. ${fattura.psicologo.numeroOrdine}`, pageWidth / 2, 55, { align: 'center' });
  }

  // Recipient details
  let yPos = 75;
  doc.setFontSize(10);
  doc.text('Egr. Sig.', leftMargin, yPos);
  doc.text(`${fattura.paziente?.nome} ${fattura.paziente?.cognome}`, 50, yPos);

  yPos += 10;
  doc.text('Cod. Fisc.', leftMargin, yPos);
  doc.text(fattura.paziente?.codiceFiscale || '', 50, yPos);

  // Invoice number and date
  yPos += 20;
  doc.setFont('helvetica', 'bold');
  doc.text(`PARCELLA N. ${fattura.numeroFattura} del ${formattatoreData.format(new Date(fattura.data))}`, leftMargin, yPos);

  // Description
  yPos += 15;
  doc.setFont('helvetica', 'normal');
  doc.text('Ci pregiamo rimetterVi fattura per prestazioni professionali relative a :', leftMargin, yPos);

  yPos += 7;
  doc.text(fattura.descrizione || `sostegno psicologico`, leftMargin + 5, yPos);

  // Financial breakdown
  yPos += 25;

  // Table-like structure for costs
  const col1X = leftMargin;
  const col2X = pageWidth - rightMargin - 40;

  // Onorari (main fee)
  doc.text('Onorari', col1X, yPos);
  doc.text(formatCurrency(fattura.importo), col2X, yPos, { align: 'right' });
  yPos += 7;

  // ENPAP contribution (2% for psychologists)
  const enpapAmount = fattura.importo * 0.02;
  doc.text('Contr. integr. ENPAP 2%', col1X, yPos);
  doc.text(formatCurrency(enpapAmount), col2X, yPos, { align: 'right' });
  yPos += 10;

  // Total line
  doc.setFont('helvetica', 'bold');
  doc.text('TOTALE', col1X, yPos);
  const totale = fattura.importo + enpapAmount;
  doc.text(formatCurrency(totale), col2X, yPos, { align: 'right' });

  // Draw line above NET TO PAY
  yPos += 10;
  doc.setLineWidth(0.5);
  doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);

  // NET TO PAY
  yPos += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('NETTO A PAGARE', col1X, yPos);
  doc.text(formatCurrency(totale), col2X, yPos, { align: 'right' });

  // Add note about tax exemption
  yPos += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('(*) Importo', col2X - 30, yPos, { align: 'right' });
  yPos += 4;
  doc.text('escluso da I.V.A. ai', col2X - 20, yPos, { align: 'right' });

  // Tax code reference
  yPos += 10;
  doc.setFontSize(9);
  doc.text(`sensi dell'art. 15 D.P.R. 633/72`, leftMargin, yPos);

  // Legal footer
  yPos = 260; // Position near bottom
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text("Operazione effettuata ai sensi dell' art. 1, comma da 54 a 89 della legge 190/2014, come modificati", leftMargin, yPos);
  yPos += 4;
  doc.text("dall' articolo 1, comma da 111 a 113 della Legge 208/2015 (regime forfettario).", leftMargin, yPos);

  // Additional notes if any
  if (fattura.note) {
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Note:', leftMargin, yPos);
    yPos += 5;

    // Split long notes into multiple lines
    const lines = doc.splitTextToSize(fattura.note, contentWidth);
    lines.forEach((line: string, index: number) => {
      doc.text(line, leftMargin, yPos + (index * 5));
    });
  }

  // Save the PDF with appropriate filename
  const fileName = `Parcella_${fattura.numeroFattura}_${fattura.paziente?.cognome}_${new Date(fattura.data).getFullYear()}.pdf`;
  doc.save(fileName);

  return doc;
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