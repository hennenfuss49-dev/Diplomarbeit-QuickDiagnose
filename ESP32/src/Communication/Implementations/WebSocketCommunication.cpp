//
// Created by Rafael Ortner on 06/10/2026.
//
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <Arduino_JSON.h>
#include "../CommunicationManager.h"
#include "WebSocketCommunication.h"

WebSocketCommunication::WebSocketCommunication(uint16_t port)
    : server(port),
      ws("/ws")
{
    instance = this;
}

bool WebSocketCommunication::begin() {
    ws.onEvent(onEventStatic);

    server.addHandler(&ws);

    server.begin();

    Serial.println("WebSocket server started");
    return true;
}

void WebSocketCommunication::loop() {
    ws.cleanupClients();
}

bool WebSocketCommunication::send(const DataSet &dataset) {
    if (!connected()) {
        return false;
    }
    JSONVar root;

    root["type"] = "dataset";
    root["name"] = dataset.getName();

    JSONVar datapoints;

    int index = 0;

    for (const DataPoint& point : dataset.getDataPoints()) {

        JSONVar jsonPoint;

        jsonPoint["name"] = point.name;
        jsonPoint["value"] = point.value;
        jsonPoint["unit"] = point.unit;

        datapoints[index++] = jsonPoint;
    }

    root["datapoints"] = datapoints;

    String json = JSON.stringify(root);

    ws.textAll(json);
    return true;
}

bool WebSocketCommunication::send(const String &message) {
    if (!connected()) {
        return false;
    }

    ws.textAll(message);
    return true;
}

bool WebSocketCommunication::send(const DataPoint &datapoint) {
    if (!connected()) {
        return false;
    }

    JSONVar jsonPoint;

    jsonPoint["name"] = datapoint.name;
    jsonPoint["value"] = datapoint.value;
    jsonPoint["unit"] = datapoint.unit;

    String json = JSON.stringify(jsonPoint);
    ws.textAll(json);
    return true;
}

bool WebSocketCommunication::receive(String &message) {
    if (receivedMessage.length() == 0) {
        return false;
    }

    message = receivedMessage;
    receivedMessage = "";

    return true;
}

bool WebSocketCommunication::connected() {
    return isConnected;
}

void WebSocketCommunication::onEvent(
    const AsyncWebSocketClient* client,
    const AwsEventType type,
    void* arg,
    uint8_t* data,
    const size_t len
)
{
    switch (type) {

        case WS_EVT_CONNECT:

            Serial.printf(
                "WebSocket client #%u connected from %s\n",
                client->id(),
                client->remoteIP().toString().c_str()
            );

            isConnected = true;
            break;


        case WS_EVT_DISCONNECT:

            Serial.printf(
                "WebSocket client #%u disconnected\n",
                client->id()
            );

            isConnected = false;
            break;


        case WS_EVT_DATA:
        {
            AwsFrameInfo* info = (AwsFrameInfo*)arg;

            if (
                info->final &&
                info->index == 0 &&
                info->len == len &&
                info->opcode == WS_TEXT
            ) {
                receivedMessage = String((char*)data).substring(0, len);

                Serial.print("Received: ");
                Serial.println(receivedMessage);
            }

            break;
        }


        case WS_EVT_PONG:
            break;


        case WS_EVT_ERROR:
            break;
        default: break;
    }
}

void WebSocketCommunication::onEventStatic(
    AsyncWebSocket* server,
    AsyncWebSocketClient* client,
    AwsEventType type,
    void* arg,
    uint8_t* data,
    size_t len
)
{
    if (instance != nullptr) {
        instance->onEvent(client, type, arg, data, len);
    }
}

WebSocketCommunication* WebSocketCommunication::instance = nullptr;

CommunicationManager::~CommunicationManager()
{
}
