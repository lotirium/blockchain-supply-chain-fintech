package com.shipment.app.services;

import android.util.Log;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import org.json.JSONObject;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class WebSocketService {
    private static final String TAG = "WebSocketService";
    private static volatile WebSocketService instance;
    private Socket socket;
    private final List<OrderUpdateListener> orderUpdateListeners = new ArrayList<>();

    public interface OrderUpdateListener {
        void onOrderUpdate(@NonNull String orderId, @NonNull String status);
    }

    private WebSocketService() {
        // Private constructor
    }

    private static String getWebSocketUrl() {
        String host = BuildConfig.API_HOST;
        // Use 10.0.2.2 for localhost when running in emulator
        if (host.equals("127.0.0.1") || host.equals("localhost")) {
            host = "10.0.2.2";
        }
        return String.format("%s://%s:%s", BuildConfig.WS_PROTOCOL, host, BuildConfig.API_PORT);
    }

    @NonNull
    public static WebSocketService getInstance() {
        if (instance == null) {
            synchronized (WebSocketService.class) {
                if (instance == null) {
                    instance = new WebSocketService();
                }
            }
        }
        return instance;
    }

    public void connect(@NonNull String token) {
        try {
            IO.Options options = new IO.Options();
            Map<String, String> auth = new HashMap<>();
            auth.put("token", token);
            options.auth = auth;
            socket = IO.socket(getWebSocketUrl(), options);
            setupSocketListeners();
            socket.connect();
        } catch (URISyntaxException e) {
            Log.e(TAG, "Error creating socket", e);
        }
    }

    private void setupSocketListeners() {
        if (socket == null) return;

        socket.on(Socket.EVENT_CONNECT, args -> 
            Log.d(TAG, "Socket connected")
        );

        socket.on(Socket.EVENT_DISCONNECT, args -> 
            Log.d(TAG, "Socket disconnected")
        );

        socket.on(Socket.EVENT_CONNECT_ERROR, args -> {
            if (args.length > 0 && args[0] instanceof Exception) {
                Log.e(TAG, "Connection error", (Exception) args[0]);
            } else {
                Log.e(TAG, "Connection error");
            }
        });

        socket.on("order_update", args -> {
            if (args.length > 0 && args[0] instanceof JSONObject) {
                try {
                    JSONObject data = (JSONObject) args[0];
                    String orderId = data.getString("orderId");
                    String status = data.getString("status");
                    notifyOrderUpdate(orderId, status);
                } catch (Exception e) {
                    Log.e(TAG, "Error parsing order update", e);
                }
            }
        });
    }

    public void addOrderUpdateListener(@NonNull OrderUpdateListener listener) {
        synchronized (orderUpdateListeners) {
            if (!orderUpdateListeners.contains(listener)) {
                orderUpdateListeners.add(listener);
            }
        }
    }

    public void removeOrderUpdateListener(@NonNull OrderUpdateListener listener) {
        synchronized (orderUpdateListeners) {
            orderUpdateListeners.remove(listener);
        }
    }

    private void notifyOrderUpdate(@NonNull String orderId, @NonNull String status) {
        synchronized (orderUpdateListeners) {
            for (OrderUpdateListener listener : orderUpdateListeners) {
                listener.onOrderUpdate(orderId, status);
            }
        }
    }

    public void disconnect() {
        if (socket != null) {
            socket.disconnect();
            socket = null;
        }
        synchronized (orderUpdateListeners) {
            orderUpdateListeners.clear();
        }
    }

    @Nullable
    public Socket getSocket() {
        return socket;
    }

    public boolean isConnected() {
        return socket != null && socket.connected();
    }
}