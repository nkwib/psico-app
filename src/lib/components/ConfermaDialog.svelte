<script lang="ts">
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogFooter
    } from '$lib/components/ui/dialog';
    import { Button } from '$lib/components/ui/button';
    import { Alert, AlertDescription } from '$lib/components/ui/alert';
    import { AlertTriangle } from 'lucide-svelte';

    let { 
        open = $bindable(false),
        titolo = 'Conferma Azione',
        descrizione = 'Sei sicuro di voler procedere?',
        testoConferma = 'Conferma',
        testoAnnulla = 'Annulla',
        variante = 'destructive',
        onConferma = () => {},
        onAnnulla = () => {}
    }: {
        open?: boolean;
        titolo?: string;
        descrizione?: string;
        testoConferma?: string;
        testoAnnulla?: string;
        variante?: 'destructive' | 'default';
        onConferma?: () => void;
        onAnnulla?: () => void;
    } = $props();
</script>

<Dialog bind:open>
    <DialogContent class="max-w-md">
        <DialogHeader>
            <div class="flex items-center gap-3">
                {#if variante === 'destructive'}
                    <AlertTriangle class="w-6 h-6 text-red-500" />
                {/if}
                <DialogTitle>{titolo}</DialogTitle>
            </div>
        </DialogHeader>

        <div class="py-4">
            {#if variante === 'destructive'}
                <Alert class="border-red-200 bg-red-50">
                    <AlertTriangle class="w-4 h-4 text-red-600" />
                    <AlertDescription class="text-red-800">
                        {descrizione}
                    </AlertDescription>
                </Alert>
            {:else}
                <p class="text-gray-700">{descrizione}</p>
            {/if}
        </div>

        <DialogFooter class="gap-2">
            <Button
                variant="outline"
                onclick={() => {
                    open = false;
                    onAnnulla();
                }}
            >
                {testoAnnulla}
            </Button>
            <Button
                variant={variante}
                onclick={() => {
                    open = false;
                    onConferma();
                }}
            >
                {testoConferma}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>