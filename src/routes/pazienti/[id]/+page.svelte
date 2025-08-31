<script lang="ts">
	import { get } from 'svelte/store';
	import { page } from '$app/stores';
	import { patients } from '$lib/stores/patients';
	import { invoices } from '$lib/stores/invoices';
	import { psychologists } from '$lib/stores/psychologists';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { formattatoreData, formattatoreValuta } from '$lib/utils/italiano';
	import type { Patient } from '$lib/utils/validation';

	// Componenti UI
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Edit, Trash2, Plus, FileText, Calendar, Phone, Mail, MapPin, User, Shield } from 'lucide-svelte';
	import ConfermaDialog from '$lib/components/ConfermaDialog.svelte';

	let { data } = $props();
	
	let patientsData = $state(get(patients));
	let invoicesData = $state(get(invoices));
	let psychologistsData = $state(get(psychologists));
	
	let paziente = $state<Patient | null>(null);
	let pazienteInvoices = $state<any[]>([]);
	let mostraConfermaEliminazione = $state(false);
	
	$effect(() => {
		const unsubPatients = patients.subscribe(value => patientsData = value);
		const unsubInvoices = invoices.subscribe(value => invoicesData = value);
		const unsubPsychologists = psychologists.subscribe(value => psychologistsData = value);
		
		return () => {
			unsubPatients();
			unsubInvoices();
			unsubPsychologists();
		};
	});

	// Get patient ID from URL and find patient data
	$effect(() => {
		const patientId = $page.params.id;
		if (patientId && patientsData.length > 0) {
			paziente = patientsData.find(p => p.id?.toString() === patientId) || null;
			
			if (paziente) {
				// Get invoices for this patient
				pazienteInvoices = invoicesData.filter(invoice => 
					invoice.idPaziente === paziente?.id?.toString()
				);
			}
		}
	});

	function confermaEliminazione() {
		mostraConfermaEliminazione = true;
	}

	function eliminaPaziente() {
		if (paziente?.id) {
			patients.remove(paziente.id);
			toast.success(`Paziente ${paziente.nome} ${paziente.cognome} eliminato con successo`);
			goto('/pazienti');
		}
	}

	function getStatoBadgeVariant(stato: string) {
		switch (stato) {
			case 'emessa': return 'default';
			case 'pagata': return 'default';
			case 'annullata': return 'destructive';
			default: return 'secondary';
		}
	}

	function getStatoText(stato: string) {
		switch (stato) {
			case 'emessa': return 'Emessa';
			case 'pagata': return 'Pagata';
			case 'annullata': return 'Annullata';
			default: return stato;
		}
	}
</script>

<div class="container mx-auto py-8 max-w-6xl">
	{#if paziente}
		<!-- Header -->
		<div class="flex justify-between items-start mb-8">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">
					{paziente.nome} {paziente.cognome}
				</h1>
				<p class="text-gray-600 mt-1">Dettagli completi del paziente</p>
			</div>
			<div class="flex gap-2">
				<Button href="/fatture/nuova?paziente={paziente.id}" variant="outline">
					<Plus class="w-4 h-4 mr-2" />
					Nuova Fattura
				</Button>
				<Button href="/pazienti/{paziente.id}/modifica" variant="outline">
					<Edit class="w-4 h-4 mr-2" />
					Modifica
				</Button>
				<Button variant="destructive" onclick={confermaEliminazione}>
					<Trash2 class="w-4 h-4 mr-2" />
					Elimina
				</Button>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Informazioni Personali -->
			<div class="lg:col-span-2 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<User class="w-5 h-5" />
							Informazioni Personali
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<p class="text-sm text-gray-600">Nome</p>
								<p class="font-medium">{paziente.nome}</p>
							</div>
							<div>
								<p class="text-sm text-gray-600">Cognome</p>
								<p class="font-medium">{paziente.cognome}</p>
							</div>
							<div>
								<p class="text-sm text-gray-600">Codice Fiscale</p>
								<p class="font-medium font-mono">{paziente.codiceFiscale}</p>
							</div>
							<div>
								<p class="text-sm text-gray-600">Data di Nascita</p>
								<p class="font-medium">{paziente.dataNascita ? formattatoreData.format(new Date(paziente.dataNascita)) : 'Non specificata'}</p>
							</div>
							{#if paziente.luogoNascita}
								<div>
									<p class="text-sm text-gray-600">Luogo di Nascita</p>
									<p class="font-medium">{paziente.luogoNascita}</p>
								</div>
							{/if}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Phone class="w-5 h-5" />
							Contatti
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<p class="text-sm text-gray-600">Telefono</p>
								<p class="font-medium">{paziente.telefono}</p>
							</div>
							<div>
								<p class="text-sm text-gray-600">Email</p>
								<p class="font-medium">{paziente.email}</p>
							</div>
							{#if paziente.indirizzo}
								<div class="md:col-span-2">
									<p class="text-sm text-gray-600">Indirizzo</p>
									<p class="font-medium">{paziente.indirizzo}</p>
								</div>
							{/if}
						</div>
					</CardContent>
				</Card>

				{#if paziente.contattoEmergenza}
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<Shield class="w-5 h-5" />
								Contatto di Emergenza
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<p class="text-sm text-gray-600">Nome</p>
									<p class="font-medium">{paziente.contattoEmergenza.nome}</p>
								</div>
								<div>
									<p class="text-sm text-gray-600">Telefono</p>
									<p class="font-medium">{paziente.contattoEmergenza.telefono}</p>
								</div>
								<div>
									<p class="text-sm text-gray-600">Parentela</p>
									<p class="font-medium">{paziente.contattoEmergenza.parentela}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				{/if}

				{#if paziente.anamnesi || paziente.farmaci}
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<FileText class="w-5 h-5" />
								Informazioni Mediche
							</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4">
							{#if paziente.anamnesi}
								<div>
									<p class="text-sm text-gray-600 mb-2">Anamnesi</p>
									<p class="text-sm">{paziente.anamnesi}</p>
								</div>
							{/if}
							{#if paziente.farmaci}
								<div>
									<p class="text-sm text-gray-600 mb-2">Farmaci Assunti</p>
									<p class="text-sm">{paziente.farmaci}</p>
								</div>
							{/if}
						</CardContent>
					</Card>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Statistiche -->
				<Card>
					<CardHeader>
						<CardTitle>Statistiche</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="space-y-4">
							<div>
								<p class="text-sm text-gray-600">Fatture Totali</p>
								<p class="text-2xl font-bold">{pazienteInvoices.length}</p>
							</div>
							<div>
								<p class="text-sm text-gray-600">Data Registrazione</p>
								<p class="font-medium">{paziente.dataCreazione ? formattatoreData.format(new Date(paziente.dataCreazione)) : 'Non specificata'}</p>
							</div>
							{#if paziente.dataConsenso}
								<div>
									<p class="text-sm text-gray-600">Consenso Privacy</p>
									<p class="font-medium">{formattatoreData.format(new Date(paziente.dataConsenso))}</p>
								</div>
							{/if}
						</div>
					</CardContent>
				</Card>

				<!-- Fatture Recenti -->
				{#if pazienteInvoices.length > 0}
					<Card>
						<CardHeader>
							<CardTitle>Fatture Recenti</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="space-y-3">
								{#each pazienteInvoices.slice(0, 5) as invoice}
									<div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
										<div>
											<p class="font-medium text-sm">#{invoice.numeroFattura}</p>
											<p class="text-xs text-gray-600">{formattatoreData.format(new Date(invoice.data))}</p>
										</div>
										<div class="text-right">
											<p class="font-medium text-sm">{formattatoreValuta.format(invoice.importo)}</p>
											<Badge variant={getStatoBadgeVariant(invoice.stato)} class="text-xs">
												{getStatoText(invoice.stato)}
											</Badge>
										</div>
									</div>
								{/each}
								{#if pazienteInvoices.length > 5}
									<p class="text-xs text-gray-500 text-center">
										+{pazienteInvoices.length - 5} altre fatture
									</p>
								{/if}
							</div>
						</CardContent>
					</Card>
				{/if}
			</div>
		</div>

		<!-- Lista Completa Fatture -->
		{#if pazienteInvoices.length > 0}
			<Card class="mt-8">
				<CardHeader>
					<CardTitle>Storico Fatture</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Numero</TableHead>
									<TableHead>Data</TableHead>
									<TableHead>Psicologo</TableHead>
									<TableHead>Importo</TableHead>
									<TableHead>Stato</TableHead>
									<TableHead class="text-right">Azioni</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each pazienteInvoices as invoice}
									<TableRow>
										<TableCell class="font-medium">#{invoice.numeroFattura}</TableCell>
										<TableCell>{formattatoreData.format(new Date(invoice.data))}</TableCell>
										<TableCell>
											{@const psicologo = psychologistsData.find(p => p.id?.toString() === invoice.idPsicologo)}
											{#if psicologo}
												Dott. {psicologo.nome} {psicologo.cognome}
											{:else}
												N/A
											{/if}
										</TableCell>
										<TableCell>{formattatoreValuta.format(invoice.importo)}</TableCell>
										<TableCell>
											<Badge variant={getStatoBadgeVariant(invoice.stato)}>
												{getStatoText(invoice.stato)}
											</Badge>
										</TableCell>
										<TableCell class="text-right">
											<Button variant="ghost" size="icon">
												<FileText class="w-4 h-4" />
											</Button>
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		{/if}
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

<!-- Dialog Conferma Eliminazione -->
<ConfermaDialog
	bind:open={mostraConfermaEliminazione}
	titolo="Elimina Paziente"
	descrizione="Sei sicuro di voler eliminare questo paziente? Questa azione eliminerà anche tutte le fatture associate e non può essere annullata."
	testoConferma="Elimina Paziente"
	testoAnnulla="Annulla"
	variante="destructive"
	onConferma={eliminaPaziente}
	onAnnulla={() => mostraConfermaEliminazione = false}
/>
