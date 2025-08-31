<script lang="ts">
	import { get } from 'svelte/store';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Plus, Search, Edit, Trash2, FileText, User } from 'lucide-svelte';
	import { patients } from '$lib/stores/patients';
	import { invoices } from '$lib/stores/invoices';
	import { formattatoreData } from '$lib/utils/italiano';
	import ConfermaDialog from '$lib/components/ConfermaDialog.svelte';
	import { toast } from 'svelte-sonner';
	import type { Patient } from '$lib/utils/validation';
	import type { InvoiceWithDetails } from '$lib/stores/invoices';
	
	let { data } = $props();
	
	let mostraConfermaEliminazione = $state(false);
	let pazienteDaEliminare = $state<Patient | null>(null);
	let searchTermValue = $state('');
	
	let patientsData = $state<Patient[]>(get(patients));
	let invoicesData = $state<InvoiceWithDetails[]>(get(invoices));
	
	$effect(() => {
		const unsubPatients = patients.subscribe(value => patientsData = value);
		const unsubInvoices = invoices.subscribe(value => invoicesData = value);
		
		return () => {
			unsubPatients();
			unsubInvoices();
		};
	});
	
	// Filter patients for this psychologist based on invoice history
	let psychologistInvoices = $derived(
		invoicesData.filter(i => parseInt(i.idPsicologo) === Number(data.psychologistId))
	);
	
	let psychologistPatients = $derived(() => {
		const patientIds = new Set(psychologistInvoices.map(i => parseInt(i.idPaziente)));
		return patientsData.filter(p => p.id && patientIds.has(p.id));
	});
	
	// Session counts for each patient
	let sessionCounts = $derived(() => {
		const counts = new Map<number, number>();
		psychologistInvoices.forEach(invoice => {
			const patientId = parseInt(invoice.idPaziente);
			counts.set(patientId, (counts.get(patientId) || 0) + 1);
		});
		return counts;
	});
	
	// Filter by search term
	let displayPatients = $derived(psychologistPatients().filter(p => {
		if (!searchTermValue) return true;
		const search = searchTermValue.toLowerCase();
		return (
			p.nome.toLowerCase().includes(search) ||
			p.cognome.toLowerCase().includes(search) ||
			p.codiceFiscale?.toLowerCase().includes(search) ||
			p.email?.toLowerCase().includes(search) ||
			p.telefono?.includes(search)
		);
	}));
	
	function confermaEliminazione(paziente: Patient) {
		pazienteDaEliminare = paziente;
		mostraConfermaEliminazione = true;
	}
	
	function eliminaPaziente() {
		if (pazienteDaEliminare?.id) {
			// Note: This removes the patient globally, not just for this psychologist
			// In a real app, you might want to just remove the association
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
			<h3 class="text-lg font-semibold">Pazienti</h3>
			<p class="text-sm text-gray-600 mt-1">Gestisci i pazienti di questo psicologo</p>
		</div>
		<Button href="/psicologi/{data.psychologistId}/pazienti/nuovo">
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
					bind:value={searchTermValue}
					class="pl-10"
				/>
			</div>
		</CardContent>
	</Card>
	
	<!-- Patients Table -->
	<Card>
		<CardHeader>
			<CardTitle>
				Lista Pazienti ({displayPatients.length})
			</CardTitle>
		</CardHeader>
		<CardContent>
			{#if displayPatients.length > 0}
				<div class="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nome</TableHead>
								<TableHead>Codice Fiscale</TableHead>
								<TableHead>Telefono</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Sedute</TableHead>
								<TableHead>Data Registrazione</TableHead>
								<TableHead class="text-right">Azioni</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each displayPatients as paziente}
								<TableRow>
									<TableCell class="font-medium">
										<Button 
											href="/psicologi/{data.psychologistId}/pazienti/{paziente.id}" 
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
										{#if paziente.id && sessionCounts().has(paziente.id)}
											<Badge variant="outline">
												{sessionCounts().get(paziente.id)} sedut{sessionCounts().get(paziente.id) === 1 ? 'a' : 'e'}
											</Badge>
										{:else}
											<span class="text-gray-400">-</span>
										{/if}
									</TableCell>
									<TableCell>
										{paziente.dataCreazione 
											? formattatoreData.format(new Date(paziente.dataCreazione))
											: '-'}
									</TableCell>
									<TableCell class="text-right">
										<div class="flex justify-end gap-2">
											<Button 
												href="/psicologi/{data.psychologistId}/pazienti/{paziente.id}/modifica" 
												variant="ghost" 
												size="icon"
											>
												<Edit class="w-4 h-4" />
											</Button>
											<Button 
												href="/psicologi/{data.psychologistId}/fatture/nuova?paziente={paziente.id}" 
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
					<User class="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<p class="text-gray-500 mb-4">
						{searchTermValue ? 'Nessun paziente trovato con i criteri di ricerca' : 'Nessun paziente registrato per questo psicologo'}
					</p>
					{#if !searchTermValue}
						<Button href="/psicologi/{data.psychologistId}/pazienti/nuovo">
							<Plus class="w-4 h-4 mr-2" />
							Aggiungi primo paziente
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
	descrizione={`Sei sicuro di voler eliminare ${pazienteDaEliminare?.nome} ${pazienteDaEliminare?.cognome}? Questa operazione eliminerà il paziente da tutto il sistema.`}
	testoConferma="Elimina Paziente"
	testoAnnulla="Annulla"
	variante="destructive"
	onConferma={eliminaPaziente}
	onAnnulla={() => pazienteDaEliminare = null}
/>