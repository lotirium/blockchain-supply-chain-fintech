package com.shipment.app.viewmodels;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import com.shipment.app.ShipmentApplication;
import com.shipment.app.api.requests.AuthRequest;
import com.shipment.app.api.responses.AuthResponse;
import com.shipment.app.repositories.AuthRepository;
import com.shipment.app.services.WebSocketService;
import com.shipment.app.utils.Resource;
import java.util.Map;

public class AuthViewModel extends AndroidViewModel {
    private final AuthRepository authRepository;
    private final MutableLiveData<Boolean> isLoading = new MutableLiveData<>(false);

    public AuthViewModel(@NonNull Application application) {
        super(application);
        authRepository = ((ShipmentApplication) application).getAuthRepository();
    }

    public LiveData<Resource<AuthResponse>> login(String email, String password) {
        isLoading.setValue(true);
        MutableLiveData<Resource<AuthResponse>> result = new MutableLiveData<>();
        result.setValue(Resource.loading(null));
        
        authRepository.login(email, password).observeForever(response -> {
            if (response.getStatus() == Resource.Status.LOADING) {
                return; // Keep loading state
            }
            isLoading.setValue(false);
            result.setValue(response);
            
            if (response.getStatus() == Resource.Status.SUCCESS && response.getData() != null) {
                // Initialize WebSocket connection after successful login
                ((ShipmentApplication) getApplication()).getWebSocketService()
                    .connect(authRepository.getAuthToken());
            }
        });
        
        return result;
    }

    public LiveData<Resource<AuthResponse>> register(
            @NonNull String username,
            @NonNull String email,
            @NonNull String password,
            @NonNull String firstName,
            @NonNull String lastName,
            @NonNull String userType,
            @NonNull Map<String, Object> validatedData) {
        
        isLoading.setValue(true);

        AuthRequest.RegisterRequest request = new AuthRequest.RegisterRequest.Builder()
            .setUsername(username)
            .setEmail(email)
            .setPassword(password)
            .setFirstName(firstName)
            .setLastName(lastName)
            .setUserType(userType)
            .build();

        if (userType.equals("seller")) {
            AuthRequest.StoreData.Builder storeBuilder = new AuthRequest.StoreData.Builder()
                .setName((String) validatedData.get("store_name"))
                .setDescription((String) validatedData.get("store_description"))
                .setAddress((String) validatedData.get("store_address"))
                .setPhone((String) validatedData.get("store_phone"))
                .setBusinessPhone((String) validatedData.get("business_phone"))
                .setBusinessAddress((String) validatedData.get("business_address"));

            request = new AuthRequest.RegisterRequest.Builder()
                .setUsername(username)
                .setEmail(email)
                .setPassword(password)
                .setFirstName(firstName)
                .setLastName(lastName)
                .setUserType(userType)
                .setStore(storeBuilder.build())
                .build();
        }
        
        LiveData<Resource<AuthResponse>> result = authRepository.register(request);
        isLoading.setValue(false);
        return result;
    }

    public LiveData<Resource<Void>> logout() {
        isLoading.setValue(true);
        MutableLiveData<Resource<Void>> result = new MutableLiveData<>();
        
        // Disconnect WebSocket before logging out
        WebSocketService.getInstance(null).disconnect();
        
        // Create a one-time observer that removes itself after receiving a non-loading response
        LiveData<Resource<Void>> logoutResponse = authRepository.logout();
        logoutResponse.observeForever(new androidx.lifecycle.Observer<Resource<Void>>() {
            @Override
            public void onChanged(Resource<Void> response) {
                if (response.getStatus() != Resource.Status.LOADING) {
                    isLoading.setValue(false);
                    result.setValue(response);
                    logoutResponse.removeObserver(this);
                }
            }
        });
        
        return result;
    }

    public LiveData<Resource<AuthResponse>> getProfile() {
        isLoading.setValue(true);
        LiveData<Resource<AuthResponse>> result = authRepository.getProfile();
        isLoading.setValue(false);
        return result;
    }

    public LiveData<Boolean> isAuthenticated() {
        return authRepository.isAuthenticated();
    }

    public LiveData<String> getUserRole() {
        return authRepository.getUserRoleLiveData();
    }

    public LiveData<Resource<AuthResponse>> updateProfile(String firstName, String lastName, String email, String username) {
        isLoading.setValue(true);
        LiveData<Resource<AuthResponse>> result = authRepository.updateProfile(firstName, lastName, email, username);
        isLoading.setValue(false);
        return result;
    }

    public LiveData<Boolean> getIsLoading() {
        return isLoading;
    }

    public String getAuthToken() {
        return authRepository.getAuthToken();
    }

    public String getUserId() {
        return authRepository.getUserId();
    }
}