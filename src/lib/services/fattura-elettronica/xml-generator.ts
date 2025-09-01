import { XMLBuilder } from 'fast-xml-parser';
import type { Invoice, Psychologist, Patient } from '$lib/utils/validation';
import type { FatturaPA } from './types';
import { ARUBA_CONFIG } from '$lib/config/electronic-invoicing';

export interface InvoiceXMLOptions {
  invoice: Invoice;
  psychologist: Psychologist;
  patient: Patient;
  progressiveNumber?: string;
  isAmendment?: boolean;
  originalInvoiceReference?: string;
}

export class FaturaPAXMLGenerator {
  private xmlBuilder: XMLBuilder;

  constructor() {
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
      indentBy: '  ',
      suppressEmptyNode: true
    });
  }

  /**
   * Generate FatturaPA XML for an invoice
   */
  generateXML(options: InvoiceXMLOptions): string {
    const { invoice, psychologist, patient, progressiveNumber, isAmendment = false } = options;
    
    // Generate progressive number if not provided
    const progNumber = progressiveNumber || this.generateProgressiveNumber();
    
    // Build the FatturaPA structure
    const fatturaPA: FatturaPA = {
      FatturaElettronica: {
        '@_versione': 'FPR12',
        '@_xmlns': 'http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2',
        FatturaElettronicaHeader: this.buildHeader(psychologist, patient, progNumber),
        FatturaElettronicaBody: this.buildBody(invoice, psychologist, isAmendment)
      }
    };

    return this.xmlBuilder.build(fatturaPA);
  }

  /**
   * Build the XML header section
   */
  private buildHeader(psychologist: Psychologist, patient: Patient, progressiveNumber: string) {
    return {
      DatiTrasmissione: {
        IdTrasmittente: {
          IdPaese: 'IT',
          IdCodice: ARUBA_CONFIG.TRASMITTENTE_CODICE_FISCALE
        },
        ProgressivoInvio: progressiveNumber,
        FormatoTrasmissione: 'FPR12',
        CodiceDestinatario: patient.codiceDestinatario || '0000000',
        ...(patient.pec && { PECDestinatario: patient.pec })
      },
      CedentePrestatore: this.buildCedentePrestatore(psychologist),
      CessionarioCommittente: this.buildCessionarioCommittente(patient)
    };
  }

  /**
   * Build supplier/provider (psychologist) data
   */
  private buildCedentePrestatore(psychologist: Psychologist) {
    const regimeFiscale = this.getRegimeFiscaleCode(psychologist.regimeFiscale || 'forfettario');
    
    return {
      DatiAnagrafici: {
        IdFiscaleIVA: {
          IdPaese: 'IT',
          IdCodice: psychologist.partitaIva
        },
        CodiceFiscale: psychologist.codiceFiscale,
        Anagrafica: {
          Nome: psychologist.nome,
          Cognome: psychologist.cognome,
          ...(psychologist.sesso && {
            Titolo: psychologist.sesso === 'M' ? 'Dott.' : 'Dott.ssa'
          })
        },
        RegimeFiscale: regimeFiscale
      },
      Sede: {
        Indirizzo: psychologist.indirizzo,
        CAP: psychologist.cap || '00100',
        Comune: psychologist.citta || 'Roma',
        Provincia: psychologist.provincia || 'RM',
        Nazione: 'IT'
      },
      ...(psychologist.numeroOrdine && psychologist.regioneOrdine && {
        IscrizioneREA: {
          Ufficio: psychologist.regioneOrdine,
          NumeroREA: psychologist.numeroOrdine
        }
      }),
      Contatti: {
        ...(psychologist.telefono && { Telefono: psychologist.telefono }),
        ...(psychologist.email && { Email: psychologist.email }),
        ...(psychologist.pec && { PEC: psychologist.pec })
      }
    };
  }

  /**
   * Build customer/client (patient) data
   */
  private buildCessionarioCommittente(patient: Patient) {
    return {
      DatiAnagrafici: {
        CodiceFiscale: patient.codiceFiscale,
        Anagrafica: {
          Nome: patient.nome,
          Cognome: patient.cognome
        }
      },
      ...(patient.indirizzo && {
        Sede: {
          Indirizzo: patient.indirizzo,
          CAP: patient.cap || '00100',
          Comune: patient.citta || 'Roma',
          Provincia: patient.provincia || 'RM',
          Nazione: 'IT'
        }
      })
    };
  }

  /**
   * Build the invoice body section
   */
  private buildBody(invoice: Invoice, psychologist: Psychologist, isAmendment: boolean) {
    const documentType = isAmendment ? 'TD04' : 'TD06'; // Credit note or professional service bill
    const vatNature = this.getVATNature(invoice.regimeFiscale || 'forfettario');
    const vatAmount = this.calculateVATAmount(invoice.importo, invoice.aliquotaIva);
    const totalAmount = invoice.importo + vatAmount + (invoice.speseAnticipate || 0);

    return {
      DatiGenerali: {
        DatiGeneraliDocumento: {
          TipoDocumento: documentType,
          Divisa: 'EUR',
          Data: this.formatDate(invoice.data),
          Numero: invoice.numeroFattura,
          ImportoTotaleDocumento: totalAmount.toFixed(2),
          ...(invoice.descrizione && {
            Causale: this.splitCausale(invoice.descrizione)
          })
        }
      },
      DatiBeniServizi: {
        DettaglioLinee: [
          {
            NumeroLinea: 1,
            Descrizione: this.buildServiceDescription(invoice),
            Quantita: '1.00',
            PrezzoUnitario: invoice.importo.toFixed(2),
            PrezzoTotale: invoice.importo.toFixed(2),
            AliquotaIVA: invoice.aliquotaIva.toFixed(2),
            ...(vatNature && { Natura: vatNature })
          },
          // Add expenses if any
          ...(invoice.speseAnticipate && invoice.speseAnticipate > 0 ? [{
            NumeroLinea: 2,
            Descrizione: 'Spese anticipate e sostenute',
            Quantita: '1.00',
            PrezzoUnitario: invoice.speseAnticipate.toFixed(2),
            PrezzoTotale: invoice.speseAnticipate.toFixed(2),
            AliquotaIVA: '0.00',
            Natura: 'N1'
          }] : [])
        ],
        DatiRiepilogo: [
          {
            AliquotaIVA: invoice.aliquotaIva.toFixed(2),
            ...(vatNature && { Natura: vatNature }),
            ImponibileImporto: invoice.importo.toFixed(2),
            Imposta: vatAmount.toFixed(2),
            ...(vatNature && {
              RiferimentoNormativo: this.getVATReference(invoice.regimeFiscale || 'forfettario')
            })
          },
          // Add separate summary for expenses if any
          ...(invoice.speseAnticipate && invoice.speseAnticipate > 0 ? [{
            AliquotaIVA: '0.00',
            Natura: 'N1',
            ImponibileImporto: invoice.speseAnticipate.toFixed(2),
            Imposta: '0.00'
          }] : [])
        ]
      }
    };
  }

  /**
   * Build service description based on invoice type and details
   */
  private buildServiceDescription(invoice: Invoice): string {
    const baseDescription = invoice.descrizione || 'Prestazioni professionali psicologiche';
    
    if (invoice.dettaglioSedute && invoice.numeroSedute && invoice.numeroSedute > 1) {
      return `${baseDescription} - ${invoice.numeroSedute} sedute`;
    }
    
    return baseDescription;
  }

  /**
   * Get regime fiscale code for FatturaPA
   */
  private getRegimeFiscaleCode(regime: string): string {
    switch (regime) {
      case 'forfettario':
        return 'RF04';
      case 'ordinario':
        return 'RF01';
      case 'minimi':
        return 'RF02';
      default:
        return 'RF04';
    }
  }

  /**
   * Get VAT nature code for tax-exempt services
   */
  private getVATNature(regime: string): string | null {
    return regime === 'forfettario' ? 'N2' : null;
  }

  /**
   * Get VAT reference normative text
   */
  private getVATReference(regime: string): string | null {
    if (regime === 'forfettario') {
      return 'art. 1, comma da 54 a 89 della legge 190/2014';
    }
    return null;
  }

  /**
   * Calculate VAT amount
   */
  private calculateVATAmount(amount: number, vatRate: number): number {
    return (amount * vatRate) / 100;
  }

  /**
   * Format date for XML (YYYY-MM-DD)
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  /**
   * Split long causale text into maximum 200 character chunks
   */
  private splitCausale(text: string): string[] {
    const maxLength = 200;
    const chunks: string[] = [];
    
    for (let i = 0; i < text.length; i += maxLength) {
      chunks.push(text.substring(i, i + maxLength));
    }
    
    return chunks;
  }

  /**
   * Generate progressive transmission number
   */
  private generateProgressiveNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}${random}`;
  }

  /**
   * Validate XML against basic FatturaPA requirements
   */
  validateXML(xmlData: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      // Basic XML structure validation
      if (!xmlData.includes('FatturaElettronica')) {
        errors.push('Missing FatturaElettronica root element');
      }
      
      if (!xmlData.includes('DatiTrasmissione')) {
        errors.push('Missing DatiTrasmissione');
      }
      
      if (!xmlData.includes('CedentePrestatore')) {
        errors.push('Missing CedentePrestatore');
      }
      
      if (!xmlData.includes('CessionarioCommittente')) {
        errors.push('Missing CessionarioCommittente');
      }
      
      if (!xmlData.includes('DatiGeneraliDocumento')) {
        errors.push('Missing DatiGeneraliDocumento');
      }
      
      if (!xmlData.includes('DettaglioLinee')) {
        errors.push('Missing DettaglioLinee');
      }
      
    } catch (error) {
      errors.push(`XML validation error: ${error}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}