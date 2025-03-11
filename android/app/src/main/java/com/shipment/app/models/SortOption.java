package com.shipment.app.models;

import androidx.annotation.NonNull;

public enum SortOption {
    NEWEST("newest"),
    PRICE_LOW_TO_HIGH("price_asc"),
    PRICE_HIGH_TO_LOW("price_desc"),
    POPULARITY("popularity");

    @NonNull
    private final String value;

    SortOption(@NonNull String value) {
        this.value = value;
    }

    @NonNull
    public String getValue() {
        return value;
    }

    @NonNull
    public static SortOption fromValue(@NonNull String value) {
        for (SortOption option : values()) {
            if (option.value.equals(value)) {
                return option;
            }
        }
        return NEWEST;
    }
}