package com.shipment.app.models;

import com.google.gson.annotations.SerializedName;

public class LoginRequest {
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