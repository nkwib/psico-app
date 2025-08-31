<script lang="ts">
	import { patients } from '$lib/stores/patients';
	import { psychologists } from '$lib/stores/psychologists';
	import { invoices } from '$lib/stores/invoices';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Select from '$lib/components/ui/select';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Edit, FileText, Trash2, Calendar, Mail, Phone, AlertCircle, User, Save, Settings } from 'lucide-svelte';
	import { formattatoreData, formattatoreValuta } from '$lib/utils/italiano';
	import { toast } from 'svelte-sonner';
	import ConfermaDialog from '$lib/components/ConfermaDialog.svelte';
	
	let { data } = $props();
	
	let patient = $state<any>(null);
	let psychologist = $state<any>(null);
	let patientInvoices = $state<any[]>([]);
	let mostraConfermaEliminazione = $state(false);
	let mostraPrezziPreferiti = $state(false);
	
	// Pricing preferences
	let importoPreferito = $state(50);
	let aliquotaIvaPreferita = $state('0');
	let prezzoIncludeIvaPreferito = $state(false);
	
	// Store subscriptions
	let unsubPatients: (() => void) | null = null;
	let unsubPsychologists: (() => void) | null = null;
	let unsubInvoices: (() => void) | null = null;
	
	onMount(() => {
		unsubPatients = patients.subscribe(allPatients => {
			const foundPatient = allPatients.find(p => p.id === Number(data.patientId));
			if (foundPatient) {
				patient = foundPatient;
				// Load pricing preferences if they exist
				if (foundPatient.prezziPreferiti) {
					importoPreferito = foundPatient.prezziPreferiti.importo || 50;
					aliquotaIvaPreferita = String(foundPatient.prezziPreferiti.aliquotaIva || 0);
					prezzoIncludeIvaPreferito = foundPatient.prezziPreferiti.prezzoIncludeIva || false;
				}
			}
		});
		
		unsubPsychologists = psychologists.subscribe(psychs => {
			psychologist = psychs.find(p => p.id === Number(data.psychologistId));
		});
		
		unsubInvoices = invoices.subscribe(allInvoices => {
			// Filter invoices for this patient with this psychologist
			patientInvoices = allInvoices.filter(i => 
				parseInt(i.idPaziente) === Number(data.patientId) &&
				parseInt(i.idPsicologo) === Number(data.psychologistId)
			);
		});
	});
	
	onDestroy(() => {
		if (unsubPatients) unsubPatients();
		if (unsubPsychologists) unsubPsychologists();
		if (unsubInvoices) unsubInvoices();
	});
	
	function eliminaPaziente() {
		if (patient?.id) {
			patients.remove(patient.id);
			toast.success(`Paziente ${patient.nome} ${patient.cognome} eliminato con successo`);
			goto(`/psicologi/${data.psychologistId}/pazienti`);
		}
	}
	
	function salvaPrezziPreferiti() {
		if (patient?.id) {
			const prezziPreferiti = {
				importo: importoPreferito,
				aliquotaIva: parseInt(aliquotaIvaPreferita),
				prezzoIncludeIva: prezzoIncludeIvaPreferito
			};
			patients.update(patient.id, { prezziPreferiti });
			toast.success('Prezzi preferiti salvati con successo');
			mostraPrezziPreferiti = false;
		}
	}
	
	// Calculate age from birth date
	let age = $derived(() => {
		if (!patient?.dataNascita) return null;
		const birthDate = new Date(patient.dataNascita);
		const today = new Date();
		let age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
			age--;
		}
		return age;
	});
</script>

{#if patient}
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex justify-between items-center">
			<div>
				<h3 class="text-lg font-semibold">{patient.nome} {patient.cognome}</h3>
				<p class="text-sm text-gray-600 mt-1">
					Paziente di {psychologist ? `Dr. ${psychologist.nome} ${psychologist.cognome}` : 'questo psicologo'}
				</p>
			</div>
			<div class="flex gap-2">
				<Button 
					href="/psicologi/{data.psychologistId}/pazienti/{data.patientId}/modifica"
					variant="outline"
					size="sm"
				>
					<Edit class="w-4 h-4 mr-2" />
					Modifica
				</Button>
				<Button 
					href="/psicologi/{data.psychologistId}/fatture/nuova?paziente={data.patientId}"
					size="sm"
				>
					<FileText class="w-4 h-4 mr-2" />
					Nuova Fattura
				</Button>
			</div>
		</div>

		<!-- Pricing Preferences Card -->
		{#if mostraPrezziPreferiti}
			<Card>
				<CardHeader>
					<div class="flex justify-between items-center">
						<CardTitle class="flex items-center gap-2">
							<Settings class="w-4 h-4" />
							Prezzi Preferiti per Fatturazione
						</CardTitle>
						<Button
							size="sm"
							variant="ghost"
							onclick={() => mostraPrezziPreferiti = false}
						>
							Chiudi
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<Label for="importoPreferito">Importo Predefinito (€)</Label>
							<Input
								id="importoPreferito"
								type="number"
								step="0.01"
								bind:value={importoPreferito}
							/>
						</div>
						<div>
							<Label for="aliquotaIvaPreferita">Aliquota IVA (%)</Label>
							<Select.Root type="single" bind:value={aliquotaIvaPreferita}>
								<Select.Trigger>
									{aliquotaIvaPreferita}%
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="0">0% - Esente</Select.Item>
									<Select.Item value="4">4% - Agevolata</Select.Item>
									<Select.Item value="10">10% - Ridotta</Select.Item>
									<Select.Item value="22">22% - Ordinaria</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
						<div class="flex items-end">
							<div class="flex items-center space-x-2">
								<Checkbox
									id="prezzoIncludeIvaPreferito"
									bind:checked={prezzoIncludeIvaPreferito}
								/>
								<Label
									for="prezzoIncludeIvaPreferito"
									class="text-sm font-normal cursor-pointer"
								>
									Importo IVA inclusa
								</Label>
							</div>
						</div>
					</div>
					<div class="flex justify-end mt-4">
						<Button onclick={salvaPrezziPreferiti} size="sm">
							<Save class="w-4 h-4 mr-2" />
							Salva Prezzi Preferiti
						</Button>
					</div>
				</CardContent>
			</Card>
		{:else}
			<div class="flex justify-end">
				<Button
					variant="outline"
					size="sm"
					onclick={() => mostraPrezziPreferiti = true}
				>
					<Settings class="w-4 h-4 mr-2" />
					Imposta Prezzi Preferiti
				</Button>
			</div>
		{/if}

		<!-- Patient Info Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<!-- Personal Information -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<User class="w-4 h-4" />
						Informazioni Personali
					</CardTitle>
				</CardHeader>
				<CardContent class="space-y-3">
					<div>
						<p class="text-sm text-gray-500">Nome Completo</p>
						<p class="font-medium">{patient.nome} {patient.cognome}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Codice Fiscale</p>
						<p class="font-medium uppercase">{patient.codiceFiscale}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Data di Nascita</p>
						<p class="font-medium">
							{patient.dataNascita ? formattatoreData.format(new Date(patient.dataNascita)) : '-'}
							{age() !== null && ` (${age()} anni)`}
						</p>
					</div>
					{#if patient.dataCreazione}
						<div>
							<p class="text-sm text-gray-500">Registrato il</p>
							<p class="font-medium">{formattatoreData.format(new Date(patient.dataCreazione))}</p>
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Contact Information -->
			<Card>
				<CardHeader>
					<CardTitle>Contatti</CardTitle>
				</CardHeader>
				<CardContent class="space-y-3">
					<div>
						<p class="text-sm text-gray-500 flex items-center gap-1">
							<Phone class="w-3 h-3" /> Telefono
						</p>
						<p class="font-medium">{patient.telefono || 'Non specificato'}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500 flex items-center gap-1">
							<Mail class="w-3 h-3" /> Email
						</p>
						<p class="font-medium">{patient.email || 'Non specificata'}</p>
					</div>
					{#if patient.contattoEmergenza}
						<div>
							<p class="text-sm text-gray-500 flex items-center gap-1">
								<AlertCircle class="w-3 h-3" /> Contatto Emergenza
							</p>
							<p class="font-medium">
								{patient.contattoEmergenza.nome} ({patient.contattoEmergenza.parentela})
							</p>
							<p class="text-sm text-gray-600">{patient.contattoEmergenza.telefono}</p>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>

		<!-- Anamnesis -->
		{#if patient.anamnesi}
			<Card>
				<CardHeader>
					<CardTitle>Note Anamnestiche</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="whitespace-pre-wrap">{patient.anamnesi}</p>
				</CardContent>
			</Card>
		{/if}

		<!-- Invoice History -->
		<Card>
			<CardHeader>
				<div class="flex justify-between items-center">
					<CardTitle>Storico Fatture con {psychologist?.nome} {psychologist?.cognome}</CardTitle>
					<Badge variant="secondary">
						{patientInvoices.length} fattur{patientInvoices.length === 1 ? 'a' : 'e'}
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				{#if patientInvoices.length > 0}
					<div class="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Numero</TableHead>
									<TableHead>Data</TableHead>
									<TableHead>Descrizione</TableHead>
									<TableHead>Importo</TableHead>
									<TableHead>Stato</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each patientInvoices as invoice}
									<TableRow>
										<TableCell class="font-medium">{invoice.numeroFattura}</TableCell>
										<TableCell>{formattatoreData.format(new Date(invoice.data))}</TableCell>
										<TableCell class="max-w-xs truncate">
											{invoice.descrizione || 'Prestazione professionale'}
										</TableCell>
										<TableCell class="font-medium">
											{formattatoreValuta.format(invoice.importo * (1 + invoice.aliquotaIva / 100))}
										</TableCell>
										<TableCell>
											<Badge variant={
												invoice.stato === 'pagata' ? 'default' :
												invoice.stato === 'annullata' ? 'destructive' : 'secondary'
											}>
												{invoice.stato || 'emessa'}
											</Badge>
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				{:else}
					<p class="text-center text-gray-500 py-8">
						Nessuna fattura emessa per questo paziente
					</p>
					<div class="text-center">
						<Button 
							href="/psicologi/{data.psychologistId}/fatture/nuova?paziente={data.patientId}"
							variant="outline"
							size="sm"
						>
							<FileText class="w-4 h-4 mr-2" />
							Crea prima fattura
						</Button>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Actions -->
		<div class="flex justify-between pt-6 border-t">
			<Button 
				variant="outline" 
				onclick={() => goto(`/psicologi/${data.psychologistId}/pazienti`)}
			>
				Torna alla lista
			</Button>
			<Button 
				variant="destructive"
				onclick={() => mostraConfermaEliminazione = true}
			>
				<Trash2 class="w-4 h-4 mr-2" />
				Elimina Paziente
			</Button>
		</div>
	</div>

	<!-- Delete Confirmation Dialog -->
	<ConfermaDialog
		bind:open={mostraConfermaEliminazione}
		titolo="Elimina Paziente"
		descrizione={`Sei sicuro di voler eliminare ${patient?.nome} ${patient?.cognome}? Questa operazione eliminerà il paziente da tutto il sistema e non può essere annullata.`}
		testoConferma="Elimina Paziente"
		testoAnnulla="Annulla"
		variante="destructive"
		onConferma={eliminaPaziente}
		onAnnulla={() => mostraConfermaEliminazione = false}
	/>
{:else}
	<div class="flex flex-col items-center justify-center h-64">
		<p class="text-gray-500 mb-4">Paziente non trovato</p>
		<Button 
			href="/psicologi/{data.psychologistId}/pazienti" 
			variant="outline"
		>
			Torna alla lista pazienti
		</Button>
	</div>
{/if}