<script lang="ts">
	import { get } from 'svelte/store';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Plus, Download, Eye, Trash2, Search, FileText } from 'lucide-svelte';
	import { invoices } from '$lib/stores/invoices';
	import { formattatoreData, formattatoreValuta } from '$lib/utils/italiano';
	import ConfermaDialog from '$lib/components/ConfermaDialog.svelte';
	import { toast } from 'svelte-sonner';
	import type { InvoiceWithDetails } from '$lib/stores/invoices';
	
	let { data } = $props();
	
	let mostraConfermaEliminazione = $state(false);
	let fatturaDaEliminare = $state<InvoiceWithDetails | null>(null);
	let filtroStato = $state('tutte');
	let ricerca = $state('');
	
	let invoicesData = $state<InvoiceWithDetails[]>(get(invoices));
	
	$effect(() => {
		const unsubInvoices = invoices.subscribe(value => invoicesData = value);
		return () => unsubInvoices();
	});
	
	// Filter invoices for this psychologist
	let psychologistInvoices = $derived(
		invoicesData.filter(i => parseInt(i.idPsicologo) === Number(data.psychologistId))
	);
	
	// Calculate statistics
	let stats = $derived(() => {
		const currentMonth = new Date().getMonth();
		const currentYear = new Date().getFullYear();
		
		const monthlyInvoices = psychologistInvoices.filter(i => {
			const invoiceDate = new Date(i.data);
			return invoiceDate.getMonth() === currentMonth &&
				invoiceDate.getFullYear() === currentYear;
		});
		
		const totalRevenue = monthlyInvoices.reduce((sum, i) => sum + i.importo, 0);
		
		return {
			total: psychologistInvoices.length,
			monthly: monthlyInvoices.length,
			revenue: totalRevenue,
			pending: psychologistInvoices.filter(i => i.stato === 'emessa').length,
			paid: psychologistInvoices.filter(i => i.stato === 'pagata').length
		};
	});
	
	// Filter by status and search
	let fattureFiltrate = $derived(psychologistInvoices.filter(fattura => {
		const matchStato = filtroStato === 'tutte' || fattura.stato === filtroStato;
		const matchRicerca = !ricerca || 
			fattura.numeroFattura?.toLowerCase().includes(ricerca.toLowerCase()) ||
			fattura.paziente?.nome?.toLowerCase().includes(ricerca.toLowerCase()) ||
			fattura.paziente?.cognome?.toLowerCase().includes(ricerca.toLowerCase());
		return matchStato && matchRicerca;
	}));
	
	function confermaEliminazione(fattura: InvoiceWithDetails) {
		fatturaDaEliminare = fattura;
		mostraConfermaEliminazione = true;
	}
	
	function eliminaFattura() {
		if (fatturaDaEliminare?.id) {
			invoices.remove(fatturaDaEliminare.id);
			toast.success(`Fattura ${fatturaDaEliminare.numeroFattura} eliminata con successo`);
			fatturaDaEliminare = null;
		}
	}
	
	function cambiaStato(id: number, nuovoStato: 'emessa' | 'pagata' | 'annullata') {
		invoices.updateStatus(id, nuovoStato);
		toast.success('Stato fattura aggiornato');
	}
	
	function scaricaFattura(fattura: InvoiceWithDetails) {
		import('$lib/utils/pdf').then(({ generaFatturaPDF }) => {
			generaFatturaPDF(fattura);
			toast.success('Fattura scaricata con successo');
		});
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h3 class="text-lg font-semibold">Fatture</h3>
			<p class="text-sm text-gray-600 mt-1">Gestisci le fatture emesse</p>
		</div>
		<Button href="/psicologi/{data.psychologistId}/fatture/nuova">
			<Plus class="w-4 h-4 mr-2" />
			Nuova Fattura
		</Button>
	</div>
	
	<!-- Statistics Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-gray-600">Totale Fatture</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{stats().total}</div>
			</CardContent>
		</Card>
		
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-gray-600">Questo Mese</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{stats().monthly}</div>
			</CardContent>
		</Card>
		
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-gray-600">In Attesa</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{stats().pending}</div>
			</CardContent>
		</Card>
		
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-gray-600">Entrate Mese</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{formattatoreValuta.format(stats().revenue)}</div>
			</CardContent>
		</Card>
	</div>
	
	<!-- Filters -->
	<Card>
		<CardContent class="pt-6">
			<div class="flex flex-col md:flex-row gap-4">
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
						<Input
							type="text"
							placeholder="Cerca per numero fattura o paziente..."
							bind:value={ricerca}
							class="pl-10"
						/>
					</div>
				</div>
				<Select.Root type="single" bind:value={filtroStato}>
					<Select.Trigger class="w-[180px]">
						{filtroStato === 'tutte' ? 'Tutte' : 
						 filtroStato === 'emessa' ? 'Emessa' : 
						 filtroStato === 'pagata' ? 'Pagata' : 'Annullata'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="tutte">Tutte</Select.Item>
						<Select.Item value="emessa">Emessa</Select.Item>
						<Select.Item value="pagata">Pagata</Select.Item>
						<Select.Item value="annullata">Annullata</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
		</CardContent>
	</Card>
	
	<!-- Invoices Table -->
	<Card>
		<CardHeader>
			<CardTitle>Lista Fatture ({fattureFiltrate.length})</CardTitle>
		</CardHeader>
		<CardContent>
			{#if fattureFiltrate.length > 0}
				<div class="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Numero</TableHead>
								<TableHead>Data</TableHead>
								<TableHead>Paziente</TableHead>
								<TableHead>Totale</TableHead>
								<TableHead>Stato</TableHead>
								<TableHead class="text-right">Azioni</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each fattureFiltrate as fattura}
								<TableRow>
									<TableCell class="font-medium">
										{fattura.numeroFattura}
									</TableCell>
									<TableCell>
										{formattatoreData.format(new Date(fattura.data))}
									</TableCell>
									<TableCell>
										{fattura.paziente?.nome} {fattura.paziente?.cognome}
									</TableCell>
									<TableCell class="font-medium">
										{formattatoreValuta.format(fattura.importo * (1 + fattura.aliquotaIva / 100))}
									</TableCell>
									<TableCell>
										<Badge variant={
											fattura.stato === 'pagata' ? 'default' :
											fattura.stato === 'annullata' ? 'destructive' : 'secondary'
										}>
											{fattura.stato || 'emessa'}
										</Badge>
									</TableCell>
									<TableCell class="text-right">
										<div class="flex justify-end gap-2">
											{#if fattura.stato === 'emessa'}
												<Button 
													variant="outline" 
													size="sm"
													onclick={() => cambiaStato(fattura.id!, 'pagata')}
												>
													Segna Pagata
												</Button>
											{/if}
											<Button 
												variant="ghost" 
												size="icon"
												onclick={() => scaricaFattura(fattura)}
											>
												<Download class="w-4 h-4" />
											</Button>
											<Button 
												variant="ghost" 
												size="icon"
												onclick={() => confermaEliminazione(fattura)}
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
					<FileText class="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<p class="text-gray-500 mb-4">
						{ricerca || filtroStato !== 'tutte' ? 'Nessuna fattura trovata con i criteri di ricerca' : 'Nessuna fattura emessa per questo psicologo'}
					</p>
					{#if !ricerca && filtroStato === 'tutte'}
						<Button href="/psicologi/{data.psychologistId}/fatture/nuova">
							<Plus class="w-4 h-4 mr-2" />
							Crea la prima fattura
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
	titolo="Elimina Fattura"
	descrizione={`Sei sicuro di voler eliminare la fattura ${fatturaDaEliminare?.numeroFattura}? Questa operazione non può essere annullata.`}
	testoConferma="Elimina Fattura"
	testoAnnulla="Annulla"
	variante="destructive"
	onConferma={eliminaFattura}
	onAnnulla={() => fatturaDaEliminare = null}
/>