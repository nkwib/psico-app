<script lang="ts">
	import { get } from 'svelte/store';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Plus, Users, FileText, Receipt, TrendingUp, Clock, Euro, Calendar } from 'lucide-svelte';
	import { patients } from '$lib/stores/patients';
	import { invoices } from '$lib/stores/invoices';
	import { formattatoreValuta, formattatoreData } from '$lib/utils/italiano';
	import type { Patient } from '$lib/utils/validation';
	import type { InvoiceWithDetails } from '$lib/stores/invoices';
	
	let { data } = $props();
	
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
	
	// Filter data for this psychologist
	let psychologistInvoices = $derived(
		invoicesData.filter(i => parseInt(i.idPsicologo) === Number(data.psychologistId))
	);
	
	// Get unique patients for this psychologist
	let psychologistPatients = $derived(() => {
		const patientIds = new Set(psychologistInvoices.map(i => parseInt(i.idPaziente)));
		return patientsData.filter(p => p.id && patientIds.has(p.id));
	});
	
	// Calculate statistics
	let stats = $derived(() => {
		const currentMonth = new Date().getMonth();
		const currentYear = new Date().getFullYear();
		
		const monthlyInvoices = psychologistInvoices.filter(i => {
			const invoiceDate = new Date(i.data);
			return invoiceDate.getMonth() === currentMonth &&
				invoiceDate.getFullYear() === currentYear;
		});
		
		const totalRevenue = psychologistInvoices.reduce((sum, i) => sum + i.importo, 0);
		const monthlyRevenue = monthlyInvoices.reduce((sum, i) => sum + i.importo, 0);
		
		return {
			totalPatients: psychologistPatients().length,
			totalInvoices: psychologistInvoices.length,
			monthlyInvoices: monthlyInvoices.length,
			totalRevenue,
			monthlyRevenue,
			pendingInvoices: psychologistInvoices.filter(i => i.stato === 'emessa').length,
			paidInvoices: psychologistInvoices.filter(i => i.stato === 'pagata').length
		};
	});
	
	// Get recent data
	let recentPatients = $derived(psychologistPatients().slice(-5).reverse());
	let recentInvoices = $derived(psychologistInvoices.slice(-5).reverse());
</script>

<div class="space-y-6">
	<!-- Quick Actions -->
	<div class="flex justify-between items-center sm:flex-row flex-col">
		<h3 class="text-lg font-semibold">Dashboard</h3>
		<div class="flex gap-3">
			<Button href="/psicologi/{data.psychologistId}/pazienti/nuovo" variant="outline">
				<Plus class="w-4 h-4 mr-2" />
				Nuovo Paziente
			</Button>
			<Button href="/psicologi/{data.psychologistId}/fatture/nuova">
				<Plus class="w-4 h-4 mr-2" />
				Nuova Fattura
			</Button>
		</div>
	</div>
	
	<!-- Statistics Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium text-gray-600">
					Pazienti Totali
				</CardTitle>
				<Users class="w-4 h-4 text-gray-400" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{stats().totalPatients}</div>
				<p class="text-xs text-gray-500">attivi con questo psicologo</p>
			</CardContent>
		</Card>
		
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium text-gray-600">
					Fatture Questo Mese
				</CardTitle>
				<Calendar class="w-4 h-4 text-gray-400" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{stats().monthlyInvoices}</div>
				<p class="text-xs text-gray-500">su {stats().totalInvoices} totali</p>
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
					{formattatoreValuta.format(stats().monthlyRevenue)}
				</div>
				<p class="text-xs text-gray-500">fatturato mensile</p>
			</CardContent>
		</Card>
		
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium text-gray-600">
					Fatture da Pagare
				</CardTitle>
				<Clock class="w-4 h-4 text-gray-400" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{stats().pendingInvoices}</div>
				<p class="text-xs text-gray-500">{stats().paidInvoices} già pagate</p>
			</CardContent>
		</Card>
	</div>
	
	<!-- Recent Data Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Recent Patients -->
		<Card>
			<CardHeader>
				<div class="flex justify-between items-center">
					<CardTitle>Pazienti Recenti</CardTitle>
					<Button 
						href="/psicologi/{data.psychologistId}/pazienti" 
						variant="ghost" 
						size="sm"
					>
						Vedi tutti
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{#if recentPatients.length > 0}
					<div class="space-y-3">
						{#each recentPatients as paziente}
							<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
								<div>
									<p class="font-medium">
										{paziente.nome} {paziente.cognome}
									</p>
									<p class="text-sm text-gray-600">
										CF: {paziente.codiceFiscale}
									</p>
								</div>
								<Button 
									href="/psicologi/{data.psychologistId}/pazienti/{paziente.id}" 
									variant="ghost" 
									size="sm"
								>
									Visualizza
								</Button>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-center text-gray-500 py-8">
						Nessun paziente registrato
					</p>
					<div class="text-center">
						<Button 
							href="/psicologi/{data.psychologistId}/pazienti/nuovo"
							variant="outline"
							size="sm"
						>
							<Plus class="w-4 h-4 mr-2" />
							Aggiungi primo paziente
						</Button>
					</div>
				{/if}
			</CardContent>
		</Card>
		
		<!-- Recent Invoices -->
		<Card>
			<CardHeader>
				<div class="flex justify-between items-center">
					<CardTitle>Fatture Recenti</CardTitle>
					<Button 
						href="/psicologi/{data.psychologistId}/fatture" 
						variant="ghost" 
						size="sm"
					>
						Vedi tutte
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{#if recentInvoices.length > 0}
					<div class="space-y-3">
						{#each recentInvoices as fattura}
							<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
								<div>
									<p class="font-medium">
										{fattura.numeroFattura}
									</p>
									<p class="text-sm text-gray-600">
										{fattura.paziente?.nome} {fattura.paziente?.cognome} • 
										{formattatoreData.format(new Date(fattura.data))}
									</p>
								</div>
								<div class="flex items-center gap-2">
									<Badge variant={
										fattura.stato === 'pagata' ? 'default' :
										fattura.stato === 'annullata' ? 'destructive' : 'secondary'
									}>
										{fattura.stato || 'emessa'}
									</Badge>
									<span class="font-medium">
										{formattatoreValuta.format(fattura.importo * (1 + fattura.aliquotaIva / 100))}
									</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-center text-gray-500 py-8">
						Nessuna fattura emessa
					</p>
					<div class="text-center">
						<Button 
							href="/psicologi/{data.psychologistId}/fatture/nuova"
							variant="outline"
							size="sm"
						>
							<Plus class="w-4 h-4 mr-2" />
							Crea prima fattura
						</Button>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>