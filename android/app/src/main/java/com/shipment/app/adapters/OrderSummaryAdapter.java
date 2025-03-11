package com.shipment.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;
import com.bumptech.glide.Glide;
import com.shipment.app.R;
import com.shipment.app.models.OrderSummaryItem;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.Objects;

public class OrderSummaryAdapter extends ListAdapter<OrderSummaryItem, OrderSummaryAdapter.ViewHolder> {
    private static final DiffUtil.ItemCallback<OrderSummaryItem> DIFF_CALLBACK = new DiffUtil.ItemCallback<OrderSummaryItem>() {
        @Override
        public boolean areItemsTheSame(@NonNull OrderSummaryItem oldItem, @NonNull OrderSummaryItem newItem) {
            return Objects.equals(oldItem.getProductId(), newItem.getProductId());
        }

        @Override
        public boolean areContentsTheSame(@NonNull OrderSummaryItem oldItem, @NonNull OrderSummaryItem newItem) {
            return Objects.equals(oldItem.getProductId(), newItem.getProductId()) &&
                   Objects.equals(oldItem.getName(), newItem.getName()) &&
                   Objects.equals(oldItem.getPrice(), newItem.getPrice()) &&
                   oldItem.getQuantity() == newItem.getQuantity() &&
                   Objects.equals(oldItem.getImageUrl(), newItem.getImageUrl());
        }
    };

    public OrderSummaryAdapter() {
        super(DIFF_CALLBACK);
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
            .inflate(R.layout.item_order_summary, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        OrderSummaryItem item = getItem(position);
        holder.bind(item);
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        private final ImageView productImage;
        private final TextView productName;
        private final TextView productPrice;
        private final TextView totalPrice;
        private final NumberFormat currencyFormatter;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            productImage = itemView.findViewById(R.id.product_image);
            productName = itemView.findViewById(R.id.product_name);
            productPrice = itemView.findViewById(R.id.product_price);
            totalPrice = itemView.findViewById(R.id.total_price);
            currencyFormatter = NumberFormat.getCurrencyInstance(Locale.US);
        }

        void bind(OrderSummaryItem item) {
            productName.setText(item.getName());
            
            // Format price with quantity
            String priceWithQuantity = String.format("%s × %d",
                currencyFormatter.format(item.getPrice()),
                item.getQuantity());
            productPrice.setText(priceWithQuantity);

            // Format total price with prefix
            String total = String.format("Total: %s",
                currencyFormatter.format(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))));
            totalPrice.setText(total);

            // Load product image
            Glide.with(itemView.getContext())
                .load(item.getImageUrl())
                .placeholder(R.drawable.placeholder_product)
                .error(R.drawable.error_product)
                .into(productImage);
        }
    }
}