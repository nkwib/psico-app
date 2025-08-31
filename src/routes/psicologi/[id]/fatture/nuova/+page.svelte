<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { invoiceSchema } from '$lib/utils/validation';
	import { patients } from '$lib/stores/patients';
	import { psychologists } from '$lib/stores/psychologists';
	import { invoices } from '$lib/stores/invoices';
	import { goto } from '$app/navigation';
	import { zod } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { formattatoreValuta } from '$lib/utils/italiano';
	import { onMount, onDestroy } from 'svelte';

	// Componenti UI
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import * as Select from '$lib/components/ui/select';
	import { User } from 'lucide-svelte';

	let { data } = $props();
	
	let patientsData = $state<any[]>([]);
	let invoicesData = $state<any[]>([]);
	let psychologist = $state<any>(null);
	
	// Store subscriptions
	let unsubPatients: (() => void) | null = null;
	let unsubInvoices: (() => void) | null = null;
	let unsubPsychologists: (() => void) | null = null;
	
	// Subscribe to stores on mount
	onMount(() => {
		unsubPatients = patients.subscribe(value => patientsData = value);
		unsubInvoices = invoices.subscribe(value => invoicesData = value);
		unsubPsychologists = psychologists.subscribe(psychs => {
			psychologist = psychs.find(p => p.id === Number(data.psychologistId));
		});
	});
	
	// Cleanup subscriptions on destroy
	onDestroy(() => {
		if (unsubPatients) unsubPatients();
		if (unsubInvoices) unsubInvoices();
		if (unsubPsychologists) unsubPsychologists();
	});
	
	// Filter patients for this psychologist
	let psychologistInvoices = $derived(
		invoicesData.filter(i => parseInt(i.idPsicologo) === Number(data.psychologistId))
	);
	
	let availablePatients = $derived(() => {
		const patientIds = new Set(psychologistInvoices.map(i => parseInt(i.idPaziente)));
		return patientsData.filter(p => p.id && patientIds.has(p.id));
	});

	// Pre-populate form with defaults
	const today = new Date().toISOString().split('T')[0];
	const nextInvoiceNumber = invoices.getNextInvoiceNumber();

	const { form, errors, enhance, constraints, submitting, tainted } = superForm(data.form, {
		validators: zod(invoiceSchema),
		dataType: 'json',
		resetForm: false,
		onSubmit: async ({ formData, cancel }) => {
			cancel();

			const selectedPatient = patientsData.find(p => p.id === parseInt($form.idPaziente));

			const invoice = {
				idPaziente: $form.idPaziente,
				idPsicologo: data.psychologistId, // Always use psychologist from URL
				numeroFattura: $form.numeroFattura,
				data: $form.data,
				descrizione: $form.descrizione,
				importo: subtotale(), // Store the net amount (without IVA)
				aliquotaIva: $form.aliquotaIva,
				note: $form.note || undefined,
				paziente: selectedPatient,
				psicologo: psychologist,
				stato: 'emessa' as const,
				// Add missing required fields with defaults
				dettaglioSedute: true,
				numeroSedute: 1,
				tipoPrestazione: 'sostegno_psicologico' as const,
				speseAnticipate: 0,
				mostraPrivacy: false,
				modalitaPagamento: 'bonifico' as const,
				regimeFiscale: 'forfettario' as const,
				marcaDaBollo: false,
				importoMarcaDaBollo: 2.00
			};

			invoices.add(invoice);
			
			// Generate PDF
			import('$lib/utils/pdf').then(({ generaFatturaPDF }) => {
				generaFatturaPDF(invoice);
			});
			
			toast.success(`Fattura ${invoice.numeroFattura} creata e scaricata con successo`);
			setTimeout(() => {
				goto(`/psicologi/${data.psychologistId}/fatture`);
			}, 100);
		},
		onError: ({ result }) => {
			console.error('Errore form:', result);
			toast.error('Errore nella creazione della fattura');
		}
	});

	// Initialize form with defaults
	onMount(() => {
		$form.data = today;
		$form.numeroFattura = nextInvoiceNumber;
		$form.idPsicologo = data.psychologistId;
		$form.aliquotaIva = 0; // Regime forfettario
		$form.importo = 50; // Default session price
		
		// Set patient from URL parameter if provided
		if (data.preselectedPatientId) {
			$form.idPaziente = data.preselectedPatientId;
			
			// Load patient's pricing preferences if they exist
			const patient = patientsData.find(p => p.id?.toString() === data.preselectedPatientId);
			if (patient?.prezziPreferiti) {
				$form.importo = patient.prezziPreferiti.importo || 50;
				aliquotaIvaString = String(patient.prezziPreferiti.aliquotaIva || 0);
				prezzoIncludeIva = patient.prezziPreferiti.prezzoIncludeIva || false;
			}
		}
	});

	// For the Select component, we need string values
	let aliquotaIvaString = $state('0');
	$effect(() => {
		$form.aliquotaIva = parseInt(aliquotaIvaString);
	});

	// State for IVA inclusion
	let prezzoIncludeIva = $state(false);
	
	// Track the last loaded patient to avoid reloading preferences
	let lastLoadedPatientId = $state<string | null>(null);
	
	// Watch for patient selection to load their preferences
	$effect(() => {
		if ($form.idPaziente && $form.idPaziente !== lastLoadedPatientId) {
			const patient = patientsData.find(p => p.id?.toString() === $form.idPaziente);
			if (patient?.prezziPreferiti) {
				$form.importo = patient.prezziPreferiti.importo || 50;
				aliquotaIvaString = String(patient.prezziPreferiti.aliquotaIva || 0);
				prezzoIncludeIva = patient.prezziPreferiti.prezzoIncludeIva || false;
			}
			lastLoadedPatientId = $form.idPaziente;
		}
	});

	// Calculate totals based on IVA inclusion
	let subtotale = $derived(() => {
		const importo = $form.importo || 0;
		if (prezzoIncludeIva && $form.aliquotaIva > 0) {
			// If price includes IVA, calculate the net amount
			return importo / (1 + $form.aliquotaIva / 100);
		}
		return importo;
	});
	
	let iva = $derived(() => {
		const importo = $form.importo || 0;
		if (prezzoIncludeIva && $form.aliquotaIva > 0) {
			// If price includes IVA, IVA is the difference
			return importo - subtotale();
		}
		// If price doesn't include IVA, calculate it normally
		return subtotale() * ($form.aliquotaIva / 100);
	});
	
	let totale = $derived(() => {
		if (prezzoIncludeIva) {
			// If price includes IVA, total is the entered amount
			return $form.importo || 0;
		}
		// If price doesn't include IVA, add IVA to get total
		return subtotale() + iva();
	});
</script>

<div class="space-y-6">
	<!-- Header with Context -->
	<div class="flex justify-between items-center">
		<div>
			<h3 class="text-lg font-semibold">Nuova Fattura</h3>
			<p class="text-sm text-gray-600 mt-1">
				Genera una nuova fattura per {psychologist ? `Dr. ${psychologist.nome} ${psychologist.cognome}` : 'questo psicologo'}
			</p>
		</div>
		{#if psychologist}
			<Badge variant="secondary" class="gap-1">
				<User class="w-3 h-3" />
				Dr. {psychologist.nome} {psychologist.cognome}
			</Badge>
		{/if}
	</div>

	<form method="POST" use:enhance class="space-y-6">
		<!-- Card Dettagli Fattura -->
		<Card>
			<CardHeader>
				<CardTitle>Dettagli Fattura</CardTitle>
			</CardHeader>
			<CardContent class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<Label for="numeroFattura">Numero Fattura *</Label>
					<Input
						id="numeroFattura"
						name="numeroFattura"
						bind:value={$form.numeroFattura}
						readonly
						class="bg-gray-50"
					/>
				</div>

				<div>
					<Label for="data">Data *</Label>
					<Input
						id="data"
						name="data"
						type="date"
						bind:value={$form.data}
						{...$constraints.data}
						aria-invalid={$errors.data ? 'true' : undefined}
						class={$errors.data ? 'border-red-500' : ''}
					/>
					{#if $errors.data && tainted && 'data' in tainted}
						<p class="text-sm text-red-500 mt-1">{$errors.data}</p>
					{/if}
				</div>

				<div class="md:col-span-2">
					<Label for="idPaziente">Paziente *</Label>
					{#if availablePatients().length > 0}
						<Select.Root type="single" bind:value={$form.idPaziente}>
							<Select.Trigger class={$errors.idPaziente ? 'border-red-500' : ''}>
								{#if $form.idPaziente}
									{@const selected = patientsData.find(p => p.id?.toString() === $form.idPaziente)}
									{#if selected}
										{selected.nome} {selected.cognome}
									{:else}
										Seleziona paziente...
									{/if}
								{:else}
									Seleziona paziente...
								{/if}
							</Select.Trigger>
							<Select.Content>
								{#each availablePatients() as paziente}
									<Select.Item value={paziente.id?.toString() || ''}>
										{paziente.nome} {paziente.cognome} - CF: {paziente.codiceFiscale}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{:else}
						<div class="p-3 border rounded-md bg-gray-50">
							<p class="text-sm text-gray-600">
								Nessun paziente disponibile. 
								<Button 
									href="/psicologi/{data.psychologistId}/pazienti/nuovo" 
									variant="link" 
									class="p-0 h-auto"
								>
									Aggiungi un paziente
								</Button>
							</p>
						</div>
					{/if}
					{#if $errors.idPaziente && tainted && 'idPaziente' in tainted}
						<p class="text-sm text-red-500 mt-1">{$errors.idPaziente}</p>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Card Prestazione -->
		<Card>
			<CardHeader>
				<CardTitle>Dettagli Prestazione</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div>
					<Label for="descrizione">Descrizione Prestazione</Label>
					<Textarea
						id="descrizione"
						name="descrizione"
						bind:value={$form.descrizione}
						placeholder="Descrizione della prestazione..."
						rows={3}
					/>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<Label for="importo">Importo (€) *</Label>
						<Input
							id="importo"
							name="importo"
							type="number"
							step="0.01"
							bind:value={$form.importo}
							{...$constraints.importo}
							aria-invalid={$errors.importo ? 'true' : undefined}
							class={$errors.importo ? 'border-red-500' : ''}
						/>
						{#if $errors.importo && tainted && 'importo' in tainted}
							<p class="text-sm text-red-500 mt-1">{$errors.importo}</p>
						{/if}
						<div class="flex items-center space-x-2 mt-2">
							<Checkbox
								id="prezzoIncludeIva"
								bind:checked={prezzoIncludeIva}
							/>
							<Label
								for="prezzoIncludeIva"
								class="text-sm font-normal cursor-pointer"
							>
								Importo IVA inclusa
							</Label>
						</div>
					</div>

					<div>
						<Label for="aliquotaIva">Aliquota IVA (%)</Label>
						<Select.Root type="single" bind:value={aliquotaIvaString}>
							<Select.Trigger>
								{aliquotaIvaString}%
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="0">0% - Esente</Select.Item>
								<Select.Item value="4">4% - Agevolata</Select.Item>
								<Select.Item value="10">10% - Ridotta</Select.Item>
								<Select.Item value="22">22% - Ordinaria</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div>
						<Label>Totale</Label>
						<div class="p-3 bg-gray-50 rounded-md">
							<p class="text-sm text-gray-600">Subtotale: {formattatoreValuta.format(subtotale())}</p>
							<p class="text-sm text-gray-600">IVA: {formattatoreValuta.format(iva())}</p>
							<p class="font-bold">Totale: {formattatoreValuta.format(totale())}</p>
						</div>
					</div>
				</div>

				<div>
					<Label for="note">Note (opzionale)</Label>
					<Textarea
						id="note"
						name="note"
						bind:value={$form.note}
						placeholder="Note aggiuntive..."
						rows={2}
					/>
				</div>
			</CardContent>
		</Card>

		<!-- Azioni Form -->
		<div class="flex justify-between pt-6 border-t">
			<Button 
				variant="outline" 
				type="button" 
				onclick={() => goto(`/psicologi/${data.psychologistId}/fatture`)}
			>
				Annulla
			</Button>

			<Button type="submit" disabled={$submitting}>
				{#if $submitting}
					Creazione fattura...
				{:else}
					Crea e Scarica PDF
				{/if}
			</Button>
		</div>
	</form>
</div>