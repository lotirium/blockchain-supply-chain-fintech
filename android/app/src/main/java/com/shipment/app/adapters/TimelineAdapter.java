package com.shipment.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.shipment.app.R;
import com.shipment.app.models.TimelineEvent;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

public class TimelineAdapter extends RecyclerView.Adapter<TimelineAdapter.ViewHolder> {
    private final List<TimelineEvent> timeline;
    private final SimpleDateFormat dateFormat;

    public TimelineAdapter(List<TimelineEvent> timeline) {
        this.timeline = timeline;
        this.dateFormat = new SimpleDateFormat("MMM dd, yyyy HH:mm:ss", Locale.getDefault());
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_timeline, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        TimelineEvent event = timeline.get(position);
        holder.statusText.setText(event.getStatus());
        holder.timeText.setText(dateFormat.format(event.getTime()));
        
        // Show line above for all items except the first
        holder.lineAbove.setVisibility(position == 0 ? View.INVISIBLE : View.VISIBLE);
        
        // Show line below for all items except the last
        holder.lineBelow.setVisibility(position == timeline.size() - 1 ? View.INVISIBLE : View.VISIBLE);
    }

    @Override
    public int getItemCount() {
        return timeline.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final View lineAbove;
        final View lineBelow;
        final TextView statusText;
        final TextView timeText;

        ViewHolder(View view) {
            super(view);
            lineAbove = view.findViewById(R.id.line_above);
            lineBelow = view.findViewById(R.id.line_below);
            statusText = view.findViewById(R.id.status_text);
            timeText = view.findViewById(R.id.time_text);
        }
    }
}