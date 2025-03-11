package com.shipment.app.repositories;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.google.gson.Gson;
import com.shipment.app.api.ApiService;
import com.shipment.app.api.responses.VerificationResponse;
import com.shipment.app.models.Order;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

public class OrderRepository {
    private final ApiService apiService;
    private final Gson gson;

    public interface OrderCallback {
        void onSuccess(@Nullable Order order);
        void onError(@NonNull String message);
    }

    public interface OrderListCallback {
        void onSuccess(@NonNull List<Order> orders);
        void onError(@NonNull String message);
    }

    public interface VerificationCallback {
        void onSuccess(@NonNull VerificationResponse response);
        void onError(@NonNull String message);
    }

    public OrderRepository(ApiService apiService) {
        if (apiService == null) {
            throw new IllegalArgumentException("ApiService must not be null");
        }
        this.apiService = apiService;
        this.gson = new Gson();
    }

    public void getUserOrders(@NonNull OrderListCallback callback) {
        apiService.getUserOrders().enqueue(new retrofit2.Callback<List<Order>>() {
            @Override
            public void onResponse(@NonNull retrofit2.Call<List<Order>> call,
                                 @NonNull retrofit2.Response<List<Order>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    callback.onSuccess(response.body());
                } else {
                    callback.onError("Failed to fetch orders: " + response.message());
                }
            }

            @Override
            public void onFailure(@NonNull retrofit2.Call<List<Order>> call,
                                @NonNull Throwable t) {
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }

    public void getOrderDetails(@NonNull String orderId, @NonNull OrderCallback callback) {
        apiService.getOrder(orderId).enqueue(new retrofit2.Callback<Order>() {
            @Override
            public void onResponse(@NonNull retrofit2.Call<Order> call,
                                 @NonNull retrofit2.Response<Order> response) {
                if (response.isSuccessful() && response.body() != null) {
                    callback.onSuccess(response.body());
                } else {
                    callback.onError("Failed to fetch order: " + response.message());
                }
            }

            @Override
            public void onFailure(@NonNull retrofit2.Call<Order> call,
                                @NonNull Throwable t) {
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }

    public void verifyOrderQR(@NonNull String qrData, @NonNull VerificationCallback callback) {
        try {
            Map<String, String> verificationData = new HashMap<>();
            verificationData.put("qrData", qrData);

            apiService.verifyQRCode(verificationData).enqueue(new retrofit2.Callback<VerificationResponse>() {
                @Override
                public void onResponse(@NonNull retrofit2.Call<VerificationResponse> call,
                                     @NonNull retrofit2.Response<VerificationResponse> response) {
                    if (response.isSuccessful() && response.body() != null) {
                        VerificationResponse result = response.body();
                        if (result.isSuccess()) {
                            callback.onSuccess(result);
                        } else {
                            callback.onError(result.getMessage());
                        }
                    } else {
                        callback.onError("Failed to verify QR code: " + response.message());
                    }
                }

                @Override
                public void onFailure(@NonNull retrofit2.Call<VerificationResponse> call,
                                    @NonNull Throwable t) {
                    callback.onError("Network error: " + t.getMessage());
                }
            });
        } catch (Exception e) {
            callback.onError("Error verifying QR code: " + e.getMessage());
        }
    }

    public void updateOrderStatus(@NonNull String orderId, @NonNull String status,
                                @NonNull OrderCallback callback) {
        try {
            Map<String, Object> statusData = new HashMap<>();
            statusData.put("status", status);

            apiService.updateOrderStatus(orderId, statusData).enqueue(new retrofit2.Callback<Order>() {
                @Override
                public void onResponse(@NonNull retrofit2.Call<Order> call,
                                     @NonNull retrofit2.Response<Order> response) {
                    if (response.isSuccessful() && response.body() != null) {
                        callback.onSuccess(response.body());
                    } else {
                        callback.onError("Failed to update order status: " + response.message());
                    }
                }

                @Override
                public void onFailure(@NonNull retrofit2.Call<Order> call,
                                    @NonNull Throwable t) {
                    callback.onError("Network error: " + t.getMessage());
                }
            });
        } catch (Exception e) {
            callback.onError("Error updating order status: " + e.getMessage());
        }
    }
}