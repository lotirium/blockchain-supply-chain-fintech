package com.shipment.app.utils;

import androidx.annotation.NonNull;
import java.util.concurrent.TimeUnit;
import retrofit2.Response;

public class RetryHelper {
    private static final int MAX_RETRIES = 3;
    private static final long BASE_DELAY_MS = 1000; // 1 second
    private static final long MAX_DELAY_MS = 10000; // 10 seconds

    public interface RetryableOperation<T> {
        Response<T> execute() throws Exception;
    }

    public static <T> Response<T> executeWithRetry(@NonNull RetryableOperation<T> operation) throws Exception {
        Exception lastException = null;
        
        for (int retryCount = 0; retryCount <= MAX_RETRIES; retryCount++) {
            try {
                Response<T> response = operation.execute();
                
                // Check for rate limiting
                if (response.code() == 429) {
                    String retryAfterHeader = response.headers().get("Retry-After");
                    long delayMs = calculateDelay(retryCount, retryAfterHeader);
                    
                    if (retryCount < MAX_RETRIES) {
                        Thread.sleep(delayMs);
                        continue;
                    }
                }
                
                return response;
            } catch (Exception e) {
                lastException = e;
                
                // Check if we should retry based on the exception
                if (shouldRetry(e) && retryCount < MAX_RETRIES) {
                    long delayMs = calculateDelay(retryCount, null);
                    Thread.sleep(delayMs);
                    continue;
                }
                
                throw e;
            }
        }
        
        // If we get here, we've exhausted our retries
        throw lastException != null ? lastException : 
            new Exception("Max retries exceeded without successful response");
    }

    private static boolean shouldRetry(Exception e) {
        String message = e.getMessage();
        if (message == null) return false;
        
        return message.contains("Failed to connect") ||
               message.contains("timeout") ||
               message.contains("Unable to resolve host") ||
               message.contains("ERR_INSUFFICIENT_RESOURCES") ||
               message.contains("ERR_RATE_LIMIT_EXCEEDED");
    }

    private static long calculateDelay(int retryCount, String retryAfterHeader) {
        if (retryAfterHeader != null) {
            try {
                return TimeUnit.SECONDS.toMillis(Long.parseLong(retryAfterHeader));
            } catch (NumberFormatException ignored) {
                // Fall back to exponential backoff
            }
        }
        
        // Calculate exponential backoff with jitter
        long delay = Math.min(
            BASE_DELAY_MS * (long) Math.pow(2, retryCount) + (long) (Math.random() * 1000),
            MAX_DELAY_MS
        );
        
        return delay;
    }
}