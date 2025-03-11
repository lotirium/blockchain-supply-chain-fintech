package com.shipment.app.viewmodels;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import com.shipment.app.ShipmentApplication;
import com.shipment.app.api.ApiService;
import com.shipment.app.api.responses.VerificationResponse;
import com.shipment.app.models.Order;
import com.shipment.app.repositories.AuthRepository;
import com.shipment.app.repositories.OrderRepository;
import com.shipment.app.utils.Resource;

public class OrderDetailsViewModel extends AndroidViewModel {
    private final OrderRepository orderRepository;
    private final AuthRepository authRepository;
    private final MutableLiveData<Order> order;
    private final MutableLiveData<Boolean> isLoading;
    private final MutableLiveData<String> error;
    private final MutableLiveData<Boolean> isSeller;

    public OrderDetailsViewModel(@NonNull Application application) {
        super(application);
        ApiService apiService = ((ShipmentApplication) application).getApiService();
        orderRepository = new OrderRepository(apiService);
        authRepository = new AuthRepository(application, apiService);
        order = new MutableLiveData<>();
        isLoading = new MutableLiveData<>(false);
        error = new MutableLiveData<>();
        isSeller = new MutableLiveData<>(false);
        checkSellerStatus();
    }

    private void checkSellerStatus() {
        authRepository.getProfile().observeForever(response -> {
            if (response.getStatus() == Resource.Status.SUCCESS && response.getData() != null) {
                String role = response.getData().getUser().getRole();
                boolean hasSeller = "seller".equals(role) && 
                    response.getData().getUser().getStore() != null;
                isSeller.postValue(hasSeller);
            } else {
                isSeller.postValue(false);
            }
        });
    }

    public LiveData<Order> getOrder() {
        return order;
    }

    public LiveData<Boolean> isSeller() {
        return isSeller;
    }

    public LiveData<Boolean> getIsLoading() {
        return isLoading;
    }

    public LiveData<String> getError() {
        return error;
    }

    public void loadOrderDetails(@NonNull String orderId) {
        if (isLoading.getValue() != null && isLoading.getValue()) {
            return;
        }

        isLoading.setValue(true);
        orderRepository.getOrderDetails(orderId, new OrderRepository.OrderCallback() {
            @Override
            public void onSuccess(@NonNull Order orderDetails) {
                order.postValue(orderDetails);
                isLoading.postValue(false);
            }

            @Override
            public void onError(@NonNull String message) {
                error.postValue(message);
                isLoading.postValue(false);
            }
        });
    }

    public void verifyQrCode(String qrData) {
        if (isLoading.getValue() != null && isLoading.getValue()) {
            return;
        }

        isLoading.setValue(true);
        orderRepository.verifyOrderQR(qrData, new OrderRepository.VerificationCallback() {
            @Override
            public void onSuccess(@NonNull VerificationResponse response) {
                // Refresh order details after successful verification
                if (response.isSuccess() && response.getVerificationResult() != null) {
                    Order currentOrder = order.getValue();
                    if (currentOrder != null) {
                        loadOrderDetails(currentOrder.getId());
                    }
                    error.postValue(null);
                } else {
                    error.postValue(response.getMessage());
                }
                isLoading.postValue(false);
            }

            @Override
            public void onError(@NonNull String message) {
                error.postValue(message);
                isLoading.postValue(false);
            }
        });
    }

    @Override
    protected void onCleared() {
        super.onCleared();
        // Cleanup if needed
    }
}