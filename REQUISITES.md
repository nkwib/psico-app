# Sistema di Gestione Studio Psicologico - SvelteKit + shadcn-svelte

## Panoramica del Progetto

Costruire un sistema completo di gestione dello studio per psicologi utilizzando **SvelteKit + shadcn-svelte + Superforms**. Questo sistema deve dare priorità ai pattern UI/UX specifici per la sanità, alla privacy dei dati e ai flussi di lavoro efficienti per la gestione delle informazioni dei pazienti e della fatturazione.

**🇮🇹 IMPORTANTE: APPLICAZIONE IN ITALIANO**

- **Lingua**: Tutta l'interfaccia utente deve essere completamente in italiano
- **Etichette**: Utilizzare terminologia italiana appropriata per il contesto sanitario
- **Validazione**: Implementare validazioni specifiche italiane (Codice Fiscale, Partita IVA)
- **Formati**: Utilizzare formati italiani per date, valute (Euro) e numeri
- **Conferme**: Implementare dialog di conferma per TUTTE le azioni distruttive

## Core Requirements

### 🏥 Requisiti Funzionali

1. **Gestione Profili Psicologo**

   - Creare/modificare profili psicologi con dettagli completi
   - Impostare un profilo come "preferito" per la generazione rapida delle fatture
   - Memorizzare: nome, cognome, codice fiscale, partita IVA, indirizzo, telefono, email

2. **Sistema di Gestione Pazienti**

   - Operazioni CRUD complete per i record dei pazienti
   - Dati paziente: nome, cognome, codice fiscale
   - Ricerca avanzata con filtri debounced
   - Operazioni bulk e export dei dati
   - **CONFERME OBBLIGATORIE**: Dialog di conferma per eliminazione pazienti

3. **Generazione Fatture**

   - Creare fatture collegando il psicologo preferito al paziente selezionato
   - Generazione automatica di numeri progressivi delle fatture
   - Pre-compilazione con data corrente e dati psicologo/paziente
   - Generare fatture PDF per il download
   - Memorizzare metadati fatture per storico e download bulk

4. **Persistenza Dati & Backup**
   - Tutti i dati memorizzati in localStorage (prima iterazione)
   - Funzionalità completa di export/import dati
   - Ripristino backup con dialog di conferma
   - **CONFERME OBBLIGATORIE**: Dialog di conferma per ripristino backup e cancellazione dati

## 🚨 Dialog di Conferma per Azioni Distruttive

**OBBLIGATORIO**: Implementare dialog di conferma per TUTTE le azioni distruttive con testi informativi in italiano.

### Componente Dialog di Conferma Riutilizzabile

```svelte
<!-- components/ConfermaDialog.svelte -->
<script>
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '$lib/components/ui/dialog';
    import { Button } from '$lib/components/ui/button';
    import { Alert, AlertDescription } from '$lib/components/ui/alert';
    import { AlertTriangle } from 'lucide-svelte';

    export let open = false;
    export let titolo = 'Conferma Azione';
    export let descrizione = 'Sei sicuro di voler procedere?';
    export let testoConferma = 'Conferma';
    export let testoAnnulla = 'Annulla';
    export let variante = 'destructive'; // 'destructive' | 'default'
    export let onConferma = () => {};
    export let onAnnulla = () => {};
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
```

### Esempi di Utilizzo dei Dialog di Conferma

**1. Eliminazione Paziente:**

```svelte
<script>
    import ConfermaDialog from '$lib/components/ConfermaDialog.svelte';

    let mostraConfermaEliminaPaziente = false;
    let pazienteDaEliminare = null;

    function confermaEliminaPaziente(paziente) {
        pazienteDaEliminare = paziente;
        mostraConfermaEliminaPaziente = true;
    }

    function eliminaPaziente() {
        if (pazienteDaEliminare) {
            pazienti.remove(pazienteDaEliminare.id);
            pazienteDaEliminare = null;
            // Mostra notifica successo
            toast.success('Paziente eliminato con successo');
        }
    }
</script>

<ConfermaDialog
    bind:open={mostraConfermaEliminaPaziente}
    titolo="Elimina Paziente"
    descrizione={`Sei sicuro di voler eliminare il paziente ${pazienteDaEliminare?.nome} ${pazienteDaEliminare?.cognome}? Questa azione eliminerà definitivamente tutti i dati associati, incluse le fatture. Questa operazione non può essere annullata.`}
    testoConferma="Elimina Paziente"
    testoAnnulla="Annulla"
    variante="destructive"
    onConferma={eliminaPaziente}
    onAnnulla={() => pazienteDaEliminare = null}
/>
```

**2. Cancellazione Dati Completa:**

```svelte
<script>
    let mostraConfermaReset = false;
    let confermaDigitata = '';

    function resetCompleto() {
        if (confermaDigitata === 'ELIMINA TUTTO') {
            localStorage.clear();
            window.location.reload();
        }
    }
</script>

<Dialog bind:open={mostraConfermaReset}>
    <DialogContent class="max-w-lg">
        <DialogHeader>
            <div class="flex items-center gap-3">
                <AlertTriangle class="w-6 h-6 text-red-500" />
                <DialogTitle>Elimina Tutti i Dati</DialogTitle>
            </div>
        </DialogHeader>

        <div class="py-4 space-y-4">
            <Alert class="border-red-200 bg-red-50">
                <AlertTriangle class="w-4 h-4 text-red-600" />
                <AlertDescription class="text-red-800">
                    <strong>ATTENZIONE:</strong> Questa azione eliminerà permanentemente:
                </AlertDescription>
            </Alert>

            <ul class="text-sm text-gray-700 list-disc list-inside space-y-1">
                <li>Tutti i profili degli psicologi</li>
                <li>Tutti i dati dei pazienti</li>
                <li>Tutte le fatture emesse</li>
                <li>Tutte le impostazioni dell'applicazione</li>
                <li>Tutti i backup locali</li>
            </ul>

            <p class="text-sm text-red-600 font-medium">
                Questa operazione NON PUÒ essere annullata.
            </p>

            <div class="space-y-2">
                <Label for="confermaEliminazione">
                    Per confermare, digita: <code class="bg-gray-100 px-2 py-1 rounded">ELIMINA TUTTO</code>
                </Label>
                <Input
                    id="confermaEliminazione"
                    bind:value={confermaDigitata}
                    placeholder="Digita qui..."
                    class={confermaDigitata === 'ELIMINA TUTTO' ? 'border-red-500' : ''}
                />
            </div>
        </div>

        <DialogFooter class="gap-2">
            <Button
                variant="outline"
                onclick={() => {
                    mostraConfermaReset = false;
                    confermaDigitata = '';
                }}
            >
                Annulla
            </Button>
            <Button
                variant="destructive"
                disabled={confermaDigitata !== 'ELIMINA TUTTO'}
                onclick={resetCompleto}
            >
                Elimina Tutti i Dati
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

**3. Ripristino Backup:**

```svelte
<script>
    import { toast } from 'svelte-sonner';

    let mostraConfermaRipristino = false;
    let fileBackup = null;

    function confermaRipristinoBackup(file) {
        fileBackup = file;
        mostraConfermaRipristino = true;
    }

    function ripristinaBackup() {
        if (fileBackup) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const dati = JSON.parse(e.target.result);

                    // Valida la struttura del backup
                    if (!dati.psicologi || !dati.pazienti || !dati.fatture) {
                        throw new Error('File backup non valido');
                    }

                    // Ripristina i dati
                    localStorage.setItem('psicologi', JSON.stringify(dati.psicologi));
                    localStorage.setItem('pazienti', JSON.stringify(dati.pazienti));
                    localStorage.setItem('fatture', JSON.stringify(dati.fatture));
                    localStorage.setItem('psicologoPreferito', dati.psicologoPreferito || '');

                    toast.success('Backup ripristinato con successo!');
                    window.location.reload();
                } catch (error) {
                    toast.error('Errore nel ripristino del backup', {
                        description: 'Il file selezionato non è un backup valido.'
                    });
                }
            };
            reader.readAsText(fileBackup);
        }
    }
</script>

<ConfermaDialog
    bind:open={mostraConfermaRipristino}
    titolo="Ripristina Backup"
    descrizione="Il ripristino del backup sostituirà TUTTI i dati attuali con quelli del file di backup selezionato. Tutti i dati attuali (psicologi, pazienti, fatture) andranno persi. Si consiglia di creare un backup dei dati attuali prima di procedere."
    testoConferma="Ripristina Backup"
    testoAnnulla="Annulla"
    variante="destructive"
    onConferma={ripristinaBackup}
    onAnnulla={() => fileBackup = null}
/>
```

**4. Notifiche Toast per Feedback:**

```javascript
// lib/utils/notifiche.js
import { toast } from "svelte-sonner";

export const notifiche = {
  pazienteCreato: (nome, cognome) =>
    toast.success(`Paziente ${nome} ${cognome} creato con successo`),

  pazienteEliminato: (nome, cognome) =>
    toast.success(`Paziente ${nome} ${cognome} eliminato`),

  fatturaCreata: (numero) =>
    toast.success(`Fattura ${numero} creata e scaricata`),

  backupEsportato: () => toast.success("Backup esportato con successo"),

  erroreGenerico: (messaggio) =>
    toast.error("Errore", { description: messaggio }),

  datiSalvati: () => toast.success("Dati salvati correttamente"),
};
```

### Design Philosophy

Based on **healthcare UX best practices for 2025**, implement:

**Clarity Over Aesthetics**: In healthcare, clarity matters more than beauty. Simplicity and intuitive designs reduce cognitive load and support better decision-making

**Action-Oriented Design**: Great dashboard design starts with knowing your audience's intent. Whether your user is a sales manager, data analyst, or logistics operator, they visit the dashboard to solve a problem or monitor performance

### Visual Design System

**Color Palette:**

- **Primary**: Clean medical teal/blue (#0f766e) - teal green, white and smoke colours - giving a calming effect
- **Backgrounds**: Light gray (#f8fafc) and white for contrast
- **Accents**: Warm green for success states, soft red for warnings
- **Text**: High contrast grays for accessibility

**Typography:**

- Use system fonts for healthcare compliance and accessibility
- typeface that has been widely used (and so tested), it has a friendly appearance
- Ensure WCAG 2.1 AA contrast ratios

**Layout Principles:**

1. The best dashboards tend not to include more than 5 or 6 cards in their initial view. Try to stick to a single screen to improve dashboard UX
2. A crowded dashboard will often have little whitespace and can hinder navigation. Therefore, by keeping important information on the surface and not overwhelming the user, we can ensure great UX
3. Use clear labels and intuitive paths to guide users. Overly complicated navigation can deter users from effectively using the dashboard

### Component Hierarchy & Navigation

**Struttura Navigazione Dashboard:**

```
├── Intestazione
│   ├── Titolo App: "Gestionale Studio"
│   ├── Azioni Rapide (Nuovo Paziente, Nuova Fattura)
│   └── Menu Profilo/Impostazioni
├── Navigazione Laterale
│   ├── Panoramica
│   ├── Psicologi
│   ├── Pazienti (con ricerca)
│   ├── Fatture
│   └── Impostazioni/Backup
└── Area Contenuto Principale
    ├── Intestazione Pagina con Breadcrumb
    ├── Barra Azioni (filtri, ricerca, azioni)
    └── Card/Tabelle Contenuto
```

**Visualizzazione Card Informazioni:**

- **Card Panoramica**: Totale psicologi, pazienti, fatture del mese
- **Card Azioni Rapide**: Pazienti recenti, fatture in sospeso
- **Indicatori Stato**: Badge colorati per stato fatture, attività pazienti

### Navigazione Responsive in Italiano

```svelte
<!-- components/Navigazione.svelte -->
<script>
    import { Button } from '$lib/components/ui/button';
    import { Sheet, SheetContent, SheetTrigger } from '$lib/components/ui/sheet';
    import { Menu, Users, FileText, Receipt } from 'lucide-svelte';
    import { page } from '$app/stores';

    const navigazione = [
        { nome: 'Panoramica', href: '/', icona: FileText },
        { nome: 'Psicologi', href: '/psicologi', icona: Users },
        { nome: 'Pazienti', href: '/pazienti', icona: Users },
        { nome: 'Fatture', href: '/fatture', icona: Receipt }
    ];
</script>

<!-- Navigazione Mobile -->
<div class="lg:hidden">
    <Sheet>
        <SheetTrigger asChild let:builder>
            <Button variant="ghost" size="sm" builders={[builder]}>
                <Menu class="w-5 h-5" />
            </Button>
        </SheetTrigger>
        <SheetContent side="left" class="w-64">
            <nav class="space-y-2">
                {#each navigazione as voce}
                    <a
                        href={voce.href}
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
        </SheetContent>
    </Sheet>
</div>

<!-- Navigazione Desktop -->
<nav class="hidden lg:flex space-x-4">
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
```

## 🛠 Technical Implementation Guide

### SvelteKit Architecture Patterns

**Project Structure:**

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/           # shadcn-svelte components
│   │   ├── layout/       # Navigation, header, sidebar
│   │   ├── forms/        # Form components with Superforms
│   │   └── charts/       # Data visualization
│   ├── stores/
│   │   ├── psychologists.js
│   │   ├── patients.js
│   │   └── invoices.js
│   ├── utils/
│   │   ├── validation.js # Zod schemas
│   │   ├── storage.js    # localStorage utilities
│   │   └── pdf.js        # PDF generation
│   └── types/
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte      # Dashboard
│   ├── psychologists/
│   ├── patients/
│   └── invoices/
└── app.html
```

### SvelteKit Best Practices

**1. Reactive Stores Pattern:**

```javascript
// lib/stores/patients.js
import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";

function createPatientStore() {
  const { subscribe, set, update } = writable([]);

  // Load from localStorage on client
  if (browser) {
    const stored = localStorage.getItem("patients");
    if (stored) set(JSON.parse(stored));
  }

  return {
    subscribe,
    add: (patient) =>
      update((patients) => {
        const newPatients = [...patients, { ...patient, id: Date.now() }];
        if (browser)
          localStorage.setItem("patients", JSON.stringify(newPatients));
        return newPatients;
      }),
    remove: (id) =>
      update((patients) => {
        const filtered = patients.filter((p) => p.id !== id);
        if (browser) localStorage.setItem("patients", JSON.stringify(filtered));
        return filtered;
      }),
    update: (id, data) =>
      update((patients) => {
        const updated = patients.map((p) =>
          p.id === id ? { ...p, ...data } : p
        );
        if (browser) localStorage.setItem("patients", JSON.stringify(updated));
        return updated;
      }),
  };
}

export const patients = createPatientStore();

// Derived store for search
export const filteredPatients = derived(
  [patients, searchTerm],
  ([$patients, $searchTerm]) =>
    $patients.filter((patient) =>
      `${patient.name} ${patient.surname} ${patient.taxId}`
        .toLowerCase()
        .includes($searchTerm.toLowerCase())
    )
);
```

**2. Load Function Pattern for Server-Side Logic:**

```javascript
// routes/patients/+page.server.js
import { superValidate } from "sveltekit-superforms/server";
import { patientSchema } from "$lib/utils/validation.js";

export async function load() {
  // Initialize empty form for new patients
  const form = await superValidate(patientSchema);

  return {
    form,
  };
}
```

## 📝 Superforms Integration Guide

### When to Use Superforms vs Form Actions

**Use Superforms for:**

- ✅ Complex form validation (patient forms, psychologist profiles)
- ✅ Multi-step forms or forms with dependent fields
- ✅ Real-time validation feedback
- ✅ Forms that need client-side state management
- ✅ Any form handling sensitive medical data

**Use Standard SvelteKit Form Actions for:**

- ✅ Simple operations (delete confirmations, logout)
- ✅ One-time data submissions without complex validation
- ✅ Progressive enhancement where JavaScript isn't guaranteed

### Comprehensive Superforms Examples

**1. Patient Registration Form (Complex Healthcare Form):**

```javascript
// lib/utils/validation.js
import { z } from "zod";

// Validazione Codice Fiscale italiano
const codiceFiscaleRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;

// Validazione Partita IVA italiana
const partitaIvaRegex = /^[0-9]{11}$/;

export const patientSchema = z.object({
  nome: z.string().min(2, "Il nome deve essere di almeno 2 caratteri"),
  cognome: z.string().min(2, "Il cognome deve essere di almeno 2 caratteri"),
  codiceFiscale: z
    .string()
    .regex(codiceFiscaleRegex, "Formato del codice fiscale non valido"),
  email: z.string().email("Formato email non valido").optional(),
  telefono: z
    .string()
    .regex(/^\+?[\d\s-()]{10,}$/, "Numero di telefono non valido")
    .optional(),
  dataNascita: z.string().min(1, "Data di nascita obbligatoria"),
  contattoEmergenza: z.object({
    nome: z.string().min(2, "Nome del contatto di emergenza obbligatorio"),
    telefono: z
      .string()
      .min(10, "Telefono del contatto di emergenza obbligatorio"),
    parentela: z.string().min(1, "Parentela obbligatoria"),
  }),
  anamnesi: z.array(z.string()).optional(),
  farmaci: z
    .array(
      z.object({
        nome: z.string(),
        dosaggio: z.string(),
        frequenza: z.string(),
      })
    )
    .optional(),
  consensoTrattamentoDati: z
    .boolean()
    .refine(
      (val) => val === true,
      "Il consenso al trattamento dati è obbligatorio"
    ),
});

export const psychologistSchema = z.object({
  nome: z.string().min(2, "Il nome deve essere di almeno 2 caratteri"),
  cognome: z.string().min(2, "Il cognome deve essere di almeno 2 caratteri"),
  codiceFiscale: z
    .string()
    .regex(codiceFiscaleRegex, "Formato del codice fiscale non valido"),
  partitaIva: z
    .string()
    .regex(partitaIvaRegex, "Formato della partita IVA non valido"),
  indirizzo: z.string().min(5, "Indirizzo obbligatorio"),
  telefono: z
    .string()
    .regex(/^\+?[\d\s-()]{10,}$/, "Numero di telefono non valido"),
  email: z.string().email("Formato email non valido"),
  numeroOrdine: z
    .string()
    .min(1, "Numero di iscrizione all'Ordine degli Psicologi obbligatorio")
    .optional(),
});

export const invoiceSchema = z.object({
  idPaziente: z.string().min(1, "Selezione paziente obbligatoria"),
  idPsicologo: z.string().min(1, "Selezione psicologo obbligatoria"),
  numeroFattura: z.string().min(1, "Numero fattura obbligatorio"),
  data: z.string().min(1, "Data obbligatoria"),
  descrizione: z.string().min(5, "Descrizione del servizio obbligatoria"),
  importo: z.number().min(0.01, "L'importo deve essere maggiore di 0"),
  aliquotaIva: z
    .number()
    .min(0)
    .max(100, "L'aliquota IVA deve essere tra 0-100%"),
  note: z.string().optional(),
});

export type PatientSchema = typeof patientSchema;
export type PsychologistSchema = typeof psychologistSchema;
export type InvoiceSchema = typeof invoiceSchema;
```

```javascript
// routes/patients/new/+page.server.js
import { superValidate } from "sveltekit-superforms/server";
import { fail, redirect } from "@sveltejs/kit";
import { patientSchema } from "$lib/utils/validation.js";

export async function load() {
  return {
    form: await superValidate(patientSchema),
  };
}

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, patientSchema);

    if (!form.valid) {
      return fail(400, { form });
    }

    // In a real app, save to database
    // For now, we'll handle this client-side via stores

    throw redirect(303, "/patients?created=true");
  },
};
```

```svelte
<!-- routes/pazienti/nuovo/+page.svelte -->
<script>
    import { superForm } from 'sveltekit-superforms/client';
    import { patientSchema } from '$lib/utils/validation.js';
    import { patients } from '$lib/stores/pazienti.js';
    import { goto } from '$app/navigation';

    // Componenti UI
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Checkbox } from '$lib/components/ui/checkbox';
    import { Textarea } from '$lib/components/ui/textarea';
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Alert, AlertDescription } from '$lib/components/ui/alert';

    export let data;

    const { form, errors, enhance, constraints, submitting, tainted } = superForm(data.form, {
        validators: patientSchema,
        resetForm: false,
        taintedMessage: 'Ci sono modifiche non salvate. Sei sicuro di voler uscire?',
        onSubmit: ({ formData, cancel }) => {
            // Gestisce l'invio del form lato client per localStorage
            cancel(); // Previene l'invio al server

            const datiPaziente = Object.fromEntries(formData);
            patients.add({
                ...datiPaziente,
                id: Date.now(),
                dataCreazione: new Date().toISOString()
            });

            goto('/pazienti?creato=true');
        },
        onError: ({ result, message }) => {
            console.error('Errore form:', result);
        }
    });
</script>

<div class="container mx-auto py-8 max-w-4xl">
    <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Nuovo Paziente</h1>
        <p class="text-gray-600 mt-2">Compila le informazioni complete del paziente per la cartella clinica</p>
    </div>

    <form method="POST" use:enhance class="space-y-6">
        <!-- Card Informazioni Anagrafiche -->
        <Card>
            <CardHeader>
                <CardTitle>Informazioni Anagrafiche</CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label for="nome">Nome *</Label>
                    <Input
                        id="nome"
                        name="nome"
                        bind:value={$form.nome}
                        {...$constraints.nome}
                        aria-invalid={$errors.nome ? 'true' : undefined}
                        class={$errors.nome ? 'border-red-500' : ''}
                    />
                    {#if $errors.nome}
                        <p class="text-sm text-red-500 mt-1">{$errors.nome}</p>
                    {/if}
                </div>

                <div>
                    <Label for="cognome">Cognome *</Label>
                    <Input
                        id="cognome"
                        name="cognome"
                        bind:value={$form.cognome}
                        {...$constraints.cognome}
                        aria-invalid={$errors.cognome ? 'true' : undefined}
                        class={$errors.cognome ? 'border-red-500' : ''}
                    />
                    {#if $errors.cognome}
                        <p class="text-sm text-red-500 mt-1">{$errors.cognome}</p>
                    {/if}
                </div>

                <div>
                    <Label for="codiceFiscale">Codice Fiscale *</Label>
                    <Input
                        id="codiceFiscale"
                        name="codiceFiscale"
                        bind:value={$form.codiceFiscale}
                        placeholder="RSSMRA85M01H501Z"
                        {...$constraints.codiceFiscale}
                        aria-invalid={$errors.codiceFiscale ? 'true' : undefined}
                        class={$errors.codiceFiscale ? 'border-red-500' : ''}
                    />
                    {#if $errors.codiceFiscale}
                        <p class="text-sm text-red-500 mt-1">{$errors.codiceFiscale}</p>
                    {/if}
                </div>

                <div>
                    <Label for="dataNascita">Data di Nascita *</Label>
                    <Input
                        id="dataNascita"
                        name="dataNascita"
                        type="date"
                        bind:value={$form.dataNascita}
                        {...$constraints.dataNascita}
                        aria-invalid={$errors.dataNascita ? 'true' : undefined}
                        class={$errors.dataNascita ? 'border-red-500' : ''}
                    />
                    {#if $errors.dataNascita}
                        <p class="text-sm text-red-500 mt-1">{$errors.dataNascita}</p>
                    {/if}
                </div>

                <div>
                    <Label for="telefono">Telefono</Label>
                    <Input
                        id="telefono"
                        name="telefono"
                        bind:value={$form.telefono}
                        placeholder="+39 xxx xxx xxxx"
                        {...$constraints.telefono}
                        aria-invalid={$errors.telefono ? 'true' : undefined}
                        class={$errors.telefono ? 'border-red-500' : ''}
                    />
                    {#if $errors.telefono}
                        <p class="text-sm text-red-500 mt-1">{$errors.telefono}</p>
                    {/if}
                </div>

                <div>
                    <Label for="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        bind:value={$form.email}
                        placeholder="paziente@esempio.com"
                        {...$constraints.email}
                        aria-invalid={$errors.email ? 'true' : undefined}
                        class={$errors.email ? 'border-red-500' : ''}
                    />
                    {#if $errors.email}
                        <p class="text-sm text-red-500 mt-1">{$errors.email}</p>
                    {/if}
                </div>
            </CardContent>
        </Card>

        <!-- Card Contatto di Emergenza -->
        <Card>
            <CardHeader>
                <CardTitle>Contatto di Emergenza</CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Label for="contattoEmergenza.nome">Nome Contatto *</Label>
                    <Input
                        id="contattoEmergenza.nome"
                        name="contattoEmergenza.nome"
                        bind:value={$form.contattoEmergenza.nome}
                        aria-invalid={$errors.contattoEmergenza?.nome ? 'true' : undefined}
                        class={$errors.contattoEmergenza?.nome ? 'border-red-500' : ''}
                    />
                    {#if $errors.contattoEmergenza?.nome}
                        <p class="text-sm text-red-500 mt-1">{$errors.contattoEmergenza.nome}</p>
                    {/if}
                </div>

                <div>
                    <Label for="contattoEmergenza.telefono">Telefono Contatto *</Label>
                    <Input
                        id="contattoEmergenza.telefono"
                        name="contattoEmergenza.telefono"
                        bind:value={$form.contattoEmergenza.telefono}
                        aria-invalid={$errors.contattoEmergenza?.telefono ? 'true' : undefined}
                        class={$errors.contattoEmergenza?.telefono ? 'border-red-500' : ''}
                    />
                    {#if $errors.contattoEmergenza?.telefono}
                        <p class="text-sm text-red-500 mt-1">{$errors.contattoEmergenza.telefono}</p>
                    {/if}
                </div>

                <div>
                    <Label for="contattoEmergenza.parentela">Parentela *</Label>
                    <Input
                        id="contattoEmergenza.parentela"
                        name="contattoEmergenza.parentela"
                        bind:value={$form.contattoEmergenza.parentela}
                        placeholder="es. Coniuge, Genitore, Amico"
                        aria-invalid={$errors.contattoEmergenza?.parentela ? 'true' : undefined}
                        class={$errors.contattoEmergenza?.parentela ? 'border-red-500' : ''}
                    />
                    {#if $errors.contattoEmergenza?.parentela}
                        <p class="text-sm text-red-500 mt-1">{$errors.contattoEmergenza.parentela}</p>
                    {/if}
                </div>
            </CardContent>
        </Card>

        <!-- Card Informazioni Cliniche -->
        <Card>
            <CardHeader>
                <CardTitle>Informazioni Cliniche</CardTitle>
                <p class="text-sm text-gray-600">Opzionale - può essere completato successivamente</p>
            </CardHeader>
            <CardContent class="space-y-4">
                <div>
                    <Label for="anamnesi">Anamnesi</Label>
                    <Textarea
                        id="anamnesi"
                        name="anamnesi"
                        placeholder="Diagnosi precedenti, interventi, allergie, ecc."
                        rows={3}
                        bind:value={$form.anamnesi}
                    />
                </div>
            </CardContent>
        </Card>

        <!-- Sezione Consenso -->
        <Card>
            <CardContent class="pt-6">
                <div class="flex items-start space-x-2">
                    <Checkbox
                        id="consensoTrattamentoDati"
                        name="consensoTrattamentoDati"
                        bind:checked={$form.consensoTrattamentoDati}
                        aria-invalid={$errors.consensoTrattamentoDati ? 'true' : undefined}
                    />
                    <div class="grid gap-1.5 leading-none">
                        <Label
                            for="consensoTrattamentoDati"
                            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Consenso al Trattamento dei Dati *
                        </Label>
                        <p class="text-xs text-muted-foreground">
                            Acconsento al trattamento dei miei dati personali e sanitari secondo il Regolamento GDPR ai fini del trattamento psicologico.
                        </p>
                    </div>
                </div>
                {#if $errors.consensoTrattamentoDati}
                    <p class="text-sm text-red-500 mt-2">{$errors.consensoTrattamentoDati}</p>
                {/if}
            </CardContent>
        </Card>

        <!-- Azioni Form -->
        <div class="flex justify-between pt-6 border-t">
            <Button variant="outline" type="button" onclick={() => history.back()}>
                Annulla
            </Button>

            <div class="flex gap-3">
                {#if $tainted}
                    <Alert class="max-w-xs">
                        <AlertDescription>Ci sono modifiche non salvate</AlertDescription>
                    </Alert>
                {/if}

                <Button type="submit" disabled={$submitting}>
                    {#if $submitting}
                        Creazione paziente...
                    {:else}
                        Crea Paziente
                    {/if}
                </Button>
            </div>
        </div>
    </form>
</div>
```

**2. Invoice Generation Form (Business Logic Form):**

```javascript
// lib/utils/validation.js
export const invoiceSchema = z.object({
  patientId: z.string().min(1, "Patient selection required"),
  psychologistId: z.string().min(1, "Psychologist selection required"),
  invoiceNumber: z.string().min(1, "Invoice number required"),
  date: z.string().min(1, "Date required"),
  description: z.string().min(5, "Service description required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  taxRate: z.number().min(0).max(100, "Tax rate must be between 0-100%"),
  notes: z.string().optional(),
});
```

```svelte
<!-- routes/invoices/new/+page.svelte -->
<script>
    import { superForm } from 'sveltekit-superforms/client';
    import { invoiceSchema } from '$lib/utils/validation.js';
    import { patients } from '$lib/stores/patients.js';
    import { psychologists, preferredPsychologist } from '$lib/stores/psychologists.js';
    import { invoices } from '$lib/stores/invoices.js';
    import { generatePDF } from '$lib/utils/pdf.js';

    // UI Components
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
    import { Textarea } from '$lib/components/ui/textarea';
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

    export let data;

    // Pre-populate form with preferred psychologist and today's date
    const today = new Date().toISOString().split('T')[0];
    const nextInvoiceNumber = `INV-${new Date().getFullYear()}-${String($invoices.length + 1).padStart(4, '0')}`;

    const { form, errors, enhance, submitting } = superForm(data.form, {
        validators: invoiceSchema,
        onSubmit: ({ formData, cancel }) => {
            cancel();

            const invoiceData = Object.fromEntries(formData);
            const selectedPatient = $patients.find(p => p.id === parseInt(invoiceData.patientId));
            const selectedPsychologist = $psychologists.find(p => p.id === parseInt(invoiceData.psychologistId));

            const invoice = {
                id: Date.now(),
                ...invoiceData,
                patient: selectedPatient,
                psychologist: selectedPsychologist,
                createdAt: new Date().toISOString(),
                status: 'draft'
            };

            invoices.add(invoice);
            generatePDF(invoice);

            goto('/invoices?created=true');
        }
    });

    // Initialize form with defaults
    $form.psychologistId = $preferredPsychologist?.id?.toString() || '';
    $form.date = today;
    $form.invoiceNumber = nextInvoiceNumber;
    $form.taxRate = 22; // Italian VAT rate
</script>

<div class="container mx-auto py-8 max-w-3xl">
    <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Create Invoice</h1>
        <p class="text-gray-600 mt-2">Generate a new invoice for psychological services</p>
    </div>

    <form method="POST" use:enhance class="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label for="invoiceNumber">Invoice Number *</Label>
                    <Input
                        id="invoiceNumber"
                        name="invoiceNumber"
                        bind:value={$form.invoiceNumber}
                        readonly
                        class="bg-gray-50"
                    />
                </div>

                <div>
                    <Label for="date">Date *</Label>
                    <Input
                        id="date"
                        name="date"
                        type="date"
                        bind:value={$form.date}
                        aria-invalid={$errors.date ? 'true' : undefined}
                        class={$errors.date ? 'border-red-500' : ''}
                    />
                    {#if $errors.date}
                        <p class="text-sm text-red-500 mt-1">{$errors.date}</p>
                    {/if}
                </div>

                <div>
                    <Label for="psychologistId">Psychologist *</Label>
                    <Select bind:value={$form.psychologistId}>
                        <SelectTrigger class={$errors.psychologistId ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select psychologist..." />
                        </SelectTrigger>
                        <SelectContent>
                            {#each $psychologists as psychologist}
                                <SelectItem value={psychologist.id.toString()}>
                                    Dr. {psychologist.name} {psychologist.surname}
                                    {#if psychologist.id === $preferredPsychologist?.id}
                                        <span class="text-blue-600 ml-2">✓ Preferred</span>
                                    {/if}
                                </SelectItem>
                            {/each}
                        </SelectContent>
                    </Select>
                    {#if $errors.psychologistId}
                        <p class="text-sm text-red-500 mt-1">{$errors.psychologistId}</p>
                    {/if}
                </div>

                <div>
                    <Label for="patientId">Patient *</Label>
                    <Select bind:value={$form.patientId}>
                        <SelectTrigger class={$errors.patientId ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select patient..." />
                        </SelectTrigger>
                        <SelectContent>
                            {#each $patients as patient}
                                <SelectItem value={patient.id.toString()}>
                                    {patient.name} {patient.surname}
                                    <span class="text-gray-500 ml-2">({patient.taxId})</span>
                                </SelectItem>
                            {/each}
                        </SelectContent>
                    </Select>
                    {#if $errors.patientId}
                        <p class="text-sm text-red-500 mt-1">{$errors.patientId}</p>
                    {/if}
                </div>
            </CardContent>
        </Card>

        <!-- Service Details -->
        <Card>
            <CardHeader>
                <CardTitle>Service Information</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
                <div>
                    <Label for="description">Service Description *</Label>
                    <Textarea
                        id="description"
                        name="description"
                        placeholder="Psychological consultation, therapy session, etc."
                        bind:value={$form.description}
                        aria-invalid={$errors.description ? 'true' : undefined}
                        class={$errors.description ? 'border-red-500' : ''}
                    />
                    {#if $errors.description}
                        <p class="text-sm text-red-500 mt-1">{$errors.description}</p>
                    {/if}
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label for="amount">Amount (€) *</Label>
                        <Input
                            id="amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            bind:value={$form.amount}
                            aria-invalid={$errors.amount ? 'true' : undefined}
                            class={$errors.amount ? 'border-red-500' : ''}
                        />
                        {#if $errors.amount}
                            <p class="text-sm text-red-500 mt-1">{$errors.amount}</p>
                        {/if}
                    </div>

                    <div>
                        <Label for="taxRate">VAT Rate (%) *</Label>
                        <Input
                            id="taxRate"
                            name="taxRate"
                            type="number"
                            min="0"
                            max="100"
                            bind:value={$form.taxRate}
                            aria-invalid={$errors.taxRate ? 'true' : undefined}
                            class={$errors.taxRate ? 'border-red-500' : ''}
                        />
                        {#if $errors.taxRate}
                            <p class="text-sm text-red-500 mt-1">{$errors.taxRate}</p>
                        {/if}
                    </div>
                </div>

                <div>
                    <Label for="notes">Additional Notes</Label>
                    <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Any additional information or terms..."
                        bind:value={$form.notes}
                    />
                </div>
            </CardContent>
        </Card>

        <!-- Invoice Preview/Summary -->
        {#if $form.amount && $form.taxRate}
            <Card class="bg-gray-50">
                <CardHeader>
                    <CardTitle class="text-lg">Invoice Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span>Subtotal:</span>
                            <span>€{parseFloat($form.amount).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>VAT ({$form.taxRate}%):</span>
                            <span>€{(parseFloat($form.amount) * parseFloat($form.taxRate) / 100).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between font-bold text-lg border-t pt-2">
                            <span>Total:</span>
                            <span>€{(parseFloat($form.amount) * (1 + parseFloat($form.taxRate) / 100)).toFixed(2)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        {/if}

        <!-- Form Actions -->
        <div class="flex justify-between pt-6 border-t">
            <Button variant="outline" type="button" onclick={() => history.back()}>
                Cancel
            </Button>

            <Button type="submit" disabled={$submitting}>
                {#if $submitting}
                    Creating Invoice...
                {:else}
                    Create & Download Invoice
                {/if}
            </Button>
        </div>
    </form>
</div>
```

## 🎯 shadcn-svelte Implementation Guide

### Installazione e Configurazione

```bash
# Inizializza progetto SvelteKit
npm create svelte@latest gestionale-psicologi
cd gestionale-psicologi

# Aggiungi Tailwind CSS
npx sv add tailwindcss

# Aggiungi shadcn-svelte
npx shadcn-svelte@latest init

# Installa componenti necessari
npx shadcn-svelte@latest add button input label card table dialog alert checkbox textarea select separator badge

# Installa dipendenze aggiuntive per l'applicazione italiana
npm install @internationalized/date lucide-svelte svelte-sonner zod sveltekit-superforms
```

### Configurazione Italiana Specifica

**1. Configurazione Locale:**

```javascript
// src/lib/utils/italiano.js
export const formattatoreData = new Intl.DateTimeFormat("it-IT", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const formattatoreValuta = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export const formattatoreNumero = new Intl.NumberFormat("it-IT");

export const validaCodiceFiscale = (cf) => {
  // Implementazione validazione codice fiscale italiano
  const regex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  return regex.test(cf.toUpperCase());
};

export const validaPartitaIva = (piva) => {
  // Implementazione validazione partita IVA italiana
  const regex = /^[0-9]{11}$/;
  if (!regex.test(piva)) return false;

  // Algoritmo di controllo partita IVA
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let digit = parseInt(piva[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(piva[10]);
};

export const etichette = {
  // Etichette comuni dell'applicazione
  paziente: "Paziente",
  pazienti: "Pazienti",
  psicologo: "Psicologo",
  psicologi: "Psicologi",
  fattura: "Fattura",
  fatture: "Fatture",
  nome: "Nome",
  cognome: "Cognome",
  codiceFiscale: "Codice Fiscale",
  partitaIva: "Partita IVA",
  telefono: "Telefono",
  email: "Email",
  indirizzo: "Indirizzo",
  data: "Data",
  importo: "Importo",
  descrizione: "Descrizione",
  note: "Note",
  salva: "Salva",
  annulla: "Annulla",
  elimina: "Elimina",
  modifica: "Modifica",
  crea: "Crea",
  nuovo: "Nuovo",
  nuova: "Nuova",
  cerca: "Cerca",
  conferma: "Conferma",
  attenzione: "Attenzione",
  successo: "Successo",
  errore: "Errore",
  caricamento: "Caricamento...",
  nessunRisultato: "Nessun risultato trovato",
  dataCreazione: "Data Creazione",
  ultimaModifica: "Ultima Modifica",
};
```

**2. Configurazione Toast in Italiano:**

```svelte
<!-- app.html -->
<script>
    import { Toaster } from 'svelte-sonner';
</script>

<!-- Aggiungi il componente Toaster per le notifiche -->
<Toaster
    richColors
    closeButton
    position="top-right"
    toastOptions={{
        duration: 4000,
        style: 'font-family: system-ui, -apple-system, sans-serif;'
    }}
/>
```

**3. Utilità per Generazione PDF in Italiano:**

```javascript
// lib/utils/generatorePDF.js
import { formattatoreData, formattatoreValuta } from "./italiano.js";

export function generaFatturaPDF(fattura) {
  const contenuto = `
FATTURA N. ${fattura.numeroFattura}
Data: ${formattatoreData.format(new Date(fattura.data))}

PRESTATORE DI SERVIZI:
Dott. ${fattura.psicologo.nome} ${fattura.psicologo.cognome}
Codice Fiscale: ${fattura.psicologo.codiceFiscale}
Partita IVA: ${fattura.psicologo.partitaIva}
Indirizzo: ${fattura.psicologo.indirizzo}
Telefono: ${fattura.psicologo.telefono}
Email: ${fattura.psicologo.email}

CLIENTE:
${fattura.paziente.nome} ${fattura.paziente.cognome}
Codice Fiscale: ${fattura.paziente.codiceFiscale}

PRESTAZIONE:
Descrizione: ${fattura.descrizione}
Imponibile: ${formattatoreValuta.format(fattura.importo)}
Aliquota IVA: ${fattura.aliquotaIva}%
IVA: ${formattatoreValuta.format((fattura.importo * fattura.aliquotaIva) / 100)}
TOTALE: ${formattatoreValuta.format(
    fattura.importo * (1 + fattura.aliquotaIva / 100)
  )}

${fattura.note ? `Note: ${fattura.note}` : ""}

Fattura elettronica non soggetta a marca da bollo ai sensi dell'art. 15 del DPR 642/72.
    `;

  const blob = new Blob([contenuto], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Fattura_${fattura.numeroFattura}_${fattura.paziente.cognome}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Component Usage Patterns

**1. Data Tables with Search and Actions:**

```svelte
<!-- components/PatientTable.svelte -->
<script>
    import { createTable, Render, Subscribe } from 'svelte-headless-table';
    import { addPagination, addSortBy, addTableFilter } from 'svelte-headless-table/plugins';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Badge } from '$lib/components/ui/badge';
    import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '$lib/components/ui/dropdown-menu';

    export let data;

    const table = createTable(data, {
        page: addPagination({ initialPageSize: 10 }),
        sort: addSortBy(),
        filter: addTableFilter({
            fn: ({ filterValue, value }) => value.toLowerCase().includes(filterValue.toLowerCase())
        })
    });

    const columns = table.createColumns([
        table.column({
            accessor: 'name',
            header: 'Name',
            cell: ({ value, row }) => `${value} ${row.original.surname}`
        }),
        table.column({
            accessor: 'taxId',
            header: 'Tax ID'
        }),
        table.column({
            accessor: 'createdAt',
            header: 'Created',
            cell: ({ value }) => new Date(value).toLocaleDateString()
        }),
        table.column({
            accessor: ({ id }) => id,
            header: 'Actions',
            cell: ({ value }) => value,
            plugins: {
                sort: { disable: true }
            }
        })
    ]);

    const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } =
        table.createViewModel(columns);

    const { hasNextPage, hasPreviousPage, pageIndex } = pluginStates.page;
    const { filterValue } = pluginStates.filter;
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <Input
            class="max-w-sm"
            placeholder="Search patients..."
            type="text"
            bind:value={$filterValue}
        />
    </div>

    <div class="rounded-md border">
        <table {...$tableAttrs} class="w-full">
            <thead>
                {#each $headerRows as headerRow}
                    <tr class="border-b">
                        {#each headerRow.cells as cell (cell.id)}
                            <th class="h-12 px-4 text-left align-middle font-medium">
                                <Render of={cell.render()} />
                            </th>
                        {/each}
                    </tr>
                {/each}
            </thead>
            <tbody {...$tableBodyAttrs}>
                {#each $pageRows as row (row.id)}
                    <tr class="border-b hover:bg-gray-50">
                        {#each row.cells as cell (cell.id)}
                            <td class="p-4 align-middle">
                                {#if cell.id.includes('actions')}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild let:builder>
                                            <Button variant="ghost" builders={[builder]}>
                                                Actions
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onclick={() => editPatient(row.original)}>
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onclick={() => createInvoice(row.original)}>
                                                Create Invoice
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onclick={() => deletePatient(row.original)}>
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                {:else}
                                    <Render of={cell.render()} />
                                {/if}
                            </td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between">
        <p class="text-sm text-gray-700">
            Page {$pageIndex + 1} of {Math.ceil(data.length / 10)}
        </p>
        <div class="flex items-center space-x-2">
            <Button
                variant="outline"
                size="sm"
                disabled={!$hasPreviousPage}
                onclick={() => pluginStates.page.previousPage()}
            >
                Previous
            </Button>
            <Button
                variant="outline"
                size="sm"
                disabled={!$hasNextPage}
                onclick={() => pluginStates.page.nextPage()}
            >
                Next
            </Button>
        </div>
    </div>
</div>
```

**2. Dashboard Cards with Healthcare-Specific Styling:**

```svelte
<!-- components/DashboardCard.svelte -->
<script>
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Badge } from '$lib/components/ui/badge';

    export let title;
    export let value;
    export let subtitle = '';
    export let trend = null; // 'up', 'down', 'stable'
    export let icon = null;
    export let color = 'blue'; // 'blue', 'green', 'amber', 'red'
</script>

<Card class="relative overflow-hidden">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium text-gray-600">
            {title}
        </CardTitle>
        {#if icon}
            <div class="h-4 w-4 text-gray-400">
                {@html icon}
            </div>
        {/if}
    </CardHeader>
    <CardContent>
        <div class="text-2xl font-bold text-gray-900">{value}</div>
        {#if subtitle}
            <p class="text-xs text-gray-500 mt-1">{subtitle}</p>
        {/if}
        {#if trend}
            <div class="mt-2">
                <Badge
                    variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}
                    class="text-xs"
                >
                    {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trend}
                </Badge>
            </div>
        {/if}
    </CardContent>
    <!-- Color accent bar -->
    <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-{color}-500 to-{color}-600"></div>
</Card>
```

## 🔒 Privacy & Security Implementation

### GDPR Compliance Features

Due to the sensitive nature of healthcare data, maintaining strict security measures is vital. UI/UX healthcare mobile app design should prioritize data privacy, ensuring that user information is protected at all times

**1. Consent Management:**

```javascript
// lib/stores/consent.js
import { writable } from "svelte/store";

export const consentStore = writable({
  dataProcessing: false,
  medicalRecords: false,
  communications: false,
  thirdPartySharing: false,
  timestamp: null,
});

export function recordConsent(consentData) {
  consentStore.set({
    ...consentData,
    timestamp: new Date().toISOString(),
  });

  // Log consent for audit trail
  const auditLog = JSON.parse(localStorage.getItem("auditLog") || "[]");
  auditLog.push({
    action: "CONSENT_RECORDED",
    data: consentData,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem("auditLog", JSON.stringify(auditLog));
}
```

**2. Data Export/Deletion (Right to Data Portability):**

```svelte
<!-- components/DataManagement.svelte -->
<script>
    import { Button } from '$lib/components/ui/button';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
    import { Alert, AlertDescription } from '$lib/components/ui/alert';

    function exportAllData() {
        const data = {
            patients: JSON.parse(localStorage.getItem('patients') || '[]'),
            psychologists: JSON.parse(localStorage.getItem('psychologists') || '[]'),
            invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
            consent: JSON.parse(localStorage.getItem('consent') || '{}'),
            exportDate: new Date().toISOString(),
            format: 'JSON'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `practice-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function deleteAllData() {
        if (confirm('This will permanently delete all data. This action cannot be undone.')) {
            localStorage.clear();
            window.location.reload();
        }
    }
</script>

<div class="space-y-4">
    <Alert>
        <AlertDescription>
            As per GDPR regulations, you have the right to export or delete your data at any time.
        </AlertDescription>
    </Alert>

    <div class="flex gap-4">
        <Button onclick={exportAllData}>
            Export All Data
        </Button>

        <Dialog>
            <DialogTrigger asChild let:builder>
                <Button variant="destructive" builders={[builder]}>
                    Delete All Data
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Data Deletion</DialogTitle>
                </DialogHeader>
                <p>This action will permanently delete all practice data including:</p>
                <ul class="list-disc ml-6 mt-2">
                    <li>All patient records</li>
                    <li>All psychologist profiles</li>
                    <li>All invoices</li>
                    <li>All system settings</li>
                </ul>
                <div class="flex justify-end gap-3 mt-6">
                    <Button variant="outline">Cancel</Button>
                    <Button variant="destructive" onclick={deleteAllData}>
                        Delete All Data
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
</div>
```

## 🎨 Advanced UI Patterns

### Micro-interactions for Healthcare UX

Microinteractions are prior design elements that improve usability and make dashboards feel more polished. They include things like button hover states, chart tooltips, filter loading animations, or icon transitions

**Loading States:**

```svelte
<!-- components/LoadingButton.svelte -->
<script>
    import { Button } from '$lib/components/ui/button';
    import { cn } from '$lib/utils';

    export let loading = false;
    export let disabled = false;
    export let variant = 'default';
    export let size = 'default';

    let className = '';
    export { className as class };
</script>

<Button
    {variant}
    {size}
    disabled={loading || disabled}
    class={cn('relative', className)}
    onclick
    {...$$restProps}
>
    {#if loading}
        <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <span class="opacity-0">
            <slot />
        </span>
    {:else}
        <slot />
    {/if}
</Button>
```

### Progressive Disclosure Pattern

Progressive disclosure solves this dilemma by revealing information in manageable layers

```svelte
<!-- components/PatientCard.svelte -->
<script>
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Button } from '$lib/components/ui/button';
    import { Badge } from '$lib/components/ui/badge';
    import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '$lib/components/ui/collapsible';
    import { ChevronDown, ChevronRight } from 'lucide-svelte';

    export let patient;

    let expanded = false;
</script>

<Card>
    <CardHeader>
        <div class="flex items-center justify-between">
            <CardTitle class="text-lg">
                {patient.name} {patient.surname}
            </CardTitle>
            <Badge variant="outline">
                {patient.status || 'Active'}
            </Badge>
        </div>
        <p class="text-sm text-gray-600">Tax ID: {patient.taxId}</p>
    </CardHeader>

    <CardContent>
        <div class="space-y-2">
            <p class="text-sm"><strong>Last Visit:</strong> {patient.lastVisit || 'No visits recorded'}</p>
            <p class="text-sm"><strong>Phone:</strong> {patient.phone || 'Not provided'}</p>
        </div>

        <Collapsible bind:open={expanded}>
            <CollapsibleTrigger asChild let:builder>
                <Button variant="ghost" size="sm" builders={[builder]} class="w-full mt-4">
                    {#if expanded}
                        <ChevronDown class="w-4 h-4 mr-2" />
                        Hide Details
                    {:else}
                        <ChevronRight class="w-4 h-4 mr-2" />
                        Show Details
                    {/if}
                </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div class="pt-4 border-t space-y-2">
                    <p class="text-sm"><strong>Date of Birth:</strong> {patient.dateOfBirth}</p>
                    <p class="text-sm"><strong>Emergency Contact:</strong> {patient.emergencyContact?.name} ({patient.emergencyContact?.phone})</p>
                    {#if patient.medicalHistory}
                        <div>
                            <p class="text-sm font-medium">Medical History:</p>
                            <p class="text-sm text-gray-600 mt-1">{patient.medicalHistory}</p>
                        </div>
                    {/if}
                    <div class="flex gap-2 mt-4">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">Create Invoice</Button>
                        <Button size="sm" variant="outline">View History</Button>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    </CardContent>
</Card>
```

## 📱 Mobile-First Responsive Design

Ensure your dashboard works seamlessly across different devices. In today's multi-device world, a dashboard that looks great on desktop but is unusable on a smartphone isn't very useful

### Responsive Navigation

```svelte
<!-- components/Navigation.svelte -->
<script>
    import { Button } from '$lib/components/ui/button';
    import { Sheet, SheetContent, SheetTrigger } from '$lib/components/ui/sheet';
    import { Menu, Users, FileText, Receipt } from 'lucide-svelte';
    import { page } from '$app/stores';

    const navigation = [
        { name: 'Dashboard', href: '/', icon: FileText },
        { name: 'Psychologists', href: '/psychologists', icon: Users },
        { name: 'Patients', href: '/patients', icon: Users },
        { name: 'Invoices', href: '/invoices', icon: Receipt }
    ];
</script>

<!-- Mobile Navigation -->
<div class="lg:hidden">
    <Sheet>
        <SheetTrigger asChild let:builder>
            <Button variant="ghost" size="sm" builders={[builder]}>
                <Menu class="w-5 h-5" />
            </Button>
        </SheetTrigger>
        <SheetContent side="left" class="w-64">
            <nav class="space-y-2">
                {#each navigation as item}
                    <a
                        href={item.href}
                        class="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                            {$page.url.pathname === item.href
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'}"
                    >
                        <svelte:component this={item.icon} class="w-4 h-4 mr-3" />
                        {item.name}
                    </a>
                {/each}
            </nav>
        </SheetContent>
    </Sheet>
</div>

<!-- Desktop Navigation -->
<nav class="hidden lg:flex space-x-4">
    {#each navigation as item}
        <a
            href={item.href}
            class="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                {$page.url.pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'}"
        >
            <svelte:component this={item.icon} class="w-4 h-4 mr-2" />
            {item.name}
        </a>
    {/each}
</nav>
```

## ⚡ Performance Optimization

### Virtual Lists for Large Datasets

```svelte
<!-- components/VirtualPatientList.svelte -->
<script>
    import { createVirtualizer } from '@tanstack/svelte-virtual';
    import { writable } from 'svelte/store';

    export let patients = [];

    let scrollElement;
    const count = patients.length;
    const rowHeight = 72; // Fixed row height in pixels

    $: virtualizer = createVirtualizer({
        count,
        getScrollElement: () => scrollElement,
        estimateSize: () => rowHeight,
        overscan: 5
    });

    $: items = $virtualizer.getVirtualItems();
    $: totalSize = $virtualizer.getTotalSize();
</script>

<div
    bind:this={scrollElement}
    class="h-96 overflow-auto border rounded-md"
>
    <div class="relative w-full" style="height: {totalSize}px">
        {#each items as virtualRow (virtualRow.index)}
            {@const patient = patients[virtualRow.index]}
            <div
                class="absolute top-0 left-0 w-full flex items-center p-4 border-b hover:bg-gray-50"
                style="height: {virtualRow.size}px; transform: translateY({virtualRow.start}px);"
            >
                <div class="flex-1">
                    <h3 class="font-medium">{patient.name} {patient.surname}</h3>
                    <p class="text-sm text-gray-500">{patient.taxId}</p>
                </div>
                <div class="flex gap-2">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="outline">Invoice</Button>
                </div>
            </div>
        {/each}
    </div>
</div>
```

## 🚀 Final Implementation Notes

### Error Handling Strategy

```javascript
// lib/utils/errors.js
export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

export function handleError(error, toast) {
  console.error("Application error:", error);

  if (error instanceof ValidationError) {
    toast.error(`Validation Error: ${error.message}`, {
      description: error.field ? `Field: ${error.field}` : undefined,
    });
  } else {
    toast.error("An unexpected error occurred", {
      description:
        "Please try again or contact support if the problem persists.",
    });
  }
}
```

### Testing Strategy

- **Unit Tests**: Test utility functions, validation schemas
- **Integration Tests**: Test Superforms integration, store updates
- **E2E Tests**: Test complete user workflows (patient creation → invoice generation)
- **Accessibility Tests**: Ensure WCAG 2.1 compliance throughout

### Deployment Preparation

```javascript
// vite.config.js
import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig({
  plugins: [sveltekit()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["svelte"],
          ui: ["@radix-ui/react-accordion"],
          forms: ["sveltekit-superforms"],
        },
      },
    },
  },
});
```

This specification provides a comprehensive foundation for building a modern, healthcare-compliant psychology practice management system. The combination of SvelteKit's simplicity, shadcn-svelte's beautiful components, and Superforms' powerful form handling creates an ideal stack for this domain-specific application.
