<script lang="ts">
	import { get } from 'svelte/store';
	import { psychologists } from '$lib/stores/psychologists';
	import { selectedPsychologistId, selectedPsychologist, isAllPsychologistsMode } from '$lib/stores/selectedPsychologist';
	import * as Select from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import { Users, User } from 'lucide-svelte';
	
	let psychologistsData = $state(get(psychologists));
	let selectedPsychologistData = $state(get(selectedPsychologist));
	let isAllMode = $state(get(isAllPsychologistsMode));
	let currentValue = $state(get(selectedPsychologistId)?.toString() || 'all');
	
	$effect(() => {
		const unsubPsychologists = psychologists.subscribe(value => psychologistsData = value);
		const unsubSelected = selectedPsychologist.subscribe(value => selectedPsychologistData = value);
		const unsubIsAll = isAllPsychologistsMode.subscribe(value => isAllMode = value);
		const unsubSelectedId = selectedPsychologistId.subscribe(value => {
			currentValue = value?.toString() || 'all';
		});
		
		return () => {
			unsubPsychologists();
			unsubSelected();
			unsubIsAll();
			unsubSelectedId();
		};
	});
	
	$effect(() => {
		if (currentValue === 'all') {
			selectedPsychologistId.clear();
		} else if (currentValue) {
			selectedPsychologistId.set(parseInt(currentValue));
		}
	});
</script>

<div class="flex items-center gap-2">
	<Select.Root type="single" bind:value={currentValue}>
		<Select.Trigger class="w-[250px]">
			<div class="flex items-center gap-2">
				{#if isAllMode}
					<Users class="w-4 h-4 text-gray-500" />
					<span>Tutti i Psicologi</span>
				{:else if selectedPsychologistData}
					<User class="w-4 h-4 text-blue-600" />
					<span class="font-medium">
						Dott. {selectedPsychologistData.nome} {selectedPsychologistData.cognome}
					</span>
				{/if}
			</div>
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="all">
				<div class="flex items-center gap-2">
					<Users class="w-4 h-4 text-gray-500" />
					<span>Tutti i Psicologi</span>
				</div>
			</Select.Item>
			<Select.Separator />
			{#each psychologistsData as psicologo}
				<Select.Item value={psicologo.id?.toString() || ''}>
					<div class="flex items-center gap-2">
						<User class="w-4 h-4" />
						<span>Dr. {psicologo.nome} {psicologo.cognome}</span>
						{#if psicologo.isPreferito}
							<Badge variant="outline" class="ml-auto text-xs">Preferito</Badge>
						{/if}
					</div>
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
	
	{#if !isAllMode && selectedPsychologistData}
		<Badge variant="secondary" class="text-xs">
			Filtro Attivo
		</Badge>
	{/if}
</div>