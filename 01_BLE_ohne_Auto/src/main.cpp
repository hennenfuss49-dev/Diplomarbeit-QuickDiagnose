// STUFE 1: ESP32-S3 sendet ohne Auto jede Sekunde einen Testwert per BLE.
// Arduino-ESP32 bringt BLEDevice, BLEServer und BLE2902 bereits mit.
#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

static const char *DEVICE_NAME = "OBD-BLE-Test";
// Nordic UART Service: ein verbreitetes BLE-GATT-Profil zum Datensenden.
static const char *SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
static const char *TX_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

BLEServer *server = nullptr;
BLECharacteristic *txCharacteristic = nullptr;
volatile bool connected = false;
bool wasConnected = false;
unsigned long lastMessage = 0;

class MyCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *s) override {
    connected = true;
    Serial.println("BLE: Laptop verbunden.");
  }
  void onDisconnect(BLEServer *s) override {
    connected = false;
    Serial.println("BLE: getrennt.");
  }
};

void setup() {
  Serial.begin(115200);
  delay(700);
  Serial.println("=== OBD Bluetooth Test: DEMO ohne Auto ===");

  BLEDevice::init(DEVICE_NAME);
  server = BLEDevice::createServer();
  server->setCallbacks(new MyCallbacks());

  BLEService *service = server->createService(SERVICE_UUID);
  txCharacteristic = service->createCharacteristic(
      TX_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  txCharacteristic->addDescriptor(new BLE2902());
  txCharacteristic->setValue("TEST:START");
  service->start();

  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->setScanResponse(true);
  BLEDevice::startAdvertising();

  Serial.println("Bluetooth bereit: OBD-BLE-Test");
  Serial.println("Auf dem Laptop: Bluetooth_Testseite ueber localhost oeffnen.");
}

void loop() {
  if (connected && millis() - lastMessage >= 1000UL) {
    lastMessage = millis();
    int fakeRPM = 900 + static_cast<int>((millis() / 1000UL) % 8) * 50;
    String message = "TEST-RPM:" + String(fakeRPM);  // bewusst kurz (< 20 Byte)
    txCharacteristic->setValue(message.c_str());
    txCharacteristic->notify();
    Serial.println("BLE gesendet: " + message);
  }

  if (!connected && wasConnected) {
    delay(300);
    server->startAdvertising();
    wasConnected = false;
    Serial.println("Bluetooth wieder sichtbar.");
  }
  if (connected && !wasConnected) {
    wasConnected = true;
  }
  delay(20);
}
