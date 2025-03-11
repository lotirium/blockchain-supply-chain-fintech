package com.shipment.app.viewmodels;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import com.shipment.app.api.ApiService;
import com.shipment.app.api.responses.VerificationResponse;
import java.util.HashMap;
import java.util.Map;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ProductVerificationViewModel extends AndroidViewModel {
    private final MutableLiveData<Boolean> isLoading = new MutableLiveData<>(false);
    private final MutableLiveData<String> error = new MutableLiveData<>();
    private final MutableLiveData<VerificationResponse> verificationResult = new MutableLiveData<>();
    private final ApiService apiService;

    public ProductVerificationViewModel(@NonNull Application application) {
        super(application);
        apiService = ApiService.getInstance();
    }

    public LiveData<Boolean> getIsLoading() {
        return isLoading;
    }

    public LiveData<String> getError() {
        return error;
    }

    public LiveData<VerificationResponse> getVerificationResult() {
        return verificationResult;
    }

    public void verifyProduct(String qrData) {
        isLoading.setValue(true);
        error.setValue(null);

        Map<String, String> requestData = new HashMap<>();
        requestData.put("qrData", qrData);
        
        apiService.verifyQRCode(requestData).enqueue(new Callback<VerificationResponse>() {
            @Override
            public void onResponse(@NonNull Call<VerificationResponse> call,
                                 @NonNull Response<VerificationResponse> response) {
                isLoading.setValue(false);
                if (response.isSuccessful() && response.body() != null) {
                    VerificationResponse data = response.body();
                    verificationResult.setValue(data);
                    if (!data.isSuccess()) {
                        error.setValue(data.getMessage());
                    }
                } else {
                    error.setValue("Failed to verify product. Please try again.");
                }
            }

            @Override
            public void onFailure(@NonNull Call<VerificationResponse> call, @NonNull Throwable t) {
                isLoading.setValue(false);
                error.setValue("Network error. Please check your connection and try again.");
            }
        });
    }


}