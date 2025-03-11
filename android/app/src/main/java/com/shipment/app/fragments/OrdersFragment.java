package com.shipment.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.fragment.NavHostFragment;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.google.android.material.snackbar.Snackbar;
import com.shipment.app.R;
import com.shipment.app.adapters.OrdersAdapter;
import com.shipment.app.models.Order;
import com.shipment.app.viewmodels.OrdersViewModel;
import com.shipment.app.viewmodels.OrdersViewModelFactory;

public class OrdersFragment extends Fragment implements OrdersAdapter.OnOrderClickListener {
    private OrdersViewModel viewModel;
    private OrdersAdapter adapter;
    private SwipeRefreshLayout swipeRefresh;
    private RecyclerView ordersRecycler;
    private LinearLayout emptyView;
    private ProgressBar loadingIndicator;

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        OrdersViewModelFactory factory = new OrdersViewModelFactory();
        viewModel = new ViewModelProvider(this, factory).get(OrdersViewModel.class);
        adapter = new OrdersAdapter(this);
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                           @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_orders, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        initViews(view);
        setupRecyclerView();
        observeViewModel();
    }

    private void initViews(View view) {
        swipeRefresh = view.findViewById(R.id.swipe_refresh);
        ordersRecycler = view.findViewById(R.id.orders_recycler);
        emptyView = view.findViewById(R.id.empty_view);
        loadingIndicator = view.findViewById(R.id.loading_indicator);

        swipeRefresh.setOnRefreshListener(() -> {
            viewModel.refresh();
            swipeRefresh.setRefreshing(false);
        });
    }

    private void setupRecyclerView() {
        ordersRecycler.setAdapter(adapter);
    }

    private void observeViewModel() {
        viewModel.getOrders().observe(getViewLifecycleOwner(), orders -> {
            adapter.submitList(orders);
            updateEmptyState(orders == null || orders.isEmpty());
        });

        viewModel.getIsLoading().observe(getViewLifecycleOwner(), this::updateLoadingState);
        viewModel.getError().observe(getViewLifecycleOwner(), this::showError);
    }

    private void updateEmptyState(boolean isEmpty) {
        if (isEmpty) {
            emptyView.setVisibility(View.VISIBLE);
            ordersRecycler.setVisibility(View.GONE);
        } else {
            emptyView.setVisibility(View.GONE);
            ordersRecycler.setVisibility(View.VISIBLE);
        }
    }

    private void updateLoadingState(boolean isLoading) {
        loadingIndicator.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        if (isLoading) {
            emptyView.setVisibility(View.GONE);
            ordersRecycler.setVisibility(View.GONE);
        }
    }

    private void showError(String error) {
        if (error != null && !error.isEmpty() && getView() != null) {
            Snackbar.make(getView(), error, Snackbar.LENGTH_LONG)
                .setAction(R.string.retry, v -> viewModel.refresh())
                .show();
        }
    }

    @Override
    public void onOrderClick(Order order) {
        Bundle args = new Bundle();
        args.putString("orderId", order.getId());
        NavHostFragment.findNavController(this)
            .navigate(R.id.action_orders_to_order_details, args);
    }
}