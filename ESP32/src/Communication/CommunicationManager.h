#pragma once

#include <Arduino.h>
#include <WString.h>
//
// Created by Rafael Ortner on 06/10/2026.
//
class CommunicationManager {
public:
    virtual bool begin() = 0;
    virtual bool connected() = 0;
    virtual bool send(const String& data) = 0;
    virtual bool receive(String &data) = 0;

    virtual void loop() = 0;

    virtual ~CommunicationManager();
};