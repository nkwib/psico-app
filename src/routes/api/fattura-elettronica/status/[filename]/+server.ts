import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ArubaAPIClient } from '$lib/services/fattura-elettronica/aruba-client';
import { electronicInvoicingConfig } from '$lib/config/electronic-invoicing';

export const GET: RequestHandler = async ({ params }) => {
	try {
		// Check if electronic invoicing is enabled
		if (!electronicInvoicingConfig.enabled) {
			return json(
				{ error: 'Electronic invoicing is not enabled' },
				{ status: 503 }
			);
		}

		const { filename } = params;

		if (!filename) {
			return json(
				{ error: 'Missing filename parameter' },
				{ status: 400 }
			);
		}

		// Initialize Aruba client
		const arubaClient = new ArubaAPIClient();

		// Get invoice status from Aruba
		const statusResult = await arubaClient.getInvoiceStatus(decodeURIComponent(filename));

		if (!statusResult) {
			return json(
				{ error: 'Invoice not found in Aruba system' },
				{ status: 404 }
			);
		}

		// Get notifications if available
		const notifications = await arubaClient.getInvoiceNotifications(filename);

		return json({
			success: true,
			status: statusResult.status,
			sdiId: statusResult.sdiId,
			submissionDate: statusResult.submissionDate,
			lastUpdate: statusResult.lastUpdate,
			errors: statusResult.errors || [],
			notifications: notifications,
			environment: arubaClient.getEnvironmentInfo().environment
		});

	} catch (error) {
		console.error('Status check error:', error);
		
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
				error: 'Failed to check invoice status',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		// Check if electronic invoicing is enabled
		if (!electronicInvoicingConfig.enabled) {
			return json(
				{ error: 'Electronic invoicing is not enabled' },
				{ status: 503 }
			);
		}

		const { filename } = params;
		const body = await request.json();
		const { action } = body;

		if (!filename) {
			return json(
				{ error: 'Missing filename parameter' },
				{ status: 400 }
			);
		}

		// Initialize Aruba client
		const arubaClient = new ArubaAPIClient();

		switch (action) {
			case 'check-status':
				return await GET({ params } as any);
				
			case 'get-notifications':
				const notifications = await arubaClient.getInvoiceNotifications(decodeURIComponent(filename));
				return json({
					success: true,
					notifications
				});

			default:
				return json(
					{ error: `Unknown action: ${action}` },
					{ status: 400 }
				);
		}

	} catch (error) {
		console.error('Status action error:', error);
		return json(
			{
				error: 'Failed to perform status action',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};