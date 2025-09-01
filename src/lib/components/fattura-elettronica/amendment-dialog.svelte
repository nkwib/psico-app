<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { z } from 'zod';
	import type { Invoice } from '$lib/utils/validation';
	
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { AlertTriangle, FileText } from 'lucide-svelte';

	interface Props {
		open: boolean;
		originalInvoice: Invoice;
		onClose?: () => void;
	}

	let { 
		open = false,
		originalInvoice,
		onClose
	}: Props = $props();

	const dispatch = createEventDispatcher<{
		'create-amendment': {
			amendmentData: AmendmentData;
			originalInvoice: Invoice;
		};
	}>();

	interface AmendmentData {
		motivo: string;
		motivoDettaglio: string;
		tipoCorrezione: 'totale' | 'parziale';
		nuovoImporto?: number;
		noteAggiuntive?: string;
	}

	// Amendment form data
	let amendmentData = $state<AmendmentData>({
		motivo: '',
		motivoDettaglio: '',
		tipoCorrezione: 'totale'
	});

	let isSubmitting = $state(false);
	let errors = $state<Record<string, string>>({});

	// Amendment reason options
	const motiviAmendment = [
		{ value: 'errore_importo', label: 'Errore nell\'importo' },
		{ value: 'errore_dati_fiscali', label: 'Errore nei dati fiscali' },
		{ value: 'errore_prestazione', label: 'Errore nella descrizione prestazione' },
		{ value: 'errore_paziente', label: 'Errore nei dati del paziente' },
		{ value: 'prestazione_annullata', label: 'Prestazione annullata' },
		{ value: 'altro', label: 'Altro motivo' }
	];

	// Validation schema
	const amendmentSchema = z.object({
		motivo: z.string().min(1, 'Motivo obbligatorio'),
		motivoDettaglio: z.string().min(10, 'Dettaglio motivo obbligatorio (min 10 caratteri)'),
		tipoCorrezione: z.enum(['totale', 'parziale']),
		nuovoImporto: z.number().positive().optional(),
		noteAggiuntive: z.string().optional()
	});

	function validateForm() {
		try {
			errors = {};
			
			const validatedData = amendmentSchema.parse(amendmentData);
			
			// Additional validation for partial correction
			if (validatedData.tipoCorrezione === 'parziale' && !validatedData.nuovoImporto) {
				errors.nuovoImporto = 'Nuovo importo obbligatorio per correzione parziale';
				return false;
			}
			
			if (validatedData.nuovoImporto && validatedData.nuovoImporto >= originalInvoice.importo) {
				errors.nuovoImporto = 'Il nuovo importo deve essere inferiore all\'originale';
				return false;
			}
			
			return true;
		} catch (error) {
			if (error instanceof z.ZodError) {
				error.errors.forEach(err => {
					if (err.path[0]) {
						errors[err.path[0].toString()] = err.message;
					}
				});
			}
			return false;
		}
	}

	async function handleCreateAmendment() {
		if (!validateForm()) return;
		
		isSubmitting = true;
		
		try {
			dispatch('create-amendment', {
				amendmentData: { ...amendmentData },
				originalInvoice
			});
			
			// Reset form
			amendmentData = {
				motivo: '',
				motivoDettaglio: '',
				tipoCorrezione: 'totale'
			};
			errors = {};
			
			if (onClose) onClose();
			
		} catch (error) {
			console.error('Error creating amendment:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function handleClose() {
		if (isSubmitting) return;
		
		// Reset form
		amendmentData = {
			motivo: '',
			motivoDettaglio: '',
			tipoCorrezione: 'totale'
		};
		errors = {};
		
		if (onClose) onClose();
	}

	let selectedMotivoLabel = $derived(motiviAmendment.find(m => m.value === amendmentData.motivo)?.label || '');
	let creditAmount = $derived(amendmentData.tipoCorrezione === 'totale' 
		? originalInvoice.importo 
		: (amendmentData.nuovoImporto ? originalInvoice.importo - amendmentData.nuovoImporto : 0));
</script>

<Dialog.Root bind:open onOpenChange={handleClose}>
	<Dialog.Content class="sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<FileText class="w-5 h-5" />
				Crea Nota di Credito
			</Dialog.Title>
			<Dialog.Description>
				Crea una nota di credito per correggere la fattura n. {originalInvoice.numeroFattura}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6 py-4">
			<!-- Invoice Info -->
			<div class="bg-gray-50 p-4 rounded-lg">
				<h4 class="font-medium text-sm mb-2">Fattura Originale</h4>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span class="text-gray-600">Numero:</span>
						<span class="ml-2 font-mono">{originalInvoice.numeroFattura}</span>
					</div>
					<div>
						<span class="text-gray-600">Data:</span>
						<span class="ml-2">{new Date(originalInvoice.data).toLocaleDateString('it-IT')}</span>
					</div>
					<div>
						<span class="text-gray-600">Importo:</span>
						<span class="ml-2 font-medium">€ {originalInvoice.importo.toFixed(2)}</span>
					</div>
					<div>
						<span class="text-gray-600">Stato SDI:</span>
						<span class="ml-2">{originalInvoice.sdiStatus || 'N/A'}</span>
					</div>
				</div>
			</div>

			<!-- Warning -->
			<Alert>
				<AlertTriangle class="h-4 w-4" />
				<AlertDescription>
					<strong>Attenzione:</strong> La nota di credito sarà automaticamente inviata al Sistema di Interscambio 
					se la fattura originale è stata trasmessa elettronicamente.
				</AlertDescription>
			</Alert>

			<!-- Amendment Form -->
			<div class="space-y-4">
				<!-- Reason -->
				<div>
					<Label for="motivo">Motivo della correzione *</Label>
					<Select.Root bind:value={amendmentData.motivo} type="single">
						<Select.Trigger class={errors.motivo ? 'border-red-500' : ''}>
							{selectedMotivoLabel || "Seleziona il motivo..."}
						</Select.Trigger>
						<Select.Content>
							{#each motiviAmendment as motivo}
								<Select.Item value={motivo.value}>{motivo.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#if errors.motivo}
						<p class="text-sm text-red-500 mt-1">{errors.motivo}</p>
					{/if}
				</div>

				<!-- Detailed Reason -->
				<div>
					<Label for="motivoDettaglio">Dettaglio motivo *</Label>
					<Textarea
						id="motivoDettaglio"
						bind:value={amendmentData.motivoDettaglio}
						placeholder="Descrivi dettagliatamente il motivo della correzione..."
						rows={3}
						class={errors.motivoDettaglio ? 'border-red-500' : ''}
					/>
					{#if errors.motivoDettaglio}
						<p class="text-sm text-red-500 mt-1">{errors.motivoDettaglio}</p>
					{/if}
				</div>

				<!-- Correction Type -->
				<div>
					<Label>Tipo di correzione *</Label>
					<div class="flex gap-4 mt-2">
						<label class="flex items-center gap-2 cursor-pointer">
							<input 
								type="radio" 
								bind:group={amendmentData.tipoCorrezione} 
								value="totale" 
								class="w-4 h-4"
							/>
							<span>Annullamento totale</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input 
								type="radio" 
								bind:group={amendmentData.tipoCorrezione} 
								value="parziale" 
								class="w-4 h-4"
							/>
							<span>Correzione parziale</span>
						</label>
					</div>
				</div>

				<!-- Partial Amount -->
				{#if amendmentData.tipoCorrezione === 'parziale'}
					<div>
						<Label for="nuovoImporto">Nuovo importo corretto (€) *</Label>
						<Input
							id="nuovoImporto"
							type="number"
							step="0.01"
							bind:value={amendmentData.nuovoImporto}
							placeholder="0.00"
							class={errors.nuovoImporto ? 'border-red-500' : ''}
						/>
						{#if errors.nuovoImporto}
							<p class="text-sm text-red-500 mt-1">{errors.nuovoImporto}</p>
						{/if}
					</div>
				{/if}

				<!-- Additional Notes -->
				<div>
					<Label for="noteAggiuntive">Note aggiuntive</Label>
					<Textarea
						id="noteAggiuntive"
						bind:value={amendmentData.noteAggiuntive}
						placeholder="Note aggiuntive per la nota di credito..."
						rows={2}
					/>
				</div>

				<!-- Summary -->
				{#if amendmentData.motivo && creditAmount > 0}
					<div class="bg-blue-50 p-4 rounded-lg">
						<h4 class="font-medium text-sm mb-2">Riepilogo Nota di Credito</h4>
						<div class="space-y-1 text-sm">
							<p><span class="text-gray-600">Motivo:</span> <span class="ml-2">{selectedMotivoLabel}</span></p>
							<p><span class="text-gray-600">Tipo:</span> <span class="ml-2 capitalize">{amendmentData.tipoCorrezione}</span></p>
							<p><span class="text-gray-600">Importo credito:</span> <span class="ml-2 font-bold">€ {creditAmount.toFixed(2)}</span></p>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<Dialog.Footer>
			<Button 
				variant="outline" 
				onclick={handleClose}
				disabled={isSubmitting}
			>
				Annulla
			</Button>
			<Button 
				onclick={handleCreateAmendment}
				disabled={isSubmitting || !amendmentData.motivo}
			>
				{#if isSubmitting}
					Creazione in corso...
				{:else}
					Crea Nota di Credito
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>