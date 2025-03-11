package com.shipment.app.models;

import android.os.Parcel;
import android.os.Parcelable;
import com.google.gson.annotations.SerializedName;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class TimelineEvent implements Parcelable {
    @SerializedName("status")
    private String status;

    @SerializedName("time")
    private String time;

    private transient Date parsedTime;

    public TimelineEvent() {
        // Required empty constructor
    }

    protected TimelineEvent(Parcel in) {
        status = in.readString();
        time = in.readString();
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeString(status);
        dest.writeString(time);
    }

    @Override
    public int describeContents() {
        return 0;
    }

    public static final Creator<TimelineEvent> CREATOR = new Creator<TimelineEvent>() {
        @Override
        public TimelineEvent createFromParcel(Parcel in) {
            return new TimelineEvent(in);
        }

        @Override
        public TimelineEvent[] newArray(int size) {
            return new TimelineEvent[size];
        }
    };

    public String getStatus() {
        return status;
    }

    public Date getTime() {
        if (parsedTime == null && time != null) {
            try {
                SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
                parsedTime = isoFormat.parse(time);
            } catch (Exception e) {
                parsedTime = new Date(0); // Fallback to epoch if parsing fails
            }
        }
        return parsedTime != null ? parsedTime : new Date(0);
    }
}