<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from 'svelte-sonner';
	import Navigazione from '$lib/components/Navigazione.svelte';
	import PsychologistSelector from '$lib/components/PsychologistSelector.svelte';
  import { Button } from '$lib/components/ui/button';
  import { House } from 'lucide-svelte';
  import { goto } from '$app/navigation';
	// import { Button } from '$lib/components/ui/button';
	// import { UserCircle } from 'lucide-svelte';
	
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white border-b">
		<div class="container mx-auto px-4">
			<div class="flex items-center justify-between h-16">
				<!-- Logo e Titolo -->
				<div class="flex items-center space-x-4">
					<Button variant="ghost"  onclick={() => goto('/')}>
						<House class="w-5 h-5" />
						<h1 class="text-xl font-bold text-gray-900">Gestionale Studio</h1>
					</Button>
				</div>

				<!-- Navigazione -->
				<div class="flex items-center space-x-4">
					<PsychologistSelector />
					<div class="h-6 w-px bg-gray-300"></div>
					<Navigazione />
					
					<!-- <div class="hidden lg:block">
						<Button variant="ghost" size="icon">
							<UserCircle class="w-5 h-5" />
						</Button>
					</div> -->
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="container mx-auto px-4 py-8">
		{@render children?.()}
	</main>
</div>

<!-- Toast Notifications -->
<Toaster 
	richColors 
	closeButton 
	position="top-right"
	duration={4000}
/>
