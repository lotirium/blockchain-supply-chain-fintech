package com.shipment.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import java.math.BigDecimal;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;
import com.shipment.app.R;
import com.shipment.app.models.Order;
import com.shipment.app.models.OrderItem;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

public class OrdersAdapter extends ListAdapter<Order, OrdersAdapter.OrderViewHolder> {
    private final OnOrderClickListener listener;
    private final SimpleDateFormat displayFormat;
    private final SimpleDateFormat parseFormat;
    private final NumberFormat currencyFormatter;

    public OrdersAdapter(OnOrderClickListener listener) {
        super(new OrderDiffCallback());
        this.listener = listener;
        this.displayFormat = new SimpleDateFormat("MMMM dd, yyyy", Locale.getDefault());
        this.parseFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        this.currencyFormatter = NumberFormat.getCurrencyInstance(Locale.US);
    }

    @NonNull
    @Override
    public OrderViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_order, parent, false);
        return new OrderViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull OrderViewHolder holder, int position) {
        holder.bind(getItem(position));
    }

    class OrderViewHolder extends RecyclerView.ViewHolder {
        private final TextView orderNumber;
        private final TextView orderDate;
        private final TextView orderTotal;
        private final TextView itemsCount;
        private final TextView orderStatus;

        OrderViewHolder(@NonNull View itemView) {
            super(itemView);
            orderNumber = itemView.findViewById(R.id.order_number);
            orderDate = itemView.findViewById(R.id.order_date);
            orderTotal = itemView.findViewById(R.id.order_total);
            itemsCount = itemView.findViewById(R.id.items_count);
            orderStatus = itemView.findViewById(R.id.order_status);

            itemView.setOnClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION) {
                    listener.onOrderClick(getItem(position));
                }
            });
        }

        void bind(Order order) {
            // Display first item and additional items count if any
            List<OrderItem> items = order.getItems();
            if (!items.isEmpty()) {
                OrderItem firstItem = items.get(0);
                if (items.size() == 1) {
                    orderNumber.setText(itemView.getContext().getString(
                        R.string.order_items_format,
                        firstItem.getProduct().getName()
                    ));
                } else {
                    orderNumber.setText(itemView.getContext().getString(
                        R.string.order_items_with_more_format,
                        firstItem.getProduct().getName(),
                        items.size() - 1
                    ));
                }
            } else {
                orderNumber.setText(""); // Empty state
            }

            try {
                String dateStr = order.getCreatedAt();
                java.util.Date date = parseFormat.parse(dateStr);
                orderDate.setText(displayFormat.format(date));
            } catch (Exception e) {
                // If date parsing fails, display the raw date string
                orderDate.setText(order.getCreatedAt());
            }
            try {
                BigDecimal amount = new BigDecimal(order.getTotalFiatAmount());
                orderTotal.setText(currencyFormatter.format(amount));
            } catch (NumberFormatException e) {
                // If amount parsing fails, display raw amount
                orderTotal.setText(order.getTotalFiatAmount());
            }
            itemsCount.setText(itemView.getContext().getString(R.string.items_count, order.getItems().size()));

            // Set status with icon and background
            orderStatus.setText(getStatusString(order.getStatus()));
            orderStatus.setBackgroundResource(getStatusBackgroundResource(order.getStatus()));
            orderStatus.setCompoundDrawablesWithIntrinsicBounds(
                getStatusIconResource(order.getStatus()), 0, 0, 0);
        }

        private int getStatusBackgroundResource(String status) {
            switch (status.toLowerCase()) {
                case "pending":
                    return R.drawable.status_pending;
                case "confirmed":
                    return R.drawable.status_confirmed;
                case "processing":
                    return R.drawable.status_processing;
                case "packed":
                    return R.drawable.status_packed;
                case "shipped":
                    return R.drawable.status_shipped;
                case "delivered":
                    return R.drawable.status_delivered;
                case "cancelled":
                    return R.drawable.status_cancelled;
                case "refunded":
                    return R.drawable.status_cancelled;
                default:
                    return R.drawable.status_pending;
            }
        }

        private int getStatusIconResource(String status) {
            switch (status.toLowerCase()) {
                case "pending":
                    return R.drawable.ic_pending;
                case "confirmed":
                    return R.drawable.ic_confirmed;
                case "processing":
                    return R.drawable.ic_processing;
                case "packed":
                    return R.drawable.ic_packed;
                case "shipped":
                    return R.drawable.ic_shipped;
                case "delivered":
                    return R.drawable.ic_delivered;
                case "cancelled":
                    return R.drawable.ic_cancelled;
                case "refunded":
                    return R.drawable.ic_cancelled;
                default:
                    return R.drawable.ic_pending;
            }
        }

        private String getStatusString(String status) {
            switch (status.toLowerCase()) {
                case "pending":
                    return itemView.getContext().getString(R.string.status_pending);
                case "confirmed":
                    return itemView.getContext().getString(R.string.status_confirmed);
                case "processing":
                    return itemView.getContext().getString(R.string.status_processing);
                case "packed":
                    return itemView.getContext().getString(R.string.status_packed);
                case "shipped":
                    return itemView.getContext().getString(R.string.status_shipped);
                case "delivered":
                    return itemView.getContext().getString(R.string.status_delivered);
                case "cancelled":
                    return itemView.getContext().getString(R.string.status_cancelled);
                case "refunded":
                    return itemView.getContext().getString(R.string.status_refunded);
                default:
                    return itemView.getContext().getString(R.string.status_pending);
            }
        }
    }

    private static class OrderDiffCallback extends DiffUtil.ItemCallback<Order> {
        @Override
        public boolean areItemsTheSame(@NonNull Order oldItem, @NonNull Order newItem) {
            return oldItem.getId().equals(newItem.getId());
        }

        @Override
        public boolean areContentsTheSame(@NonNull Order oldItem, @NonNull Order newItem) {
            try {
                BigDecimal oldAmount = new BigDecimal(oldItem.getTotalFiatAmount());
                BigDecimal newAmount = new BigDecimal(newItem.getTotalFiatAmount());
                return oldItem.getStatus().equals(newItem.getStatus()) &&
                       oldAmount.compareTo(newAmount) == 0 &&
                       oldItem.getItems().size() == newItem.getItems().size();
            } catch (NumberFormatException e) {
                // If amount parsing fails, fall back to string comparison
                return oldItem.getStatus().equals(newItem.getStatus()) &&
                       oldItem.getTotalFiatAmount().equals(newItem.getTotalFiatAmount()) &&
                       oldItem.getItems().size() == newItem.getItems().size();
            }
        }
    }

    public interface OnOrderClickListener {
        void onOrderClick(Order order);
    }
}