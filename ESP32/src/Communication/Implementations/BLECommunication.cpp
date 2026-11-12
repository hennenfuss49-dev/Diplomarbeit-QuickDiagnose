#include "BLECommunication.h"

#include <BLEAdvertising.h>
#include <BLEDevice.h>
#include <cstring>

namespace {
constexpr char DeviceName[] = "QuickDiagnose-BLE";
constexpr char ServiceUuid[] = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
constexpr char TxUuid[] = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

// Bei Standard-ATT-MTU 23 bleiben 20 Byte pro Notification.
constexpr size_t PacketSize = 20;
constexpr size_t HeaderSize = 2;
constexpr size_t PayloadSize = PacketSize - HeaderSize;
constexpr size_t MaxMessageSize = 64 * 1024;
constexpr uint8_t StartFlag = 0x80;
constexpr uint8_t EndFlag = 0x40;
constexpr uint8_t SequenceHighMask = 0x3F;
constexpr unsigned long FragmentDelayMs = 15;
}

bool BLECommunication::begin() {
    BLEDevice::init(DeviceName);
    BLEServer* server = BLEDevice::createServer();
    server->setCallbacks(this);

    BLEService* service = server->createService(ServiceUuid);
    tx = service->createCharacteristic(TxUuid, BLECharacteristic::PROPERTY_NOTIFY);
    tx->setCallbacks(this);
    notifications = new BLE2902();
    tx->addDescriptor(notifications);
    service->start();

    // Die 128-Bit-UUID und der vollständige Name passen zusammen nicht in 31 Byte.
    BLEAdvertisementData advertisement;
    advertisement.setFlags(ESP_BLE_ADV_FLAG_GEN_DISC | ESP_BLE_ADV_FLAG_BREDR_NOT_SPT);
    advertisement.setCompleteServices(BLEUUID(ServiceUuid));
    BLEAdvertisementData scanResponse;
    scanResponse.setName(DeviceName);

    BLEAdvertising* advertising = BLEDevice::getAdvertising();
    advertising->setAdvertisementData(advertisement);
    advertising->setScanResponseData(scanResponse);
    BLEDevice::startAdvertising();
    Serial.println("Bluetooth bereit als QuickDiagnose-BLE.");
    return true;
}

void BLECommunication::onConnect(BLEServer*) {
    notifications->setNotifications(false);
    clientConnected = true;
}

void BLECommunication::onDisconnect(BLEServer*) {
    clientConnected = false;
    restartAdvertising = true;
}

void BLECommunication::onStatus(BLECharacteristic*, Status status, uint32_t) {
    notificationQueued = status == Status::SUCCESS_NOTIFY;
}

void BLECommunication::loop() {
    if (restartAdvertising.exchange(false)) {
        BLEDevice::startAdvertising();
    }
}

bool BLECommunication::connected() {
    return clientConnected && notifications->getNotifications();
}

bool BLECommunication::send(const String& message) {
    const size_t length = message.length();
    if (!connected() || length == 0 || length > MaxMessageSize) {
        return false;
    }

    uint8_t packet[PacketSize];
    for (size_t offset = 0; offset < length; offset += PayloadSize) {
        if (!connected()) {
            return false;
        }

        const size_t bytes = min(PayloadSize, length - offset);
        const bool last = offset + bytes == length;
        const size_t sequence = offset / PayloadSize;
        packet[0] = (offset == 0 ? StartFlag : 0) | (last ? EndFlag : 0) |
                    ((sequence >> 8) & SequenceHighMask);
        packet[1] = static_cast<uint8_t>(sequence);
        memcpy(packet + HeaderSize, message.c_str() + offset, bytes);

        notificationQueued = false;
        tx->setValue(packet, HeaderSize + bytes);
        tx->notify();
        if (!notificationQueued) {
            return false;
        }
        if (!last) {
            delay(FragmentDelayMs);
        }
    }
    return true;
}

bool BLECommunication::receive(String&) {
    return false;
}
