package com.shipment.app.api.responses;

import com.google.gson.annotations.SerializedName;
import com.shipment.app.models.Product;
import com.shipment.app.models.Order;
import java.util.List;

public class VerificationResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("message")
    private String message;

    @SerializedName("data")
    private DataWrapper data;

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public VerificationData getVerificationResult() {
        return data != null ? data.verificationResult : null;
    }

    public static class DataWrapper {
        @SerializedName("verificationResult")
        private VerificationData verificationResult;
    }

    public static class VerificationData {
        @SerializedName("isAuthentic")
        private boolean isAuthentic;

        @SerializedName("verifiedAt")
        private String verifiedAt;

        @SerializedName("product")
        private Product product;

        @SerializedName("store")
        private String store;

        @SerializedName("order")
        private Order order;

        @SerializedName("nftData")
        private NFTData nftData;

        public boolean isAuthentic() {
            return isAuthentic;
        }

        public String getVerifiedAt() {
            return verifiedAt;
        }

        public Product getProduct() {
            return product;
        }

        public String getStore() {
            return store;
        }

        public Order getOrder() {
            return order;
        }

        public NFTData getNftData() {
            return nftData;
        }

        public static class NFTData {
            @SerializedName("status")
            private String status;

            @SerializedName("message")
            private String message;

            @SerializedName("metadata")
            private NFTMetadataInfo metadata;

            public String getStatus() {
                return status;
            }

            public String getMessage() {
                return message;
            }

            public NFTMetadataInfo getMetadata() {
                return metadata;
            }
        }

        public static class NFTMetadataInfo {
            @SerializedName("tokenAddress")
            private String tokenAddress;

            @SerializedName("mintedAt")
            private long mintedAt;

            @SerializedName("attributes")
            private List<NFTAttribute> attributes;

            public String getTokenAddress() {
                return tokenAddress;
            }

            public long getMintedAt() {
                return mintedAt;
            }

            public List<NFTAttribute> getAttributes() {
                return attributes;
            }
        }

        public static class NFTAttribute {
            @SerializedName("traitType")
            private String traitType;

            @SerializedName("value")
            private String value;

            public String getTraitType() {
                return traitType;
            }

            public String getValue() {
                return value;
            }
        }
    }
}