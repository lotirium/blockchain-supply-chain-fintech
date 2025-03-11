package com.shipment.app.api.requests;

import androidx.annotation.NonNull;
import com.google.gson.annotations.SerializedName;
import java.util.Map;

public class AuthRequest {
    public static class LoginRequest {
        @SerializedName("email")
        private final String email;

        @SerializedName("password")
        private final String password;

        private LoginRequest(Builder builder) {
            this.email = builder.email;
            this.password = builder.password;
        }

        public String getEmail() {
            return email;
        }

        public String getPassword() {
            return password;
        }

        public static class Builder {
            private String email;
            private String password;

            public Builder setEmail(String email) {
                this.email = email;
                return this;
            }

            public Builder setPassword(String password) {
                this.password = password;
                return this;
            }

            public LoginRequest build() {
                if (email == null || email.trim().isEmpty()) {
                    throw new IllegalStateException("Email is required");
                }
                if (password == null || password.trim().isEmpty()) {
                    throw new IllegalStateException("Password is required");
                }
                return new LoginRequest(this);
            }
        }
    }

    public static class RegisterRequest {
        @SerializedName("email")
        private final String email;

        @SerializedName("password")
        private final String password;

        @SerializedName("username")
        private final String username;

        @SerializedName("first_name")
        private final String firstName;

        @SerializedName("last_name")
        private final String lastName;

        @SerializedName("user_type")
        private final String userType;

        @SerializedName("store")
        private final StoreData store;

        private RegisterRequest(Builder builder) {
            this.email = builder.email;
            this.password = builder.password;
            this.username = builder.username;
            this.firstName = builder.firstName;
            this.lastName = builder.lastName;
            this.userType = builder.userType;
            this.store = builder.store;
        }

        public String getEmail() {
            return email;
        }

        public String getPassword() {
            return password;
        }

        public String getUsername() {
            return username;
        }

        public String getFirstName() {
            return firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public String getUserType() {
            return userType;
        }

        public StoreData getStore() {
            return store;
        }

        public static class Builder {
            private String email;
            private String password;
            private String username;
            private String firstName;
            private String lastName;
            private String userType;
            private StoreData store;

            @NonNull
            public static Builder fromMap(@NonNull Map<String, Object> data) {
                Builder builder = new Builder();
                builder.setEmail((String) data.get("email"))
                      .setPassword((String) data.get("password"))
                      .setUsername((String) data.get("username"))
                      .setFirstName((String) data.get("first_name"))
                      .setLastName((String) data.get("last_name"))
                      .setUserType((String) data.get("user_type"));

                Map<String, Object> storeData = (Map<String, Object>) data.get("store");
                if (storeData != null) {
                    StoreData.Builder storeBuilder = new StoreData.Builder();
                    storeBuilder.setName((String) storeData.get("name"))
                              .setDescription((String) storeData.get("description"))
                              .setAddress((String) storeData.get("address"))
                              .setPhone((String) storeData.get("phone"))
                              .setBusinessPhone((String) storeData.get("business_phone"))
                              .setBusinessAddress((String) storeData.get("business_address"));
                    builder.setStore(storeBuilder.build());
                }

                return builder;
            }

            public Builder setEmail(String email) {
                this.email = email;
                return this;
            }

            public Builder setPassword(String password) {
                this.password = password;
                return this;
            }

            public Builder setUsername(String username) {
                this.username = username;
                return this;
            }

            public Builder setFirstName(String firstName) {
                this.firstName = firstName;
                return this;
            }

            public Builder setLastName(String lastName) {
                this.lastName = lastName;
                return this;
            }

            public Builder setUserType(String userType) {
                this.userType = userType;
                return this;
            }

            public Builder setStore(StoreData store) {
                this.store = store;
                return this;
            }

            public RegisterRequest build() {
                if (email == null || email.trim().isEmpty()) {
                    throw new IllegalStateException("Email is required");
                }
                if (password == null || password.trim().isEmpty()) {
                    throw new IllegalStateException("Password is required");
                }
                if (username == null || username.trim().isEmpty()) {
                    throw new IllegalStateException("Username is required");
                }
                if (firstName == null || firstName.trim().isEmpty()) {
                    throw new IllegalStateException("First name is required");
                }
                if (lastName == null || lastName.trim().isEmpty()) {
                    throw new IllegalStateException("Last name is required");
                }
                if (userType == null || userType.trim().isEmpty()) {
                    throw new IllegalStateException("User type is required");
                }
                if ("seller".equals(userType) && store == null) {
                    throw new IllegalStateException("Store details are required for seller accounts");
                }
                return new RegisterRequest(this);
            }
        }
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

        @SerializedName("business_phone")
        private final String businessPhone;

        @SerializedName("business_address")
        private final String businessAddress;

        private StoreData(Builder builder) {
            this.name = builder.name;
            this.description = builder.description;
            this.address = builder.address;
            this.phone = builder.phone;
            this.businessPhone = builder.businessPhone;
            this.businessAddress = builder.businessAddress;
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

        public String getBusinessPhone() {
            return businessPhone;
        }

        public String getBusinessAddress() {
            return businessAddress;
        }

        public static class Builder {
            private String name;
            private String description;
            private String address;
            private String phone;
            private String businessPhone;
            private String businessAddress;

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

            public Builder setBusinessPhone(String businessPhone) {
                this.businessPhone = businessPhone;
                return this;
            }

            public Builder setBusinessAddress(String businessAddress) {
                this.businessAddress = businessAddress;
                return this;
            }

            public StoreData build() {
                if (name == null || name.trim().isEmpty()) {
                    throw new IllegalStateException("Store name is required");
                }
                return new StoreData(this);
            }
        }
    }
}