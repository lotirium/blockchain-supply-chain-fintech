package com.shipment.app.models;

import android.os.Parcel;
import android.os.Parcelable;
import androidx.annotation.NonNull;
import java.util.HashMap;
import java.util.Map;

public class Address implements Parcelable {
    private String street;
    private String city;
    private String state;
    private String zip;
    private String country;
    private String fullName;
    private String phone;
    private String email;

    private Address(Builder builder) {
        this.street = builder.street;
        this.city = builder.city;
        this.state = builder.state;
        this.zip = builder.zip;
        this.country = builder.country;
        this.fullName = builder.fullName;
        this.phone = builder.phone;
        this.email = builder.email;
    }

    protected Address(Parcel in) {
        street = in.readString();
        city = in.readString();
        state = in.readString();
        zip = in.readString();
        country = in.readString();
        fullName = in.readString();
        phone = in.readString();
        email = in.readString();
    }

    public static final Creator<Address> CREATOR = new Creator<Address>() {
        @Override
        public Address createFromParcel(Parcel in) {
            return new Address(in);
        }

        @Override
        public Address[] newArray(int size) {
            return new Address[size];
        }
    };

    @NonNull
    public String getStreet() {
        return street;
    }

    @NonNull
    public String getCity() {
        return city;
    }

    @NonNull
    public String getState() {
        return state;
    }

    @NonNull
    public String getZip() {
        return zip;
    }

    @NonNull
    public String getCountry() {
        return country;
    }

    @NonNull
    public String getFullName() {
        return fullName != null ? fullName : "";
    }

    @NonNull
    public String getPhone() {
        return phone != null ? phone : "";
    }

    @NonNull
    public String getEmail() {
        return email != null ? email : "";
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("street", street);
        map.put("city", city);
        map.put("state", state);
        map.put("zip", zip);
        map.put("country", country);
        map.put("fullName", fullName);
        map.put("phone", phone);
        map.put("email", email);
        return map;
    }

    @Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(@NonNull Parcel dest, int flags) {
        dest.writeString(street);
        dest.writeString(city);
        dest.writeString(state);
        dest.writeString(zip);
        dest.writeString(country);
        dest.writeString(fullName);
        dest.writeString(phone);
        dest.writeString(email);
    }

    public static class Builder {
        private String street;
        private String city;
        private String state;
        private String zip;
        private String country;
        private String fullName;
        private String phone;
        private String email;

        public Builder setStreet(String street) {
            this.street = street;
            return this;
        }

        public Builder setCity(String city) {
            this.city = city;
            return this;
        }

        public Builder setState(String state) {
            this.state = state;
            return this;
        }

        public Builder setZip(String zip) {
            this.zip = zip;
            return this;
        }

        public Builder setCountry(String country) {
            this.country = country;
            return this;
        }

        public Builder setFullName(String fullName) {
            this.fullName = fullName;
            return this;
        }

        public Builder setPhone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder setEmail(String email) {
            this.email = email;
            return this;
        }

        public Address build() {
            return new Address(this);
        }

        public static Builder fromMap(Map<String, Object> map) {
            Builder builder = new Builder();
            if (map.containsKey("street")) {
                builder.setStreet((String) map.get("street"));
            }
            if (map.containsKey("city")) {
                builder.setCity((String) map.get("city"));
            }
            if (map.containsKey("state")) {
                builder.setState((String) map.get("state"));
            }
            if (map.containsKey("zip")) {
                builder.setZip((String) map.get("zip"));
            }
            if (map.containsKey("country")) {
                builder.setCountry((String) map.get("country"));
            }
            if (map.containsKey("fullName")) {
                builder.setFullName((String) map.get("fullName"));
            }
            if (map.containsKey("phone")) {
                builder.setPhone((String) map.get("phone"));
            }
            if (map.containsKey("email")) {
                builder.setEmail((String) map.get("email"));
            }
            return builder;
        }
    }
}