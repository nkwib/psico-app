<script lang="ts">
	import { get } from 'svelte/store';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Users, Receipt, Plus, Euro, User, ArrowRight } from 'lucide-svelte';
	import { patients } from '$lib/stores/patients';
	import { psychologists } from '$lib/stores/psychologists';
	import { invoices, invoiceStats } from '$lib/stores/invoices';
	import { formattatoreValuta } from '$lib/utils/italiano';

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
	
</script>

<div class="space-y-6">
	<!-- Header con Azioni Rapide -->
	<div class="flex justify-between items-center sm:flex-row flex-col">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Panoramica</h1>
			<p class="text-gray-600 mt-1">Benvenuto nel tuo gestionale studio</p>
		</div>
	</div>



	<!-- Psychologists Cards -->
	<div class="space-y-4 mt-6">
		<h2 class="text-xl font-semibold">Seleziona un Psicologo</h2>
		<p class="text-sm text-gray-600 mb-4">Accedi al workspace di un psicologo per gestire pazienti e fatture</p>
		{#if psychologistsData.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each psychologistsData as psicologo}
					<Card class="hover:shadow-lg transition-shadow cursor-pointer" onclick={() => window.location.href = `/psicologi/${psicologo.id}/dashboard`}>
						<CardContent class="pt-6">
							<div class="flex items-start justify-between mb-4">
								<div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
									<span class="text-blue-600 font-bold">
										{psicologo.nome.charAt(0)}{psicologo.cognome.charAt(0)}
									</span>
								</div>
								{#if psicologo.isPreferito}
									<Badge variant="secondary" class="text-xs">Preferito</Badge>
								{/if}
							</div>
							<h3 class="font-semibold mb-2">
								Dr. {psicologo.nome} {psicologo.cognome}
							</h3>
							<p class="text-sm text-gray-600 mb-4">
								P.IVA: {psicologo.partitaIva}
							</p>
							<Button 
								href="/psicologi/{psicologo.id}/dashboard" 
								variant="outline" 
								size="sm"
								class="w-full"
							>
								Accedi al workspace
								<ArrowRight class="w-4 h-4 ml-2" />
							</Button>
						</CardContent>
					</Card>
				{/each}
			</div>
		{:else}
			<Card>
				<CardContent class="pt-6 text-center">
					<User class="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<p class="text-gray-500 mb-4">Nessun psicologo registrato</p>
					<Button href="/psicologi/nuovo">
						<Plus class="w-4 h-4 mr-2" />
						Aggiungi il primo psicologo
					</Button>
				</CardContent>
			</Card>
		{/if}
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

	<!-- Azioni Rapide -->
</div>
