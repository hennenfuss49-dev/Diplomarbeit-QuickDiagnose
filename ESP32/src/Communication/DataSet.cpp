#pragma once

#include <Arduino.h>
#include <vector>
#include "DataPoint.cpp"

class DataSet {
public:

    DataSet(const String& name)
        : name(name)
    {
    }

    // Add live data
    void add(
        const String& name,
        const String& value,
        const String& unit
    )
    {
        liveDataPoints.push_back({
            name,
            value,
            unit
        });
    }

    // Add error code
    void add(
        const String& code,
        const String& description,
        const String& state,
        const String& timestamp
    )
    {
        errorCodePoints.push_back({
            code,
            description,
            state,
            timestamp
        });
    }

    String getName() const {
        return name;
    }

    const std::vector<DataPointLiveData>& getLiveDataPoints() const {
        return liveDataPoints;
    }

    const std::vector<DataPointErrorCodes>& getErrorCodePoints() const {
        return errorCodePoints;
    }

private:

    String name;

    std::vector<DataPointLiveData> liveDataPoints;
    std::vector<DataPointErrorCodes> errorCodePoints;
};