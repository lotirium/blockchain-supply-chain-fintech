package com.shipment.app.utils;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * A generic class that holds a value with its loading status.
 * @param <T> Type of the resource data
 */
public class Resource<T> {
    @NonNull
    private final Status status;
    
    @Nullable
    private final T data;
    
    @Nullable
    private final String message;

    public enum Status {
        SUCCESS,
        ERROR,
        LOADING
    }

    private Resource(@NonNull Status status, @Nullable T data, @Nullable String message) {
        this.status = status;
        this.data = data;
        this.message = message;
    }

    public static <T> Resource<T> success(@Nullable T data) {
        return new Resource<>(Status.SUCCESS, data, null);
    }

    public static <T> Resource<T> error(String msg, @Nullable T data) {
        return new Resource<>(Status.ERROR, data, msg);
    }

    public static <T> Resource<T> loading(@Nullable T data) {
        return new Resource<>(Status.LOADING, data, null);
    }

    @NonNull
    public Status getStatus() {
        return status;
    }

    @Nullable
    public T getData() {
        return data;
    }

    @Nullable
    public String getMessage() {
        return message;
    }

    public boolean isSuccess() {
        return status == Status.SUCCESS;
    }

    public boolean isLoading() {
        return status == Status.LOADING;
    }

    public boolean isError() {
        return status == Status.ERROR;
    }

    /**
     * Helper method to handle the resource state with a callback interface
     */
    public void handle(ResourceCallback<T> callback) {
        switch (status) {
            case SUCCESS:
                if (data != null) {
                    callback.onSuccess(data);
                }
                break;
            case ERROR:
                callback.onError(message);
                break;
            case LOADING:
                callback.onLoading();
                break;
        }
    }

    /**
     * Callback interface for handling resource states
     */
    public interface ResourceCallback<T> {
        void onSuccess(T data);
        void onError(String message);
        void onLoading();
    }
}