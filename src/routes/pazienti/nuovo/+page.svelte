<script lang="ts">
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
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';

	let { data } = $props();

	const { form, errors, enhance, constraints, submitting, tainted } = superForm(data.form, {
		validators: zod(patientSchema),
		dataType: 'json',
		resetForm: false,
		onSubmit: async ({ formData, cancel }) => {
			// Gestisce l'invio del form lato client per localStorage
			cancel(); // Previene l'invio al server

			// With dataType: 'json', form data is already properly structured
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

			patients.add(datiPaziente);
			toast.success(`Paziente ${datiPaziente.nome} ${datiPaziente.cognome} creato con successo`);
			setTimeout(() => {
				goto('/pazienti');
			}, 100);
		},
		onError: ({ result }) => {
			console.error('Errore form:', result);
			toast.error('Errore nella creazione del paziente');
		}
	});
</script>

<div class="container mx-auto py-8 max-w-4xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Nuovo Paziente</h1>
		<p class="text-gray-600 mt-2">Compila le informazioni complete del paziente per la cartella clinica</p>
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

		<!-- Card Contatto di Emergenza -->
		<Card>
			<CardHeader>
				<CardTitle>Contatto di Emergenza</CardTitle>
			</CardHeader>
			<CardContent class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<Label for="contattoEmergenza.nome">Nome Contatto *</Label>
					<Input
						id="contattoEmergenza.nome"
						name="contattoEmergenza.nome"
						bind:value={$form.contattoEmergenza.nome}
						aria-invalid={$errors.contattoEmergenza?.nome ? 'true' : undefined}
						class={$errors.contattoEmergenza?.nome ? 'border-red-500' : ''}
					/>
					{#if $errors.contattoEmergenza?.nome && $tainted?.contattoEmergenza?.nome}
						<p class="text-sm text-red-500 mt-1">{$errors.contattoEmergenza.nome}</p>
					{/if}
				</div>

				<div>
					<Label for="contattoEmergenza.telefono">Telefono Contatto *</Label>
					<Input
						id="contattoEmergenza.telefono"
						name="contattoEmergenza.telefono"
						bind:value={$form.contattoEmergenza.telefono}
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
						placeholder="es. Coniuge, Genitore, Amico"
						aria-invalid={$errors.contattoEmergenza?.parentela ? 'true' : undefined}
						class={$errors.contattoEmergenza?.parentela ? 'border-red-500' : ''}
					/>
					{#if $errors.contattoEmergenza?.parentela && $tainted?.contattoEmergenza?.parentela}
						<p class="text-sm text-red-500 mt-1">{$errors.contattoEmergenza.parentela}</p>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Card Informazioni Cliniche -->
		<Card>
			<CardHeader>
				<CardTitle>Informazioni Cliniche</CardTitle>
				<p class="text-sm text-gray-600">Opzionale - può essere completato successivamente</p>
			</CardHeader>
			<CardContent class="space-y-4">
				<div>
					<Label for="anamnesi">Anamnesi</Label>
					<Textarea
						id="anamnesi"
						name="anamnesi"
						placeholder="Diagnosi precedenti, interventi, allergie, ecc."
						rows={3}
						bind:value={$form.anamnesi}
					/>
				</div>
			</CardContent>
		</Card>

		<!-- Sezione Consenso -->
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
							Consenso al Trattamento dei Dati *
						</Label>
						<p class="text-xs text-muted-foreground">
							Acconsento al trattamento dei miei dati personali e sanitari secondo il Regolamento GDPR ai fini del trattamento psicologico.
						</p>
					</div>
				</div>
				{#if $errors.consensoTrattamentoDati && $tainted?.consensoTrattamentoDati}
					<p class="text-sm text-red-500 mt-2">{$errors.consensoTrattamentoDati}</p>
				{/if}
			</CardContent>
		</Card>

		<!-- Azioni Form -->
		<div class="flex justify-between pt-6 border-t">
			<Button variant="outline" type="button" onclick={() => goto('/pazienti')}>
				Annulla
			</Button>

			<div class="flex gap-3">
				<Button type="submit" disabled={$submitting}>
					{#if $submitting}
						Creazione paziente...
					{:else}
						Crea Paziente
					{/if}
				</Button>
			</div>
		</div>
	</form>
</div>