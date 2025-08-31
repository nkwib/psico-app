<script lang="ts">
	import { get } from 'svelte/store';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '$lib/components/ui/dialog';
	import { 
		Download, 
		Upload, 
		Trash2, 
		AlertTriangle, 
		Shield, 
		Database,
		FileDown,
		FileUp,
		HardDrive
	} from 'lucide-svelte';
	import { patients } from '$lib/stores/patients';
	import { psychologists } from '$lib/stores/psychologists';
	import { invoices } from '$lib/stores/invoices';
	import { toast } from 'svelte-sonner';
	import ConfermaDialog from '$lib/components/ConfermaDialog.svelte';

	let mostraConfermaReset = $state(false);
	let mostraDialogRipristino = $state(false);
	let confermaDigitata = $state('');
	let fileBackup = $state<File | null>(null);
	let inputFile: HTMLInputElement;
	
	let patientsData = $state(get(patients));
	let psychologistsData = $state(get(psychologists));
	let invoicesData = $state(get(invoices));
	
	$effect(() => {
		const unsubPatients = patients.subscribe(value => patientsData = value);
		const unsubPsychologists = psychologists.subscribe(value => psychologistsData = value);
		const unsubInvoices = invoices.subscribe(value => invoicesData = value);
		
		return () => {
			unsubPatients();
			unsubPsychologists();
			unsubInvoices();
		};
	});

	// Calculate storage usage
	let totalRecords = $derived(patientsData.length + psychologistsData.length + invoicesData.length);
	let storageUsed = $derived(new Blob([
		JSON.stringify(patientsData),
		JSON.stringify(psychologistsData),
		JSON.stringify(invoicesData)
	]).size);
	let storageUsedMB = $derived((storageUsed / 1024 / 1024).toFixed(2));

	function esportaBackup() {
		const datiBackup = {
			versione: '1.0',
			dataEsportazione: new Date().toISOString(),
			psicologi: psychologistsData,
			pazienti: patientsData,
			fatture: invoicesData,
			psicologoPreferito: localStorage.getItem('preferredPsychologist')
		};

		const blob = new Blob([JSON.stringify(datiBackup, null, 2)], { 
			type: 'application/json' 
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `backup_gestionale_${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toast.success('Backup esportato con successo');
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			fileBackup = target.files[0];
			mostraDialogRipristino = true;
		}
	}

	function ripristinaBackup() {
		if (!fileBackup) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const result = e.target?.result;
				if (typeof result !== 'string') {
					throw new Error('Errore nella lettura del file');
				}

				const dati = JSON.parse(result);

				// Valida la struttura del backup
				if (!dati.psicologi || !dati.pazienti || !dati.fatture) {
					throw new Error('File backup non valido');
				}

				// Ripristina i dati
				localStorage.setItem('psychologists', JSON.stringify(dati.psicologi));
				localStorage.setItem('patients', JSON.stringify(dati.pazienti));
				localStorage.setItem('invoices', JSON.stringify(dati.fatture));
				if (dati.psicologoPreferito) {
					localStorage.setItem('preferredPsychologist', dati.psicologoPreferito);
				}

				toast.success('Backup ripristinato con successo!');
				setTimeout(() => {
					window.location.reload();
				}, 1500);
			} catch (error) {
				console.error('Errore nel ripristino:', error);
				toast.error('Errore nel ripristino del backup', {
					description: 'Il file selezionato non è un backup valido.'
				});
			}
		};
		reader.readAsText(fileBackup);
		mostraDialogRipristino = false;
		fileBackup = null;
	}

	function resetCompleto() {
		if (confermaDigitata === 'ELIMINA TUTTO') {
			localStorage.clear();
			toast.success('Tutti i dati sono stati eliminati');
			setTimeout(() => {
				window.location.reload();
			}, 1500);
		}
	}

	function esportaCSV(tipo: 'pazienti' | 'psicologi' | 'fatture') {
		let csv = '';
		let filename = '';

		switch(tipo) {
			case 'pazienti':
				csv = 'Nome,Cognome,Codice Fiscale,Email,Telefono,Data Nascita\n';
				patientsData.forEach(p => {
					csv += `"${p.nome}","${p.cognome}","${p.codiceFiscale}","${p.email || ''}","${p.telefono || ''}","${p.dataNascita}"\n`;
				});
				filename = 'pazienti.csv';
				break;
			case 'psicologi':
				csv = 'Nome,Cognome,Codice Fiscale,Partita IVA,Email,Telefono,Indirizzo\n';
				psychologistsData.forEach(p => {
					csv += `"${p.nome}","${p.cognome}","${p.codiceFiscale}","${p.partitaIva}","${p.email}","${p.telefono}","${p.indirizzo}"\n`;
				});
				filename = 'psicologi.csv';
				break;
			case 'fatture':
				csv = 'Numero,Data,Paziente,Psicologo,Importo,IVA,Totale,Stato\n';
				invoicesData.forEach(f => {
					const totale = f.importo * (1 + f.aliquotaIva / 100);
					csv += `"${f.numeroFattura}","${f.data}","${f.paziente?.nome} ${f.paziente?.cognome}","${f.psicologo?.nome} ${f.psicologo?.cognome}","${f.importo}","${f.aliquotaIva}%","${totale}","${f.stato || 'bozza'}"\n`;
				});
				filename = 'fatture.csv';
				break;
		}

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toast.success(`Esportazione ${tipo} completata`);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Impostazioni</h1>
		<p class="text-gray-600 mt-1">Gestisci backup e impostazioni dell'applicazione</p>
	</div>

	<!-- Storage Info -->
	<Card>
		<CardHeader>
			<div class="flex items-center gap-2">
				<HardDrive class="w-5 h-5 text-gray-500" />
				<CardTitle>Utilizzo Storage</CardTitle>
			</div>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div>
					<p class="text-sm text-gray-600">Pazienti</p>
					<p class="text-2xl font-bold">{patientsData.length}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">Psicologi</p>
					<p class="text-2xl font-bold">{psychologistsData.length}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">Fatture</p>
					<p class="text-2xl font-bold">{invoicesData.length}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">Spazio Utilizzato</p>
					<p class="text-2xl font-bold">{storageUsedMB} MB</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Backup & Restore -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<Card>
			<CardHeader>
				<div class="flex items-center gap-2">
					<Database class="w-5 h-5 text-blue-500" />
					<CardTitle>Backup Dati</CardTitle>
				</div>
				<CardDescription>
					Esporta tutti i dati in un file di backup
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<Alert>
					<Shield class="w-4 h-4" />
					<AlertDescription>
						Il backup include tutti i dati di pazienti, psicologi e fatture. 
						Conserva il file in un luogo sicuro.
					</AlertDescription>
				</Alert>
				
				<Button 
					onclick={esportaBackup} 
					class="w-full"
					variant="outline"
				>
					<Download class="w-4 h-4 mr-2" />
					Esporta Backup Completo
				</Button>

				<div class="pt-4 border-t space-y-2">
					<p class="text-sm font-medium text-gray-700">Esportazioni Parziali (CSV)</p>
					<div class="grid grid-cols-3 gap-2">
						<Button 
							variant="outline" 
							size="sm"
							onclick={() => esportaCSV('pazienti')}
						>
							Pazienti
						</Button>
						<Button 
							variant="outline" 
							size="sm"
							onclick={() => esportaCSV('psicologi')}
						>
							Psicologi
						</Button>
						<Button 
							variant="outline" 
							size="sm"
							onclick={() => esportaCSV('fatture')}
						>
							Fatture
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<div class="flex items-center gap-2">
					<Upload class="w-5 h-5 text-green-500" />
					<CardTitle>Ripristina Backup</CardTitle>
				</div>
				<CardDescription>
					Importa i dati da un file di backup precedente
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<Alert class="border-orange-200 bg-orange-50">
					<AlertTriangle class="w-4 h-4 text-orange-600" />
					<AlertDescription class="text-orange-800">
						Il ripristino sostituirà TUTTI i dati attuali. 
						Esegui un backup prima di procedere.
					</AlertDescription>
				</Alert>

				<input
					bind:this={inputFile}
					type="file"
					accept=".json"
					on:change={handleFileSelect}
					class="hidden"
				/>
				
				<Button 
					onclick={() => inputFile.click()}
					class="w-full"
					variant="outline"
				>
					<FileUp class="w-4 h-4 mr-2" />
					Seleziona File di Backup
				</Button>
			</CardContent>
		</Card>
	</div>

	<!-- Privacy & GDPR -->
	<Card>
		<CardHeader>
			<div class="flex items-center gap-2">
				<Shield class="w-5 h-5 text-purple-500" />
				<CardTitle>Privacy e GDPR</CardTitle>
			</div>
			<CardDescription>
				Gestione dati secondo il Regolamento GDPR
			</CardDescription>
		</CardHeader>
		<CardContent>
			<Alert>
				<AlertDescription>
					In conformità al GDPR, hai il diritto di esportare o eliminare i tuoi dati in qualsiasi momento.
					Tutti i dati sono memorizzati localmente sul tuo dispositivo.
				</AlertDescription>
			</Alert>

			<div class="mt-6 pt-6 border-t">
				<h3 class="text-lg font-semibold text-red-600 mb-4">Zona Pericolosa</h3>
				
				<Card class="border-red-200 bg-red-50">
					<CardContent class="pt-6">
						<div class="space-y-4">
							<div>
								<h4 class="font-medium text-red-900">Elimina Tutti i Dati</h4>
								<p class="text-sm text-red-700 mt-1">
									Questa azione eliminerà permanentemente tutti i dati dell'applicazione.
								</p>
							</div>
							
							<Button 
								variant="destructive"
								onclick={() => mostraConfermaReset = true}
							>
								<Trash2 class="w-4 h-4 mr-2" />
								Elimina Tutti i Dati
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</CardContent>
	</Card>
</div>

<!-- Dialog Conferma Ripristino -->
<ConfermaDialog
	bind:open={mostraDialogRipristino}
	titolo="Ripristina Backup"
	descrizione="Il ripristino del backup sostituirà TUTTI i dati attuali con quelli del file di backup selezionato. Tutti i dati attuali (psicologi, pazienti, fatture) andranno persi. Si consiglia di creare un backup dei dati attuali prima di procedere."
	testoConferma="Ripristina Backup"
	testoAnnulla="Annulla"
	variante="destructive"
	onConferma={ripristinaBackup}
	onAnnulla={() => fileBackup = null}
/>

<!-- Dialog Reset Completo -->
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