<script lang="ts">
	import { get } from 'svelte/store';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Plus, Search, Edit, Trash2, FileText, MoreVertical } from 'lucide-svelte';
	import { patients, filteredPatients, searchTerm } from '$lib/stores/patients';
	import { formattatoreData } from '$lib/utils/italiano';
	import ConfermaDialog from '$lib/components/ConfermaDialog.svelte';
	import { toast } from 'svelte-sonner';
	import type { Patient } from '$lib/utils/validation';

	let mostraConfermaEliminazione = $state(false);
	let pazienteDaEliminare = $state<Patient | null>(null);
	
	let patientsData = $state(get(patients));
	let searchTermValue = $state(get(searchTerm));
	let filteredPatientsData = $state(get(filteredPatients));
	
	$effect(() => {
		const unsubPatients = patients.subscribe(value => patientsData = value);
		const unsubSearchTerm = searchTerm.subscribe(value => searchTermValue = value);
		const unsubFiltered = filteredPatients.subscribe(value => filteredPatientsData = value);
		
		return () => {
			unsubPatients();
			unsubSearchTerm();
			unsubFiltered();
		};
	});

	function confermaEliminazione(paziente: Patient) {
		pazienteDaEliminare = paziente;
		mostraConfermaEliminazione = true;
	}

	function eliminaPaziente() {
		if (pazienteDaEliminare?.id) {
			patients.remove(pazienteDaEliminare.id);
			toast.success(`Paziente ${pazienteDaEliminare.nome} ${pazienteDaEliminare.cognome} eliminato con successo`);
			pazienteDaEliminare = null;
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Pazienti</h1>
			<p class="text-gray-600 mt-1">Gestisci i tuoi pazienti</p>
		</div>
		<Button href="/pazienti/nuovo">
			<Plus class="w-4 h-4 mr-2" />
			Nuovo Paziente
		</Button>
	</div>

	<!-- Search Bar -->
	<Card>
		<CardContent class="pt-6">
			<div class="relative">
				<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
				<Input
					type="text"
					placeholder="Cerca per nome, cognome o codice fiscale..."
					value={searchTermValue}
					onchange={(e) => searchTerm.set(e.currentTarget.value)}
					class="pl-10"
				/>
			</div>
		</CardContent>
	</Card>

	<!-- Patients Table -->
	<Card>
		<CardHeader>
			<CardTitle>Lista Pazienti ({filteredPatientsData.length})</CardTitle>
		</CardHeader>
		<CardContent>
			{#if filteredPatientsData.length > 0}
				<div class="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nome</TableHead>
								<TableHead>Codice Fiscale</TableHead>
								<TableHead>Telefono</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Data Registrazione</TableHead>
								<TableHead class="text-right">Azioni</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each filteredPatientsData as paziente}
								<TableRow>
									<TableCell class="font-medium">
										<Button 
											href="/pazienti/{paziente.id}" 
											variant="link" 
											class="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
										>
											{paziente.nome} {paziente.cognome}
										</Button>
									</TableCell>
									<TableCell>{paziente.codiceFiscale}</TableCell>
									<TableCell>{paziente.telefono || '-'}</TableCell>
									<TableCell>{paziente.email || '-'}</TableCell>
									<TableCell>
										{paziente.dataCreazione 
											? formattatoreData.format(new Date(paziente.dataCreazione))
											: '-'}
									</TableCell>
									<TableCell class="text-right">
										<div class="flex justify-end gap-2">
											<Button 
												href="/pazienti/{paziente.id}/modifica" 
												variant="ghost" 
												size="icon"
											>
												<Edit class="w-4 h-4" />
											</Button>
											<Button 
												href="/fatture/nuova?paziente={paziente.id}" 
												variant="ghost" 
												size="icon"
											>
												<FileText class="w-4 h-4" />
											</Button>
											<Button 
												variant="ghost" 
												size="icon"
												onclick={() => confermaEliminazione(paziente)}
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
					<p class="text-gray-500 mb-4">
						{searchTermValue ? 'Nessun paziente trovato con i criteri di ricerca' : 'Nessun paziente registrato'}
					</p>
					{#if !searchTermValue}
						<Button href="/pazienti/nuovo">
							<Plus class="w-4 h-4 mr-2" />
							Aggiungi il primo paziente
						</Button>
					{/if}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>

<!-- Dialog di conferma eliminazione -->
<ConfermaDialog
	bind:open={mostraConfermaEliminazione}
	titolo="Elimina Paziente"
	descrizione={`Sei sicuro di voler eliminare il paziente ${pazienteDaEliminare?.nome} ${pazienteDaEliminare?.cognome}? Questa azione eliminerà definitivamente tutti i dati associati, incluse le fatture. Questa operazione non può essere annullata.`}
	testoConferma="Elimina Paziente"
	testoAnnulla="Annulla"
	variante="destructive"
	onConferma={eliminaPaziente}
	onAnnulla={() => pazienteDaEliminare = null}
/>