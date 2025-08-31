<script lang="ts">
	import { get } from 'svelte/store';
	import { superForm } from 'sveltekit-superforms/client';
	import { invoiceSchema } from '$lib/utils/validation';
	import { patients } from '$lib/stores/patients';
	import { psychologists, preferredPsychologist } from '$lib/stores/psychologists';
	import { invoices } from '$lib/stores/invoices';
	import { goto } from '$app/navigation';
	import { zod } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { formattatoreValuta } from '$lib/utils/italiano';

	// Componenti UI
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import * as Select from '$lib/components/ui/select';

	let { data } = $props();
	
	let patientsData = $state(get(patients));
	let psychologistsData = $state(get(psychologists));
	let preferredPsychologistData = $state(get(preferredPsychologist));
	
	$effect(() => {
		const unsubPatients = patients.subscribe(value => patientsData = value);
		const unsubPsychologists = psychologists.subscribe(value => psychologistsData = value);
		const unsubPreferred = preferredPsychologist.subscribe(value => preferredPsychologistData = value);
		
		return () => {
			unsubPatients();
			unsubPsychologists();
			unsubPreferred();
		};
	});

	// Pre-populate form with defaults
	const today = new Date().toISOString().split('T')[0];
	const nextInvoiceNumber = invoices.getNextInvoiceNumber();

	const { form, errors, enhance, constraints, submitting } = superForm(data.form, {
		validators: zod(invoiceSchema),
		dataType: 'json',
		resetForm: false,
		onSubmit: async ({ formData, cancel }) => {
			cancel();

			const selectedPatient = patientsData.find(p => p.id === parseInt($form.idPaziente));
			const selectedPsychologist = psychologistsData.find(p => p.id === parseInt($form.idPsicologo));

			const invoice = {
				idPaziente: $form.idPaziente,
				idPsicologo: $form.idPsicologo,
				numeroFattura: $form.numeroFattura,
				data: $form.data,
				descrizione: $form.descrizione,
				importo: $form.importo,
				aliquotaIva: $form.aliquotaIva,
				note: $form.note || undefined,
				paziente: selectedPatient,
				psicologo: selectedPsychologist,
				stato: 'emessa' as const
			};

			invoices.add(invoice);
			
			// Generate PDF
			import('$lib/utils/pdf').then(({ generaFatturaPDF }) => {
				generaFatturaPDF(invoice);
			});
			
			toast.success(`Fattura ${invoice.numeroFattura} creata e scaricata con successo`);
			setTimeout(() => {
				goto('/fatture');
			}, 100);
		},
		onError: ({ result }) => {
			console.error('Errore form:', result);
			toast.error('Errore nella creazione della fattura');
		}
	});

	// Initialize form with defaults
	$form.idPsicologo = preferredPsychologistData?.id?.toString() || '';
	$form.data = today;
	$form.numeroFattura = nextInvoiceNumber;
	$form.aliquotaIva = 0; // Regime forfettario
	$form.importo = 80; // Default session price

	// For the Select component, we need string values
	let aliquotaIvaString = $state('0');
	$effect(() => {
		$form.aliquotaIva = parseInt(aliquotaIvaString);
	});

	// Calculate totals
	let subtotale = $derived($form.importo || 0);
	let iva = $derived(subtotale * ($form.aliquotaIva / 100));
	let totale = $derived(subtotale + iva);
</script>

<div class="container mx-auto py-8 max-w-3xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Nuova Fattura</h1>
		<p class="text-gray-600 mt-2">Genera una nuova fattura per prestazioni psicologiche</p>
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
						aria-invalid={$errors.data ? 'true' : undefined}
						class={$errors.data ? 'border-red-500' : ''}
					/>
					{#if $errors.data}
						<p class="text-sm text-red-500 mt-1">{$errors.data}</p>
					{/if}
				</div>

				<div>
					<Label for="idPsicologo">Psicologo *</Label>
					<Select.Root type="single" bind:value={$form.idPsicologo}>
						<Select.Trigger class="{$errors.idPsicologo ? 'border-red-500' : ''}">
							{#if $form.idPsicologo}
								{@const selected = psychologistsData.find(p => p.id?.toString() === $form.idPsicologo)}
								{#if selected}
									Dott. {selected.nome} {selected.cognome}
								{:else}
									Seleziona psicologo...
								{/if}
							{:else}
								Seleziona psicologo...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each psychologistsData as psicologo}
								<Select.Item value={psicologo.id?.toString() || ''}>
									Dott. {psicologo.nome} {psicologo.cognome}
									{#if psicologo.id === preferredPsychologistData?.id}
										<span class="text-blue-600 ml-2">✓ Preferito</span>
									{/if}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#if $errors.idPsicologo}
						<p class="text-sm text-red-500 mt-1">{$errors.idPsicologo}</p>
					{/if}
				</div>

				<div>
					<Label for="idPaziente">Paziente *</Label>
					<Select.Root type="single" bind:value={$form.idPaziente}>
						<Select.Trigger class="{$errors.idPaziente ? 'border-red-500' : ''}">
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
							{#each patientsData as paziente}
								<Select.Item value={paziente.id?.toString() || ''}>
									{paziente.nome} {paziente.cognome}
									<span class="text-gray-500 ml-2">({paziente.codiceFiscale})</span>
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#if $errors.idPaziente}
						<p class="text-sm text-red-500 mt-1">{$errors.idPaziente}</p>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Informazioni Servizio -->
		<Card>
			<CardHeader>
				<CardTitle>Informazioni Servizio</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div>
					<Label for="descrizione">Descrizione Servizio *</Label>
					<Textarea
						id="descrizione"
						name="descrizione"
						placeholder="es. Seduta di psicoterapia individuale"
						bind:value={$form.descrizione}
						aria-invalid={$errors.descrizione ? 'true' : undefined}
						class={$errors.descrizione ? 'border-red-500' : ''}
					/>
					{#if $errors.descrizione}
						<p class="text-sm text-red-500 mt-1">{$errors.descrizione}</p>
					{/if}
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<Label for="importo">Importo (€) *</Label>
						<Input
							id="importo"
							name="importo"
							type="number"
							step="0.01"
							min="0"
							bind:value={$form.importo}
							aria-invalid={$errors.importo ? 'true' : undefined}
							class={$errors.importo ? 'border-red-500' : ''}
						/>
						{#if $errors.importo}
							<p class="text-sm text-red-500 mt-1">{$errors.importo}</p>
						{/if}
					</div>

					<div>
						<Label for="aliquotaIva">Aliquota IVA (%) *</Label>
						<Select.Root type="single" bind:value={aliquotaIvaString}>
							<Select.Trigger>
								{aliquotaIvaString}% - 
								{aliquotaIvaString === '0' ? 'Regime forfettario' :
								 aliquotaIvaString === '22' ? 'Aliquota ordinaria' :
								 aliquotaIvaString === '10' ? 'Aliquota ridotta' : 'Aliquota minima'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="0">0% - Regime forfettario</Select.Item>
								<Select.Item value="22">22% - Aliquota ordinaria</Select.Item>
								<Select.Item value="10">10% - Aliquota ridotta</Select.Item>
								<Select.Item value="4">4% - Aliquota minima</Select.Item>
							</Select.Content>
						</Select.Root>
						{#if $errors.aliquotaIva}
							<p class="text-sm text-red-500 mt-1">{$errors.aliquotaIva}</p>
						{/if}
					</div>
				</div>

				<div>
					<Label for="note">Note Aggiuntive</Label>
					<Textarea
						id="note"
						name="note"
						placeholder="Eventuali note o condizioni..."
						bind:value={$form.note}
						rows={2}
					/>
				</div>
			</CardContent>
		</Card>

		<!-- Riepilogo Fattura -->
		<Card class="bg-gray-50">
			<CardHeader>
				<CardTitle class="text-lg">Riepilogo Fattura</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-2">
					<div class="flex justify-between">
						<span>Imponibile:</span>
						<span>{formattatoreValuta.format(subtotale)}</span>
					</div>
					<div class="flex justify-between">
						<span>IVA ({$form.aliquotaIva}%):</span>
						<span>{formattatoreValuta.format(iva)}</span>
					</div>
					<div class="flex justify-between font-bold text-lg border-t pt-2">
						<span>Totale:</span>
						<span>{formattatoreValuta.format(totale)}</span>
					</div>
				</div>

				{#if $form.aliquotaIva === 0}
					<Alert class="mt-4">
						<AlertDescription>
							Operazione in regime forfettario ex art.1, c. 54-89 L.190/2014.
							Non soggetta a ritenuta d'acconto.
						</AlertDescription>
					</Alert>
				{/if}
			</CardContent>
		</Card>

		<!-- Azioni Form -->
		<div class="flex justify-between pt-6 border-t">
			<Button variant="outline" type="button" onclick={() => history.back()}>
				Annulla
			</Button>

			<Button type="submit" disabled={$submitting}>
				{#if $submitting}
					Creazione fattura...
				{:else}
					Crea e Scarica Fattura
				{/if}
			</Button>
		</div>
	</form>
</div>