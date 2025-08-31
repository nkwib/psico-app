<script lang="ts">
	import { get } from 'svelte/store';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Users, FileText, Receipt, Plus, TrendingUp, Clock, Euro } from 'lucide-svelte';
	import { patients } from '$lib/stores/patients';
	import { psychologists } from '$lib/stores/psychologists';
	import { invoices, invoiceStats } from '$lib/stores/invoices';
	import { formattatoreValuta, formattatoreData } from '$lib/utils/italiano';

	// Get recent patients (last 5)
	let patientsData = $state(get(patients));
	let psychologistsData = $state(get(psychologists));
	let invoicesData = $state(get(invoices));
	let invoiceStatsData = $state(get(invoiceStats));
	
	$effect(() => {
		const unsubPatients = patients.subscribe(value => patientsData = value);
		const unsubPsychologists = psychologists.subscribe(value => psychologistsData = value);
		const unsubInvoices = invoices.subscribe(value => invoicesData = value);
		const unsubStats = invoiceStats.subscribe(value => invoiceStatsData = value);
		
		return () => {
			unsubPatients();
			unsubPsychologists();
			unsubInvoices();
			unsubStats();
		};
	});
	
	let recentPatients = $derived(patientsData.slice(-5).reverse());
	let recentInvoices = $derived(invoicesData.slice(-5).reverse());
</script>

<div class="space-y-6">
	<!-- Header con Azioni Rapide -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Panoramica</h1>
			<p class="text-gray-600 mt-1">Benvenuto nel tuo gestionale studio</p>
		</div>
		<div class="flex gap-3">
			<Button href="/pazienti/nuovo" variant="outline">
				<Plus class="w-4 h-4 mr-2" />
				Nuovo Paziente
			</Button>
			<Button href="/fatture/nuova">
				<Plus class="w-4 h-4 mr-2" />
				Nuova Fattura
			</Button>
		</div>
	</div>

	<!-- Statistiche Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium text-gray-600">
					Totale Pazienti
				</CardTitle>
				<Users class="w-4 h-4 text-gray-400" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{patientsData.length}</div>
				<p class="text-xs text-gray-500 mt-1">Pazienti registrati</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium text-gray-600">
					Psicologi
				</CardTitle>
				<Users class="w-4 h-4 text-gray-400" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{psychologistsData.length}</div>
				<p class="text-xs text-gray-500 mt-1">Professionisti attivi</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium text-gray-600">
					Fatture del Mese
				</CardTitle>
				<Receipt class="w-4 h-4 text-gray-400" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{invoiceStatsData.monthly}</div>
				<p class="text-xs text-gray-500 mt-1">
					{invoiceStatsData.pending} in attesa di pagamento
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium text-gray-600">
					Entrate del Mese
				</CardTitle>
				<Euro class="w-4 h-4 text-gray-400" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">
					{formattatoreValuta.format(invoiceStatsData.revenue)}
				</div>
				<p class="text-xs text-gray-500 mt-1">IVA inclusa</p>
			</CardContent>
		</Card>
	</div>

	<!-- Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Pazienti Recenti -->
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle>Pazienti Recenti</CardTitle>
					<Button href="/pazienti" variant="ghost" size="sm">
						Vedi tutti
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{#if recentPatients.length > 0}
					<div class="space-y-3">
						{#each recentPatients as paziente}
							<div class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
								<div>
									<p class="font-medium">{paziente.nome} {paziente.cognome}</p>
									<p class="text-sm text-gray-500">{paziente.codiceFiscale}</p>
								</div>
								<Button href="/pazienti/{paziente.id}" variant="ghost" size="sm">
									Dettagli
								</Button>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-gray-500 text-center py-8">
						Nessun paziente registrato
					</p>
				{/if}
			</CardContent>
		</Card>

		<!-- Fatture Recenti -->
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle>Fatture Recenti</CardTitle>
					<Button href="/fatture" variant="ghost" size="sm">
						Vedi tutte
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{#if recentInvoices.length > 0}
					<div class="space-y-3">
						{#each recentInvoices as fattura}
							<div class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
								<div>
									<p class="font-medium">Fattura #{fattura.numeroFattura}</p>
									<p class="text-sm text-gray-500">
										{formattatoreData.format(new Date(fattura.data))}
									</p>
								</div>
								<div class="flex items-center gap-2">
									<Badge variant={
										fattura.stato === 'pagata' ? 'default' :
										fattura.stato === 'emessa' ? 'secondary' : 'outline'
									}>
										{fattura.stato || 'bozza'}
									</Badge>
									<span class="font-medium">
										{formattatoreValuta.format(fattura.importo * (1 + fattura.aliquotaIva / 100))}
									</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-gray-500 text-center py-8">
						Nessuna fattura emessa
					</p>
				{/if}
			</CardContent>
		</Card>
	</div>

	<!-- Azioni Rapide -->
	<Card>
		<CardHeader>
			<CardTitle>Azioni Rapide</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Button href="/pazienti/nuovo" variant="outline" class="h-20 flex-col">
					<Users class="w-5 h-5 mb-2" />
					<span class="text-xs">Nuovo Paziente</span>
				</Button>
				<Button href="/psicologi/nuovo" variant="outline" class="h-20 flex-col">
					<Users class="w-5 h-5 mb-2" />
					<span class="text-xs">Nuovo Psicologo</span>
				</Button>
				<Button href="/fatture/nuova" variant="outline" class="h-20 flex-col">
					<Receipt class="w-5 h-5 mb-2" />
					<span class="text-xs">Nuova Fattura</span>
				</Button>
				<Button href="/impostazioni" variant="outline" class="h-20 flex-col">
					<FileText class="w-5 h-5 mb-2" />
					<span class="text-xs">Backup Dati</span>
				</Button>
			</div>
		</CardContent>
	</Card>
</div>
