<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { psychologistSchema } from '$lib/utils/validation';
	import { psychologists } from '$lib/stores/psychologists';
	import { goto } from '$app/navigation';
	import { zod } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';

	// Componenti UI
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';

	let { data } = $props();

	const { form, errors, enhance, constraints, submitting, tainted } = superForm(data.form, {
		validators: zod(psychologistSchema),
		dataType: 'json',
		resetForm: false,
		onSubmit: async ({ formData, cancel }) => {
			cancel();

			const datiPsicologo = {
				nome: $form.nome,
				cognome: $form.cognome,
				codiceFiscale: $form.codiceFiscale,
				partitaIva: $form.partitaIva,
				indirizzo: $form.indirizzo,
				telefono: $form.telefono,
				email: $form.email,
				numeroOrdine: $form.numeroOrdine || undefined,
				isPreferito: $form.isPreferito
			};

			psychologists.add(datiPsicologo);
			
			// Note: Set as preferred after adding if needed
			// This would need to be done after getting the new ID
			
			toast.success(`Psicologo ${datiPsicologo.nome} ${datiPsicologo.cognome} creato con successo`);
			setTimeout(() => {
				goto('/psicologi');
			}, 100);
		},
		onError: ({ result }) => {
			console.error('Errore form:', result);
			toast.error('Errore nella creazione del psicologo');
		}
	});
</script>

<div class="container mx-auto py-8 max-w-4xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900">Nuovo Psicologo</h1>
		<p class="text-gray-600 mt-2">Registra un nuovo professionista</p>
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
					<Label for="numeroOrdine">Numero Iscrizione Ordine</Label>
					<Input
						id="numeroOrdine"
						name="numeroOrdine"
						bind:value={$form.numeroOrdine}
						placeholder="es. 12345"
						{...$constraints.numeroOrdine}
						aria-invalid={$errors.numeroOrdine ? 'true' : undefined}
						class={$errors.numeroOrdine ? 'border-red-500' : ''}
					/>
					{#if $errors.numeroOrdine && $tainted?.numeroOrdine}
						<p class="text-sm text-red-500 mt-1">{$errors.numeroOrdine}</p>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Card Informazioni Professionali -->
		<Card>
			<CardHeader>
				<CardTitle>Informazioni Professionali</CardTitle>
			</CardHeader>
			<CardContent class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<Label for="partitaIva">Partita IVA *</Label>
					<Input
						id="partitaIva"
						name="partitaIva"
						bind:value={$form.partitaIva}
						placeholder="12345678901"
						{...$constraints.partitaIva}
						aria-invalid={$errors.partitaIva ? 'true' : undefined}
						class={$errors.partitaIva ? 'border-red-500' : ''}
					/>
					{#if $errors.partitaIva && $tainted?.partitaIva}
						<p class="text-sm text-red-500 mt-1">{$errors.partitaIva}</p>
					{/if}
				</div>

				<div>
					<Label for="telefono">Telefono *</Label>
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
					<Label for="email">Email *</Label>
					<Input
						id="email"
						name="email"
						type="email"
						bind:value={$form.email}
						placeholder="psicologo@esempio.com"
						{...$constraints.email}
						aria-invalid={$errors.email ? 'true' : undefined}
						class={$errors.email ? 'border-red-500' : ''}
					/>
					{#if $errors.email && $tainted?.email}
						<p class="text-sm text-red-500 mt-1">{$errors.email}</p>
					{/if}
				</div>

				<div>
					<Label for="indirizzo">Indirizzo Studio *</Label>
					<Input
						id="indirizzo"
						name="indirizzo"
						bind:value={$form.indirizzo}
						placeholder="Via Roma 1, 00100 Roma"
						{...$constraints.indirizzo}
						aria-invalid={$errors.indirizzo ? 'true' : undefined}
						class={$errors.indirizzo ? 'border-red-500' : ''}
					/>
					{#if $errors.indirizzo && $tainted?.indirizzo}
						<p class="text-sm text-red-500 mt-1">{$errors.indirizzo}</p>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Card Impostazioni -->
		<Card>
			<CardContent class="pt-6">
				<div class="flex items-start space-x-2">
					<Checkbox
						id="isPreferito"
						name="isPreferito"
						bind:checked={$form.isPreferito}
					/>
					<div class="grid gap-1.5 leading-none">
						<Label
							for="isPreferito"
							class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							Imposta come Psicologo Preferito
						</Label>
						<p class="text-xs text-muted-foreground">
							Il psicologo preferito verrà automaticamente selezionato nella creazione delle fatture
						</p>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Azioni Form -->
		<div class="flex justify-between pt-6 border-t">
			<Button variant="outline" type="button" onclick={() => history.back()}>
				Annulla
			</Button>

			<div class="flex gap-3">
				<Button type="submit" disabled={$submitting}>
					{#if $submitting}
						Creazione psicologo...
					{:else}
						Crea Psicologo
					{/if}
				</Button>
			</div>
		</div>
	</form>
</div>