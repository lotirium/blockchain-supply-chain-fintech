package com.shipment.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.ProgressBar;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.List;
import java.util.stream.Collectors;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.snackbar.Snackbar;
import com.shipment.app.R;
import com.shipment.app.adapters.OrderSummaryAdapter;
import androidx.navigation.fragment.NavHostFragment;
import com.google.android.material.button.MaterialButton;
import com.shipment.app.models.Order;
import com.shipment.app.models.OrderItem;
import com.shipment.app.models.OrderSummaryItem;
import com.shipment.app.models.Address;
import com.shipment.app.viewmodels.OrderDetailsViewModel;
import java.text.SimpleDateFormat;
import java.util.Locale;

public class OrderDetailsFragment extends Fragment {
    private OrderDetailsViewModel viewModel;
    private OrderSummaryAdapter adapter;
    private TextView orderNumber;
    private TextView orderDate;
    private TextView orderStatus;
    private TextView shippingName;
    private TextView shippingAddress;
    private TextView shippingPhone;
    private TextView shippingEmail;
    private TextView subtotalText;
    private TextView shippingCostText;
    private TextView totalText;
    private RecyclerView orderItemsRecycler;
    private ProgressBar loadingIndicator;
    private MaterialButton scanQrButton;
    private final NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(Locale.US);

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        viewModel = new ViewModelProvider(this, 
            ViewModelProvider.AndroidViewModelFactory.getInstance(requireActivity().getApplication()))
            .get(OrderDetailsViewModel.class);
        adapter = new OrderSummaryAdapter();
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                           @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_order_details, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        initViews(view);
        setupRecyclerView();
        observeViewModel();
        loadOrderDetails();
        setupQrScanner();
    }

    private void initViews(View view) {
        orderNumber = view.findViewById(R.id.order_number);
        orderDate = view.findViewById(R.id.order_date);
        orderStatus = view.findViewById(R.id.order_status);
        shippingName = view.findViewById(R.id.shipping_name);
        shippingAddress = view.findViewById(R.id.shipping_address);
        shippingPhone = view.findViewById(R.id.shipping_phone);
        shippingEmail = view.findViewById(R.id.shipping_email);
        subtotalText = view.findViewById(R.id.subtotal_text);
        shippingCostText = view.findViewById(R.id.shipping_cost_text);
        totalText = view.findViewById(R.id.total_text);
        orderItemsRecycler = view.findViewById(R.id.order_items_recycler);
        loadingIndicator = view.findViewById(R.id.loading_indicator);
        scanQrButton = view.findViewById(R.id.scan_qr_button);
    }

    private void setupRecyclerView() {
        orderItemsRecycler.setLayoutManager(new LinearLayoutManager(requireContext()));
        orderItemsRecycler.setAdapter(adapter);
    }

    private void setupQrScanner() {
        // Show QR scanner button for buyers to verify products
        scanQrButton.setVisibility(View.VISIBLE);
        scanQrButton.setOnClickListener(v -> 
            NavHostFragment.findNavController(this)
                .navigate(R.id.action_order_details_to_qr_scanner));
    }

    private String getStatusString(String status) {
        switch (status.toLowerCase()) {
            case "pending":
                return getString(R.string.status_pending);
            case "processing":
                return getString(R.string.status_processing);
            case "shipped":
                return getString(R.string.status_shipped);
            case "delivered":
                return getString(R.string.status_delivered);
            case "cancelled":
                return getString(R.string.status_cancelled);
            default:
                return getString(R.string.status_pending);
        }
    }

    private void observeViewModel() {
        viewModel.getOrder().observe(getViewLifecycleOwner(), this::displayOrderDetails);
        viewModel.getIsLoading().observe(getViewLifecycleOwner(), this::updateLoadingState);
        viewModel.getError().observe(getViewLifecycleOwner(), this::showError);
    }

    private void loadOrderDetails() {
        String orderId = requireArguments().getString("orderId");
        if (orderId != null) {
            viewModel.loadOrderDetails(orderId);
        }
    }

    private List<OrderSummaryItem> convertToSummaryItems(List<OrderItem> items) {
        return items.stream()
            .map(item -> new OrderSummaryItem.Builder()
                .setProductId(item.getProduct().getId())
                .setName(item.getProduct().getName())
                .setPrice(item.getUnitPrice())
                .setImageUrl(item.getProduct().getImageUrl())
                .setQuantity(item.getQuantity())
                .build())
            .collect(Collectors.toList());
    }

    private void displayOrderDetails(Order order) {
        if (order == null) return;

        orderNumber.setText(getString(R.string.order_number_format, order.getId()));

        SimpleDateFormat displayFormat = new SimpleDateFormat("MMMM dd, yyyy", Locale.getDefault());
        SimpleDateFormat parseFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        try {
            java.util.Date date = parseFormat.parse(order.getCreatedAt());
            orderDate.setText(displayFormat.format(date));
        } catch (Exception e) {
            // If date parsing fails, display the raw date string
            orderDate.setText(order.getCreatedAt());
        }

        updateOrderStatus(order.getStatus());

        // Hide shipping info since it's not available in current model
        shippingName.setVisibility(View.GONE);
        shippingAddress.setVisibility(View.GONE);
        shippingPhone.setVisibility(View.GONE);
        shippingEmail.setVisibility(View.GONE);

        adapter.submitList(convertToSummaryItems(order.getItems()));

        // Use total_fiat_amount directly since shipping cost is not available
        BigDecimal totalAmount = new BigDecimal(order.getTotalFiatAmount());
        subtotalText.setText(currencyFormatter.format(totalAmount));
        shippingCostText.setVisibility(View.GONE);
        totalText.setText(currencyFormatter.format(totalAmount));
    }

    private void updateOrderStatus(String status) {
        orderStatus.setText(getStatusString(status));
        orderStatus.setBackgroundResource(getStatusBackgroundResource(status));
        orderStatus.setCompoundDrawablesWithIntrinsicBounds(getStatusIconResource(status), 0, 0, 0);
        orderStatus.setCompoundDrawablePadding(getResources().getDimensionPixelSize(R.dimen.spacing_small));
    }

    private int getStatusBackgroundResource(String status) {
        switch (status.toLowerCase()) {
            case "pending":
                return R.drawable.status_pending;
            case "processing":
                return R.drawable.status_processing;
            case "shipped":
                return R.drawable.status_shipped;
            case "delivered":
                return R.drawable.status_delivered;
            case "cancelled":
                return R.drawable.status_cancelled;
            default:
                return R.drawable.status_pending;
        }
    }

    private int getStatusIconResource(String status) {
        switch (status.toLowerCase()) {
            case "pending":
                return R.drawable.ic_pending;
            case "processing":
                return R.drawable.ic_processing;
            case "shipped":
                return R.drawable.ic_shipped;
            case "delivered":
                return R.drawable.ic_delivered;
            case "cancelled":
                return R.drawable.ic_cancelled;
            default:
                return R.drawable.ic_pending;
        }
    }

    private void updateLoadingState(boolean isLoading) {
        loadingIndicator.setVisibility(isLoading ? View.VISIBLE : View.GONE);
    }

    private void showError(String error) {
        if (error != null && !error.isEmpty() && getView() != null) {
            Snackbar.make(getView(), error, Snackbar.LENGTH_LONG).show();
        }
    }
}