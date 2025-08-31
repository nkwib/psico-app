<script lang="ts">
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { psychologists } from '$lib/stores/psychologists';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { ChevronRight, Home, Users, Receipt, BarChart3, Edit } from 'lucide-svelte';
	import type { Psychologist } from '$lib/utils/validation';
	
	let { children, data } = $props();
	
	let psychologist = $state<Psychologist | null>(null);
	let psychologistsList = $state<Psychologist[]>(get(psychologists));
	
	$effect(() => {
		const unsubscribe = psychologists.subscribe((allPsychologists) => {
			psychologistsList = allPsychologists;
			psychologist = allPsychologists.find(p => p.id === Number(data.psychologistId)) || null;
		});
		
		return () => unsubscribe();
	});
	
	// Sub-navigation items for psychologist context
	const subNav = [
		{ nome: 'Dashboard', href: `/psicologi/${data.psychologistId}/dashboard`, icona: BarChart3 },
		{ nome: 'Pazienti', href: `/psicologi/${data.psychologistId}/pazienti`, icona: Users },
		{ nome: 'Fatture', href: `/psicologi/${data.psychologistId}/fatture`, icona: Receipt },
	];
	
	let currentPath = $derived($page.url.pathname);
	let isEditPage = $derived(currentPath.includes('/modifica'));
</script>

{#if psychologist}
	<div class="space-y-6">
		<!-- Breadcrumb and Header -->
		<div class="space-y-4">
			<!-- Breadcrumb -->
			<nav class="flex items-center text-sm text-gray-600">
				<a href="/psicologi" class="hover:text-gray-900">Psicologi</a>
				<ChevronRight class="w-4 h-4 mx-2" />
				<span class="font-medium text-gray-900">
					Dr. {psychologist.nome} {psychologist.cognome}
				</span>
				{#if currentPath.includes('/pazienti')}
					<ChevronRight class="w-4 h-4 mx-2" />
					<span>Pazienti</span>
				{:else if currentPath.includes('/fatture')}
					<ChevronRight class="w-4 h-4 mx-2" />
					<span>Fatture</span>
				{:else if currentPath.includes('/dashboard')}
					<ChevronRight class="w-4 h-4 mx-2" />
					<span>Dashboard</span>
				{/if}
			</nav>
			
			<!-- Psychologist Header Card -->
			<Card>
				<CardContent class="pt-6">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-4">
							<div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
								<span class="text-blue-600 font-bold text-lg">
									{psychologist.nome.charAt(0)}{psychologist.cognome.charAt(0)}
								</span>
							</div>
							<div>
								<h2 class="text-xl font-bold">
									Dr. {psychologist.nome} {psychologist.cognome}
									{#if psychologist.isPreferito}
										<Badge variant="secondary" class="ml-2">Preferito</Badge>
									{/if}
								</h2>
								<p class="text-sm text-gray-600">
									P.IVA: {psychologist.partitaIva} • CF: {psychologist.codiceFiscale}
								</p>
							</div>
						</div>
						{#if !isEditPage}
							<Button href="/psicologi/{data.psychologistId}/modifica" variant="outline" size="sm">
								<Edit class="w-4 h-4 mr-2" />
								Modifica
							</Button>
						{/if}
					</div>
					
					<!-- Sub-navigation tabs -->
					{#if !isEditPage}
						<div class="flex gap-2 mt-6 pt-4 border-t">
							{#each subNav as item}
								<Button 
									href={item.href}
									variant={currentPath === item.href ? 'default' : 'ghost'}
									size="sm"
									class="gap-2"
								>
									{@const Icon = item.icona}
									<Icon class="w-4 h-4" />
									{item.nome}
								</Button>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
		
		<!-- Child content -->
		{@render children?.()}
	</div>
{:else}
	<div class="flex flex-col items-center justify-center h-64">
		<p class="text-gray-500 mb-4">Psicologo non trovato</p>
		<Button href="/psicologi" variant="outline">
			Torna alla lista
		</Button>
	</div>
{/if}