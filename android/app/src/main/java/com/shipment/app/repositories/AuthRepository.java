package com.shipment.app.repositories;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import com.shipment.app.api.ApiService;
import com.shipment.app.api.requests.AuthRequest;
import com.shipment.app.api.responses.AuthResponse;
import com.shipment.app.utils.AuthValidator;
import com.shipment.app.utils.RetryHelper;
import com.shipment.app.utils.Resource;
import retrofit2.Response;
import java.util.Map;

public class AuthRepository {
    private static final String PREF_NAME = "auth_prefs";
    private static final String KEY_TOKEN = "auth_token";
    private static final String KEY_USER_ID = "user_id";
    private static final String KEY_USER_ROLE = "user_role";
    private static final String KEY_USER_TYPE = "user_type";

    private final ApiService apiService;
    private final SharedPreferences prefs;
    private final MutableLiveData<Boolean> isAuthenticated = new MutableLiveData<>();
    private final MutableLiveData<String> userRole = new MutableLiveData<>();
    private AuthStateListener authStateListener;

    public interface AuthStateListener {
        void onAuthStateChanged(boolean isAuthenticated, String token);
    }

    public void addAuthStateListener(AuthStateListener listener) {
        this.authStateListener = listener;
        if (listener != null) {
            listener.onAuthStateChanged(isAuthenticated.getValue() != null && isAuthenticated.getValue(), getAuthToken());
        }
    }

    public AuthRepository(Context context, ApiService apiService) {
        this.apiService = apiService;
        this.prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String token = getAuthToken();
        isAuthenticated.postValue(token != null && !token.isEmpty());
        userRole.postValue(getUserRole());
    }

    public LiveData<Resource<AuthResponse>> register(AuthRequest.RegisterRequest request) {
        MutableLiveData<Resource<AuthResponse>> result = new MutableLiveData<>();
        result.setValue(Resource.loading(null));

        try {
            // Validate registration data using web's validation logic
            Map<String, Object> validatedData = AuthValidator.validateRegistrationData(request);

            RetryHelper.RetryableOperation<AuthResponse> operation = () -> 
                apiService.register(new AuthRequest.RegisterRequest.Builder()
                    .fromMap(validatedData)
                    .build())
                    .execute();

            new Thread(() -> {
                try {
                    Response<AuthResponse> response = RetryHelper.executeWithRetry(operation);
                    if (response.isSuccessful() && response.body() != null) {
                        AuthResponse authResponse = response.body();
                        saveAuthData(authResponse);
                        result.postValue(Resource.success(authResponse));
                    } else {
                        if (response.code() == 409) {
                            result.postValue(Resource.error("This email is already registered. Please use a different email address or try logging in.", null));
                        } else {
                            result.postValue(Resource.error("Registration failed", null));
                        }
                    }
                } catch (Exception e) {
                    handleAuthError(e, result);
                }
            }).start();
        } catch (AuthValidator.ValidationException e) {
            result.setValue(Resource.error(e.getMessage(), null));
        }

        return result;
    }

    public LiveData<Resource<AuthResponse>> login(String email, String password) {
        MutableLiveData<Resource<AuthResponse>> result = new MutableLiveData<>();
        result.setValue(Resource.loading(null));

        if (email == null || email.trim().isEmpty()) {
            result.setValue(Resource.error("Email is required", null));
            return result;
        }

        if (password == null || password.isEmpty()) {
            result.setValue(Resource.error("Password is required", null));
            return result;
        }

        RetryHelper.RetryableOperation<AuthResponse> operation = () ->
            apiService.login(new AuthRequest.LoginRequest.Builder()
                .setEmail(email.trim())
                .setPassword(password)
                .build())
                .execute();

        new Thread(() -> {
            try {
                Response<AuthResponse> response = RetryHelper.executeWithRetry(operation);
                android.util.Log.d("AuthRepository", "Profile response code: " + response.code());
                if (response.isSuccessful() && response.body() != null) {
                    AuthResponse authResponse = response.body();
                    saveAuthData(authResponse);
                    result.postValue(Resource.success(authResponse));
                } else {
                    result.postValue(Resource.error("Login failed", null));
                }
            } catch (Exception e) {
                handleAuthError(e, result);
            }
        }).start();

        return result;
    }

    public LiveData<Resource<Void>> logout() {
        MutableLiveData<Resource<Void>> result = new MutableLiveData<>();
        
        // Clear auth data immediately
        clearAuthData();
        
        // Sync with server in background
        RetryHelper.RetryableOperation<Void> operation = () ->
            apiService.logout().execute();

        new Thread(() -> {
            try {
                Response<Void> response = RetryHelper.executeWithRetry(operation);
                result.postValue(Resource.success(null));
            } catch (Exception e) {
                handleAuthError(e, result);
            }
        }).start();

        return result;
    }

    public LiveData<Resource<AuthResponse>> updateProfile(String firstName, String lastName, String email, String username) {
        MutableLiveData<Resource<AuthResponse>> result = new MutableLiveData<>();
        result.setValue(Resource.loading(null));

        if (firstName == null || firstName.trim().isEmpty()) {
            result.setValue(Resource.error("First name is required", null));
            return result;
        }

        if (lastName == null || lastName.trim().isEmpty()) {
            result.setValue(Resource.error("Last name is required", null));
            return result;
        }

        if (email == null || email.trim().isEmpty()) {
            result.setValue(Resource.error("Email is required", null));
            return result;
        }

        if (username == null || username.trim().isEmpty()) {
            result.setValue(Resource.error("Username is required", null));
            return result;
        }

        Map<String, String> profileData = new java.util.HashMap<>();
        profileData.put("firstName", firstName.trim());
        profileData.put("lastName", lastName.trim());
        profileData.put("email", email.trim());
        profileData.put("username", username.trim());

        RetryHelper.RetryableOperation<AuthResponse> operation = () ->
            apiService.updateProfile(profileData).execute();

        new Thread(() -> {
            try {
                Response<AuthResponse> response = RetryHelper.executeWithRetry(operation);
                if (response.isSuccessful() && response.body() != null) {
                    AuthResponse authResponse = response.body();
                    saveAuthData(authResponse);
                    result.postValue(Resource.success(authResponse));
                } else {
                    if (response.code() == 409) {
                        result.postValue(Resource.error("This email is already in use", null));
                    } else {
                        result.postValue(Resource.error("Failed to update profile", null));
                    }
                }
            } catch (Exception e) {
                handleAuthError(e, result);
            }
        }).start();

        return result;
    }

    public LiveData<Resource<AuthResponse>> getProfile() {
        MutableLiveData<Resource<AuthResponse>> result = new MutableLiveData<>();
        result.setValue(Resource.loading(null));

        String token = getAuthToken();
        if (token == null) {
            result.setValue(Resource.error("No authentication token found", null));
            return result;
        }

        RetryHelper.RetryableOperation<AuthResponse> operation = () ->
            apiService.getProfile().execute();

        android.util.Log.d("AuthRepository", "Getting profile with token: " + token);

        new Thread(() -> {
            try {
                Response<AuthResponse> response = RetryHelper.executeWithRetry(operation);
                if (response.isSuccessful() && response.body() != null) {
                    result.postValue(Resource.success(response.body()));
                } else {
                    android.util.Log.w("AuthRepository", "Profile request failed with code: " + response.code() + 
                        ", message: " + (response.errorBody() != null ? response.errorBody().string() : "No error body"));
                    if (response.code() == 401) {
                        clearAuthData();
                        result.postValue(Resource.error("Session expired. Please login again.", null));
                    } else {
                        result.postValue(Resource.error("Failed to get profile", null));
                    }
                }
            } catch (Exception e) {
                handleAuthError(e, result);
            }
        }).start();

        return result;
    }

    private void saveAuthData(AuthResponse response) {
        if (response.getToken() != null && response.getUser() != null) {
            prefs.edit()
                .putString(KEY_TOKEN, response.getToken())
                .putString(KEY_USER_ID, response.getUser().getId())
                .putString(KEY_USER_ROLE, response.getUser().getRole())
                .putString(KEY_USER_TYPE, response.getUser().getUserType())
                .apply();
            isAuthenticated.postValue(true);
            userRole.postValue(response.getUser().getRole());
            if (authStateListener != null) {
                authStateListener.onAuthStateChanged(true, response.getToken());
            }
        }
    }

    private void clearAuthData() {
        prefs.edit().clear().apply();
        isAuthenticated.postValue(false);
        userRole.postValue(null);
        if (authStateListener != null) {
            authStateListener.onAuthStateChanged(false, null);
        }
    }

    private <T> void handleAuthError(Exception e, MutableLiveData<Resource<T>> result) {
        String message = e.getMessage();
        if (message != null && message.contains("User not found")) {
            clearAuthData();
            message = "Session expired. Please login again.";
        } else if (message != null && (
            message.contains("Failed to connect") ||
            message.contains("timeout") ||
            message.contains("Unable to resolve host"))) {
            message = "Server is currently unavailable. Please try again later.";
        }
        result.postValue(Resource.error(message, null));
    }

    public String getAuthToken() {
        return prefs.getString(KEY_TOKEN, null);
    }

    public String getUserId() {
        return prefs.getString(KEY_USER_ID, null);
    }

    public String getUserRole() {
        return prefs.getString(KEY_USER_ROLE, null);
    }

    public String getUserType() {
        return prefs.getString(KEY_USER_TYPE, null);
    }

    public LiveData<Boolean> isAuthenticated() {
        return isAuthenticated;
    }

    public LiveData<String> getUserRoleLiveData() {
        return userRole;
    }
}