package com.shipment.app.api;

import com.shipment.app.api.responses.AuthResponse;
import com.shipment.app.api.requests.AuthRequest;
import com.shipment.app.api.responses.VerificationResponse;
import com.shipment.app.models.Order;
import java.util.List;
import java.util.Map;
import retrofit2.Call;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.http.*;

public interface ApiService {
    static String getBaseUrl() {
        String host = BuildConfig.API_HOST;
        // Use 10.0.2.2 for localhost when running in emulator
        if (host.equals("127.0.0.1") || host.equals("localhost")) {
            host = "10.0.2.2";
        }
        return String.format("%s://%s:%s/", BuildConfig.API_PROTOCOL, host, BuildConfig.API_PORT);
    }
    
    static ApiService getInstance() {
        Retrofit retrofit = new Retrofit.Builder()
            .baseUrl(getBaseUrl())
            .addConverterFactory(GsonConverterFactory.create())
            .build();
        return retrofit.create(ApiService.class);
    }
    // Auth endpoints
    @POST("/api/auth/login")
    Call<AuthResponse> login(@Body AuthRequest.LoginRequest request);

    @POST("/api/auth/register")
    Call<AuthResponse> register(@Body AuthRequest.RegisterRequest request);

    @POST("/api/auth/logout")
    Call<Void> logout();

    @GET("/api/profile")
    Call<AuthResponse> getProfile();

    @PUT("/api/profile")
    Call<AuthResponse> updateProfile(@Body Map<String, String> profileData);

    // Order endpoints
    @GET("/api/orders/user")
    Call<List<Order>> getUserOrders();

    @GET("/api/orders/{orderId}")
    Call<Order> getOrder(@Path("orderId") String orderId);

    @POST("/api/qrcode/verify")
    Call<VerificationResponse> verifyQRCode(@Body Map<String, String> qrData);

    @PUT("/api/orders/{orderId}/status")
    Call<Order> updateOrderStatus(
        @Path("orderId") String orderId,
        @Body Map<String, Object> statusData
    );
}