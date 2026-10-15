#include <Arduino.h>
#include <WiFi.h>

#include "Communication/Implementations/WebSocketCommunication.h"

// true = virtuelles Auto, false = echter Freematics-Adapter
const bool SIMULATION = false;

// UART zwischen ESP32-S3 und Freematics
HardwareSerial OBD(1);

// ESP32-S3 DevKitC-1:
// GPIO17 = U1TXD
// GPIO18 = U1RXD
const int OBD_RX = 18;   // Freematics GRÜN (TX) -> hier
const int OBD_TX = 17;   // Freematics WEISS (RX) -> hier

unsigned long obdBaud = 0;


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
    float load;
    int speed, coolant;
    simulatedValues(load, speed, coolant, load);
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
// SETUP
// ====================================================


const char* ssid = "OBD-ESP32";
const char* password = "12345678";


WebSocketCommunication communication;
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

  Serial.println(sendCommand("ATDP"));
}


// ====================================================
// LOOP
// ====================================================

void loop()
{
  float rpm;
  float load;

  int speed;
  int coolant;
  communication.loop();

  Serial.println();
  Serial.println("-----------------------------");


  if (getRPM(rpm)) {
    Serial.print("RPM:          ");
    Serial.print(rpm, 0);
    Serial.println(" rpm");
  }
  else {
    Serial.println("RPM:          keine Antwort");
  }


  if (getSpeed(speed)) {
    Serial.print("Speed:        ");
    Serial.print(speed);
    Serial.println(" km/h");
  }
  else {
    Serial.println("Speed:        keine Antwort");
  }


  if (getCoolant(coolant)) {
    Serial.print("Coolant:      ");
    Serial.print(coolant);
    Serial.println(" °C");
  }
  else {
    Serial.println("Coolant:      keine Antwort");
  }


  if (getLoad(load)) {
    Serial.print("Engine Load:  ");
    Serial.print(load, 1);
    Serial.println(" %");
  }
  else {
    Serial.println("Engine Load:  keine Antwort");
  }

  DataSet vehicle("live_data");

  vehicle.add("rpm", String(rpm), "rpm");
  vehicle.add("speed", String(speed), "km/h");
  vehicle.add("coolant", String(coolant), "°C");
  vehicle.add("engine_load", String(load), "%");

  communication.send(vehicle);



  delay(1000);
}