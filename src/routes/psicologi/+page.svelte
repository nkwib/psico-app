<script lang="ts">
	import { get } from 'svelte/store';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Plus, Edit, Trash2, Star, StarOff } from 'lucide-svelte';
	import { psychologists, preferredPsychologist } from '$lib/stores/psychologists';
	import { formattatoreData } from '$lib/utils/italiano';
	import ConfermaDialog from '$lib/components/ConfermaDialog.svelte';
	import { toast } from 'svelte-sonner';
	import type { Psychologist } from '$lib/utils/validation';

	let mostraConfermaEliminazione = $state(false);
	let psicologoDaEliminare = $state<Psychologist | null>(null);
	
	let psychologistsData = $state(get(psychologists));
	let preferredPsychologistData = $state(get(preferredPsychologist));
	
	$effect(() => {
		const unsubPsychologists = psychologists.subscribe(value => psychologistsData = value);
		const unsubPreferred = preferredPsychologist.subscribe(value => preferredPsychologistData = value);
		
		// Fix any data inconsistencies on page load
		psychologists.fixPreferredStatus();
		
		return () => {
			unsubPsychologists();
			unsubPreferred();
		};
	});

	function confermaEliminazione(psicologo: Psychologist) {
		psicologoDaEliminare = psicologo;
		mostraConfermaEliminazione = true;
	}

	function eliminaPsicologo() {
		if (psicologoDaEliminare?.id) {
			psychologists.remove(psicologoDaEliminare.id);
			toast.success(`Psicologo ${psicologoDaEliminare.nome} ${psicologoDaEliminare.cognome} eliminato con successo`);
			psicologoDaEliminare = null;
		}
	}

	function impostaPreferito(id: number) {
		psychologists.setPreferred(id);
		const psicologo = psychologistsData.find(p => p.id === id);
		if (psicologo) {
			toast.success(`${psicologo.nome} ${psicologo.cognome} impostato come psicologo preferito`);
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Psicologi</h1>
			<p class="text-gray-600 mt-1">Gestisci i profili dei professionisti</p>
		</div>
		<Button href="/psicologi/nuovo">
			<Plus class="w-4 h-4 mr-2" />
			Nuovo Psicologo
		</Button>
	</div>

	<!-- Preferred Psychologist Card -->
	{#if preferredPsychologistData}
		<Card class="border-blue-200 bg-blue-50">
			<CardHeader>
				<CardTitle class="text-lg flex items-center gap-2">
					<Star class="w-5 h-5 text-yellow-500 fill-yellow-500" />
					Psicologo Preferito
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<p class="text-sm text-gray-600">Nome</p>
						<p class="font-medium">Dott. {preferredPsychologistData.nome} {preferredPsychologistData.cognome}</p>
					</div>
					<div>
						<p class="text-sm text-gray-600">Partita IVA</p>
						<p class="font-medium">{preferredPsychologistData.partitaIva}</p>
					</div>
					<div>
						<p class="text-sm text-gray-600">Codice Fiscale</p>
						<p class="font-medium">{preferredPsychologistData.codiceFiscale}</p>
					</div>
					<div>
						<p class="text-sm text-gray-600">Email</p>
						<p class="font-medium">{preferredPsychologistData.email}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Psychologists Table -->
	<Card>
		<CardHeader>
			<CardTitle>Lista Psicologi ({psychologistsData.length})</CardTitle>
		</CardHeader>
		<CardContent>
			{#if psychologistsData.length > 0}
				<div class="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nome</TableHead>
								<TableHead>Codice Fiscale</TableHead>
								<TableHead>Partita IVA</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Telefono</TableHead>
								<TableHead>Preferito</TableHead>
								<TableHead class="text-right">Azioni</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each psychologistsData as psicologo}
								<TableRow>
									<TableCell class="font-medium">
										Dott. {psicologo.nome} {psicologo.cognome}
									</TableCell>
									<TableCell>{psicologo.codiceFiscale}</TableCell>
									<TableCell>{psicologo.partitaIva}</TableCell>
									<TableCell>{psicologo.email}</TableCell>
									<TableCell>{psicologo.telefono}</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="icon"
											onclick={() => psicologo.id && impostaPreferito(psicologo.id)}
										>
											{#if psicologo.isPreferito}
												<Star class="w-4 h-4 text-yellow-500 fill-yellow-500" />
											{:else}
												<StarOff class="w-4 h-4 text-gray-400" />
											{/if}
										</Button>
									</TableCell>
									<TableCell class="text-right">
										<div class="flex justify-end gap-2">
											<Button 
												href="/psicologi/{psicologo.id}/modifica" 
												variant="ghost" 
												size="icon"
											>
												<Edit class="w-4 h-4" />
											</Button>
											<Button 
												variant="ghost" 
												size="icon"
												onclick={() => confermaEliminazione(psicologo)}
											>
												<Trash2 class="w-4 h-4 text-red-500" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>
			{:else}
				<div class="text-center py-12">
					<p class="text-gray-500 mb-4">Nessun psicologo registrato</p>
					<Button href="/psicologi/nuovo">
						<Plus class="w-4 h-4 mr-2" />
						Aggiungi il primo psicologo
					</Button>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>

<!-- Dialog di conferma eliminazione -->
<ConfermaDialog
	bind:open={mostraConfermaEliminazione}
	titolo="Elimina Psicologo"
	descrizione={`Sei sicuro di voler eliminare il profilo di ${psicologoDaEliminare?.nome} ${psicologoDaEliminare?.cognome}? Questa azione eliminerà definitivamente tutti i dati associati. Questa operazione non può essere annullata.`}
	testoConferma="Elimina Psicologo"
	testoAnnulla="Annulla"
	variante="destructive"
	onConferma={eliminaPsicologo}
	onAnnulla={() => psicologoDaEliminare = null}
/>