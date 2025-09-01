import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { FaturaPAXMLGenerator } from '$lib/services/fattura-elettronica/xml-generator';
import { ArubaAPIClient } from '$lib/services/fattura-elettronica/aruba-client';

// Mock test data
const mockPsychologist = {
  id: 1,
  nome: 'Mario',
  cognome: 'Rossi',
  sesso: 'M' as const,
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
  regimeFiscale: 'forfettario' as const
};

const mockPatient = {
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

const mockInvoice = {
  id: 1,
  idPaziente: '1',
  idPsicologo: '1',
  numeroFattura: '1/2024',
  data: '2024-01-15',
  descrizione: 'Prestazioni professionali psicologiche',
  importo: 50.00,
  aliquotaIva: 0,
  note: 'Seduta di sostegno psicologico',
  stato: 'emessa' as const,
  regimeFiscale: 'forfettario' as const,
  fatturazioneElettronica: true,
  dettaglioSedute: true,
  numeroSedute: 1,
  tipoPrestazione: 'sostegno_psicologico' as const,
  speseAnticipate: 0,
  mostraPrivacy: false,
  modalitaPagamento: 'bonifico' as const,
  marcaDaBollo: false,
  importoMarcaDaBollo: 2.00
};

export const GET: RequestHandler = async ({ url }) => {
  const testType = url.searchParams.get('test') || 'connection';

  try {
    switch (testType) {
      case 'connection':
        return await testConnection();
      
      case 'xml':
        return await testXMLGeneration();
      
      case 'upload':
        return await testInvoiceUpload();
      
      case 'status':
        return await testStatusCheck();
      
      case 'full':
        return await testFullWorkflow();
      
      default:
        return json({
          error: 'Invalid test type',
          availableTests: ['connection', 'xml', 'upload', 'status', 'full']
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Test error:', error);
    return json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

async function testConnection() {
  const arubaClient = new ArubaAPIClient();
  const result = await arubaClient.testConnection();
  
  return json({
    test: 'connection',
    result,
    environment: arubaClient.getEnvironmentInfo()
  });
}

async function testXMLGeneration() {
  const xmlGenerator = new FaturaPAXMLGenerator();
  const xmlData = xmlGenerator.generateXML({
    invoice: mockInvoice,
    psychologist: mockPsychologist,
    patient: mockPatient
  });
  
  const validation = xmlGenerator.validateXML(xmlData);
  
  return json({
    test: 'xml-generation',
    result: {
      success: validation.valid,
      xmlLength: xmlData.length,
      validation,
      preview: xmlData.substring(0, 500) + '...' // First 500 chars for preview
    }
  });
}

async function testInvoiceUpload() {
  // Generate XML first
  const xmlGenerator = new FaturaPAXMLGenerator();
  const xmlData = xmlGenerator.generateXML({
    invoice: mockInvoice,
    psychologist: mockPsychologist,
    patient: mockPatient
  });
  
  // Upload to Aruba (mock)
  const arubaClient = new ArubaAPIClient();
  const uploadResult = await arubaClient.uploadInvoice(xmlData, 'test_invoice.xml');
  
  return json({
    test: 'invoice-upload',
    result: uploadResult,
    environment: arubaClient.getEnvironmentInfo()
  });
}

async function testStatusCheck() {
  const arubaClient = new ArubaAPIClient();
  const status = await arubaClient.getInvoiceStatus('test_invoice.xml');
  
  return json({
    test: 'status-check',
    result: status,
    environment: arubaClient.getEnvironmentInfo()
  });
}

async function testFullWorkflow() {
  const results: any = {};
  
  // 1. Test connection
  const arubaClient = new ArubaAPIClient();
  results.connection = await arubaClient.testConnection();
  
  // 2. Generate XML
  const xmlGenerator = new FaturaPAXMLGenerator();
  const xmlData = xmlGenerator.generateXML({
    invoice: mockInvoice,
    psychologist: mockPsychologist,
    patient: mockPatient
  });
  
  const validation = xmlGenerator.validateXML(xmlData);
  results.xmlGeneration = {
    success: validation.valid,
    errors: validation.errors
  };
  
  // 3. Upload invoice
  if (validation.valid) {
    results.upload = await arubaClient.uploadInvoice(xmlData, `test_full_${Date.now()}.xml`);
    
    // 4. Check status
    if (results.upload.success) {
      results.status = await arubaClient.getInvoiceStatus(results.upload.uploadFilename!);
    }
  }
  
  return json({
    test: 'full-workflow',
    results,
    environment: arubaClient.getEnvironmentInfo(),
    summary: {
      connection: results.connection?.success || false,
      xmlGeneration: results.xmlGeneration?.success || false,
      upload: results.upload?.success || false,
      statusCheck: !!results.status
    }
  });
}