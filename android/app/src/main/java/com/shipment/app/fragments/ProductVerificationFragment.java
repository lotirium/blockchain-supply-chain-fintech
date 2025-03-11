package com.shipment.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.fragment.NavHostFragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.button.MaterialButton;
import com.shipment.app.R;
import com.shipment.app.adapters.TimelineAdapter;
import com.shipment.app.api.responses.VerificationResponse;
import com.shipment.app.models.Order;
import com.shipment.app.models.Product;
import com.shipment.app.models.TimelineEvent;
import com.shipment.app.viewmodels.ProductVerificationViewModel;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class ProductVerificationFragment extends Fragment {
    private ProductVerificationViewModel viewModel;
    private View loadingIndicator;
    private View verificationContent;
    private View errorContent;
    private TextView verificationStatus;
    private TextView productName;
    private TextView manufacturer;
    private TextView storeName;
    private TextView tokenId;
    private TextView orderId;
    private TextView orderStatus;
    private TextView verificationTime;
    private TextView errorMessage;
    private RecyclerView timelineRecycler;
    private MaterialButton verifyAnotherButton;
    private MaterialButton tryAgainButton;

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        viewModel = new ViewModelProvider(this).get(ProductVerificationViewModel.class);
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                           @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_product_verification, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        initViews(view);
        setupObservers();
        handleArguments();
    }

    private void initViews(View view) {
        loadingIndicator = view.findViewById(R.id.loading_indicator);
        verificationContent = view.findViewById(R.id.verification_content);
        errorContent = view.findViewById(R.id.error_content);
        verificationStatus = view.findViewById(R.id.verification_status);
        productName = view.findViewById(R.id.product_name);
        manufacturer = view.findViewById(R.id.manufacturer);
        storeName = view.findViewById(R.id.store_name);
        tokenId = view.findViewById(R.id.token_id);
        orderId = view.findViewById(R.id.order_id);
        orderStatus = view.findViewById(R.id.order_status);
        verificationTime = view.findViewById(R.id.verification_time);
        errorMessage = view.findViewById(R.id.error_message);
        timelineRecycler = view.findViewById(R.id.timeline_recycler);
        
        timelineRecycler.setLayoutManager(new LinearLayoutManager(requireContext()));

        verifyAnotherButton = view.findViewById(R.id.verify_another_button);
        verifyAnotherButton.setOnClickListener(v -> navigateToScanner());

        tryAgainButton = view.findViewById(R.id.try_again_button);
        tryAgainButton.setOnClickListener(v -> navigateToScanner());
    }

    private void setupObservers() {
        viewModel.getIsLoading().observe(getViewLifecycleOwner(), this::updateLoadingState);
        viewModel.getError().observe(getViewLifecycleOwner(), this::showError);
        viewModel.getVerificationResult().observe(getViewLifecycleOwner(), this::displayVerificationResult);
    }

    private void handleArguments() {
        String qrData = ProductVerificationFragmentArgs.fromBundle(requireArguments()).getQrData();
        if (qrData != null && !qrData.isEmpty()) {
            viewModel.verifyProduct(qrData);
        } else {
            showError("Invalid QR code data");
        }
    }

    private void updateLoadingState(boolean isLoading) {
        loadingIndicator.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        verificationContent.setVisibility(View.GONE);
        errorContent.setVisibility(View.GONE);
    }

    private void showError(String error) {
        loadingIndicator.setVisibility(View.GONE);
        verificationContent.setVisibility(View.GONE);
        errorContent.setVisibility(View.VISIBLE);
        errorMessage.setText(error);
    }

    private void displayVerificationResult(VerificationResponse result) {
        if (result == null) {
            showError("Invalid verification response");
            return;
        }

        loadingIndicator.setVisibility(View.GONE);
        verificationContent.setVisibility(View.VISIBLE);
        errorContent.setVisibility(View.GONE);

        VerificationResponse.VerificationData data = result.getVerificationResult();
        if (data == null) {
            showError("Invalid verification data");
            return;
        }

        // Update status with appropriate background color
        verificationStatus.setText(data.isAuthentic() ? 
            R.string.product_authentic : R.string.product_invalid);
        verificationStatus.setBackgroundResource(data.isAuthentic() ? 
            R.color.success : R.color.error);

        // Set product details
        Product product = data.getProduct();
        if (product != null) {
            productName.setText(getString(R.string.product_name_format, product.getName()));
            manufacturer.setText(getString(R.string.manufacturer_format, product.getManufacturer()));
            
            // Handle blockchain status
            String blockchainStatus = product.getBlockchainStatus();
            if (blockchainStatus != null && blockchainStatus.equals("pending")) {
                tokenId.setText(R.string.token_pending);
                tokenId.setTextColor(getResources().getColor(R.color.warning, null));
            } else {
                tokenId.setText(getString(R.string.token_id_format, 
                    product.getTokenId() != null ? product.getTokenId() : getString(R.string.not_available)));
                tokenId.setTextColor(getResources().getColor(R.color.text_primary, null));
            }
        }

        // Set store name
        String store = data.getStore();
        if (store != null) {
            storeName.setText(getString(R.string.store_format, store));
        }

        // Set order details
        Order order = data.getOrder();
        if (order != null) {
            orderId.setText(getString(R.string.order_id_format, order.getId()));
            orderStatus.setText(getString(R.string.order_status_format, order.getStatus()));

            // Setup timeline
            List<TimelineEvent> timeline = order.getTimeline();
            if (timeline != null && !timeline.isEmpty()) {
                timelineRecycler.setAdapter(new TimelineAdapter(timeline));
            }
        }

        // Set verification time and NFT status
        SimpleDateFormat dateFormat = new SimpleDateFormat("MMM dd, yyyy HH:mm:ss", Locale.getDefault());
        try {
            SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            Date verifiedDate = isoFormat.parse(data.getVerifiedAt());
            verificationTime.setText(getString(R.string.verified_at_format, 
                dateFormat.format(verifiedDate)));

            // Add NFT verification status if available
            if (data.getNftData() != null) {
                if ("pending".equals(data.getNftData().getStatus())) {
                    TextView nftStatus = view.findViewById(R.id.nft_status);
                    nftStatus.setVisibility(View.VISIBLE);
                    nftStatus.setText(data.getNftData().getMessage());
                    nftStatus.setTextColor(getResources().getColor(R.color.warning, null));
                }
            }
        } catch (Exception e) {
            verificationTime.setText(getString(R.string.verified_at_format, "Unknown"));
        }
    }

    private void navigateToScanner() {
        NavHostFragment.findNavController(this)
                .navigate(R.id.action_product_verification_to_qr_scanner);
    }
}