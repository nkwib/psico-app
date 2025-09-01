<script lang="ts">
	import type { ElectronicInvoiceStatus, SDIError } from '$lib/services/fattura-elettronica/types';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { 
		CircleCheck, 
		Clock, 
		CircleAlert, 
		CircleX, 
		Send, 
		RefreshCw, 
		Download,
		TriangleAlert
	} from 'lucide-svelte';

	interface Props {
		status?: ElectronicInvoiceStatus;
		sdiId?: string;
		errors?: SDIError[];
		lastCheck?: string;
		submissionDate?: string;
		onCheckStatus?: () => void;
		onSendToSDI?: () => void;
		onDownloadXML?: () => void;
		loading?: boolean;
		disabled?: boolean;
	}

	let { 
		status,
		sdiId,
		errors = [],
		lastCheck,
		submissionDate,
		onCheckStatus,
		onSendToSDI,
		onDownloadXML,
		loading = false,
		disabled = false
	}: Props = $props();

	function getStatusConfig(status?: ElectronicInvoiceStatus) {
		switch (status) {
			case 'pending':
				return {
					label: 'In Preparazione',
					variant: 'secondary' as const,
					icon: Clock,
					description: 'Fattura pronta per l\'invio al Sistema di Interscambio'
				};
			case 'sent':
				return {
					label: 'Inviata a SDI',
					variant: 'default' as const,
					icon: Send,
					description: 'Fattura trasmessa al Sistema di Interscambio, in attesa di accettazione'
				};
			case 'accepted':
				return {
					label: 'Accettata',
					variant: 'default' as const,
					icon: CircleCheck,
					description: 'Fattura accettata dal Sistema di Interscambio e inviata al destinatario'
				};
			case 'rejected':
				return {
					label: 'Rifiutata',
					variant: 'destructive' as const,
					icon: CircleX,
					description: 'Fattura rifiutata dal Sistema di Interscambio. Verifica gli errori.'
				};
			case 'delivered':
				return {
					label: 'Consegnata',
					variant: 'default' as const,
					icon: CircleCheck,
					description: 'Fattura consegnata con successo al destinatario'
				};
			default:
				return {
					label: 'Non Inviata',
					variant: 'outline' as const,
					icon: CircleAlert,
					description: 'Fattura non ancora inviata al Sistema di Interscambio'
				};
		}
	}

	let statusConfig = $derived(getStatusConfig(status));
	let hasErrors = $derived(errors.length > 0);
	let canSend = $derived(!status || status === 'pending');
	let canCheck = $derived(status && status !== 'pending');
</script>

<Card class="w-full">
	<CardHeader class="pb-3">
		<CardTitle class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				{#if statusConfig.icon}
					{@const IconComponent = statusConfig.icon}
					<IconComponent class="w-5 h-5" />
				{/if}
				<span>Fatturazione Elettronica</span>
			</div>
			<Badge variant={statusConfig.variant}>
				{statusConfig.label}
			</Badge>
		</CardTitle>
	</CardHeader>
	
	<CardContent class="space-y-4">
		<p class="text-sm text-muted-foreground">
			{statusConfig.description}
		</p>

		{#if sdiId}
			<div class="text-sm">
				<span class="font-medium">ID SDI:</span>
				<span class="font-mono ml-2">{sdiId}</span>
			</div>
		{/if}

		{#if submissionDate}
			<div class="text-sm text-muted-foreground">
				Inviata il: {new Date(submissionDate).toLocaleString('it-IT')}
			</div>
		{/if}

		{#if lastCheck}
			<div class="text-sm text-muted-foreground">
				Ultimo controllo: {new Date(lastCheck).toLocaleString('it-IT')}
			</div>
		{/if}

		{#if hasErrors}
			<Alert variant="destructive">
				<TriangleAlert class="h-4 w-4" />
				<AlertDescription>
					<div class="space-y-1">
						<p class="font-medium">Errori rilevati:</p>
						{#each errors as error}
							<div class="text-sm">
								<span class="font-mono">{error.code}:</span>
								<span class="ml-2">{error.description}</span>
							</div>
						{/each}
					</div>
				</AlertDescription>
			</Alert>
		{/if}

		<!-- Actions -->
		<div class="flex gap-2 pt-2">
			{#if canSend && onSendToSDI}
				<Button 
					size="sm" 
					onclick={onSendToSDI}
					disabled={disabled || loading}
				>
					{#if loading}
						<RefreshCw class="w-4 h-4 mr-2 animate-spin" />
					{:else}
						<Send class="w-4 h-4 mr-2" />
					{/if}
					Invia a SDI
				</Button>
			{/if}

			{#if canCheck && onCheckStatus}
				<Button 
					variant="outline" 
					size="sm" 
					onclick={onCheckStatus}
					disabled={disabled || loading}
				>
					{#if loading}
						<RefreshCw class="w-4 h-4 mr-2 animate-spin" />
					{:else}
						<RefreshCw class="w-4 h-4 mr-2" />
					{/if}
					Controlla Stato
				</Button>
			{/if}

			{#if onDownloadXML}
				<Button 
					variant="outline" 
					size="sm" 
					onclick={onDownloadXML}
					disabled={disabled}
				>
					<Download class="w-4 h-4 mr-2" />
					Scarica XML
				</Button>
			{/if}
		</div>
	</CardContent>
</Card>