import { describe, it, expect, beforeEach } from 'vitest';
import { FaturaPAXMLGenerator } from './xml-generator';
import type { Invoice, Psychologist, Patient } from '$lib/utils/validation';

// Mock data for testing
const mockPsychologist: Psychologist = {
	id: 1,
	nome: 'Mario',
	cognome: 'Rossi',
	sesso: 'M',
	codiceFiscale: 'RSSMRA80A01H501Z',
	partitaIva: '12345678901',
	indirizzo: 'Via Roma 123',
	cap: '00100',
	citta: 'Roma',
	provincia: 'RM',
	telefono: '+39 06 123456789',
	email: 'mario.rossi@example.com',
	numeroOrdine: '12345',
	regioneOrdine: 'Lazio',
	pec: 'mario.rossi@pec.example.com',
	fatturaElettronicaAbilitata: true,
	regimeFiscale: 'forfettario'
};

const mockPatient: Patient = {
	id: 1,
	nome: 'Anna',
	cognome: 'Verdi',
	codiceFiscale: 'VRDNNA85C01H501W',
	dataNascita: '1985-03-01',
	indirizzo: 'Via Milano 456',
	cap: '00200',
	citta: 'Roma',
	provincia: 'RM',
	telefono: '+39 06 987654321',
	email: 'anna.verdi@example.com',
	contattoEmergenza: {
		nome: 'Giuseppe Verdi',
		telefono: '+39 06 111222333',
		parentela: 'Padre'
	},
	consensoTrattamentoDati: true,
	dataConsenso: '2024-01-15'
};

const mockInvoice: Invoice = {
	id: 1,
	idPaziente: '1',
	idPsicologo: '1',
	numeroFattura: '1/2024',
	data: '2024-01-15',
	descrizione: 'Prestazioni professionali psicologiche',
	importo: 50.00,
	aliquotaIva: 0,
	note: 'Seduta di sostegno psicologico',
	stato: 'emessa',
	regimeFiscale: 'forfettario',
	fatturazioneElettronica: true,
	dettaglioSedute: true,
	numeroSedute: 1,
	tipoPrestazione: 'sostegno_psicologico',
	speseAnticipate: 0,
	mostraPrivacy: false,
	modalitaPagamento: 'bonifico',
	marcaDaBollo: false,
	importoMarcaDaBollo: 2.00
};

describe('FaturaPAXMLGenerator', () => {
	let xmlGenerator: FaturaPAXMLGenerator;

	beforeEach(() => {
		xmlGenerator = new FaturaPAXMLGenerator();
	});

	it('should create an instance', () => {
		expect(xmlGenerator).toBeTruthy();
		expect(xmlGenerator).toBeInstanceOf(FaturaPAXMLGenerator);
	});

	it('should generate valid FatturaPA XML', () => {
		const xmlData = xmlGenerator.generateXML({
			invoice: mockInvoice,
			psychologist: mockPsychologist,
			patient: mockPatient
		});

		expect(xmlData).toBeTruthy();
		expect(typeof xmlData).toBe('string');
		expect(xmlData).toContain('FatturaElettronica');
		expect(xmlData).toContain('xmlns="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2"');
	});

	it('should include correct psychologist data in XML', () => {
		const xmlData = xmlGenerator.generateXML({
			invoice: mockInvoice,
			psychologist: mockPsychologist,
			patient: mockPatient
		});

		expect(xmlData).toContain(mockPsychologist.codiceFiscale);
		expect(xmlData).toContain(mockPsychologist.partitaIva);
		expect(xmlData).toContain(mockPsychologist.nome);
		expect(xmlData).toContain(mockPsychologist.cognome);
		expect(xmlData).toContain(mockPsychologist.indirizzo);
	});

	it('should include correct patient data in XML', () => {
		const xmlData = xmlGenerator.generateXML({
			invoice: mockInvoice,
			psychologist: mockPsychologist,
			patient: mockPatient
		});

		expect(xmlData).toContain(mockPatient.codiceFiscale);
		expect(xmlData).toContain(mockPatient.nome);
		expect(xmlData).toContain(mockPatient.cognome);
	});

	it('should include correct invoice data in XML', () => {
		const xmlData = xmlGenerator.generateXML({
			invoice: mockInvoice,
			psychologist: mockPsychologist,
			patient: mockPatient
		});

		expect(xmlData).toContain(mockInvoice.numeroFattura);
		expect(xmlData).toContain('2024-01-15'); // Date format
		expect(xmlData).toContain('50.00'); // Amount format
		expect(xmlData).toContain('TD06'); // Professional service document type
		expect(xmlData).toContain('EUR'); // Currency
	});

	it('should use correct regime fiscale code', () => {
		const xmlData = xmlGenerator.generateXML({
			invoice: mockInvoice,
			psychologist: mockPsychologist,
			patient: mockPatient
		});

		expect(xmlData).toContain('RF04'); // Forfettario regime code
	});

	it('should include VAT exemption for forfettario regime', () => {
		const xmlData = xmlGenerator.generateXML({
			invoice: mockInvoice,
			psychologist: mockPsychologist,
			patient: mockPatient
		});

		expect(xmlData).toContain('N2'); // VAT nature code for forfettario
		expect(xmlData).toContain('art. 1, comma da 54 a 89 della legge 190/2014');
	});

	it('should generate different progressive numbers', () => {
		const xml1 = xmlGenerator.generateXML({
			invoice: mockInvoice,
			psychologist: mockPsychologist,
			patient: mockPatient
		});

		// Wait a bit to ensure different timestamp
		const xml2 = xmlGenerator.generateXML({
			invoice: mockInvoice,
			psychologist: mockPsychologist,
			patient: mockPatient
		});

		const progressiveRegex = /<ProgressivoInvio>([^<]+)<\/ProgressivoInvio>/;
		const prog1 = xml1.match(progressiveRegex)?.[1];
		const prog2 = xml2.match(progressiveRegex)?.[1];

		expect(prog1).toBeTruthy();
		expect(prog2).toBeTruthy();
		expect(prog1).not.toBe(prog2);
	});

	it('should include Aruba transmitter code', () => {
		const xmlData = xmlGenerator.generateXML({
			invoice: mockInvoice,
			psychologist: mockPsychologist,
			patient: mockPatient
		});

		expect(xmlData).toContain('01879020517'); // Aruba's fiscal code
	});

	it('should generate credit note XML when isAmendment is true', () => {
		const xmlData = xmlGenerator.generateXML({
			invoice: mockInvoice,
			psychologist: mockPsychologist,
			patient: mockPatient,
			isAmendment: true
		});

		expect(xmlData).toContain('TD04'); // Credit note document type
	});

	it('should validate generated XML', () => {
		const xmlData = xmlGenerator.generateXML({
			invoice: mockInvoice,
			psychologist: mockPsychologist,
			patient: mockPatient
		});

		const validation = xmlGenerator.validateXML(xmlData);
		
		expect(validation.valid).toBe(true);
		expect(validation.errors).toHaveLength(0);
	});

	it('should detect invalid XML structure', () => {
		const invalidXml = '<invalid>test</invalid>';
		
		const validation = xmlGenerator.validateXML(invalidXml);
		
		expect(validation.valid).toBe(false);
		expect(validation.errors.length).toBeGreaterThan(0);
	});

	it('should handle expenses correctly', () => {
		const invoiceWithExpenses = {
			...mockInvoice,
			speseAnticipate: 10.50
		};

		const xmlData = xmlGenerator.generateXML({
			invoice: invoiceWithExpenses,
			psychologist: mockPsychologist,
			patient: mockPatient
		});

		expect(xmlData).toContain('Spese anticipate e sostenute');
		expect(xmlData).toContain('10.50');
		expect(xmlData).toContain('60.50'); // Total amount including expenses
	});

	it('should handle multiple sessions correctly', () => {
		const multiSessionInvoice = {
			...mockInvoice,
			numeroSedute: 3,
			dettaglioSedute: true
		};

		const xmlData = xmlGenerator.generateXML({
			invoice: multiSessionInvoice,
			psychologist: mockPsychologist,
			patient: mockPatient
		});

		expect(xmlData).toContain('3 sedute');
	});
});