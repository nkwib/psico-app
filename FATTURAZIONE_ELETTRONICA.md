# Fatturazione Elettronica - Implementazione Completa

Questa implementazione aggiunge il supporto completo per la Fatturazione Elettronica italiana tramite l'integrazione con i servizi Aruba.

## 🚀 Funzionalità Implementate

### ✅ Generazione XML FatturaPA
- **Generazione XML**: Completa generazione del formato FatturaPA v1.2
- **Validazione**: Controllo struttura XML e conformità normativa
- **Regime Forfettario**: Supporto completo per professionisti in regime forfettario
- **ENPAP**: Gestione contributi previdenziali per psicologi
- **Natura IVA**: Gestione corretta delle esenzioni IVA

### ✅ Integrazione Aruba
- **Autenticazione**: Sistema di autenticazione automatica con refresh token
- **Invio Fatture**: Upload automatico delle fatture al Sistema di Interscambio
- **Monitoraggio Stato**: Controllo automatico dello stato delle fatture
- **Test Environment**: Supporto per ambiente di test Aruba
- **Rate Limiting**: Rispetto dei limiti di utilizzo API

### ✅ Interfaccia Utente
- **Checkbox Attivazione**: Opzione per abilitare fatturazione elettronica per singola fattura
- **Status Badge**: Indicatori visivi dello stato SDI
- **Dashboard Status**: Componente completo per monitoraggio stato fatture
- **Amendment Dialog**: Dialog per creazione note di credito
- **Validazione Form**: Controlli di validazione specifici per FE

### ✅ Gestione Errori e Correzioni
- **Note di Credito**: Sistema completo per correzioni post-invio
- **Validazione Errori**: Gestione errori di validazione SDI
- **Storico Operazioni**: Tracciamento completo delle operazioni
- **Retry Logic**: Sistema di retry automatico per errori temporanei

## 📋 Setup per Produzione

### 1. Configurazione Environment

Crea un file `.env` con le seguenti variabili:

```bash
# Fatturazione Elettronica - Aruba API Configuration

# Test Environment (Demo)
ARUBA_FE_TEST_BASE_URL=https://demows.fatturazioneelettronica.aruba.it
ARUBA_FE_TEST_USERNAME=your_test_username
ARUBA_FE_TEST_PASSWORD=your_test_password

# Production Environment
ARUBA_FE_PROD_BASE_URL=https://ws.fatturazioneelettronica.aruba.it
ARUBA_FE_PROD_USERNAME=your_prod_username
ARUBA_FE_PROD_PASSWORD=your_prod_password

# Environment Mode: 'test' or 'production'
ARUBA_FE_ENVIRONMENT=test

# Optional: Enable/disable electronic invoicing feature
FEATURE_ELECTRONIC_INVOICING=true
```

### 2. Setup Aruba Account

#### Account Demo (Testing)
1. Registrati su [Aruba Demo](https://demows.fatturazioneelettronica.aruba.it)
2. Ottieni credenziali di accesso per API
3. Configura il trasmittente con codice fiscale Aruba: `01879020517`

#### Account Produzione
1. Sottoscrivi servizio Aruba Fatturazione Elettronica
2. Completa l'attivazione del web panel
3. Ottieni credenziali API di produzione
4. Verifica la configurazione fiscale

### 3. Configurazione Psicologo

Per abilitare la fatturazione elettronica per uno psicologo:

1. **Vai su Modifica Psicologo**
2. **Abilita Fatturazione Elettronica**: Spunta il checkbox
3. **PEC Fatturazione**: Inserisci PEC dedicata (opzionale)
4. **Codice Destinatario**: Per clienti B2B (7 caratteri)
5. **Regime Fiscale**: Seleziona regime appropriato

### 4. Test della Configurazione

Utilizza l'endpoint di test:
```bash
GET /api/fattura-elettronica/test-connection
```

## 🔧 Utilizzo

### Creazione Fattura Elettronica

1. **Crea nuova fattura** per psicologo abilitato
2. **Abilita fatturazione elettronica** spuntando il checkbox
3. **Compila tutti i campi obbligatori**
4. **Crea fattura**: Il sistema genera automaticamente il XML

### Invio al SDI

1. **Dalla lista fatture**, seleziona fattura elettronica
2. **Clicca "Invia a SDI"** dal pannello stato
3. **Monitora lo stato** tramite aggiornamenti automatici

### Gestione Errori

Se una fattura viene rifiutata:

1. **Verifica errori** nel pannello stato SDI
2. **Correggi i dati** se necessario
3. **Crea nota di credito** per annullare l'originale
4. **Genera nuova fattura** corretta

### Creazione Note di Credito

1. **Seleziona fattura da correggere**
2. **Clicca "Crea Nota di Credito"**
3. **Specifica motivo dettagliato**
4. **Scegli tipo correzione** (totale/parziale)
5. **Conferma creazione**

## 🧪 Testing

### Modalità di Test Disponibili

La sistema supporta 3 modalità di test:

#### 1. **Modalità Mock** (Consigliata per sviluppo)
```bash
# Nel tuo .env
ARUBA_FE_ENVIRONMENT=mock
FEATURE_ELECTRONIC_INVOICING=true
```

#### 2. **Modalità Demo Aruba** (Per test reali)
```bash
# Nel tuo .env
ARUBA_FE_ENVIRONMENT=test
ARUBA_FE_TEST_USERNAME=your_demo_username
ARUBA_FE_TEST_PASSWORD=your_demo_password
FEATURE_ELECTRONIC_INVOICING=true
```

#### 3. **Modalità Produzione** (Solo per deploy)
```bash
# Nel tuo .env
ARUBA_FE_ENVIRONMENT=production
ARUBA_FE_PROD_USERNAME=your_prod_username
ARUBA_FE_PROD_PASSWORD=your_prod_password
```

### Test Automatici

```bash
# Test unitari XML generation
npm run test -- xml-generator.test.ts

# Test completi
npm run test
```

### Test Manuali - API Endpoints

#### Test Rapido (Mock Mode)
```bash
# Test connessione
curl http://localhost:5173/api/fattura-elettronica/test-mock?test=connection

# Test generazione XML
curl http://localhost:5173/api/fattura-elettronica/test-mock?test=xml

# Test upload (mock)
curl http://localhost:5173/api/fattura-elettronica/test-mock?test=upload

# Test workflow completo
curl http://localhost:5173/api/fattura-elettronica/test-mock?test=full
```

#### Test con Demo Aruba
```bash
# Prima configura le credenziali demo, poi:
curl http://localhost:5173/api/fattura-elettronica/test-connection
```

### Setup Demo Aruba

Per testare con l'ambiente demo Aruba:

1. **Registrazione**: Vai su https://demo.fatturazioneelettronica.aruba.it
2. **Credenziali**: Ottieni username/password per l'ambiente demo
3. **Configurazione**: Aggiungi le credenziali nel tuo `.env`
4. **Test**: Usa gli endpoint di test per verificare la connessione

**Nota**: L'ambiente demo Aruba è temporaneo e i dati vengono cancellati periodicamente.

## 🔍 Monitoring e Debugging

### Log da Monitorare

- **Autenticazione Aruba**: Errori di login/token
- **Upload Fatture**: Successi/fallimenti invio
- **Status Check**: Aggiornamenti stato SDI
- **Validazione XML**: Errori di struttura

### Endpoints di Debug

- `GET /api/fattura-elettronica/test-connection` - Test connessione
- `POST /api/fattura-elettronica/generate-xml` - Test generazione XML
- `GET /api/fattura-elettronica/status/[filename]` - Verifica stato

## ⚠️ Considerazioni Importanti

### Sicurezza
- **Mai committare credenziali** nei file di codice
- **Usa variabili ambiente** per configurazioni sensibili
- **Configura HTTPS** per comunicazioni API
- **Valida sempre input utente** prima generazione XML

### Compliance
- **Conserva XML originali** per almeno 10 anni
- **Traccia tutte le operazioni** per audit
- **Backup regolari** dei dati fatturazione
- **Verifica aggiornamenti normativi** periodicamente

### Performance
- **Cache token autenticazione** per ridurre chiamate API
- **Rate limiting** rispetto limiti Aruba (30/min upload, 12/min search)
- **Batch operations** per controlli stato multipli
- **Timeout appropriati** per chiamate API

## 🚨 Troubleshooting

### Errori Comuni

#### "Authentication failed"
- Verifica credenziali in `.env`
- Controlla scadenza account Aruba
- Verifica connessione internet

#### "XML validation failed"
- Controlla dati obbligatori psicologo/paziente
- Verifica formato codice fiscale/P.IVA
- Controlla caratteri speciali in descrizioni

#### "Upload failed"
- Verifica dimensione XML (max 5MB)
- Controlla rate limiting (max 30 upload/min)
- Verifica formato filename

### Recovery Procedure

#### Fattura Bloccata in "Sent"
1. Controlla manualmente stato su portale Aruba
2. Usa endpoint status check per aggiornamento
3. Se necessario, contatta supporto Aruba

#### Dati Corrotti Store
1. Backup dati esistenti
2. Verifica integrità JSON localStorage
3. Ricostruisci store se necessario

## 📞 Supporto

### Aruba Support
- **Telefono**: 0575 0505 (Supporto Tecnico)
- **Email**: supporto@staff.aruba.it
- **Documentazione**: https://fatturazioneelettronica.aruba.it/apidoc/

### Normativa
- **Agenzia delle Entrate**: https://www.agenziaentrate.gov.it/
- **Specifiche Tecniche**: https://www.fatturapa.gov.it/

---

## 🎯 Roadmap Future

### Miglioramenti Pianificati
- [ ] Dashboard analytics avanzata per FE
- [ ] Export massivo XML per backup
- [ ] Integrazione con altri provider SDI
- [ ] Automazione controlli periodici stato
- [ ] Notifiche push per cambi stato
- [ ] Widget desktop per monitoraggio

### Ottimizzazioni
- [ ] Caching intelligente dati XML
- [ ] Compressione payload API
- [ ] Background jobs per operazioni batch
- [ ] Sincronizzazione multi-device