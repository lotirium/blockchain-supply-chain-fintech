package com.shipment.app.models;

import android.os.Parcel;
import android.os.Parcelable;
import androidx.annotation.NonNull;
import com.google.gson.annotations.SerializedName;
import java.util.ArrayList;
import java.util.List;

public class OrderItem implements Parcelable {
    @SerializedName("quantity")
    private int quantity;

    @SerializedName("unit_price")
    private String unitPrice;

    @SerializedName("total_price")
    private String totalPrice;

    @SerializedName("product")
    private Product product;

    public OrderItem() {
        // Required empty constructor
    }

    protected OrderItem(Parcel in) {
        quantity = in.readInt();
        unitPrice = in.readString();
        totalPrice = in.readString();
        product = in.readParcelable(Product.class.getClassLoader());
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeInt(quantity);
        dest.writeString(unitPrice);
        dest.writeString(totalPrice);
        dest.writeParcelable(product, flags);
    }

    @Override
    public int describeContents() {
        return 0;
    }

    public static final Creator<OrderItem> CREATOR = new Creator<OrderItem>() {
        @Override
        public OrderItem createFromParcel(Parcel in) {
            return new OrderItem(in);
        }

        @Override
        public OrderItem[] newArray(int size) {
            return new OrderItem[size];
        }
    };

    // Getters and setters
    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public String getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(String unitPrice) {
        this.unitPrice = unitPrice;
    }

    public String getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(String totalPrice) {
        this.totalPrice = totalPrice;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public static class Product implements Parcelable {
        @SerializedName("id")
        private String id;

        @SerializedName("name")
        private String name;

        @SerializedName("description")
        private String description;

        @SerializedName("images")
        private List<String> images;

        public Product() {
            images = new ArrayList<>();
        }

        protected Product(Parcel in) {
            id = in.readString();
            name = in.readString();
            description = in.readString();
            images = new ArrayList<>();
            in.readStringList(images);
        }

        @Override
        public void writeToParcel(Parcel dest, int flags) {
            dest.writeString(id);
            dest.writeString(name);
            dest.writeString(description);
            dest.writeStringList(images);
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

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public List<String> getImages() {
            return images;
        }

        public void setImages(List<String> images) {
            this.images = images != null ? images : new ArrayList<>();
        }

        public String getImageUrl() {
            return !images.isEmpty() ? "http://192.168.0.9:3001" + images.get(0) : null;
        }
    }
}