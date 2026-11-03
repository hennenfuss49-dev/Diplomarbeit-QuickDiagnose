//
// Created by Rafael Ortner on 06/10/2026.
//

#pragma once
#include "ESPAsyncWebServer.h"
#include "Communication/CommunicationManager.h"
#include "../DataSet.cpp"
#include "../DataPoint.cpp"

class WebSocketCommunication : public CommunicationManager {
public:
    explicit WebSocketCommunication(uint16_t port = 80);

    bool begin() override;
    void loop() override;

    // Gesamtes Dataset senden
    bool send(const DataSet &dataset);

    // Einzelne Live-Daten senden
    bool send(const DataPointLiveData &datapoint);

    // Einzelnen Fehlercode senden
    bool send(const DataPointErrorCodes &datapoint);

    // String senden
    bool send(const String &message) override;
    bool receive(String& message) override;

    bool connected() override;

private:
    AsyncWebServer server;
    AsyncWebSocket ws;

    bool isConnected{};
    String receivedMessage;

    void onEvent(
        const AsyncWebSocketClient* client,
        AwsEventType type,
        void* arg,
        uint8_t* data,
        size_t len
    );

    static void onEventStatic(
        AsyncWebSocket* server,
        AsyncWebSocketClient* client,
        AwsEventType type,
        void* arg,
        uint8_t* data,
        size_t len
    );

    static WebSocketCommunication* instance;
};