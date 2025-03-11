package com.shipment.app.api.responses;

import androidx.annotation.NonNull;
import com.google.gson.annotations.SerializedName;
import java.util.List;

public class OrderResponse {
    @SerializedName("id")
    private String id;

    @SerializedName("status")
    private String status;

    @SerializedName("total_fiat_amount")
    private String totalFiatAmount;

    @SerializedName("created_at")
    private String createdAt;

    @SerializedName("updated_at")
    private String updatedAt;

    @SerializedName("items")
    private List<OrderItem> items;

    @SerializedName("merchantStore")
    private Store merchantStore;

    @SerializedName("orderPlacer")
    private User orderPlacer;

    public static class OrderItem {
        @SerializedName("quantity")
        private int quantity;

        @SerializedName("unit_price")
        private String unitPrice;

        @SerializedName("total_price")
        private String totalPrice;

        @SerializedName("product")
        private Product product;

        public int getQuantity() {
            return quantity;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }

        @NonNull
        public String getUnitPrice() {
            return unitPrice;
        }

        public void setUnitPrice(@NonNull String unitPrice) {
            this.unitPrice = unitPrice;
        }

        @NonNull
        public String getTotalPrice() {
            return totalPrice;
        }

        public void setTotalPrice(@NonNull String totalPrice) {
            this.totalPrice = totalPrice;
        }

        @NonNull
        public Product getProduct() {
            return product;
        }

        public void setProduct(@NonNull Product product) {
            this.product = product;
        }
    }

    public static class Product {
        @SerializedName("id")
        private String id;

        @SerializedName("name")
        private String name;

        @SerializedName("description")
        private String description;

        @NonNull
        public String getId() {
            return id;
        }

        public void setId(@NonNull String id) {
            this.id = id;
        }

        @NonNull
        public String getName() {
            return name;
        }

        public void setName(@NonNull String name) {
            this.name = name;
        }

        @NonNull
        public String getDescription() {
            return description;
        }

        public void setDescription(@NonNull String description) {
            this.description = description;
        }
    }

    public static class Store {
        @SerializedName("id")
        private String id;

        @SerializedName("name")
        private String name;

        @NonNull
        public String getId() {
            return id;
        }

        public void setId(@NonNull String id) {
            this.id = id;
        }

        @NonNull
        public String getName() {
            return name;
        }

        public void setName(@NonNull String name) {
            this.name = name;
        }
    }

    public static class User {
        @SerializedName("id")
        private String id;

        @SerializedName("first_name")
        private String firstName;

        @SerializedName("last_name")
        private String lastName;

        @SerializedName("email")
        private String email;

        @NonNull
        public String getId() {
            return id;
        }

        public void setId(@NonNull String id) {
            this.id = id;
        }

        @NonNull
        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(@NonNull String firstName) {
            this.firstName = firstName;
        }

        @NonNull
        public String getLastName() {
            return lastName;
        }

        public void setLastName(@NonNull String lastName) {
            this.lastName = lastName;
        }

        @NonNull
        public String getEmail() {
            return email;
        }

        public void setEmail(@NonNull String email) {
            this.email = email;
        }
    }

    @NonNull
    public String getId() {
        return id;
    }

    public void setId(@NonNull String id) {
        this.id = id;
    }

    @NonNull
    public String getStatus() {
        return status;
    }

    public void setStatus(@NonNull String status) {
        this.status = status;
    }

    @NonNull
    public String getTotalFiatAmount() {
        return totalFiatAmount;
    }

    public void setTotalFiatAmount(@NonNull String totalFiatAmount) {
        this.totalFiatAmount = totalFiatAmount;
    }

    @NonNull
    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(@NonNull String createdAt) {
        this.createdAt = createdAt;
    }

    @NonNull
    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(@NonNull String updatedAt) {
        this.updatedAt = updatedAt;
    }

    @NonNull
    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(@NonNull List<OrderItem> items) {
        this.items = items;
    }

    @NonNull
    public Store getMerchantStore() {
        return merchantStore;
    }

    public void setMerchantStore(@NonNull Store merchantStore) {
        this.merchantStore = merchantStore;
    }

    @NonNull
    public User getOrderPlacer() {
        return orderPlacer;
    }

    public void setOrderPlacer(@NonNull User orderPlacer) {
        this.orderPlacer = orderPlacer;
    }
}