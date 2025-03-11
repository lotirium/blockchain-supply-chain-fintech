package com.shipment.app.models;

import androidx.annotation.NonNull;
import java.math.BigDecimal;

public class OrderSummaryItem {
    private final String productId;
    private final String name;
    private final BigDecimal price;
    private final int quantity;
    private final String imageUrl;

    private OrderSummaryItem(Builder builder) {
        this.productId = builder.productId;
        this.name = builder.name;
        this.price = builder.price;
        this.quantity = builder.quantity;
        this.imageUrl = builder.imageUrl;
    }

    public String getProductId() {
        return productId;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public int getQuantity() {
        return quantity;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public static class Builder {
        private String productId;
        private String name;
        private BigDecimal price;
        private int quantity;
        private String imageUrl;

        public Builder setProductId(String productId) {
            this.productId = productId;
            return this;
        }

        public Builder setName(String name) {
            this.name = name;
            return this;
        }

        public Builder setPrice(String price) {
            try {
                this.price = new BigDecimal(price);
            } catch (NumberFormatException e) {
                this.price = BigDecimal.ZERO;
            }
            return this;
        }

        public Builder setPrice(BigDecimal price) {
            this.price = price != null ? price : BigDecimal.ZERO;
            return this;
        }

        public Builder setQuantity(int quantity) {
            this.quantity = quantity;
            return this;
        }

        public Builder setImageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
            return this;
        }

        public OrderSummaryItem build() {
            return new OrderSummaryItem(this);
        }
    }
}