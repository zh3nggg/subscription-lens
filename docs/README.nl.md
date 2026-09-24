# Subscription Lens

Een desktopapp voor **Codex-abonnees** op Windows en Apple Silicon Macs die hun resterende limieten willen bekijken, willen zien welke projecten tokens gebruiken en een modelmix willen kiezen die de limiet tot de volgende reset laat meegaan. De app vergelijkt ook vastgelegd gebruik tegen API-tarieven met de abonnementsbetaling. Voor lokale statistieken is geen API-sleutel nodig; routering via een externe provider gebruikt diens inloggegevens.

[English](../README.md) · [简体中文](README.zh-CN.md) · [Nederlands](README.nl.md)

> **3.1.1: stabiele Windows-release.** Verhelpt de verdelinggrafiek die na het kiezen van meerdere apparaten nog lokale modellen toonde. Bundelt ook de Tauri-migratiefixes, Codex-quota voorspellingen, CodeBuddy/Qoder-gebruiksregistratie en optionele Cloudflare R2-statistieken. Berekende kosten blijven behouden en gebruik zonder bekende prijs wordt als ongeprijsd getoond. De originele CC Switch-providerbeheerder en router-runtime zijn ingebouwd; CC Switch hoeft niet apart te worden geïnstalleerd. De eerste betrouwbaar bruikbare multi-providerrelease was 3.0.0. macOS Apple Silicon blijft de Electron-preview `3.0.0-beta.2`.

## Wat kun je ermee?

| Behoefte | Functies |
| --- | --- |
| Resterende capaciteit bekijken | Accountlimieten, aftellen tot herstel en temposchattingen zodra voldoende metingen beschikbaar zijn. |
| Tokengebruik begrijpen | Gebruik per project, model en sessie bekijken en doorklikken naar afzonderlijke records. |
| Je modelmix plannen | Maak van de modelhistorie en het gemiddelde tempo in het actieve quotavenster een aanbevolen mix voor de volgende reset, met betrouwbaarheid en bijsturing per model. |
| Gebruik met je betaling vergelijken | Geschatte equivalente API-kosten naast je werkelijke betaling per factuurperiode bekijken. |
| Limieten tijdens het werk volgen | Een compact vastzetbaar venster, systeemvak en optionele limietmeldingen met stille uren. |
| Apparaten privé vergelijken | De Windows Tauri-app synchroniseert optioneel één privacyvriendelijke Sublens-gebruikssnapshot per apparaat via Cloudflare R2; bronlogs, chatinhoud en projectpaden worden niet geüpload. |
| Exporteren en delen | Records naar CSV exporteren of een HTML-overzicht opslaan zonder projectnamen of accountidentificaties. |

## Aanbieders volgen in 1.5

Verbind Qwen Code, Kimi Code, CodeBuddy Code, Qoder, CC Switch, Claude Code, Gemini CLI of je eigen API-gebruiksbestand. Op Windows leest Qoder Quest lokale IDE-agentlogs met contextsnapshots; deze Tokens worden duidelijk als schatting gemarkeerd. Qoder-streams kunnen ook met het ingebouwde script worden vastgelegd; Credits blijven gescheiden van API-equivalent USD en cumulatieve resultaten worden overgeslagen om dubbele kosten te voorkomen. Chinese modelfamilies worden in hetzelfde diagram toegewezen aan Alibaba Cloud, Moonshot AI, Zhipu AI, MiniMax en DeepSeek. [Bronnen en kostendefinities](PROVIDER-MONITORING.md).

De Tauri 3.x-versie verzamelt momenteel native gebruiksgegevens van alleen CodeBuddy Code en Qoder. De overige hierboven genoemde bronnen zijn nog beschikbaar in de Electron-monitoringversie en zijn niet aangesloten op Tauri.

De Windows Tauri-app biedt optionele R2-synchronisatie tussen apparaten. Je kunt in de app een aparte bucket aanmaken of een bestaande bucket opgeven; Sublens bewaart één JSON-snapshot per apparaat onder een bucketprefix (een virtuele map in R2). De Access Key staat in Windows Credential Manager. Snapshots bevatten alleen gehashte record-/sessie-ID's, tijdstippen, modellen, tokencategorieën en beschikbare kosten; nooit bronlogs, chattekst, projectpaden, API-sleutels of aanmeldgegevens. Synchronisatie gebeurt bij het starten en elke vijf minuten zolang de app open is. De weergave kan daardoor maximaal vijf minuten achterlopen.

De diagrammen per aanbieder en model tonen ook de gemiddelde kosten per 1M tokens voor de geselecteerde periode. Alleen tokens met een prijs vormen de noemer; ongeprijsd gebruik blijft zichtbaar maar telt niet mee in het gemiddelde.

### Codex-providerroutering in 3.0.0

In Windows 3.0.0 opent de pagina **Route** de originele, ingebouwde CC Switch-providerbeheerder. Providers toevoegen en bewerken, geavanceerde opties, modeltoewijzingen, verbindingstests, wisselen en afzonderlijke autorisatie voor OpenAI Official verlopen via de eigen interface, opdrachten en database van CC Switch. Ook de lokale proxy, herstel, terugdraaien en omzetting tussen Responses en Chat gebruiken de oorspronkelijke implementatie. Taken en antwoorden blijven in Codex GUI/CLI. Een al geopend Codex-gesprek kan het vorige model of de vorige autorisatie behouden; begin na het wisselen een nieuw gesprek.

Geïnstalleerde tools in standaardmappen worden automatisch gevonden en kunnen samen worden verbonden; aangepaste locaties blijven beschikbaar. Het Codex-overzicht adviseert een modelmix op basis van de modelhistorie en het gemiddelde quotatempo in het actieve venster. Omdat OpenAI geen exacte quotagewichten per model publiceert, toont het advies de betrouwbaarheid en blijft het zichzelf kalibreren.

### CC Switch: bron en copyright

Windows 3.0.0 hergebruikt de originele providerbeheerinterface van [CC Switch](https://github.com/farion1231/cc-switch), evenals de native runtime voor providerconfiguratie, OAuth, proxy-overname, herstel en protocolconversie, vastgezet op commit `06082e189d65e6d6dbadc35dacdac1ce6c79d89a`. Deze componenten blijven onder de MIT-licentie vallen; copyright © 2025 Jason Young. De distributie bevat de upstreamlicentie en [meldingen van derden](../THIRD-PARTY-NOTICES.md). De projecten zijn niet aan elkaar verbonden.

![Subscription Lens-overzicht in het Nederlands](images/providers.nl-NL.png)

*Het overzicht toont synthetische gegevens, geen echte account- of gespreksgegevens.*

## Downloaden en aan de slag

**Windows 3.1.1 · x64.** Verhelpt de verdelinggrafiek in het multi-apparatenoverzicht. Stabiele release met Codex-quota voorspellingen, CodeBuddy- en Qoder-gebruiksregistratie en optionele Cloudflare R2-statistieken. API-equivalente kosten zijn schattingen, geen factuur; records zonder bekende prijs blijven ongeprijsd. Download [Windows 3.1.1](https://github.com/zh3nggg/subscription-lens/releases/tag/v3.1.1) en installeer met `Subscription-Lens-3.1.1-installer-x64.exe`. Sluit de oude app voor de upgrade. Omdat de runtime van Electron naar Tauri verandert, is een back-up van de bestaande gegevens verstandig; installeer in een aparte map als je eenvoudig wilt kunnen terugkeren. CC Switch is ingebouwd en hoeft niet apart te worden geïnstalleerd.

**macOS Apple Silicon:** `3.0.0-beta.2` hieronder blijft een Electron-preview en gebruikt nog niet de Tauri-runtime van Windows 3.0.0.

**3.0.0-beta.2 Preview · macOS Apple Silicon.** Vereist een Mac met M-chip en macOS 13 of nieuwer. De collector verwerkt nog niet alle recordformaten volledig; totalen kunnen te hoog of te laag zijn. Kosten zijn schattingen, geen factuur of gegarandeerde besparing. Automatische updates zijn niet beschikbaar.

[Download 3.0.0-beta.2](https://github.com/zh3nggg/subscription-lens/releases/tag/v3.0.0-beta.2)

### Installeren op macOS

1. Download `Subscription-Lens-3.0.0-beta.2-arm64.dmg`, open het bestand en sleep **Subscription Lens** naar **Programma's**. De ZIP bevat dezelfde app als draagbaar archief.
2. Deze preview is lokaal ad-hoc ondertekend maar niet door Apple genotariseerd. macOS kan daarom melden dat de ontwikkelaar niet kan worden gecontroleerd. Control-klik in **Programma's** op **Subscription Lens**, kies **Open** en bevestig opnieuw met **Open**. Dit is normaal alleen bij de eerste start nodig.
3. Als macOS de app nog blokkeert, open je **Systeeminstellingen → Privacy en beveiliging**, zoek je de melding voor Subscription Lens en kies je **Toch openen**. Verifieer je identiteit en bevestig **Open**. Schakel Gatekeeper niet wereldwijd uit.
4. Je kunt de download vooraf controleren met `SHA256SUMS.txt` uit dezelfde release.

**Windows-gebruikers:** gebruik de [stabiele 3.1.1-release](https://github.com/zh3nggg/subscription-lens/releases/tag/v3.1.1) hierboven.

1. Kies **Monitoring starten** voor de standaardmap van Codex, of **Map kiezen** voor een eigen map met `sessions` of `archived_sessions`.
2. Open **Verbindingen → Account verbinden** om limieten op te halen via de lokaal geïnstalleerde Codex. Gebruik **Aanmelden bij ChatGPT** als je nog niet bent aangemeld.
3. Vul onder **Instellingen** de factuurperiode, abonnementsbetaling en betaling voor extra tegoed in USD in. De einddatum telt niet mee. Kies handmatige datums of automatische maandelijkse verlenging.
4. Kies bij **Taal** de systeeminstelling, vereenvoudigd Chinees, Engels of Nederlands en klik op **Opslaan**. De keuze wordt direct toegepast en blijft na een herstart behouden. Bij andere systeemtalen wordt Engels gebruikt.

De hoofdwerkruimte is volledig bruikbaar vanaf 760×560. De eerste Codex-weergave combineert abonnementsstatus, periodevergelijking en verdeling per aanbieder/model. Middelgrote vensters gebruiken tabbladen voor trends en projecten; hoge vensters tonen automatisch meer, met behoud van bron en periode.

Je hebt geen API-sleutel, Node.js, Python of Docker nodig. Voor accountgegevens moet Codex geïnstalleerd zijn. Lokaal gebruik bijhouden werkt ook zonder accountverbinding.

<details>
<summary>Gebruiksdetails en sneltoetsen</summary>

- **Vooraf capaciteit bekijken.** Het overzicht toont resterende limieten en de tijd tot herstel. Een quotaschatting vereist minstens drie metingen, 15 minuten en een meetbare verandering binnen hetzelfde account, venster en herstelmoment. Alle bewaarde metingen in het actieve quotavenster worden gebruikt, zodat het gemiddelde het volledige venster omvat in plaats van alleen de laatste twee uur. Gegevens ouder dan drie minuten, resets en tellercorrecties onderdrukken onbetrouwbare schattingen. Een schatting gaat uit van het gemiddelde tempo van dit venster en is geen garantie. Lokale tokens worden nooit naar abonnementslimieten omgerekend.
- **Tijdens het werk compact blijven.** Ctrl+Shift+M opent het compacte venster, dat je optioneel kunt vastzetten. Escape herstelt het overzicht. Een klik op het systeemvakpictogram opent het compacte venster als systeemvakmodus actief is.
- **Gerichte meldingen.** Schakel meldingen in bij 20% en 5% resterend en bij gemeten herstel. Meldingen worden per account en venster ontdubbeld. Stille uren zijn standaard 22:00–08:00 lokale tijd. Laat de app actief; meldingsinstellingen van het besturingssysteem kunnen levering onderdrukken.
- **Duur werk terugvinden.** Selecteer een project of grafiekdatum, sorteer sessies op kosten of recente activiteit en bekijk de exacte records. Ctrl+K opent zoeken. Subagents tonen alleen hun eigen gebruik; kosten worden niet dubbel in een oudersessie opgeteld.
- **Automatisch verlengen.** Kies een maandelijkse verlengdag. Kortere maanden gebruiken de laatste dag zonder de vaste verlengdag te wijzigen. De abonnementsbetaling herhaalt zich; extra betalingen gelden alleen voor de huidige periode. Bestaande installaties behouden eerst handmatige datums.
- **Gegevens controleren.** Bekijk ontbrekende tarieven, verwerkingsfouten en de tariefdatum met directe links naar records en bronnen. Tariefdekking bewijst niet dat de accountgeschiedenis volledig is. Vergelijkingen gebruiken het direct voorafgaande tijdvak van gelijke duur.
- **Zonder projectgegevens delen.** Bekijk een voorbeeld en exporteer een zelfstandig HTML-overzicht met totalen, tariefdekking en datumbereik. Geen account, projectnamen, paden of sessie-ID’s; er wordt niets automatisch geüpload.

Limietmetingen blijven bewaard zolang het bijbehorende quotavenster actief is en nog twee dagen daarna, met een grens van 25.000 records. Geen nieuwe runtime-afhankelijkheden, clouddienst of modelaanroepen.

</details>

## Gegevens en schattingen

De app leest Codex-records zonder ze te wijzigen. Gebruiksmetadata, waaronder projectnamen, worden opgeslagen; gespreksinhoud wordt niet opgeslagen. Codex beheert de aanmelding. Je hoeft geen cookies of tokens te plakken.

Gegevens staan op Windows in `%APPDATA%\Subscription Lens` en op macOS in `~/Library/Application Support/Subscription Lens`. Ze blijven standaard behouden na het verwijderen van de app. Stel `LENS_DATA_DIR` in voor een andere locatie. Deel een actieve database niet tussen apparaten.

De meegeleverde tarieven zijn een **momentopname van Standard-tarieven in USD op 2026-09-16**. Ze worden toegepast op het verzamelde historische gebruik; het zijn geen historische tarieven per gebeurtenis. Fast/Batch, regionale toeslagen en toolkosten zijn niet inbegrepen. Onbekende modellen of onvolledige tarieven blijven onberekend. Bij het bijwerken van de tarieven worden bestaande records opnieuw berekend.

Equivalente API-kosten zijn een schatting, geen factuur of gegarandeerde besparing. Vul je werkelijke betaling in om te vergelijken. Ontbrekende gegevens kunnen de geschatte waarde verlagen.

Lokale records en accounttotalen worden apart getoond en nooit bij elkaar opgeteld. Gewone ChatGPT-gesprekken en details van cloudtaken worden niet verzameld. Totalen van meerdere apparaten bevatten alleen snapshots die je zelf hebt ingeschakeld. Historische lokale records worden niet automatisch aan het verbonden account toegewezen; selecteer op gedeelde computers alleen je eigen mappen.

## Huidige scope en volgende update

Ondersteunt Codex-abonnementen en lokale records van meerdere aanbieders op Windows en Apple Silicon macOS. Gewone ChatGPT-gesprekken en gebruik op andere apparaten worden niet automatisch ingelezen. Volledige Codex-functionaliteit van CodexBar en codex-usage is nog niet bereikt.

Versie 1.4 voegt read-only connectors voor Qwen Code, Kimi Code en CodeBuddy Code toe, plus herkenning van GLM-, Qwen-, Kimi-, MiniMax- en DeepSeek-modellen via Claude Code, CC Switch of compatibele gateways. Oudere formaten en quota- of creditinterfaces blijven op de [acceptatieroadmap](DOMESTIC-COMPATIBILITY.md).

[Roadmap](../ROADMAP.md#nederlands) · [Dekking](COMPATIBILITY.md) · [Releasegrenzen](RELEASE.md) · [Validatie](VALIDATION.md)

## Zelf bouwen en bijdragen

Voor de Tauri-build van Windows 3.1.1 zijn Node.js 24, Rust, pnpm en de geïnitialiseerde CC Switch-submodule nodig. Het buildscript compileert de originele beheerinterface en Rust-runtime. De Electron-preview voor Apple Silicon macOS vereist daarnaast Rust 1.95 en Xcode Command Line Tools voor de ingebouwde router. Zie [CONTRIBUTING.md](../CONTRIBUTING.md) voor tests en vertalingen. De test met een echt account is uitsluitend handmatig.

```powershell
npm ci
npm test
git submodule update --init --recursive
cd native/cc-switch-runtime
pnpm install --frozen-lockfile
cd ../..
.\scripts\build-tauri-migration-host.ps1 -Action release
```

Op een Apple Silicon Mac maakt `npm run dist` voorlopig nog de ad-hoc ondertekende Electron DMG- en ZIP-pakketten. De bovenstaande PowerShell-opdracht bouwt de Windows Tauri-versie.

## Ontwikkeling en dankwoord

Ontwikkeld met ondersteuning van **GPT-6 Astra**.

[CodexBar](https://github.com/steipete/CodexBar) dient als referentie voor limieten en desktopinteractie. MIT-gelicentieerde broncode van [codex-usage](https://github.com/zJay26/codex-usage) is opgenomen voor de volgende engine-integratie; de bron blijft met de licentievermelding behouden voor verdere integratie van de accounting-engine.

MIT. Zie [licenties van derden](../THIRD-PARTY-NOTICES.md) voor bronnen en auteursrechten. Dit is een onafhankelijk project, niet verbonden aan OpenAI of onderschreven door de genoemde projecten.

