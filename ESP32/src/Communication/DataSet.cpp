//
// Created by Rafael Ortner on 06/10/2026.
//
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

    void add(
        const String& name,
        const String& value,
        const String& unit = ""
    )
    {
        datapoints.push_back({
            name,
            value,
            unit
        });
    }

    String getName() const {
        return name;
    }

    const std::vector<DataPoint>& getDataPoints() const {
        return datapoints;
    }

private:

    String name;

    std::vector<DataPoint> datapoints;
};