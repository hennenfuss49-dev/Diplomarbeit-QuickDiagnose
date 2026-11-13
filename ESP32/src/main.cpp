#include <Arduino.h>
#include <WiFi.h>

#include "Communication/Implementations/WebSocketCommunication.h"

// true = virtuelles Auto, false = echter Freematics-Adapter
const bool SIMULATION = true;

// UART zwischen ESP32-S3 und Freematics
HardwareSerial OBD(1);

// ESP32-S3 DevKitC-1:
// GPIO17 = U1TXD
// GPIO18 = U1RXD
const int OBD_RX = 18;   // Freematics GRÜN (TX) -> hier
const int OBD_TX = 17;   // Freematics WEISS (RX) -> hier

unsigned long obdBaud = 0;

// Fehlercodes muessen nicht jede Sekunde abgefragt werden.
// Die Live-Daten laufen weiter mit ~1 Hz, DTCs werden alle 15 s aktualisiert.
const unsigned long DTC_SCAN_INTERVAL_MS = 15000UL;
unsigned long lastDtcScan = 0;
bool firstDtcScan = true;

const int MAX_DTC_CODES = 20;

// Gemeinsame Kommunikationsinstanz fuer Live-Daten und Fehlercodes.
WebSocketCommunication communication;


void simulatedValues(float &rpm, int &speed,
                     int &coolant, float &load)
{
  // Wiederholt den Fahrzyklus alle 40 Sekunden
  unsigned long t = (millis() / 1000) % 40;

  if (t < 5) {
    // Motor im Leerlauf
    speed = 0;
    rpm = 800;
    load = 15;
  }
  else if (t < 15) {
    // Beschleunigung
    float x = (t - 5) / 10.0;
    speed = 100 * x;
    rpm = 800 + 2200 * x;
    load = 15 + 65 * x;
  }
  else if (t < 25) {
    // Gleichmäßige Fahrt
    speed = 100;
    rpm = 2500;
    load = 35;
  }
  else if (t < 35) {
    // Verzögerung
    float x = (t - 25) / 10.0;
    speed = 100 * (1.0 - x);
    rpm = 2500 - 1700 * x;
    load = 35 - 20 * x;
  }
  else {
    // Wieder Leerlauf
    speed = 0;
    rpm = 800;
    load = 15;
  }

  // Kühlmittel erwärmt sich langsam
  coolant = 20 + min((unsigned long)70,
                     millis() / 10000);

}


// Zeitstempel: Sekunden seit dem Start des ESP32.
// Ohne synchronisierte Uhrzeit ist dies kein Kalenderdatum.
String currentDtcTimestamp()
{
  return String(millis() / 1000);
}


// Optionale Beschreibung bekannter Diagnosecodes.
String describeDTC(const String &code)
{
  if (code == "P0300") return "Zufaellige/mehrfache Fehlzuendungen";
  if (code == "P0420") return "Katalysator-Wirkungsgrad unter Grenzwert";
  if (code == "P0171") return "Gemisch zu mager (Bank 1)";
  return "Unbekannter OBD-II Fehlercode";
}


// Simulierte Fehlercodes: Zyklus von 60 Sekunden.
// Das Dataset enthaelt ausschliesslich DataPointErrorCodes.
void simulatedErrorCodes(DataSet &errors)
{
  const unsigned long t = (millis() / 1000) % 60;
  const String timestamp = currentDtcTimestamp();

  if (t >= 15) {
    errors.add("P0300", describeDTC("P0300"), "stored", timestamp);
  }
  if (t >= 30) {
    errors.add("P0420", describeDTC("P0420"), "stored", timestamp);
  }
  if (t >= 45) {
    errors.add("P0171", describeDTC("P0171"), "stored", timestamp);
  }
}


// ----------------------------------------------------
// Antwort lesen, bis der Freematics ">" sendet
// ----------------------------------------------------
String readResponse(unsigned long timeout)
{
  String response = "";
  unsigned long start = millis();

  while (millis() - start < timeout) {

    while (OBD.available()) {

      char c = OBD.read();

      if (c == '>') {
        return response;
      }

      response += c;
    }

    delay(2);
  }

  return response;
}


// ----------------------------------------------------
// Befehl senden
// ----------------------------------------------------
String sendCommand(const String &cmd,
                   unsigned long timeout = 2000)
{
  while (OBD.available()) {
    OBD.read();
  }

  OBD.print(cmd);
  OBD.print('\r');

  return readResponse(timeout);
}


// ----------------------------------------------------
// Richtige UART-Geschwindigkeit suchen
// ----------------------------------------------------
bool tryBaud(unsigned long baud)
{
  OBD.end();

  OBD.begin(
    baud,
    SERIAL_8N1,
    OBD_RX,
    OBD_TX
  );

  delay(300);

  String response = sendCommand("ATI", 1000);

  String check = response;
  check.toUpperCase();

  Serial.print("Teste ");
  Serial.print(baud);
  Serial.print(" baud: ");
  Serial.println(response);

  if (check.indexOf("OBD") >= 0 ||
      check.indexOf("ELM") >= 0 ||
      check.indexOf("FREEMATICS") >= 0) {

    obdBaud = baud;
    return true;
  }

  return false;
}


// ----------------------------------------------------
// Antwort für Verarbeitung vereinfachen
// ----------------------------------------------------
String compact(String text)
{
  text.toUpperCase();

  text.replace(" ", "");
  text.replace("\r", "");
  text.replace("\n", "");
  text.replace(">", "");

  return text;
}


// ----------------------------------------------------
// Hex -> Zahl
// ----------------------------------------------------
int hexToInt(const String &hex)
{
  return strtol(hex.c_str(), nullptr, 16);
}


// ----------------------------------------------------
// RPM – PID 0C
// ----------------------------------------------------
bool getRPM(float &rpm)
{
  if (SIMULATION) {
    float load;
    int speed, coolant;
    simulatedValues(rpm, speed, coolant, load);
    return true;
  }

  String r = compact(sendCommand("010C"));

  int p = r.indexOf("410C");

  if (p < 0 || r.length() < p + 8)
    return false;

  int A = hexToInt(r.substring(p + 4, p + 6));
  int B = hexToInt(r.substring(p + 6, p + 8));

  rpm = ((A * 256) + B) / 4.0;

  return true;
}


// ----------------------------------------------------
// Geschwindigkeit – PID 0D
// ----------------------------------------------------
bool getSpeed(int &speed)
{

  if (SIMULATION) {
    float rpm, load;
    int coolant;
    simulatedValues(rpm, speed, coolant, load);
    return true;
  }

  String r = compact(sendCommand("010D"));

  int p = r.indexOf("410D");

  if (p < 0 || r.length() < p + 6)
    return false;

  speed = hexToInt(r.substring(p + 4, p + 6));

  return true;
}


// ----------------------------------------------------
// Kühlmitteltemperatur – PID 05
// ----------------------------------------------------
bool getCoolant(int &temp)
{

  if (SIMULATION) {
    float rpm, load;
    int speed;
    simulatedValues(rpm, speed, temp, load);
    return true;
  }

  String r = compact(sendCommand("0105"));

  int p = r.indexOf("4105");

  if (p < 0 || r.length() < p + 6)
    return false;

  int A = hexToInt(r.substring(p + 4, p + 6));

  temp = A - 40;

  return true;
}


// ----------------------------------------------------
// Motorlast – PID 04
// ----------------------------------------------------
bool getLoad(float &load)
{

  if (SIMULATION) {
    float rpm;
    int speed, coolant;
    simulatedValues(rpm, speed, coolant, load);
    return true;
  }

  String r = compact(sendCommand("0104"));

  int p = r.indexOf("4104");

  if (p < 0 || r.length() < p + 6)
    return false;

  int A = hexToInt(r.substring(p + 4, p + 6));

  load = A * 100.0 / 255.0;

  return true;
}



// ====================================================
// FEHLERCODES / DTCs
// ====================================================

// Ein einzelnes Hex-Zeichen in eine Zahl umwandeln.
int hexNibble(char c)
{
  if (c >= '0' && c <= '9') return c - '0';
  if (c >= 'A' && c <= 'F') return c - 'A' + 10;
  if (c >= 'a' && c <= 'f') return c - 'a' + 10;
  return -1;
}


// Freematics-Antwort in einzelne Hex-Bytes zerlegen.
// Zeilennummern wie "0:" / "1:" werden dabei automatisch ignoriert.
int extractHexBytes(const String &text, uint8_t *bytes, int maxBytes)
{
  int count = 0;
  String token = "";

  for (unsigned int i = 0; i <= text.length(); i++) {
    char c = (i < text.length()) ? text[i] : ' ';

    if (c == ' ' || c == '\r' || c == '\n' || c == '\t') {
      if (token.length() == 2) {
        int high = hexNibble(token[0]);
        int low = hexNibble(token[1]);

        if (high >= 0 && low >= 0 && count < maxBytes) {
          bytes[count++] = (uint8_t)((high << 4) | low);
        }
      }

      token = "";
    }
    else {
      token += c;
    }
  }

  return count;
}


// 16-Bit OBD-DTC in die uebliche Schreibweise umwandeln.
// Beispiel: 0x0133 -> P0133
String formatDTC(uint16_t rawCode)
{
  const char systemLetters[] = {'P', 'C', 'B', 'U'};

  uint8_t high = (rawCode >> 8) & 0xFF;
  uint8_t low = rawCode & 0xFF;

  char code[6];

  snprintf(
    code,
    sizeof(code),
    "%c%X%X%X%X",
    systemLetters[(high >> 6) & 0x03],
    (high >> 4) & 0x03,
    high & 0x0F,
    (low >> 4) & 0x0F,
    low & 0x0F
  );

  return String(code);
}


bool containsDTC(const String codes[], int count, const String &candidate)
{
  for (int i = 0; i < count; i++) {
    if (codes[i] == candidate) return true;
  }

  return false;
}


// Mode-03-Antwort des Freematics dekodieren.
// Laut offizieller Freematics-Implementierung folgt auf 0x43
// ein Byte mit der Anzahl der DTCs; danach folgen die Codes paarweise.
// Beispiel aus Freematics: 43 04 01 08 01 09 / 01 11 01 15 ...
int parseStoredDTCs(const String &response, String codes[], int maxCodes)
{
  uint8_t bytes[128];
  int byteCount = extractHexBytes(response, bytes, 128);
  int codeCount = 0;

  for (int i = 0; i < byteCount && codeCount < maxCodes; i++) {
    if (bytes[i] != 0x43) continue; // positive Antwort auf Mode 03

    if (i + 1 >= byteCount) break;

    int declaredCount = bytes[i + 1];
    int cursor = i + 2;

    for (int n = 0;
         n < declaredCount && cursor + 1 < byteCount && codeCount < maxCodes;
         n++, cursor += 2) {

      uint16_t rawCode = ((uint16_t)bytes[cursor] << 8) | bytes[cursor + 1];

      // 0000 ist Fuellwert und kein Fehlercode.
      if (rawCode == 0) continue;

      String code = formatDTC(rawCode);

      if (!containsDTC(codes, codeCount, code)) {
        codes[codeCount++] = code;
      }
    }

    // Bei Antworten mehrerer ECUs kann spaeter nochmals 0x43 folgen.
    i = cursor - 1;
  }

  return codeCount;
}


// Gespeicherte emissionsbezogene Fehlercodes (OBD Mode 03) auslesen
// und mit genau demselben DataSet/WebSocket-System wie die Live-Daten
// an die Website schicken.
void readAndSendStoredDTCs()
{
  DataSet errors("error_codes");

  if (SIMULATION) {
    simulatedErrorCodes(errors);
    communication.send(errors);
    return;
  }

  Serial.println();
  Serial.println("DTC-Scan (Mode 03)...");

  String response = sendCommand("03", 6000);

  Serial.println("DTC Rohantwort:");
  Serial.println(response);

  String check = response;
  check.toUpperCase();

  if (response.length() == 0 ||
      check.indexOf("UNABLE TO CONNECT") >= 0 ||
      check.indexOf("BUS ERROR") >= 0 ||
      check.indexOf("CAN ERROR") >= 0 ||
      check.indexOf("?") >= 0) {

    // Keinen leeren Datensatz senden: Ein Lesefehler bedeutet
    // nicht, dass tatsaechlich keine Fehlercodes vorhanden sind.
    Serial.println("DTC-Scan fehlgeschlagen.");
    return;
  }

  // "NO DATA" bedeutet: keine gespeicherten DTCs.
  if (check.indexOf("NO DATA") >= 0) {
    communication.send(errors);
    Serial.println("Keine gespeicherten DTCs.");
    return;
  }

  String codes[MAX_DTC_CODES];
  int count = parseStoredDTCs(response, codes, MAX_DTC_CODES);
  const String timestamp = currentDtcTimestamp();

  for (int i = 0; i < count; i++) {
    errors.add(codes[i], describeDTC(codes[i]), "stored", timestamp);

    Serial.print("DTC ");
    Serial.print(i + 1);
    Serial.print(": ");
    Serial.println(codes[i]);
  }

  if (count == 0) {
    Serial.println("Keine gespeicherten DTCs dekodiert.");
  }

  if (communication.send(errors)) {
    Serial.println("DTC-Datensatz an Website gesendet.");
  }
  else {
    Serial.println("DTC-Datensatz nicht gesendet: kein WebSocket-Client verbunden.");
  }
}


// ====================================================
// SETUP
// ====================================================


const char* ssid = "OBD-ESP32";
const char* password = "12345678";


void setup()
{
  Serial.begin(115200);
  delay(2000);

  // ESP32 als Access Point
  WiFiClass::mode(WIFI_AP);
  WiFi.softAP(ssid, password);

  Serial.println();
  Serial.println("WiFi AP started");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.softAPIP());


  // WebSocket starten
  communication.begin();

  Serial.println();
  Serial.println("==============================");
  Serial.println(" OBD-II DIPLOMARBEIT TEST");
  Serial.println("==============================");

  Serial.println();
  Serial.println("Suche Freematics...");

  if (SIMULATION) {
    Serial.println("Virtuelles Fahrzeug aktiviert");
    Serial.println("Kein Auto und kein OBD-Adapter erforderlich");
    return;
  }

  // offizielle Freematics-Library probiert ebenfalls
  // 115200 und 38400
  if (!tryBaud(115200)) {

    if (!tryBaud(38400)) {

      Serial.println();
      Serial.println("FEHLER:");
      Serial.println("Freematics nicht gefunden.");
      Serial.println("TX / RX / GND kontrollieren.");

      while (true) {
        delay(1000);
      }
    }
  }

  Serial.println();
  Serial.print("Freematics gefunden mit ");
  Serial.print(obdBaud);
  Serial.println(" baud");


  // Adapter zurücksetzen
  Serial.println();
  Serial.println("Reset Adapter...");

  Serial.println(sendCommand("ATZ", 3000));

  delay(1000);


  // Echo ausschalten
  sendCommand("ATE0");

  // Linefeeds aus
  sendCommand("ATL0");

  // CAN/OBD Header nicht anzeigen
  sendCommand("ATH0");

  // Fahrzeugprotokoll automatisch erkennen
  sendCommand("ATSP0");


  Serial.println();
  Serial.println("Suche Fahrzeug...");

  // Frage unterstützte PIDs ab.
  // Gleichzeitig sehr guter Verbindungstest.
  String response = sendCommand("0100", 10000);

  Serial.println();
  Serial.println("Antwort:");
  Serial.println(response);


  String test = compact(response);

  if (test.indexOf("4100") >= 0) {

    Serial.println();
    Serial.println("********************************");
    Serial.println(" OBD-II VERBINDUNG ERFOLGREICH!");
    Serial.println("********************************");

  } else {

    Serial.println();
    Serial.println("Keine ECU-Antwort.");
    Serial.println("Motor/Zündung prüfen.");
  }


  Serial.println();
  Serial.println("Verwendetes OBD-Protokoll:");

  String obdProtocol = sendCommand("ATDP");
  Serial.println(obdProtocol);
}


// ====================================================
// LOOP
// ====================================================

void loop()
{
  float rpm = 0;
  float load = 0;

  int speed = 0;
  int coolant = 0;

  communication.loop();

  Serial.println();
  Serial.println("-----------------------------");

  bool rpmOk = getRPM(rpm);
  bool speedOk = getSpeed(speed);
  bool coolantOk = getCoolant(coolant);
  bool loadOk = getLoad(load);


  if (rpmOk) {
    Serial.print("RPM:          ");
    Serial.print(rpm, 0);
    Serial.println(" rpm");
  }
  else {
    Serial.println("RPM:          keine Antwort");
  }


  if (speedOk) {
    Serial.print("Speed:        ");
    Serial.print(speed);
    Serial.println(" km/h");
  }
  else {
    Serial.println("Speed:        keine Antwort");
  }


  if (coolantOk) {
    Serial.print("Coolant:      ");
    Serial.print(coolant);
    Serial.println(" °C");
  }
  else {
    Serial.println("Coolant:      keine Antwort");
  }


  if (loadOk) {
    Serial.print("Engine Load:  ");
    Serial.print(load, 1);
    Serial.println(" %");
  }
  else {
    Serial.println("Engine Load:  keine Antwort");
  }

  // Live-Daten wie bisher an die Website schicken.
  // Fehlgeschlagene Abfragen werden nicht als Zufallswerte uebertragen.
  DataSet vehicle("live_data");

  if (rpmOk) {
    vehicle.add("rpm", String(rpm), "rpm");
  }

  if (speedOk) {
    vehicle.add("speed", String(speed), "km/h");
  }

  if (coolantOk) {
    vehicle.add("coolant", String(coolant), "°C");
  }

  if (loadOk) {
    vehicle.add("engine_load", String(load), "%");
  }

  communication.send(vehicle);


  // Fehlercodes nicht jede Sekunde pollen. Ein Scan beim Start und danach
  // alle 15 Sekunden reicht fuer Diagnosefehler und stoert die Live-PIDs kaum.
  if (firstDtcScan || millis() - lastDtcScan >= DTC_SCAN_INTERVAL_MS) {
    firstDtcScan = false;
    lastDtcScan = millis();

    readAndSendStoredDTCs();
  }


  delay(1000);
}