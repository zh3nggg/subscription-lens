# Subscription Lens

**1.2.0 Preview · Windows x64.** [Downloaden](https://github.com/zh3nggg/subscription-lens/releases) · [Roadmap](../ROADMAP.md) · [Licenties van derden](../THIRD-PARTY-NOTICES.md)

Volledige Codex-functionaliteit van CodexBar/codex-usage is nog niet bereikt. De huidige collector verwerkt onafhankelijke verzoeken, compactie, gemengde tellerresets en overgenomen forkhistorie nog niet volledig; totalen kunnen te laag of te hoog zijn. De nieuwe engine is nog niet ingeschakeld. Zie [releasegrenzen](RELEASE.md). Andere aanbieders staan op de roadmap voor de volgende update.

[English](../README.md) · [简体中文](README.zh-CN.md) · [Nederlands](README.nl.md)

Een lokale Windows-app voor het bijhouden van je Codex-abonnementsgebruik. Bekijk vastgelegde tokens, abonnementslimieten, equivalente API-kosten en een vergelijking met je abonnementsbetaling.

## Installeren

Download het Windows x64-installatiebestand of het ZIP-bestand via **Releases** in deze repository. Voer het installatiebestand uit of pak het ZIP-bestand uit en open `Subscription Lens.exe`.

1. Kies **Monitoring starten** voor de standaardmap van Codex, of **Map kiezen** voor een eigen map met `sessions` of `archived_sessions`.
2. Open **Verbindingen → Account verbinden** om limieten op te halen via de lokaal geïnstalleerde Codex. Gebruik **Aanmelden bij ChatGPT** als je nog niet bent aangemeld.
3. Vul onder **Instellingen** de factuurperiode, abonnementsbetaling en betaling voor extra tegoed in USD in. De einddatum telt niet mee. Kies handmatige datums of automatische maandelijkse verlenging.
4. Kies bij **Taal** de systeeminstelling, vereenvoudigd Chinees, Engels of Nederlands en klik op **Opslaan**. De keuze wordt direct toegepast en blijft na een herstart behouden. Bij andere systeemtalen wordt Engels gebruikt.

Je hebt geen API-sleutel, Node.js, Python of Docker nodig. Voor accountgegevens moet Codex geïnstalleerd zijn. Lokaal gebruik bijhouden werkt ook zonder accountverbinding.

## Functies

- Nieuwe lokale gebruiksgegevens elke 15 seconden inlezen, opslaan in SQLite en dubbele records voorkomen.
- Officiële Codex-accountgegevens: limieten elke 60 seconden wanneer verbonden; het totale tokengebruik ongeveer elke 10 minuten.
- Equivalente API-kosten voor invoer, cachelezingen, cacheschrijfacties en uitvoer. Redeneertokens die al in de uitvoer zijn opgenomen, tellen niet dubbel mee.
- Zoeken, filteren op model, CSV-export, tarieven importeren/exporteren en kosten vergelijken.
- Licht/donker thema, optioneel actief blijven in het systeemvak en starten met Windows.
- Chinese, Engelse en Nederlandse interface, dialoogtitels en systeemvakmenu's; lokale getal- en datumnotatie.

## Dagelijks gebruik

- **Vooraf capaciteit bekijken.** Het overzicht toont resterende limieten en de tijd tot herstel. Een temposchatting vereist minstens drie metingen, 15 minuten en een meetbare verandering binnen hetzelfde account, venster en herstelmoment. Maximaal twee uur wordt gebruikt. Gegevens ouder dan drie minuten, resets en tellercorrecties onderdrukken onbetrouwbare schattingen. Een schatting gaat uit van gelijkblijvend gebruik en is geen garantie. Lokale tokens worden nooit naar abonnementslimieten omgerekend.
- **Tijdens het werk compact blijven.** Ctrl+Shift+M opent het compacte venster, dat je optioneel kunt vastzetten. Escape herstelt het overzicht. Een klik op het systeemvakpictogram opent het compacte venster als systeemvakmodus actief is.
- **Gerichte meldingen.** Schakel meldingen in bij 20% en 5% resterend en bij gemeten herstel. Meldingen worden per account en venster ontdubbeld. Stille uren zijn standaard 22:00–08:00 lokale tijd. Laat de app actief; Windows kan meldingen onderdrukken.
- **Duur werk terugvinden.** Selecteer een project of grafiekdatum, sorteer sessies op kosten of recente activiteit en bekijk de exacte records. Ctrl+K opent zoeken. Subagents tonen alleen hun eigen gebruik; kosten worden niet dubbel in een oudersessie opgeteld.
- **Automatisch verlengen.** Kies een maandelijkse verlengdag. Kortere maanden gebruiken de laatste dag zonder de vaste verlengdag te wijzigen. De abonnementsbetaling herhaalt zich; extra betalingen gelden alleen voor de huidige periode. Bestaande installaties behouden eerst handmatige datums.
- **Gegevens controleren.** Bekijk ontbrekende tarieven, verwerkingsfouten en de tariefdatum met directe links naar records en bronnen. Tariefdekking bewijst niet dat de accountgeschiedenis volledig is. Vergelijkingen gebruiken het direct voorafgaande tijdvak van gelijke duur.
- **Zonder projectgegevens delen.** Bekijk een voorbeeld en exporteer een zelfstandig HTML-overzicht met totalen, tariefdekking en datumbereik. Geen account, projectnamen, paden of sessie-ID’s; er wordt niets automatisch geüpload.

Limietmetingen blijven maximaal drie dagen lokaal bewaard, met een grens van 25.000 records. Geen nieuwe runtime-afhankelijkheden, clouddienst of modelaanroepen.

## Gegevens en schattingen

De app leest Codex-records zonder ze te wijzigen. Gebruiksmetadata, waaronder projectnamen, worden opgeslagen; gespreksinhoud wordt niet opgeslagen. Codex beheert de aanmelding. Je hoeft geen cookies of tokens te plakken.

Gegevens staan in `%APPDATA%\Subscription Lens` en blijven standaard behouden na het verwijderen van de app. De ZIP-versie gebruikt dezelfde gegevensmap. Stel `LENS_DATA_DIR` in voor een andere locatie. Deel een actieve database niet tussen apparaten.

De meegeleverde tarieven zijn een **momentopname van Standard-tarieven in USD op 2026-09-16**. Ze worden toegepast op het verzamelde historische gebruik; het zijn geen historische tarieven per gebeurtenis. Fast/Batch, regionale toeslagen en toolkosten zijn niet inbegrepen. Onbekende modellen of onvolledige tarieven blijven onberekend. Bij het bijwerken van de tarieven worden bestaande records opnieuw berekend.

Equivalente API-kosten zijn een schatting, geen factuur of gegarandeerde besparing. Vul je werkelijke betaling in om te vergelijken. Ontbrekende gegevens kunnen de geschatte waarde verlagen.

Lokale records en accounttotalen worden apart getoond en nooit bij elkaar opgeteld. Gewone ChatGPT-gesprekken worden niet ondersteund. Andere apparaten en details van cloudtaken worden niet automatisch ingelezen. Historische lokale records worden niet automatisch aan het verbonden account toegewezen; selecteer op gedeelde computers alleen je eigen mappen.

## Zelf bouwen

Windows x64, Node.js 24:

```powershell
npm ci
npm test
npm start
npm run dist
```

Versies staan vast in `package-lock.json`. De build maakt een NSIS-installatiebestand en een ZIP-bestand. Stel desgewenst `ELECTRON_CACHE` en `ELECTRON_BUILDER_CACHE` in op mappen binnen het project.

`node scripts/smoke-i18n.cjs` test de talen in een geïsoleerde desktopomgeving zonder je account te gebruiken. `node scripts/smoke.cjs` gebruikt je echte lokale Codex-records en account. Resultaten staan in `test-results`; verspreid die map niet. Met `LENS_TEST_EXE` kun je een verpakte app testen.

Vertalingen staan in `src/locales.json`: Chinese brontekst, gevolgd door de Engelse en Nederlandse vertaling. De browsercatalogus wordt vóór starten, testen en bouwen automatisch gegenereerd. Projectnamen en paden blijven ongewijzigd. CSV-kolomnamen blijven Engelse identificaties voor compatibiliteit.

## Versie en licentie

Versie 1.2.0 · Windows x64 · MIT. Deze build is niet digitaal ondertekend en heeft geen automatische updates. De accountkoppeling is afhankelijk van de geïnstalleerde Codex-versie. Onafhankelijke tool, niet verbonden aan OpenAI.

Officiële bronnen: [Codex App Server](https://learn.chatgpt.com/docs/app-server), [API-tarieven](https://developers.openai.com/api/docs/pricing). De licentieteksten voor Electron en Chromium zijn bij de app inbegrepen.
