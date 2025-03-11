package com.shipment.app.api;

import org.json.JSONObject;

public interface ApiCallback {
    void onSuccess(JSONObject response);
    void onError(String message);
}