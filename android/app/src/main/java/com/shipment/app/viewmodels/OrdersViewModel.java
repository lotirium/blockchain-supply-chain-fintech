package com.shipment.app.viewmodels;

import androidx.annotation.NonNull;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;
import com.shipment.app.models.Order;
import com.shipment.app.repositories.OrderRepository;
import com.shipment.app.services.WebSocketService;
import java.util.List;
import java.util.ArrayList;

public class OrdersViewModel extends ViewModel implements WebSocketService.OrderUpdateListener {
    private final OrderRepository repository;
    private final MutableLiveData<List<Order>> orders = new MutableLiveData<>();
    private final MutableLiveData<Boolean> isLoading = new MutableLiveData<>(false);
    private final MutableLiveData<String> error = new MutableLiveData<>();

    public OrdersViewModel(OrderRepository repository) {
        this.repository = repository;
        WebSocketService.getInstance(null).addOrderUpdateListener(this);
        loadOrders();
    }

    public LiveData<List<Order>> getOrders() {
        return orders;
    }

    public LiveData<Boolean> getIsLoading() {
        return isLoading;
    }

    public LiveData<String> getError() {
        return error;
    }

    public void loadOrders() {
        if (Boolean.TRUE.equals(isLoading.getValue())) return;

        isLoading.setValue(true);
        error.setValue(null);

        repository.getUserOrders(new OrderRepository.OrderListCallback() {
            @Override
            public void onSuccess(@NonNull List<Order> orderList) {
                // Sort orders by date, newest first
                orderList.sort((o1, o2) -> o2.getCreatedAt().compareTo(o1.getCreatedAt()));
                orders.postValue(orderList);
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
    public void onOrderUpdate(@NonNull String orderId, @NonNull String status) {
        List<Order> currentOrders = orders.getValue();
        if (currentOrders != null) {
            List<Order> updatedOrders = new ArrayList<>(currentOrders);
            for (int i = 0; i < updatedOrders.size(); i++) {
                Order order = updatedOrders.get(i);
                if (order.getId().equals(orderId)) {
                    order.setStatus(status);
                    updatedOrders.set(i, order);
                    orders.postValue(updatedOrders);
                    break;
                }
            }
        }
    }

    public void refresh() {
        loadOrders();
    }

    public void filterByStatus(String status) {
        if (status == null || status.isEmpty()) {
            loadOrders();
            return;
        }

        List<Order> currentOrders = orders.getValue();
        if (currentOrders != null) {
            List<Order> filteredOrders = currentOrders.stream()
                .filter(order -> order.getStatus().equalsIgnoreCase(status))
                .sorted((o1, o2) -> o2.getCreatedAt().compareTo(o1.getCreatedAt()))
                .toList();
            orders.setValue(filteredOrders);
        }
    }

    @Override
    protected void onCleared() {
        super.onCleared();
        WebSocketService.getInstance(null).removeOrderUpdateListener(this);
    }
}