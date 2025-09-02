package com.shipment.app;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Handler;
import android.os.Looper;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.multidex.MultiDexApplication;
import com.shipment.app.api.ApiService;
import com.shipment.app.repositories.AuthRepository;
import com.shipment.app.repositories.OrderRepository;
import com.shipment.app.services.WebSocketService;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import okhttp3.Request;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class ShipmentApplication extends MultiDexApplication {
    private static final int MAX_INIT_RETRIES = 3;
    private static final long INIT_RETRY_DELAY_MS = 1000;

    @SuppressWarnings("StaticFieldLeak")
    private static volatile ShipmentApplication instance;
    private ConnectivityManager connectivityManager;
    private AuthRepository authRepository;
    private OrderRepository orderRepository;
    private ApiService apiService;
    private WebSocketService webSocketService;
    private final AtomicBoolean isInitialized = new AtomicBoolean(false);
    private final AtomicBoolean isInitializing = new AtomicBoolean(false);
    private int initRetryCount = 0;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final List<InitializationCallback> initCallbacks = new ArrayList<>();

    public interface InitializationCallback {
        void onInitialized();
        void onError(String error);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        startInitialization();
    }

    private void startInitialization() {
        if (isInitializing.get() || isInitialized.get()) {
            return;
        }

        isInitializing.set(true);
        initRetryCount = 0;
        initializeAsync();
    }

    private void initializeAsync() {
        new Thread(() -> {
            try {
                if (initializeServices()) {
                    mainHandler.post(() -> {
                        isInitialized.set(true);
                        isInitializing.set(false);
                        notifyInitializationSuccess();
                    });
                } else if (initRetryCount < MAX_INIT_RETRIES) {
                    initRetryCount++;
                    android.util.Log.w("ShipmentApplication", 
                        "Initialization attempt " + initRetryCount + " failed, retrying...");
                    mainHandler.postDelayed(this::initializeAsync, INIT_RETRY_DELAY_MS);
                } else {
                    android.util.Log.e("ShipmentApplication", 
                        "Failed to initialize after " + MAX_INIT_RETRIES + " attempts");
                    mainHandler.post(() -> {
                        isInitializing.set(false);
                        notifyInitializationError("Failed to initialize after " + MAX_INIT_RETRIES + " attempts");
                    });
                }
            } catch (Exception e) {
                android.util.Log.e("ShipmentApplication", "Error during initialization", e);
                mainHandler.post(() -> {
                    isInitializing.set(false);
                    notifyInitializationError(e.getMessage());
                });
            }
        }).start();
    }

    private boolean initializeServices() {
        try {
            connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (connectivityManager == null) {
                return false;
            }

            // Initialize network components with auth token interceptor
            OkHttpClient client = new OkHttpClient.Builder()
                .addInterceptor(new HttpLoggingInterceptor().setLevel(HttpLoggingInterceptor.Level.BODY))
                // Add auth token interceptor that handles initialization timing
                .addInterceptor(chain -> {
                    Request original = chain.request();
                    Request.Builder builder = original.newBuilder();
                    
                    // Get token at request time, not initialization time
                    try {
                        if (authRepository != null) {
                            String token = authRepository.getAuthToken();
                            if (token != null && !token.isEmpty()) {
                                builder.header("Authorization", "Bearer " + token);
                                builder.header("Accept", "application/json");
                                android.util.Log.d("ShipmentApplication", "Adding auth token to request: " + original.url());
                                android.util.Log.d("ShipmentApplication", "Request headers: " + original.headers());
                            }
                        }
                    } catch (Exception e) {
                        // Log but don't fail the request if we can't get the token
                        android.util.Log.w("ShipmentApplication", "Could not get auth token for request: " + original.url(), e);
                    }
                    
                    Request request = builder
                        .method(original.method(), original.body())
                        .header("Cookie", "") // Enable cookie handling
                        .build();
                    android.util.Log.d("ShipmentApplication", "Final request headers: " + request.headers());
                    
                    return chain.proceed(request);
                })
                // Add network check interceptor
                .addInterceptor(chain -> {
                    if (!isNetworkAvailable()) {
                        throw new IOException("No internet connection");
                    }
                    Request request = chain.request();
                    int retryCount = 0;
                    int maxRetries = 3;
                    long retryDelay = 1000; // Start with 1 second delay
                    IOException lastException;
                    
                    do {
                        try {
                            return chain.proceed(request);
                        } catch (IOException e) {
                            lastException = e;
                            if (retryCount == maxRetries) throw e;
                            
                            retryCount++;
                            android.util.Log.w("ShipmentApplication", 
                                "Retry attempt " + retryCount + " for request: " + request.url());
                            
                            // Exponential backoff
                            try {
                                Thread.sleep(retryDelay);
                                retryDelay *= 2; // Double the delay for next retry
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                                throw e;
                            }
                        }
                    } while (retryCount < maxRetries);
                    
                    throw lastException;
                })
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .retryOnConnectionFailure(true)
                .followRedirects(true)
                .followSslRedirects(true)
                .cookieJar(new okhttp3.CookieJar() {
                    private final java.util.concurrent.ConcurrentHashMap<String, java.util.List<okhttp3.Cookie>> cookieStore = new java.util.concurrent.ConcurrentHashMap<>();

                    @Override
                    public void saveFromResponse(@NonNull okhttp3.HttpUrl url, @NonNull java.util.List<okhttp3.Cookie> cookies) {
                        cookieStore.put(url.host(), cookies);
                    }

                    @Override
                    public java.util.List<okhttp3.Cookie> loadForRequest(@NonNull okhttp3.HttpUrl url) {
                        java.util.List<okhttp3.Cookie> cookies = cookieStore.get(url.host());
                        return cookies != null ? cookies : new java.util.ArrayList<>();
                    }
                })
                .build();

            apiService = new Retrofit.Builder()
                .baseUrl(getBaseUrl())
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(ApiService.class);

            // Initialize WebSocket service first
            webSocketService = WebSocketService.getInstance(getBaseUrl());

            // Initialize repositories with proper sequence and context
            authRepository = new AuthRepository(this, apiService);
            orderRepository = new OrderRepository(apiService);

            // Listen for auth changes to manage WebSocket connection
            authRepository.addAuthStateListener(new AuthRepository.AuthStateListener() {
                @Override
                public void onAuthStateChanged(boolean isAuthenticated, String token) {
                    if (isAuthenticated && token != null) {
                        webSocketService.connect(token);
                    } else {
                        webSocketService.disconnect();
                    }
                }
            });

            return true;
        } catch (Exception e) {
            android.util.Log.e("ShipmentApplication", "Failed to initialize services", e);
            return false;
        }
    }

    @NonNull
    public AuthRepository getAuthRepository() {
        if (!isInitialized()) {
            throw new IllegalStateException("Application not initialized");
        }
        return authRepository;
    }

    @NonNull
    public OrderRepository getOrderRepository() {
        if (!isInitialized()) {
            throw new IllegalStateException("Application not initialized");
        }
        return orderRepository;
    }

    @NonNull
    public ApiService getApiService() {
        if (!isInitialized()) {
            throw new IllegalStateException("Application not initialized");
        }
        return apiService;
    }

    public void registerInitCallback(InitializationCallback callback) {
        if (callback == null) return;
        
        synchronized (initCallbacks) {
            if (isInitialized.get()) {
                callback.onInitialized();
            } else {
                initCallbacks.add(callback);
            }
        }
    }

    public void unregisterInitCallback(InitializationCallback callback) {
        if (callback == null) return;
        
        synchronized (initCallbacks) {
            initCallbacks.remove(callback);
        }
    }

    private void notifyInitializationSuccess() {
        synchronized (initCallbacks) {
            for (InitializationCallback callback : initCallbacks) {
                mainHandler.post(callback::onInitialized);
            }
            initCallbacks.clear();
        }
    }

    private void notifyInitializationError(String error) {
        synchronized (initCallbacks) {
            for (InitializationCallback callback : initCallbacks) {
                mainHandler.post(() -> callback.onError(error));
            }
            initCallbacks.clear();
        }
    }

    @Nullable
    public static ShipmentApplication getInstance() {
        return instance;
    }

    public boolean isInitialized() {
        return isInitialized.get();
    }

    public boolean isInitializing() {
        return isInitializing.get();
    }

    public void retryInitialization() {
        if (!isInitializing.get() && !isInitialized.get()) {
            startInitialization();
        }
    }

    public boolean isNetworkAvailable() {
        if (connectivityManager == null) {
            return false;
        }
        try {
            NetworkInfo activeNetwork = connectivityManager.getActiveNetworkInfo();
            return activeNetwork != null && activeNetwork.isConnectedOrConnecting();
        } catch (Exception e) {
            android.util.Log.e("ShipmentApplication", "Error checking network state", e);
            return false;
        }
    }

    @NonNull
    public String getBaseUrl() {
        return BuildConfig.DEBUG ? "http://192.168.0.4:3001" : "https://shipment.app";
    }

    @NonNull
    public String getStaticFileUrl() {
        // Use the same server for both API and static files since uploads are served there
        return getBaseUrl();
    }

    @NonNull
    public WebSocketService getWebSocketService() {
        if (!isInitialized()) {
            throw new IllegalStateException("Application not initialized");
        }
        return webSocketService;
    }

    @Override
    public void onTerminate() {
        super.onTerminate();
        mainHandler.removeCallbacksAndMessages(null);
        synchronized (initCallbacks) {
            initCallbacks.clear();
        }
        if (webSocketService != null) {
            webSocketService.disconnect();
        }
        instance = null;
        connectivityManager = null;
        authRepository = null;
        orderRepository = null;
        apiService = null;
        webSocketService = null;
        isInitialized.set(false);
        isInitializing.set(false);
    }
}