<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Menu, Users, FileText, Receipt, Home, Settings } from 'lucide-svelte';
    import { page } from '$app/stores';

    const navigazione = [
        { nome: 'Panoramica', href: '/', icona: Home },
        { nome: 'Psicologi', href: '/psicologi', icona: Users },
        { nome: 'Pazienti', href: '/pazienti', icona: Users },
        { nome: 'Fatture', href: '/fatture', icona: Receipt },
        { nome: 'Impostazioni', href: '/impostazioni', icona: Settings }
    ];

    let mobileMenuOpen = false;
</script>

<!-- Mobile Menu Button -->
<div class="lg:hidden">
    <Button variant="ghost" size="icon" onclick={() => mobileMenuOpen = !mobileMenuOpen}>
        <Menu class="w-5 h-5" />
    </Button>
</div>

<!-- Mobile Navigation -->
{#if mobileMenuOpen}
    <div class="lg:hidden absolute top-16 left-0 right-0 bg-white border-b shadow-lg z-50">
        <nav class="p-4 space-y-2">
            {#each navigazione as voce}
                <a
                    href={voce.href}
                    onclick={() => mobileMenuOpen = false}
                    class="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                        {$page.url.pathname === voce.href
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'}"
                >
                    <svelte:component this={voce.icona} class="w-4 h-4 mr-3" />
                    {voce.nome}
                </a>
            {/each}
        </nav>
    </div>
{/if}

<!-- Desktop Navigation -->
<nav class="hidden lg:flex space-x-2">
    {#each navigazione as voce}
        <a
            href={voce.href}
            class="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                {$page.url.pathname === voce.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'}"
        >
            <svelte:component this={voce.icona} class="w-4 h-4 mr-2" />
            {voce.nome}
        </a>
    {/each}
</nav>