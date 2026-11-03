# Projekt 2 — echte OBD-Daten per Bluetooth (BLE)

Eigenstaendiges PlatformIO-Projekt fuer **ESP32-S3-DevKitC-1-N8R8** mit
**Freematics OBD-II UART Adapter V2.1**. Das bisherige Diplomarbeitsprojekt
wird nicht benoetigt oder veraendert.

## Inhalt

```
02_BLE_mit_OBD/
  platformio.ini
  src/main.cpp
  include/
  lib/
  test/
  Bluetooth_Testseite/index.html
  README.md
```

Das Projekt verwendet nur das Arduino-ESP32-Framework und dessen BLE-Bibliothek.
Das BLE-Geraet, der Service und die Characteristic sind identisch zum Projekt
`01_BLE_ohne_Auto`. Dieselbe Testseite funktioniert deshalb ohne Aenderungen.

## Erstinstallation und Upload — am Schreibtisch

1. Den Ordner `02_BLE_mit_OBD` in VS Code mit der PlatformIO-Erweiterung oeffnen.
   Wichtig: `platformio.ini` muss **direkt** in dem geoeffneten Ordner liegen.
2. Freematics und Fahrzeug noch nicht anschliessen.
3. ESP32-S3 ueber **USB-to-UART** (Micro-USB) an den Laptop anschliessen.
4. In PlatformIO `Build` und danach `Upload` ausfuehren.
5. Den `Serial Monitor` mit **115200 Baud** oeffnen.
6. Zunaechst sieht man `Bluetooth bereit ...`, aber noch keine ECU-Daten.
   Das ist ohne angeschlossenen OBD-Adapter normal.

## Verdrahtung — USB-Modus zum Testen

| Freematics-V2.1-Kabel | ESP32-S3 | Zweck |
|---|---|---|
| Gruen: TX | **GPIO18** (RX1) | OBD-Antworten empfangen |
| Weiss: RX | **GPIO17** (TX1) | OBD-Befehle senden |
| Schwarz: GND | **GND** | gemeinsame Masse |
| Rot: 5 V | **NICHT anschliessen** | ESP32 bereits ueber Laptop-USB versorgt |

**Rot isolieren. Auf keinen Fall an 3V3 oder an einen GPIO anschliessen.**
Die Aufdrucke `RX` und `TX` auf einigen DevKitC-1-Pins sind UART0
(GPIO44/GPIO43), die unabhaengig von unserer externen UART1-Verbindung sind.

Stecken/Umstecken nur bei **ausgeschalteter Versorgung**. Fuer diesen ersten
Test alle provisorischen Leitungen mechanisch sichern und auf Kurzschluesse
pruefen. Erst danach Freematics in die OBD-II-Buchse des Fahrzeugs stecken.

## Am Auto

1. Fahrzeug im Freien oder ausreichend beluefteter Werkstatt parken,
   Parkbremse aktivieren, Gangwahl P/Leerlauf, sichere Lage der Kabel.
2. ESP32 ueber USB am Laptop versorgen, alle UART-Leitungen nach Tabelle
   verbinden, **rot bleibt frei**.
3. Freematics in die OBD-II-Buchse stecken.
4. Zuendung einschalten; bei Benziner/Diesel Motor im Stand starten.
   Nicht mit angeschlossenem Labor-Laptop fahren oder Kabel am Lenkrad/Pedalen fuehren.
5. Im Serial Monitor erscheinen z.B. `OBD-II: Fahrzeug antwortet.`
   und `BLE gesendet: RPM:...` sobald der Laptop per BLE verbunden ist.
   Die Automatik probiert 115200/38400 Baud und erkennt den OBD-Modus per ATSP0.

## Laptop: Bluetooth-Testseite

1. Windows-Bluetooth aktivieren. In **Chrome oder Edge** eine lokale HTTP-Seite
   verwenden; nicht als `file://` direkt oeffnen.
2. In VS Code ein zweites Terminal im Ordner `Bluetooth_Testseite` oeffnen:

   ```powershell
   py -m http.server 8000
   ```

   Falls `py` nicht geht: `python -m http.server 8000`.
3. `http://localhost:8000` in Chrome/Edge oeffnen.
4. `Mit ESP32 verbinden` klicken und **OBD-BLE-Test** waehlen.
   Vorheriges Windows-Pairing ist nicht noetig.
5. Jede erfolgreiche Anfrage erscheint z.B. als `RPM:843`.

## Fehlersuche

- `OBD:KEINE_DATEN`: Fahrzeug/Adapter ist noch nicht erreichbar.
- `RPM:KEINE_ANTWORT`: Adapter/Fahrzeug wurde verbunden, aber gerade keine
  brauchbare Motordrehzahl geliefert; Motor an, ECU/PID-Support pruefen.
- Browser findet kein `OBD-BLE-Test`: Bluetooth am Laptop, Browser Chrome/Edge,
  laufende Firmware, Abstand und Windows-Bluetooth pruefen.
- Keine Textausgabe im Serial Monitor: richtiger USB-to-UART-Port und
  richtiger serieller COM-Port, 115200 Baud.
- `Failed to connect to target ESP32-S3`: anderer Upload-/COM-Port oder
  Board/USB-Stecker; ggf. BOOT/RESET-Folge pruefen.

## Hinweis zum finalen Geraet

Wenn die Firmware spaeter kabellos aus OBD versorgt werden soll, zuerst
USB **abziehen**, Freematics-VCC **mit Multimeter als geregelte 5 V messen**,
und danach Freematics-Rot auf den **5V-Pin** des ESP32-S3 verbinden.
Nicht gleichzeitig ueber USB und 5V-Pin speisen.

**Dieser Test liest nur RPM (PID 010C), keine Fehlercodes.**
Keine Fahrzeug-DTCs loeschen oder sonstige schreibende Diagnose ausfuehren.
