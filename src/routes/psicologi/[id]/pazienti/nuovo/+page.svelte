<script lang="ts">
	import { get } from 'svelte/store';
	import { superForm } from 'sveltekit-superforms/client';
	import { patientSchema } from '$lib/utils/validation';
	import { patients } from '$lib/stores/patients';
	import { psychologists } from '$lib/stores/psychologists';
	import { invoices } from '$lib/stores/invoices';
	import { goto } from '$app/navigation';
	import { zod } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';

	// Componenti UI
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { User } from 'lucide-svelte';

	let { data } = $props();
	
	let psychologist = $state<any>(null);
	
	$effect(() => {
		const unsubPsychologists = psychologists.subscribe(psychs => {
			psychologist = psychs.find(p => p.id === Number(data.psychologistId));
		});
		
		return () => unsubPsychologists();
	});

	const { form, errors, enhance, constraints, submitting, tainted } = superForm(data.form, {
		validators: zod(patientSchema),
		dataType: 'json',
		resetForm: false,
		validationMethod: 'onblur',
		onSubmit: async ({ formData, cancel }) => {
			cancel();

			const datiPaziente = {
				nome: $form.nome,
				cognome: $form.cognome,
				codiceFiscale: $form.codiceFiscale,
				email: $form.email || undefined,
				telefono: $form.telefono || undefined,
				dataNascita: $form.dataNascita,
				contattoEmergenza: $form.contattoEmergenza,
				anamnesi: $form.anamnesi || undefined,
				consensoTrattamentoDati: $form.consensoTrattamentoDati
			};

			// Add patient
			patients.add(datiPaziente);
			
			// Create first invoice to establish relationship with this psychologist
			// This ensures the patient appears in this psychologist's patient list
			const newPatientId = Date.now(); // This will be the patient's ID
			const firstInvoice = {
				idPaziente: newPatientId.toString(),
				idPsicologo: data.psychologistId,
				numeroFattura: invoices.getNextInvoiceNumber(),
				data: new Date().toISOString().split('T')[0],
				descrizione: 'Prima consulenza',
				importo: 0, // Can be 0 for initial registration
				aliquotaIva: 0,
				stato: 'emessa' as const,
				paziente: { ...datiPaziente, id: newPatientId },
				psicologo: psychologist,
				// Required fields
				dettaglioSedute: false,
				numeroSedute: 0,
				tipoPrestazione: 'sostegno_psicologico' as const,
				speseAnticipate: 0,
				mostraPrivacy: false,
				modalitaPagamento: 'bonifico' as const,
				regimeFiscale: 'forfettario' as const,
				marcaDaBollo: false,
				importoMarcaDaBollo: 2.00,
				note: 'Registrazione iniziale paziente'
			};
			
			invoices.add(firstInvoice);
			
			toast.success(`Paziente ${datiPaziente.nome} ${datiPaziente.cognome} aggiunto a Dr. ${psychologist?.nome} ${psychologist?.cognome}`);
			setTimeout(() => {
				goto(`/psicologi/${data.psychologistId}/pazienti`);
			}, 100);
		},
		onError: ({ result }) => {
			console.error('Errore form:', result);
			toast.error('Errore nella creazione del paziente');
		}
	});
</script>

<div class="space-y-6">
	<!-- Header with Context -->
	<div class="flex justify-between items-center">
		<div>
			<h3 class="text-lg font-semibold">Nuovo Paziente</h3>
			<p class="text-sm text-gray-600 mt-1">
				Registra un nuovo paziente per {psychologist ? `Dr. ${psychologist.nome} ${psychologist.cognome}` : 'questo psicologo'}
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
		<!-- Card Informazioni Personali -->
		<Card>
			<CardHeader>
				<CardTitle>Informazioni Personali</CardTitle>
			</CardHeader>
			<CardContent class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<Label for="nome">Nome *</Label>
					<Input
						id="nome"
						name="nome"
						bind:value={$form.nome}
						{...$constraints.nome}
						aria-invalid={$errors.nome ? 'true' : undefined}
						class={$errors.nome ? 'border-red-500' : ''}
					/>
					{#if $errors.nome && $tainted?.nome}
						<p class="text-sm text-red-500 mt-1">{$errors.nome}</p>
					{/if}
				</div>

				<div>
					<Label for="cognome">Cognome *</Label>
					<Input
						id="cognome"
						name="cognome"
						bind:value={$form.cognome}
						{...$constraints.cognome}
						aria-invalid={$errors.cognome ? 'true' : undefined}
						class={$errors.cognome ? 'border-red-500' : ''}
					/>
					{#if $errors.cognome && $tainted?.cognome}
						<p class="text-sm text-red-500 mt-1">{$errors.cognome}</p>
					{/if}
				</div>

				<div>
					<Label for="codiceFiscale">Codice Fiscale *</Label>
					<Input
						id="codiceFiscale"
						name="codiceFiscale"
						bind:value={$form.codiceFiscale}
						placeholder="RSSMRA85M01H501Z"
						{...$constraints.codiceFiscale}
						aria-invalid={$errors.codiceFiscale ? 'true' : undefined}
						class={$errors.codiceFiscale ? 'border-red-500' : ''}
						style="text-transform: uppercase"
					/>
					{#if $errors.codiceFiscale && $tainted?.codiceFiscale}
						<p class="text-sm text-red-500 mt-1">{$errors.codiceFiscale}</p>
					{/if}
				</div>

				<div>
					<Label for="dataNascita">Data di Nascita *</Label>
					<Input
						id="dataNascita"
						name="dataNascita"
						type="date"
						bind:value={$form.dataNascita}
						{...$constraints.dataNascita}
						aria-invalid={$errors.dataNascita ? 'true' : undefined}
						class={$errors.dataNascita ? 'border-red-500' : ''}
					/>
					{#if $errors.dataNascita && $tainted?.dataNascita}
						<p class="text-sm text-red-500 mt-1">{$errors.dataNascita}</p>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Card Contatti -->
		<Card>
			<CardHeader>
				<CardTitle>Informazioni di Contatto</CardTitle>
			</CardHeader>
			<CardContent class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<Label for="telefono">Telefono</Label>
					<Input
						id="telefono"
						name="telefono"
						bind:value={$form.telefono}
						placeholder="+39 xxx xxx xxxx"
						{...$constraints.telefono}
						aria-invalid={$errors.telefono ? 'true' : undefined}
						class={$errors.telefono ? 'border-red-500' : ''}
					/>
					{#if $errors.telefono && $tainted?.telefono}
						<p class="text-sm text-red-500 mt-1">{$errors.telefono}</p>
					{/if}
				</div>

				<div>
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						bind:value={$form.email}
						placeholder="paziente@esempio.com"
						{...$constraints.email}
						aria-invalid={$errors.email ? 'true' : undefined}
						class={$errors.email ? 'border-red-500' : ''}
					/>
					{#if $errors.email && $tainted?.email}
						<p class="text-sm text-red-500 mt-1">{$errors.email}</p>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Card Contatto Emergenza -->
		<Card>
			<CardHeader>
				<CardTitle>Contatto di Emergenza *</CardTitle>
			</CardHeader>
			<CardContent class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<Label for="contattoEmergenza.nome">Nome *</Label>
					<Input
						id="contattoEmergenza.nome"
						name="contattoEmergenza.nome"
						bind:value={$form.contattoEmergenza.nome}
						{...$constraints.contattoEmergenza?.nome}
						aria-invalid={$errors.contattoEmergenza?.nome ? 'true' : undefined}
						class={$errors.contattoEmergenza?.nome ? 'border-red-500' : ''}
					/>
					{#if $errors.contattoEmergenza?.nome && $tainted?.contattoEmergenza?.nome}
						<p class="text-sm text-red-500 mt-1">{$errors.contattoEmergenza.nome}</p>
					{/if}
				</div>

				<div>
					<Label for="contattoEmergenza.telefono">Telefono *</Label>
					<Input
						id="contattoEmergenza.telefono"
						name="contattoEmergenza.telefono"
						bind:value={$form.contattoEmergenza.telefono}
						placeholder="+39 xxx xxx xxxx"
						{...$constraints.contattoEmergenza?.telefono}
						aria-invalid={$errors.contattoEmergenza?.telefono ? 'true' : undefined}
						class={$errors.contattoEmergenza?.telefono ? 'border-red-500' : ''}
					/>
					{#if $errors.contattoEmergenza?.telefono && $tainted?.contattoEmergenza?.telefono}
						<p class="text-sm text-red-500 mt-1">{$errors.contattoEmergenza.telefono}</p>
					{/if}
				</div>

				<div>
					<Label for="contattoEmergenza.parentela">Parentela *</Label>
					<Input
						id="contattoEmergenza.parentela"
						name="contattoEmergenza.parentela"
						bind:value={$form.contattoEmergenza.parentela}
						placeholder="es. Madre, Padre, Coniuge"
						{...$constraints.contattoEmergenza?.parentela}
						aria-invalid={$errors.contattoEmergenza?.parentela ? 'true' : undefined}
						class={$errors.contattoEmergenza?.parentela ? 'border-red-500' : ''}
					/>
					{#if $errors.contattoEmergenza?.parentela && $tainted?.contattoEmergenza?.parentela}
						<p class="text-sm text-red-500 mt-1">{$errors.contattoEmergenza.parentela}</p>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Card Note Anamnestiche -->
		<Card>
			<CardHeader>
				<CardTitle>Note Anamnestiche</CardTitle>
			</CardHeader>
			<CardContent>
				<div>
					<Label for="anamnesi">Anamnesi (opzionale)</Label>
					<Textarea
						id="anamnesi"
						name="anamnesi"
						bind:value={$form.anamnesi}
						placeholder="Note anamnestiche del paziente..."
						rows={4}
					/>
				</div>
			</CardContent>
		</Card>

		<!-- Card Privacy -->
		<Card>
			<CardContent class="pt-6">
				<div class="flex items-start space-x-2">
					<Checkbox
						id="consensoTrattamentoDati"
						name="consensoTrattamentoDati"
						bind:checked={$form.consensoTrattamentoDati}
						aria-invalid={$errors.consensoTrattamentoDati ? 'true' : undefined}
					/>
					<div class="grid gap-1.5 leading-none">
						<Label
							for="consensoTrattamentoDati"
							class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							Consenso al Trattamento Dati *
						</Label>
						<p class="text-xs text-muted-foreground">
							Il paziente acconsente al trattamento dei dati personali secondo la normativa GDPR
						</p>
						{#if $errors.consensoTrattamentoDati && $tainted?.consensoTrattamentoDati}
							<p class="text-sm text-red-500">{$errors.consensoTrattamentoDati}</p>
						{/if}
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Azioni Form -->
		<div class="flex justify-between pt-6 border-t">
			<Button 
				variant="outline" 
				type="button" 
				onclick={() => goto(`/psicologi/${data.psychologistId}/pazienti`)}
			>
				Annulla
			</Button>

			<Button type="submit" disabled={$submitting}>
				{#if $submitting}
					Registrazione paziente...
				{:else}
					Registra Paziente
				{/if}
			</Button>
		</div>
	</form>
</div>