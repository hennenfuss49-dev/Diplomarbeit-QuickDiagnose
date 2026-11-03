#pragma once

#include <Arduino.h>

struct DataPoint {
    virtual ~DataPoint() = default;
};

struct DataPointLiveData : DataPoint {
    String name;
    String value;
    String unit;

    DataPointLiveData(
        const String& name,
        const String& value,
        const String& unit
    ) : name(name), value(value), unit(unit) {}
};

struct DataPointErrorCodes : DataPoint {
    String code;
    String description;
    String state;
    String timestamp;

    DataPointErrorCodes(
        const String& code,
        const String& description,
        const String& state,
        const String& timestamp
    ) : code(code),
        description(description),
        state(state),
        timestamp(timestamp) {}
};