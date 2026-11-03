// PROJEKT 2: Echte Motordrehzahl per BLE an den Laptop senden.
// Hardware: ESP32-S3-DevKitC-1 + Freematics OBD-II UART Adapter V2.1.
// Keine Freematics-Library und keine andere zusaetzliche Library erforderlich.
//
// Verkabelung (bestätigte ESP32-S3 Pinbelegung):
//   Freematics GRUEN  TX   -> GPIO18 (ESP32 RX)
//   Freematics WEISS  RX   -> GPIO17 (ESP32 TX)
//   Freematics SCHWARZ GND -> GND
//   Freematics ROT  5V     -> NICHT verbinden, wenn der ESP32 per USB versorgt wird!
// ESP32 USB-to-UART-Buchse -> Laptop (Strom + Debugging).
// Freematics direkt in die OBD-II-Buchse des stehenden Fahrzeugs.
//
// BLE bleibt vom ersten Test unveraendert:
//   Geraet: OBD-BLE-Test
//   Nordic UART Service / Notify-Characteristic

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ctype.h>

static const char *DEVICE_NAME = "OBD-BLE-Test";
static const char *SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
static const char *TX_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

constexpr int OBD_RX_PIN = 18;  // ESP32 empfaengt von Freematics TX (gruen)
constexpr int OBD_TX_PIN = 17;  // ESP32 sendet an Freematics RX (weiss)

HardwareSerial OBD(1);
BLEServer *bleServer = nullptr;
BLECharacteristic *txCharacteristic = nullptr;
volatile bool bleConnected = false;
bool previouslyConnected = false;
bool obdReady = false;
uint32_t lastBLEMessage = 0;
uint32_t lastOBDRetry = 0;

class ConnectionCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) override {
    bleConnected = true;
    Serial.println("BLE: Laptop verbunden.");
  }
  void onDisconnect(BLEServer *server) override {
    bleConnected = false;
    Serial.println("BLE: Laptop getrennt.");
  }
};

// Ein ELM327-kompatibler Adapter beendet eine Antwort mit '>'.
// Rueckgabe ist ein leerer String, falls innerhalb des Timeouts
// keine Daten eintreffen. Laenge begrenzen fuer Fehlerfaelle.
String readUntilPrompt(uint32_t timeoutMs) {
  String response;
  response.reserve(160);
  uint32_t start = millis();

  while (millis() - start < timeoutMs) {
    while (OBD.available()) {
      char c = static_cast<char>(OBD.read());
      if (c == '>') return response;
      if (response.length() < 512) response += c;
    }
    delay(2);
  }
  return response;
}

String obdCommand(const char *command, uint32_t timeoutMs = 2500) {
  // Vor einer neuen Anfrage alte Zeichen entsorgen.
  while (OBD.available()) OBD.read();
  OBD.print(command);
  OBD.print('\r');
  return readUntilPrompt(timeoutMs);
}

bool tryBaudrate(uint32_t baudrate) {
  OBD.end();
  delay(100);
  OBD.begin(baudrate, SERIAL_8N1, OBD_RX_PIN, OBD_TX_PIN);
  delay(350);

  String response = obdCommand("ATI", 1500);
  String check = response;
  check.toUpperCase();

  Serial.printf("Pruefe UART %lu Baud: %s\n",
                static_cast<unsigned long>(baudrate), response.c_str());

  // Der reale Freematics lieferte im bisherigen Projekt z.B.:
  // "OBD2USART V1.1" (und nach ATZ "ELM327 v1.5").
  return check.indexOf("OBD") >= 0 ||
         check.indexOf("ELM") >= 0 ||
         check.indexOf("STN") >= 0 ||
         check.indexOf("FREEMATICS") >= 0;
}

bool initializeOBD() {
  Serial.println("Suche Freematics-Adapter...");
  if (!tryBaudrate(115200) && !tryBaudrate(38400)) {
    Serial.println("Keine UART-Antwort vom Freematics.");
    return false;
  }

  Serial.println("Adapter gefunden. Initialisiere Fahrzeugverbindung...");
  Serial.println("ATZ: " + obdCommand("ATZ", 4000));
  delay(500);
  obdCommand("ATE0");  // Echo aus
  obdCommand("ATL0");  // Zeilenumbrueche aus
  obdCommand("ATS0");  // Leerzeichen aus
  obdCommand("ATH0");  // CAN-Header aus
  obdCommand("ATSP0"); // Fahrzeugprotokoll automatisch erkennen

  // Abfrage unterstuetzter PIDs prueft, ob eine ECU antwortet.
  String response = obdCommand("0100", 10000);
  Serial.println("OBD 0100 Antwort: " + response);
  String check = response;
  check.toUpperCase();
  check.replace(" ", "");
  check.replace("\r", "");
  check.replace("\n", "");

  bool success = check.indexOf("4100") >= 0;
  if (success) {
    Serial.println("OBD-II: Fahrzeug antwortet.");
    Serial.println("Protokoll: " + obdCommand("ATDP"));
  } else {
    Serial.println("Adapter erreichbar, aber noch keine gueltige ECU-Antwort.");
  }
  return success;
}

// PID 010C: 41 0C A B -> Drehzahl = (A*256+B)/4.
// Zusaetzliche Hex-Pruefung verhindert zufaellige/ungueltige Werte.
bool readRPM(uint16_t &rpm) {
  String raw = obdCommand("010C", 2500);
  String response = raw;
  response.toUpperCase();
  response.replace(" ", "");
  response.replace("\r", "");
  response.replace("\n", "");
  int pos = response.indexOf("410C");
  if (pos < 0 || response.length() < pos + 8) {
    Serial.println("RPM: keine gueltige Antwort: " + raw);
    return false;
  }

  String hexA = response.substring(pos + 4, pos + 6);
  String hexB = response.substring(pos + 6, pos + 8);
  if (!isxdigit(static_cast<unsigned char>(hexA[0])) ||
      !isxdigit(static_cast<unsigned char>(hexA[1])) ||
      !isxdigit(static_cast<unsigned char>(hexB[0])) ||
      !isxdigit(static_cast<unsigned char>(hexB[1]))) {
    Serial.println("RPM: ungueltige Hex-Daten: " + raw);
    return false;
  }

  uint8_t a = static_cast<uint8_t>(strtoul(hexA.c_str(), nullptr, 16));
  uint8_t b = static_cast<uint8_t>(strtoul(hexB.c_str(), nullptr, 16));
  rpm = static_cast<uint16_t>((static_cast<uint16_t>(a) * 256U + b) / 4U);
  return true;
}

void sendBLE(const String &text) {
  if (!bleConnected || txCharacteristic == nullptr) return;
  // Nachrichten bewusst kurz halten (sicher bei Standard-BLE-MTU von 23).
  txCharacteristic->setValue(text.c_str());
  txCharacteristic->notify();
  Serial.println("BLE gesendet: " + text);
}

void setup() {
  Serial.begin(115200);
  delay(700);
  Serial.println();
  Serial.println("=======================================");
  Serial.println(" OBD-BLE Test 2: ECHTE Fahrzeug-RPM");
  Serial.println("=======================================");

  BLEDevice::init(DEVICE_NAME);
  bleServer = BLEDevice::createServer();
  bleServer->setCallbacks(new ConnectionCallbacks());
  BLEService *service = bleServer->createService(SERVICE_UUID);
  txCharacteristic = service->createCharacteristic(
      TX_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  txCharacteristic->addDescriptor(new BLE2902());
  txCharacteristic->setValue("OBD:START");
  service->start();

  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->setScanResponse(true);
  BLEDevice::startAdvertising();
  Serial.println("Bluetooth bereit als OBD-BLE-Test.");
  Serial.println("Testseite auf http://localhost:8000 oeffnen (Chrome/Edge).");

  // BLE startet vor der OBD-Suche, damit man Funk und OBD getrennt testen kann.
  obdReady = initializeOBD();
  lastOBDRetry = millis();
  if (!obdReady) Serial.println("OBD noch nicht bereit. Neuer Versuch alle 10 Sekunden.");
}

void loop() {
  // Wenn Fahrzeug/Adapter erst nach dem USB-Start angeschlossen wurden:
  if (!obdReady && millis() - lastOBDRetry >= 10000UL) {
    lastOBDRetry = millis();
    obdReady = initializeOBD();
  }

  // Einfache BLE-Nachricht pro Sekunde; die reale OBD-Abfrage
  // dauert eventuell laenger. Bei fehlender Antwort keine Fake-Werte.
  if (millis() - lastBLEMessage >= 1000UL) {
    lastBLEMessage = millis();
    if (!obdReady) {
      sendBLE("OBD:KEINE_DATEN");
    } else {
      uint16_t rpm = 0;
      if (readRPM(rpm)) {
        sendBLE("RPM:" + String(rpm));
      } else {
        sendBLE("RPM:KEINE_ANTWORT");
      }
    }
  }

  if (!bleConnected && previouslyConnected) {
    delay(200);
    bleServer->startAdvertising();
    previouslyConnected = false;
    Serial.println("BLE: Wieder sichtbar.");
  }
  if (bleConnected && !previouslyConnected) previouslyConnected = true;
  delay(20);
}
