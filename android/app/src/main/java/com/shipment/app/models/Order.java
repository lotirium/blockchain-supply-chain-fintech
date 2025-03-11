package com.shipment.app.models;

import android.os.Parcel;
import android.os.Parcelable;
import androidx.annotation.NonNull;
import com.google.gson.annotations.SerializedName;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.math.BigDecimal;
import com.shipment.app.models.TimelineEvent;

public class Order implements Parcelable {
    @SerializedName("id")
    private String id;

    @SerializedName("status")
    private String status;

    @SerializedName("total_fiat_amount")
    private String totalFiatAmount;

    @SerializedName("items")
    private List<OrderItem> items;

    @SerializedName("merchantStore")
    private Store store;

    @SerializedName("orderPlacer")
    private User user;

    @SerializedName("created_at")
    private String createdAt;

    @SerializedName("updated_at")
    private String updatedAt;

    @SerializedName("timeline")
    private List<TimelineEvent> timeline;

    public Order() {
        // Required empty constructor
    }

    protected Order(Parcel in) {
        id = in.readString();
        status = in.readString();
        totalFiatAmount = in.readString();
        items = in.createTypedArrayList(OrderItem.CREATOR);
        store = in.readParcelable(Store.class.getClassLoader());
        user = in.readParcelable(User.class.getClassLoader());
        createdAt = in.readString();
        updatedAt = in.readString();
        timeline = in.createTypedArrayList(TimelineEvent.CREATOR);
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeString(id);
        dest.writeString(status);
        dest.writeString(totalFiatAmount);
        dest.writeTypedList(items);
        dest.writeParcelable(store, flags);
        dest.writeParcelable(user, flags);
        dest.writeString(createdAt);
        dest.writeString(updatedAt);
        dest.writeTypedList(timeline);
    }

    @Override
    public int describeContents() {
        return 0;
    }

    public static final Creator<Order> CREATOR = new Creator<Order>() {
        @Override
        public Order createFromParcel(Parcel in) {
            return new Order(in);
        }

        @Override
        public Order[] newArray(int size) {
            return new Order[size];
        }
    };

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTotalFiatAmount() {
        return totalFiatAmount;
    }

    public void setTotalFiatAmount(String totalFiatAmount) {
        this.totalFiatAmount = totalFiatAmount;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items;
    }

    public Store getStore() {
        return store;
    }

    public void setStore(Store store) {
        this.store = store;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<TimelineEvent> getTimeline() {
        return timeline;
    }

    public void setTimeline(List<TimelineEvent> timeline) {
        this.timeline = timeline;
    }

    public static class Store implements Parcelable {
        @SerializedName("id")
        private String id;

        @SerializedName("name")
        private String name;

        public Store() {}

        protected Store(Parcel in) {
            id = in.readString();
            name = in.readString();
        }

        @Override
        public void writeToParcel(Parcel dest, int flags) {
            dest.writeString(id);
            dest.writeString(name);
        }

        @Override
        public int describeContents() {
            return 0;
        }

        public static final Creator<Store> CREATOR = new Creator<Store>() {
            @Override
            public Store createFromParcel(Parcel in) {
                return new Store(in);
            }

            @Override
            public Store[] newArray(int size) {
                return new Store[size];
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
    }

    public static class User implements Parcelable {
        @SerializedName("id")
        private String id;

        @SerializedName("first_name")
        private String firstName;

        @SerializedName("last_name")
        private String lastName;

        @SerializedName("email")
        private String email;

        public User() {}

        protected User(Parcel in) {
            id = in.readString();
            firstName = in.readString();
            lastName = in.readString();
            email = in.readString();
        }

        @Override
        public void writeToParcel(Parcel dest, int flags) {
            dest.writeString(id);
            dest.writeString(firstName);
            dest.writeString(lastName);
            dest.writeString(email);
        }

        @Override
        public int describeContents() {
            return 0;
        }

        public static final Creator<User> CREATOR = new Creator<User>() {
            @Override
            public User createFromParcel(Parcel in) {
                return new User(in);
            }

            @Override
            public User[] newArray(int size) {
                return new User[size];
            }
        };

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public void setLastName(String lastName) {
            this.lastName = lastName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }
}