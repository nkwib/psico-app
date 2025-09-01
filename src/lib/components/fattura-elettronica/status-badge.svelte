<script lang="ts">
	import type { ElectronicInvoiceStatus } from '$lib/services/fattura-elettronica/types';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		CircleCheck, 
		Clock, 
		CircleAlert, 
		CircleX, 
		Send 
	} from 'lucide-svelte';

	interface Props {
		status?: ElectronicInvoiceStatus;
		showIcon?: boolean;
		size?: 'sm' | 'default';
	}

	let { 
		status,
		showIcon = true,
		size = 'default'
	}: Props = $props();

	function getStatusConfig(status?: ElectronicInvoiceStatus) {
		switch (status) {
			case 'pending':
				return {
					label: 'Pendente',
					variant: 'secondary' as const,
					icon: Clock,
					color: 'text-yellow-600'
				};
			case 'sent':
				return {
					label: 'Inviata',
					variant: 'default' as const,
					icon: Send,
					color: 'text-blue-600'
				};
			case 'accepted':
				return {
					label: 'Accettata',
					variant: 'default' as const,
					icon: CircleCheck,
					color: 'text-green-600'
				};
			case 'rejected':
				return {
					label: 'Rifiutata',
					variant: 'destructive' as const,
					icon: CircleX,
					color: 'text-red-600'
				};
			case 'delivered':
				return {
					label: 'Consegnata',
					variant: 'default' as const,
					icon: CircleCheck,
					color: 'text-green-600'
				};
			default:
				return {
					label: 'Non Elettronica',
					variant: 'outline' as const,
					icon: CircleAlert,
					color: 'text-gray-600'
				};
		}
	}

	let statusConfig = $derived(getStatusConfig(status));
	let iconSize = $derived(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4');
</script>

<Badge variant={statusConfig.variant} class="gap-1">
	{#if showIcon}
		{@const IconComponent = statusConfig.icon}
		<IconComponent class={`${iconSize} ${statusConfig.color}`} />
	{/if}
	{statusConfig.label}
</Badge>