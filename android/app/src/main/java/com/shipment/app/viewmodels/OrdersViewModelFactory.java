package com.shipment.app.viewmodels;

import androidx.annotation.NonNull;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;
import com.shipment.app.ShipmentApplication;
import com.shipment.app.repositories.OrderRepository;

public class OrdersViewModelFactory implements ViewModelProvider.Factory {
    @NonNull
    @Override
    @SuppressWarnings("unchecked")
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        if (modelClass.isAssignableFrom(OrdersViewModel.class)) {
            ShipmentApplication app = ShipmentApplication.getInstance();
            if (app == null || !app.isInitialized()) {
                throw new IllegalStateException("Application not initialized");
            }
            return (T) new OrdersViewModel(new OrderRepository(app.getApiService()));
        }
        throw new IllegalArgumentException("Unknown ViewModel class: " + modelClass.getName());
    }
}