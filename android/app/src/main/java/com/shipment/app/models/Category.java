package com.shipment.app.models;

import android.os.Parcel;
import android.os.Parcelable;
import androidx.annotation.DrawableRes;
import androidx.annotation.NonNull;

public class Category implements Parcelable {
    private final String id;
    private final String name;
    private final String description;
    @DrawableRes
    private final int iconResId;
    private final int productCount;
    private final String imageUrl;

    private Category(Builder builder) {
        this.id = builder.id;
        this.name = builder.name;
        this.description = builder.description;
        this.iconResId = builder.iconResId;
        this.productCount = builder.productCount;
        this.imageUrl = builder.imageUrl;
    }

    protected Category(Parcel in) {
        id = in.readString();
        name = in.readString();
        description = in.readString();
        iconResId = in.readInt();
        productCount = in.readInt();
        imageUrl = in.readString();
    }

    public static final Creator<Category> CREATOR = new Creator<Category>() {
        @Override
        public Category createFromParcel(Parcel in) {
            return new Category(in);
        }

        @Override
        public Category[] newArray(int size) {
            return new Category[size];
        }
    };

    // Getters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    @DrawableRes
    public int getIconResId() { return iconResId; }
    public int getProductCount() { return productCount; }
    public String getImageUrl() { return imageUrl; }

    @Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(@NonNull Parcel dest, int flags) {
        dest.writeString(id);
        dest.writeString(name);
        dest.writeString(description);
        dest.writeInt(iconResId);
        dest.writeInt(productCount);
        dest.writeString(imageUrl);
    }

    // Builder
    public static class Builder {
        private String id;
        private String name;
        private String description;
        @DrawableRes
        private int iconResId;
        private int productCount;
        private String imageUrl;

        public Builder setId(String id) {
            this.id = id;
            return this;
        }

        public Builder setName(String name) {
            this.name = name;
            return this;
        }

        public Builder setDescription(String description) {
            this.description = description;
            return this;
        }

        public Builder setIconResId(@DrawableRes int iconResId) {
            this.iconResId = iconResId;
            return this;
        }

        public Builder setProductCount(int productCount) {
            this.productCount = productCount;
            return this;
        }

        public Builder setImageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
            return this;
        }

        public Category build() {
            return new Category(this);
        }
    }
}