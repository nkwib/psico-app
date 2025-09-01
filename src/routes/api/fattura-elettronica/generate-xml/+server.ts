import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { FaturaPAXMLGenerator } from '$lib/services/fattura-elettronica/xml-generator';
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
		const { invoice, psychologist, patient, isAmendment = false } = body;

		// Validate required data
		if (!invoice || !psychologist || !patient) {
			return json(
				{ error: 'Missing required data: invoice, psychologist, or patient' },
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

		// Generate XML
		const xmlGenerator = new FaturaPAXMLGenerator();
		const xmlData = xmlGenerator.generateXML({
			invoice,
			psychologist,
			patient,
			isAmendment
		});

		// Validate generated XML
		const validation = xmlGenerator.validateXML(xmlData);
		if (!validation.valid) {
			return json(
				{ 
					error: 'XML validation failed',
					details: validation.errors 
				},
				{ status: 400 }
			);
		}

		// Generate filename
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const filename = `IT${psychologist.codiceFiscale}_${invoice.numeroFattura.replace('/', '-')}_${timestamp}.xml`;

		// Calculate XML hash for integrity
		const encoder = new TextEncoder();
		const data = encoder.encode(xmlData);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const xmlHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

		return json({
			success: true,
			xmlData,
			xmlHash,
			filename,
			size: new Blob([xmlData]).size,
			validation: {
				valid: validation.valid,
				errors: validation.errors
			}
		});

	} catch (error) {
		console.error('XML generation error:', error);
		return json(
			{ 
				error: 'Failed to generate XML',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};