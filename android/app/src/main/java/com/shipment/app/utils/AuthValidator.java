package com.shipment.app.utils;

import android.text.TextUtils;
import com.shipment.app.api.requests.AuthRequest;
import java.util.HashMap;
import java.util.Map;

public class AuthValidator {
    public static class ValidationException extends Exception {
        public ValidationException(String message) {
            super(message);
        }
    }

    public static Map<String, Object> validateRegistrationData(AuthRequest.RegisterRequest userData) throws ValidationException {
        if (userData == null) {
            throw new ValidationException("Registration data is required");
        }

        // Basic validation for all users
        if (TextUtils.isEmpty(userData.getEmail())) {
            throw new ValidationException("Email is required");
        }
        if (TextUtils.isEmpty(userData.getPassword())) {
            throw new ValidationException("Password must be at least 8 characters");
        }
        if (TextUtils.isEmpty(userData.getUsername())) {
            throw new ValidationException("Username is required");
        }
        if (TextUtils.isEmpty(userData.getFirstName())) {
            throw new ValidationException("First name is required");
        }
        if (TextUtils.isEmpty(userData.getLastName())) {
            throw new ValidationException("Last name is required");
        }
        if (TextUtils.isEmpty(userData.getUserType())) {
            throw new ValidationException("User type is required");
        }

        // Keep both userType and role for proper validation
        String role = userData.getUserType().equals("buyer") ? "user" : "seller";

        // Validate seller store information
        if (userData.getUserType().equals("seller")) {
            if (userData.getStore() == null) {
                throw new ValidationException("Store information is required for sellers");
            }
            if (TextUtils.isEmpty(userData.getStore().getName())) {
                throw new ValidationException("Store name is required");
            }
            if (TextUtils.isEmpty(userData.getStore().getBusinessPhone())) {
                throw new ValidationException("Business phone is required");
            }
            if (TextUtils.isEmpty(userData.getStore().getBusinessAddress())) {
                throw new ValidationException("Business address is required");
            }
        }

        // Normalize and structure the data
        Map<String, Object> normalizedData = new HashMap<>();
        normalizedData.put("email", userData.getEmail().trim());
        normalizedData.put("password", userData.getPassword());
        normalizedData.put("username", userData.getUsername().trim());
        normalizedData.put("firstName", userData.getFirstName().trim());
        normalizedData.put("lastName", userData.getLastName().trim());
        normalizedData.put("role", role);
        normalizedData.put("userType", userData.getUserType());

        if (userData.getUserType().equals("seller") && userData.getStore() != null) {
            Map<String, Object> storeData = new HashMap<>();
            storeData.put("name", userData.getStore().getName().trim());
            storeData.put("description", !TextUtils.isEmpty(userData.getStore().getDescription()) ? 
                userData.getStore().getDescription().trim() : "");
            storeData.put("business_email", userData.getEmail().trim());
            storeData.put("business_phone", userData.getStore().getBusinessPhone().trim());
            storeData.put("business_address", userData.getStore().getBusinessAddress().trim());
            storeData.put("isVerified", false);
            storeData.put("status", "pending_verification");
            normalizedData.put("store", storeData);
        }

        return normalizedData;
    }

    public static void validateStoreData(Map<String, Object> storeData) throws ValidationException {
        if (storeData == null) {
            throw new ValidationException("Store data is required");
        }

        String name = (String) storeData.get("name");
        String businessPhone = (String) storeData.get("business_phone");
        String businessAddress = (String) storeData.get("business_address");

        if (TextUtils.isEmpty(name)) {
            throw new ValidationException("Store name is required");
        }
        if (TextUtils.isEmpty(businessPhone)) {
            throw new ValidationException("Business phone is required");
        }
        if (TextUtils.isEmpty(businessAddress)) {
            throw new ValidationException("Business address is required");
        }
    }
}