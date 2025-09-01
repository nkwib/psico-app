import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
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
		const { xmlData, filename, invoiceId } = body;

		// Validate required data
		if (!xmlData || !filename) {
			return json(
				{ error: 'Missing required data: xmlData or filename' },
				{ status: 400 }
			);
		}

		// Initialize Aruba client
		const arubaClient = new ArubaAPIClient();

		// Upload invoice to Aruba
		const uploadResult = await arubaClient.uploadInvoice(xmlData, filename);

		if (!uploadResult.success) {
			return json(
				{
					success: false,
					error: 'Failed to upload to Aruba',
					details: uploadResult.errors
				},
				{ status: 400 }
			);
		}

		// Get environment info
		const environmentInfo = arubaClient.getEnvironmentInfo();

		return json({
			success: true,
			uploadFilename: uploadResult.uploadFilename,
			submissionDate: new Date().toISOString(),
			environment: environmentInfo.environment,
			isTest: environmentInfo.isTest,
			message: environmentInfo.isTest 
				? 'Invoice successfully uploaded to Aruba test environment'
				: 'Invoice successfully uploaded to Aruba production environment'
		});

	} catch (error) {
		console.error('Send to Aruba error:', error);
		
		// Check if it's an authentication error
		if (error instanceof Error && error.message.includes('Authentication')) {
			return json(
				{
					error: 'Authentication failed',
					details: 'Check your Aruba API credentials in environment configuration'
				},
				{ status: 401 }
			);
		}

		return json(
			{
				error: 'Failed to send invoice to Aruba',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};