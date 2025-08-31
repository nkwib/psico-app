<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	let { data } = $props();
	
	// Redirect to dashboard
	onMount(() => {
		goto(`/psicologi/${data.psychologistId}/dashboard`);
	});
</script>

<!-- Redirecting to dashboard... -->