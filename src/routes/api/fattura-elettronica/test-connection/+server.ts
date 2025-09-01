import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ArubaAPIClient } from '$lib/services/fattura-elettronica/aruba-client';
import { electronicInvoicingConfig } from '$lib/config/electronic-invoicing';

export const GET: RequestHandler = async () => {
	try {
		// Check if electronic invoicing is enabled
		if (!electronicInvoicingConfig.enabled) {
			return json({
				success: false,
				error: 'Electronic invoicing is not enabled',
				configuration: {
					enabled: false,
					environment: 'none'
				}
			});
		}

		// Initialize Aruba client and test connection
		const arubaClient = new ArubaAPIClient();
		const testResult = await arubaClient.testConnection();
		const envInfo = arubaClient.getEnvironmentInfo();

		return json({
			success: testResult.success,
			message: testResult.message,
			configuration: {
				enabled: electronicInvoicingConfig.enabled,
				environment: envInfo.environment,
				baseUrl: envInfo.baseUrl,
				isTest: envInfo.isTest
			},
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		console.error('Connection test error:', error);
		
		return json({
			success: false,
			error: 'Connection test failed',
			details: error instanceof Error ? error.message : 'Unknown error',
			configuration: {
				enabled: electronicInvoicingConfig.enabled,
				environment: electronicInvoicingConfig.environment,
				baseUrl: electronicInvoicingConfig.baseUrl
			},
			timestamp: new Date().toISOString()
		});
	}
};