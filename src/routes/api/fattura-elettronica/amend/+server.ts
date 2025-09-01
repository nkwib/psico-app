import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { FaturaPAXMLGenerator } from '$lib/services/fattura-elettronica/xml-generator';
import { ArubaAPIClient } from '$lib/services/fattura-elettronica/aruba-client';
import { electronicInvoicingConfig } from '$lib/config/electronic-invoicing';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Check if electronic invoicing is enabled
		if (!electronicInvoicingConfig.enabled) {
			return json(
				{ error: 'Electronic invoicing is not enabled' },
				{ status: 503 }
			);
		}

		const body = await request.json();
		const { 
			originalInvoice, 
			psychologist, 
			patient, 
			amendmentData,
			autoSend = false 
		} = body;

		// Validate required data
		if (!originalInvoice || !psychologist || !patient || !amendmentData) {
			return json(
				{ error: 'Missing required data' },
				{ status: 400 }
			);
		}

		// Validate that psychologist has electronic invoicing enabled
		if (!psychologist.fatturaElettronicaAbilitata) {
			return json(
				{ error: 'Electronic invoicing not enabled for this psychologist' },
				{ status: 400 }
			);
		}

		// Create credit note invoice data
		const creditNoteData = createCreditNoteInvoice(originalInvoice, amendmentData);

		// Generate XML for credit note
		const xmlGenerator = new FaturaPAXMLGenerator();
		const xmlData = xmlGenerator.generateXML({
			invoice: creditNoteData,
			psychologist,
			patient,
			isAmendment: true,
			originalInvoiceReference: originalInvoice.numeroFattura
		});

		// Validate generated XML
		const validation = xmlGenerator.validateXML(xmlData);
		if (!validation.valid) {
			return json(
				{ 
					error: 'Credit note XML validation failed',
					details: validation.errors 
				},
				{ status: 400 }
			);
		}

		// Generate filename for credit note
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const filename = `IT${psychologist.codiceFiscale}_CN_${originalInvoice.numeroFattura.replace('/', '-')}_${timestamp}.xml`;

		// Calculate XML hash
		const encoder = new TextEncoder();
		const data = encoder.encode(xmlData);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const xmlHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

		let uploadResult = null;

		// Auto-send to Aruba if requested and original invoice was sent electronically
		if (autoSend && originalInvoice.fatturazioneElettronica && originalInvoice.sdiStatus !== 'pending') {
			try {
				const arubaClient = new ArubaAPIClient();
				uploadResult = await arubaClient.uploadInvoice(xmlData, filename);
				
				if (!uploadResult.success) {
					console.warn('Failed to auto-send credit note to Aruba:', uploadResult.errors);
				}
			} catch (error) {
				console.error('Error auto-sending credit note:', error);
			}
		}

		return json({
			success: true,
			creditNote: {
				...creditNoteData,
				xmlData,
				xmlHash,
				uploadFilename: filename,
				fatturazioneElettronica: originalInvoice.fatturazioneElettronica,
				sdiStatus: uploadResult?.success ? 'sent' : 'pending',
				originalInvoiceReference: originalInvoice.numeroFattura
			},
			upload: uploadResult ? {
				success: uploadResult.success,
				errors: uploadResult.errors
			} : null,
			validation: {
				valid: validation.valid,
				errors: validation.errors
			}
		});

	} catch (error) {
		console.error('Amendment creation error:', error);
		return json(
			{ 
				error: 'Failed to create credit note',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

function createCreditNoteInvoice(originalInvoice: any, amendmentData: any) {
	const today = new Date().toISOString().split('T')[0];
	const creditAmount = amendmentData.tipoCorrezione === 'totale' 
		? originalInvoice.importo 
		: (originalInvoice.importo - (amendmentData.nuovoImporto || 0));

	// Generate credit note number
	const creditNoteNumber = `CN-${originalInvoice.numeroFattura}`;

	return {
		...originalInvoice,
		id: undefined, // Will be assigned new ID
		numeroFattura: creditNoteNumber,
		data: today,
		importo: -Math.abs(creditAmount), // Negative amount for credit note
		descrizione: `NOTA DI CREDITO per fattura ${originalInvoice.numeroFattura}`,
		note: [
			`Motivo: ${amendmentData.motivoDettaglio}`,
			amendmentData.noteAggiuntive || '',
			`Riferimento fattura originale: ${originalInvoice.numeroFattura} del ${new Date(originalInvoice.data).toLocaleDateString('it-IT')}`
		].filter(Boolean).join('\n'),
		stato: 'emessa' as const,
		dataPagamento: undefined,
		// Credit note specific fields
		tipoDocumento: 'nota_credito' as const,
		fatturaOriginaleId: originalInvoice.id,
		fatturaOriginaleNumero: originalInvoice.numeroFattura,
		motivoAmendment: amendmentData.motivo,
		motivoDettaglio: amendmentData.motivoDettaglio,
		tipoCorrezione: amendmentData.tipoCorrezione
	};
}