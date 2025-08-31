import jsPDF from 'jspdf';
import { formattatoreData, formattatoreValuta } from './italiano.js';
import type { InvoiceWithDetails } from '$lib/stores/invoices';

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

  // Draw black box over sensitive data (simulating privacy)
  if (fattura.mostraPrivacy) {
    doc.setFillColor(0, 0, 0);
    doc.rect(50, yPos - 4, 60, 6, 'F');
  } else {
    doc.text(`${fattura.paziente?.nome} ${fattura.paziente?.cognome}`, 50, yPos);
  }

  yPos += 10;
  doc.text('Cod. Fisc.', leftMargin, yPos);

  if (fattura.mostraPrivacy) {
    doc.setFillColor(0, 0, 0);
    doc.rect(50, yPos - 4, 50, 6, 'F');
  } else {
    doc.text(fattura.paziente?.codiceFiscale || '', 50, yPos);
  }

  // Invoice number and date
  yPos += 20;
  doc.setFont('helvetica', 'bold');
  doc.text(`PARCELLA N. ${fattura.numeroFattura} del ${formattatoreData.format(new Date(fattura.data))}`, leftMargin, yPos);

  // Description
  yPos += 15;
  doc.setFont('helvetica', 'normal');
  doc.text(fattura.descrizione || 'Ci pregiamo rimetterVi fattura per prestazioni professionali relative a :', leftMargin, yPos);

  if (fattura.dettaglioSedute) {
    yPos += 7;
    doc.text(`sostegno psicologico numero ${fattura.numeroSedute || '1'} seduta`, leftMargin + 5, yPos);
  }

  // Financial breakdown
  yPos += 25;

  // Table-like structure for costs
  const tableStartY = yPos;
  const col1X = leftMargin;
  const col2X = pageWidth - rightMargin - 40;

  // Spese anticipate (if any)
  if (fattura.speseAnticipate && fattura.speseAnticipate > 0) {
    doc.text('Spese anticipate (*)', col1X, yPos);
    doc.text('0', col2X, yPos, { align: 'right' });
    yPos += 7;
  }

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

// Helper function to generate invoice number
export function generaNumeroFattura(numeroProgressivo: number, anno: number): string {
  return `${numeroProgressivo}/${anno}`;
}

// Extended invoice generation with more options
export function generaFatturaDettagliata(dati: any) {
  const fattura = {
    ...dati,
    numeroFattura: dati.numeroFattura || generaNumeroFattura(dati.numeroProgressivo, new Date().getFullYear()),
    data: dati.data || new Date().toISOString(),
    descrizione: dati.descrizione || 'Ci pregiamo rimetterVi fattura per prestazioni professionali relative a :',
    dettaglioSedute: dati.dettaglioSedute !== false,
    numeroSedute: dati.numeroSedute || 1,
    mostraPrivacy: dati.mostraPrivacy || false,
    speseAnticipate: dati.speseAnticipate || 0
  };

  return generaFatturaPDF(fattura);
}

// Export function for bulk invoice generation
export function generaFattureBulk(fatture: InvoiceWithDetails[]) {
  const risultati: Array<{
    success: boolean;
    numeroFattura: string;
    paziente?: string;
    error?: string;
  }> = [];

  fatture.forEach((fattura, index) => {
    try {
      const doc = generaFatturaPDF(fattura);
      risultati.push({
        success: true,
        numeroFattura: fattura.numeroFattura,
        paziente: `${fattura.paziente?.nome} ${fattura.paziente?.cognome}`
      });
    } catch (error) {
      risultati.push({
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
        numeroFattura: fattura.numeroFattura
      });
    }
  });

  return risultati;
}
