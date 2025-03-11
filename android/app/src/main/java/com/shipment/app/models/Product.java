package com.shipment.app.models;

import android.os.Parcel;
import android.os.Parcelable;
import java.math.BigDecimal;

public class Product implements Parcelable {
    private final String id;
    private final String name;
    private final String manufacturer;
    private final String tokenId;
    private final String description;
    private final BigDecimal price;
    private final String imageUrl;
    private final String category;
    private final int stockQuantity;
    private final String sellerId;
    private final String storeId;
    private final boolean isAvailable;
    private final float rating;
    private final int reviewCount;

    private Product(Builder builder) {
        this.id = builder.id;
        this.name = builder.name;
        this.manufacturer = builder.manufacturer;
        this.tokenId = builder.tokenId;
        this.description = builder.description;
        this.price = builder.price;
        this.imageUrl = builder.imageUrl;
        this.category = builder.category;
        this.stockQuantity = builder.stockQuantity;
        this.sellerId = builder.sellerId;
        this.storeId = builder.storeId;
        this.isAvailable = builder.isAvailable;
        this.rating = builder.rating;
        this.reviewCount = builder.reviewCount;
    }

    // Getters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getManufacturer() { return manufacturer; }
    public String getTokenId() { return tokenId; }
    public String getDescription() { return description; }
    public BigDecimal getPrice() { return price; }
    public String getImageUrl() { return imageUrl; }
    public String getCategory() { return category; }
    public int getStockQuantity() { return stockQuantity; }
    public String getSellerId() { return sellerId; }
    public String getStoreId() { return storeId; }
    public boolean isAvailable() { return isAvailable; }
    public float getRating() { return rating; }
    public int getReviewCount() { return reviewCount; }

    // Parcelable implementation
    protected Product(Parcel in) {
        id = in.readString();
        name = in.readString();
        manufacturer = in.readString();
        tokenId = in.readString();
        description = in.readString();
        price = new BigDecimal(in.readString());
        imageUrl = in.readString();
        category = in.readString();
        stockQuantity = in.readInt();
        sellerId = in.readString();
        storeId = in.readString();
        isAvailable = in.readByte() != 0;
        rating = in.readFloat();
        reviewCount = in.readInt();
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeString(id);
        dest.writeString(name);
        dest.writeString(manufacturer);
        dest.writeString(tokenId);
        dest.writeString(description);
        dest.writeString(price.toString());
        dest.writeString(imageUrl);
        dest.writeString(category);
        dest.writeInt(stockQuantity);
        dest.writeString(sellerId);
        dest.writeString(storeId);
        dest.writeByte((byte) (isAvailable ? 1 : 0));
        dest.writeFloat(rating);
        dest.writeInt(reviewCount);
    }

    @Override
    public int describeContents() {
        return 0;
    }

    public static final Creator<Product> CREATOR = new Creator<Product>() {
        @Override
        public Product createFromParcel(Parcel in) {
            return new Product(in);
        }

        @Override
        public Product[] newArray(int size) {
            return new Product[size];
        }
    };

    // Builder pattern
    public static class Builder {
        private String id;
        private String name;
        private String manufacturer;
        private String tokenId;
        private String description;
        private BigDecimal price;
        private String imageUrl;
        private String category;
        private int stockQuantity;
        private String sellerId;
        private String storeId;
        private boolean isAvailable = true;
        private float rating;
        private int reviewCount;

        public Builder setId(String id) {
            this.id = id;
            return this;
        }

        public Builder setName(String name) {
            this.name = name;
            return this;
        }

        public Builder setManufacturer(String manufacturer) {
            this.manufacturer = manufacturer;
            return this;
        }

        public Builder setTokenId(String tokenId) {
            this.tokenId = tokenId;
            return this;
        }

        public Builder setDescription(String description) {
            this.description = description;
            return this;
        }

        public Builder setPrice(BigDecimal price) {
            this.price = price;
            return this;
        }

        public Builder setImageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
            return this;
        }

        public Builder setCategory(String category) {
            this.category = category;
            return this;
        }

        public Builder setStockQuantity(int stockQuantity) {
            this.stockQuantity = stockQuantity;
            return this;
        }

        public Builder setSellerId(String sellerId) {
            this.sellerId = sellerId;
            return this;
        }

        public Builder setAvailable(boolean available) {
            this.isAvailable = available;
            return this;
        }

        public Builder setRating(float rating) {
            this.rating = rating;
            return this;
        }

        public Builder setReviewCount(int reviewCount) {
            this.reviewCount = reviewCount;
            return this;
        }

        public Builder setStoreId(String storeId) {
            this.storeId = storeId;
            return this;
        }

        public Product build() {
            if (id == null || id.trim().isEmpty()) {
                throw new IllegalStateException("Product ID is required");
            }
            if (name == null || name.trim().isEmpty()) {
                throw new IllegalStateException("Name is required");
            }
            if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException("Price must be greater than 0");
            }
            if (storeId == null || storeId.trim().isEmpty()) {
                throw new IllegalStateException("Store ID is required");
            }
            return new Product(this);
        }
    }
}