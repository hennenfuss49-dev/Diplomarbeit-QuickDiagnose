#pragma once

#include <BLE2902.h>
#include <BLECharacteristic.h>
#include <BLEServer.h>
#include <atomic>

#include "Communication/CommunicationManager.h"

class BLECommunication : public CommunicationManager,
                         private BLEServerCallbacks,
                         private BLECharacteristicCallbacks {
public:
    bool begin() override;
    bool connected() override;
    bool send(const String& message) override;
    bool receive(String& message) override;
    void loop() override;

private:
    void onConnect(BLEServer* server) override;
    void onDisconnect(BLEServer* server) override;
    void onStatus(BLECharacteristic* characteristic, Status status, uint32_t code) override;

    BLECharacteristic* tx = nullptr;
    BLE2902* notifications = nullptr;
    std::atomic<bool> clientConnected{false};
    std::atomic<bool> restartAdvertising{false};
    bool notificationQueued = false;
};
