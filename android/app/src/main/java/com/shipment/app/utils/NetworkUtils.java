package com.shipment.app.utils;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.os.Build;
import androidx.annotation.NonNull;
import com.shipment.app.BuildConfig;
import okhttp3.Interceptor;
import okhttp3.logging.HttpLoggingInterceptor;
import java.io.IOException;

public class NetworkUtils {
    private static final String TAG = "NetworkUtils";

    public static HttpLoggingInterceptor getLoggingInterceptor() {
        HttpLoggingInterceptor interceptor = new HttpLoggingInterceptor();
        if (BuildConfig.DEBUG) {
            interceptor.setLevel(HttpLoggingInterceptor.Level.BODY);
        } else {
            interceptor.setLevel(HttpLoggingInterceptor.Level.NONE);
        }
        return interceptor;
    }

    public static Interceptor getRetryInterceptor() {
        return new Interceptor() {
            @Override
            public okhttp3.Response intercept(@NonNull Chain chain) throws IOException {
                okhttp3.Request request = chain.request();
                okhttp3.Response response = chain.proceed(request);
                int tryCount = 0;
                int maxLimit = 3;

                while (!response.isSuccessful() && tryCount < maxLimit) {
                    tryCount++;
                    response.close();
                    response = chain.proceed(request);
                }
                return response;
            }
        };
    }

    public static boolean isNetworkAvailable(Context context) {
        if (context == null) return false;
        
        ConnectivityManager connectivityManager = (ConnectivityManager) 
            context.getSystemService(Context.CONNECTIVITY_SERVICE);
        
        if (connectivityManager == null) return false;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            NetworkCapabilities capabilities = connectivityManager
                .getNetworkCapabilities(connectivityManager.getActiveNetwork());
            
            if (capabilities == null) return false;

            return capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                   capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                   capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET);
        } else {
            NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
            return activeNetworkInfo != null && activeNetworkInfo.isConnected();
        }
    }

    public static String getErrorMessage(Throwable throwable) {
        if (throwable == null || throwable.getMessage() == null) {
            return "Unknown error occurred";
        }

        String message = throwable.getMessage().toLowerCase();
        if (message.contains("timeout")) {
            return "Request timed out. Please try again.";
        } else if (message.contains("unable to resolve host")) {
            return "No internet connection. Please check your network.";
        } else if (message.contains("canceled")) {
            return "Request was canceled";
        } else {
            return throwable.getMessage();
        }
    }

    public static class NoConnectivityException extends IOException {
        @Override
        public String getMessage() {
            return "No internet connection";
        }
    }
}