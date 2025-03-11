package com.shipment.app.models;

import com.google.gson.annotations.SerializedName;

public class RegisterRequest {
    @SerializedName("email")
    private final String email;

    @SerializedName("password")
    private final String password;

    @SerializedName("name")
    private final String name;

    @SerializedName("phone")
    private final String phone;

    @SerializedName("store_data")
    private final StoreData storeData;

    private RegisterRequest(Builder builder) {
        this.email = builder.email;
        this.password = builder.password;
        this.name = builder.name;
        this.phone = builder.phone;
        this.storeData = builder.storeData;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public String getName() {
        return name;
    }

    public String getPhone() {
        return phone;
    }

    public StoreData getStoreData() {
        return storeData;
    }

    public static class StoreData {
        @SerializedName("name")
        private final String name;

        @SerializedName("description")
        private final String description;

        @SerializedName("address")
        private final String address;

        @SerializedName("phone")
        private final String phone;

        @SerializedName("category")
        private final String category;

        private StoreData(StoreData.Builder builder) {
            this.name = builder.name;
            this.description = builder.description;
            this.address = builder.address;
            this.phone = builder.phone;
            this.category = builder.category;
        }

        public String getName() {
            return name;
        }

        public String getDescription() {
            return description;
        }

        public String getAddress() {
            return address;
        }

        public String getPhone() {
            return phone;
        }

        public String getCategory() {
            return category;
        }

        public static class Builder {
            private String name;
            private String description;
            private String address;
            private String phone;
            private String category;

            public Builder setName(String name) {
                this.name = name;
                return this;
            }

            public Builder setDescription(String description) {
                this.description = description;
                return this;
            }

            public Builder setAddress(String address) {
                this.address = address;
                return this;
            }

            public Builder setPhone(String phone) {
                this.phone = phone;
                return this;
            }

            public Builder setCategory(String category) {
                this.category = category;
                return this;
            }

            public StoreData build() {
                if (name == null || name.trim().isEmpty()) {
                    throw new IllegalStateException("Store name is required");
                }
                if (address == null || address.trim().isEmpty()) {
                    throw new IllegalStateException("Store address is required");
                }
                return new StoreData(this);
            }
        }
    }

    public static class Builder {
        private String email;
        private String password;
        private String name;
        private String phone;

        public Builder setEmail(String email) {
            this.email = email;
            return this;
        }

        public Builder setPassword(String password) {
            this.password = password;
            return this;
        }

        public Builder setName(String name) {
            this.name = name;
            return this;
        }

        public Builder setPhone(String phone) {
            this.phone = phone;
            return this;
        }

        private StoreData storeData;

        public Builder setStoreData(StoreData storeData) {
            this.storeData = storeData;
            return this;
        }

        public RegisterRequest build() {
            if (email == null || email.trim().isEmpty()) {
                throw new IllegalStateException("Email is required");
            }
            if (password == null || password.trim().isEmpty()) {
                throw new IllegalStateException("Password is required");
            }
            if (name == null || name.trim().isEmpty()) {
                throw new IllegalStateException("Name is required");
            }
            return new RegisterRequest(this);
        }
    }
}