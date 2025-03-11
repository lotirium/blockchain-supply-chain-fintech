package com.shipment.app.api.responses;

import androidx.annotation.NonNull;
import com.google.gson.annotations.SerializedName;

public class AuthResponse {
    @SerializedName("token")
    private String token;

    @SerializedName("id")
    private String id;

    @SerializedName("email")
    private String email;

    @SerializedName("username")
    private String username;

    @SerializedName("firstName")
    private String firstName;

    @SerializedName("lastName")
    private String lastName;

    @SerializedName("role")
    private String role;

    @SerializedName("type")
    private String userType;

    @SerializedName("walletAddress")
    private String walletAddress;

    @SerializedName("lastLogin")
    private String lastLogin;

    @SerializedName("store")
    private StoreData store;

    public String getToken() {
        return token;
    }

    public String getId() {
        return id;
    }

    public String getEmail() {
        return email;
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

    public String getRole() {
        return role;
    }

    public String getUserType() {
        // Map role to userType for web compatibility
        return userType != null ? userType : role;
    }

    public String getWalletAddress() {
        return walletAddress;
    }

    public String getLastLogin() {
        return lastLogin;
    }

    public StoreData getStore() {
        return store;
    }

    // For backward compatibility with existing code
    public UserData getUser() {
        return new UserData(this);
    }

    // Inner class for backward compatibility
    public static class UserData {
        private final AuthResponse parent;

        private UserData(AuthResponse parent) {
            this.parent = parent;
        }

        public String getId() {
            return parent.getId();
        }

        public String getEmail() {
            return parent.getEmail();
        }

        public String getFirstName() {
            return parent.getFirstName();
        }

        public String getLastName() {
            return parent.getLastName();
        }

        public String getName() {
            return parent.getUsername();
        }

        public String getRole() {
            return parent.getRole();
        }

        public String getUserType() {
            return parent.getUserType();
        }

        public StoreData getStore() {
            return parent.getStore();
        }
    }

    public static class StoreData {
        @SerializedName("id")
        private String id;

        @SerializedName("name")
        private String name;

        @SerializedName("description")
        private String description;

        @SerializedName("status")
        private String status;

        @SerializedName("business_phone")
        private String businessPhone;

        @SerializedName("business_address")
        private String businessAddress;

        @SerializedName("created_at")
        private String createdAt;

        @SerializedName("updated_at")
        private String updatedAt;

        @SerializedName("is_verified")
        private boolean isVerified;

        @SerializedName("business_email")
        private String businessEmail;

        @SerializedName("hologram_label")
        private String hologramLabel;

        @SerializedName("wallet_address")
        private String walletAddress;

        public String getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getDescription() {
            return description;
        }

        public String getStatus() {
            return status;
        }

        public String getBusinessPhone() {
            return businessPhone;
        }

        public String getBusinessAddress() {
            return businessAddress;
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public String getUpdatedAt() {
            return updatedAt;
        }

        public boolean isVerified() {
            return isVerified;
        }

        public String getBusinessEmail() {
            return businessEmail;
        }

        public String getHologramLabel() {
            return hologramLabel;
        }

        public String getWalletAddress() {
            return walletAddress;
        }
    }
}