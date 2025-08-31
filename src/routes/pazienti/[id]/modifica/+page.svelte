<script lang="ts">
	import { get } from 'svelte/store';
	import { page } from '$app/stores';
	import { superForm } from 'sveltekit-superforms/client';
	import { patientSchema } from '$lib/utils/validation';
	import { patients } from '$lib/stores/patients';
	import { goto } from '$app/navigation';
	import { zod } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';

	// Componenti UI
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';

	let { data } = $props();
	
	let patientsData = $state(get(patients));
	let paziente = $state<any>(null);
	let isEditing = $state(false);
	
	$effect(() => {
		const unsubPatients = patients.subscribe(value => patientsData = value);
		
		return () => {
			unsubPatients();
		};
	});

	// Get patient ID from URL and find patient data
	$effect(() => {
		const patientId = $page.params.id;
		if (patientId && patientsData.length > 0) {
			paziente = patientsData.find(p => p.id?.toString() === patientId) || null;
			
			if (paziente) {
				// Pre-populate the form with patient data
				$form.nome = paziente.nome;
				$form.cognome = paziente.cognome;
				$form.codiceFiscale = paziente.codiceFiscale;
				$form.dataNascita = paziente.dataNascita;
				$form.telefono = paziente.telefono;
				$form.email = paziente.email;
				$form.luogoNascita = paziente.luogoNascita || '';
				$form.indirizzo = paziente.indirizzo || '';
				$form.cap = paziente.cap || '';
				$form.citta = paziente.citta || '';
				$form.provincia = paziente.provincia || '';
				$form.dataConsenso = paziente.dataConsenso || '';
				$form.anamnesi = paziente.anamnesi || '';
				$form.farmaci = paziente.farmaci || '';
				
				// Handle emergency contact
				if (paziente.contattoEmergenza) {
					$form.contattoEmergenza = {
						nome: paziente.contattoEmergenza.nome || '',
						telefono: paziente.contattoEmergenza.telefono || '',
						parentela: paziente.contattoEmergenza.parentela || ''
					};
				} else {
					$form.contattoEmergenza = {
						nome: '',
						telefono: '',
						parentela: ''
					};
				}
				
				isEditing = true;
			}
		}
	});

	const { form, errors, enhance, constraints, submitting, tainted } = superForm(data.form, {
		validators: zod(patientSchema),
		dataType: 'json',
		resetForm: false,
		validationMethod: 'onblur',
		onSubmit: async ({ formData, cancel }) => {
			cancel();

			if (!paziente?.id) {
				toast.error('Paziente non trovato');
				return;
			}

			const datiPaziente = {
				nome: $form.nome,
				cognome: $form.cognome,
				codiceFiscale: $form.codiceFiscale,
				dataNascita: $form.dataNascita,
				telefono: $form.telefono,
				email: $form.email,
				luogoNascita: $form.luogoNascita || undefined,
				indirizzo: $form.indirizzo || undefined,
				cap: $form.cap || undefined,
				citta: $form.citta || undefined,
				provincia: $form.provincia || undefined,
				dataConsenso: $form.dataConsenso || undefined,
				anamnesi: $form.anamnesi || undefined,
				farmaci: $form.farmaci || undefined,
				contattoEmergenza: $form.contattoEmergenza
			};

			patients.update(paziente.id, datiPaziente);
			
			toast.success(`Paziente ${datiPaziente.nome} ${datiPaziente.cognome} aggiornato con successo`);
			setTimeout(() => {
				goto(`/pazienti/${paziente.id}`);
			}, 100);
		},
		onError: ({ result }) => {
			console.error('Errore form:', result);
			toast.error('Errore nell\'aggiornamento del paziente');
		}
	});
</script>

<div class="container mx-auto py-8 max-w-4xl">
	{#if paziente}
		<!-- Header -->
		<div class="mb-6">
			<h1 class="text-3xl font-bold text-gray-900">Modifica Paziente</h1>
			<p class="text-gray-600 mt-2">Aggiorna le informazioni del paziente {paziente.nome} {paziente.cognome}</p>
		</div>

		<form method="POST" use:enhance class="space-y-6">
			<!-- Card Informazioni Anagrafiche -->
			<Card>
				<CardHeader>
					<CardTitle>Informazioni Anagrafiche</CardTitle>
				</CardHeader>
				<CardContent class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<Label for="nome">Nome *</Label>
						<Input
							id="nome"
							name="nome"
							bind:value={$form.nome}
							placeholder="Mario"
							{...$constraints.nome}
							aria-invalid={$tainted?.nome && $errors.nome ? 'true' : undefined}
							class={$tainted?.nome && $errors.nome ? 'border-red-500' : ''}
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
							placeholder="Rossi"
							{...$constraints.cognome}
							aria-invalid={$tainted?.cognome && $errors.cognome ? 'true' : undefined}
							class={$tainted?.cognome && $errors.cognome ? 'border-red-500' : ''}
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
							aria-invalid={$tainted?.codiceFiscale && $errors.codiceFiscale ? 'true' : undefined}
							class={$tainted?.codiceFiscale && $errors.codiceFiscale ? 'border-red-500' : ''}
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
							aria-invalid={$tainted?.dataNascita && $errors.dataNascita ? 'true' : undefined}
							class={$tainted?.dataNascita && $errors.dataNascita ? 'border-red-500' : ''}
						/>
						{#if $errors.dataNascita && $tainted?.dataNascita}
							<p class="text-sm text-red-500 mt-1">{$errors.dataNascita}</p>
						{/if}
					</div>

					<div>
						<Label for="luogoNascita">Luogo di Nascita</Label>
						<Input
							id="luogoNascita"
							name="luogoNascita"
							bind:value={$form.luogoNascita}
							placeholder="Roma"
						/>
					</div>

					<div>
						<Label for="telefono">Telefono *</Label>
						<Input
							id="telefono"
							name="telefono"
							bind:value={$form.telefono}
							placeholder="+39 xxx xxx xxxx"
							aria-invalid={$tainted?.telefono && $errors.telefono ? 'true' : undefined}
							class={$tainted?.telefono && $errors.telefono ? 'border-red-500' : ''}
						/>
						{#if $errors.telefono && $tainted?.telefono}
							<p class="text-sm text-red-500 mt-1">{$errors.telefono}</p>
						{/if}
					</div>

					<div>
						<Label for="email">Email *</Label>
						<Input
							id="email"
							name="email"
							type="email"
							bind:value={$form.email}
							placeholder="paziente@esempio.com"
							aria-invalid={$tainted?.email && $errors.email ? 'true' : undefined}
							class={$tainted?.email && $errors.email ? 'border-red-500' : ''}
						/>
						{#if $errors.email && $tainted?.email}
							<p class="text-sm text-red-500 mt-1">{$errors.email}</p>
						{/if}
					</div>
				</CardContent>
			</Card>

			<!-- Card Indirizzo -->
			<Card>
				<CardHeader>
					<CardTitle>Indirizzo</CardTitle>
				</CardHeader>
				<CardContent class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<Label for="indirizzo">Indirizzo</Label>
						<Input
							id="indirizzo"
							name="indirizzo"
							bind:value={$form.indirizzo}
							placeholder="Via Roma 123"
						/>
					</div>

					<div>
						<Label for="cap">CAP</Label>
						<Input
							id="cap"
							name="cap"
							bind:value={$form.cap}
							placeholder="00100"
						/>
					</div>

					<div>
						<Label for="citta">Città</Label>
						<Input
							id="citta"
							name="citta"
							bind:value={$form.citta}
							placeholder="Roma"
						/>
					</div>

					<div>
						<Label for="provincia">Provincia</Label>
						<Input
							id="provincia"
							name="provincia"
							bind:value={$form.provincia}
							placeholder="RM"
						/>
					</div>
				</CardContent>
			</Card>

			<!-- Card Contatto Emergenza -->
			<Card>
				<CardHeader>
					<CardTitle>Contatto di Emergenza</CardTitle>
				</CardHeader>
				<CardContent class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<Label for="contattoEmergenzaNome">Nome</Label>
						<Input
							id="contattoEmergenzaNome"
							name="contattoEmergenzaNome"
							value={$form.contattoEmergenza?.nome || ''}
							oninput={(e) => {
								const target = e.target as HTMLInputElement;
								$form.contattoEmergenza = {
									nome: target.value,
									telefono: $form.contattoEmergenza?.telefono || '',
									parentela: $form.contattoEmergenza?.parentela || ''
								};
							}}
							placeholder="Nome contatto"
						/>
					</div>

					<div>
						<Label for="contattoEmergenzaTelefono">Telefono</Label>
						<Input
							id="contattoEmergenzaTelefono"
							name="contattoEmergenzaTelefono"
							value={$form.contattoEmergenza?.telefono || ''}
							oninput={(e) => {
								const target = e.target as HTMLInputElement;
								$form.contattoEmergenza = {
									nome: $form.contattoEmergenza?.nome || '',
									telefono: target.value,
									parentela: $form.contattoEmergenza?.parentela || ''
								};
							}}
							placeholder="+39 xxx xxx xxxx"
						/>
					</div>

					<div>
						<Label for="contattoEmergenzaParentela">Parentela</Label>
						<Input
							id="contattoEmergenzaParentela"
							name="contattoEmergenzaParentela"
							value={$form.contattoEmergenza?.parentela || ''}
							oninput={(e) => {
								const target = e.target as HTMLInputElement;
								$form.contattoEmergenza = {
									nome: $form.contattoEmergenza?.nome || '',
									telefono: $form.contattoEmergenza?.telefono || '',
									parentela: target.value
								};
							}}
							placeholder="es. Coniuge, Genitore"
						/>
					</div>
				</CardContent>
			</Card>

			<!-- Card Informazioni Mediche -->
			<Card>
				<CardHeader>
					<CardTitle>Informazioni Mediche</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div>
						<Label for="anamnesi">Anamnesi</Label>
						<textarea
							id="anamnesi"
							name="anamnesi"
							bind:value={$form.anamnesi}
							rows={3}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Storia medica del paziente..."
						></textarea>
					</div>

					<div>
						<Label for="farmaci">Farmaci Assunti</Label>
						<textarea
							id="farmaci"
							name="farmaci"
							bind:value={$form.farmaci}
							rows={3}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Farmaci attualmente assunti dal paziente..."
						></textarea>
					</div>

					<div>
						<Label for="dataConsenso">Data Consenso Privacy</Label>
						<Input
							id="dataConsenso"
							name="dataConsenso"
							type="date"
							bind:value={$form.dataConsenso}
						/>
					</div>
				</CardContent>
			</Card>

			<!-- Azioni Form -->
			<div class="flex justify-between pt-6 border-t">
				<Button variant="outline" type="button" onclick={() => history.back()}>
					Annulla
				</Button>

				<Button type="submit" disabled={$submitting}>
					{#if $submitting}
						Aggiornamento...
					{:else}
						Aggiorna Paziente
					{/if}
				</Button>
			</div>
		</form>
	{:else}
		<!-- Patient Not Found -->
		<div class="text-center py-12">
			<h2 class="text-2xl font-bold text-gray-900 mb-4">Paziente non trovato</h2>
			<p class="text-gray-600 mb-6">Il paziente richiesto non esiste o è stato eliminato.</p>
			<Button href="/pazienti">
				Torna alla Lista Pazienti
			</Button>
		</div>
	{/if}
</div>
