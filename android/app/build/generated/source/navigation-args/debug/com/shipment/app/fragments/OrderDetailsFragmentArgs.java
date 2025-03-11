package com.shipment.app.fragments;

import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.lifecycle.SavedStateHandle;
import androidx.navigation.NavArgs;
import java.lang.IllegalArgumentException;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.HashMap;

public class OrderDetailsFragmentArgs implements NavArgs {
  private final HashMap arguments = new HashMap();

  private OrderDetailsFragmentArgs() {
  }

  @SuppressWarnings("unchecked")
  private OrderDetailsFragmentArgs(HashMap argumentsMap) {
    this.arguments.putAll(argumentsMap);
  }

  @NonNull
  @SuppressWarnings("unchecked")
  public static OrderDetailsFragmentArgs fromBundle(@NonNull Bundle bundle) {
    OrderDetailsFragmentArgs __result = new OrderDetailsFragmentArgs();
    bundle.setClassLoader(OrderDetailsFragmentArgs.class.getClassLoader());
    if (bundle.containsKey("orderId")) {
      String orderId;
      orderId = bundle.getString("orderId");
      if (orderId == null) {
        throw new IllegalArgumentException("Argument \"orderId\" is marked as non-null but was passed a null value.");
      }
      __result.arguments.put("orderId", orderId);
    } else {
      throw new IllegalArgumentException("Required argument \"orderId\" is missing and does not have an android:defaultValue");
    }
    return __result;
  }

  @NonNull
  @SuppressWarnings("unchecked")
  public static OrderDetailsFragmentArgs fromSavedStateHandle(
      @NonNull SavedStateHandle savedStateHandle) {
    OrderDetailsFragmentArgs __result = new OrderDetailsFragmentArgs();
    if (savedStateHandle.contains("orderId")) {
      String orderId;
      orderId = savedStateHandle.get("orderId");
      if (orderId == null) {
        throw new IllegalArgumentException("Argument \"orderId\" is marked as non-null but was passed a null value.");
      }
      __result.arguments.put("orderId", orderId);
    } else {
      throw new IllegalArgumentException("Required argument \"orderId\" is missing and does not have an android:defaultValue");
    }
    return __result;
  }

  @SuppressWarnings("unchecked")
  @NonNull
  public String getOrderId() {
    return (String) arguments.get("orderId");
  }

  @SuppressWarnings("unchecked")
  @NonNull
  public Bundle toBundle() {
    Bundle __result = new Bundle();
    if (arguments.containsKey("orderId")) {
      String orderId = (String) arguments.get("orderId");
      __result.putString("orderId", orderId);
    }
    return __result;
  }

  @SuppressWarnings("unchecked")
  @NonNull
  public SavedStateHandle toSavedStateHandle() {
    SavedStateHandle __result = new SavedStateHandle();
    if (arguments.containsKey("orderId")) {
      String orderId = (String) arguments.get("orderId");
      __result.set("orderId", orderId);
    }
    return __result;
  }

  @Override
  public boolean equals(Object object) {
    if (this == object) {
        return true;
    }
    if (object == null || getClass() != object.getClass()) {
        return false;
    }
    OrderDetailsFragmentArgs that = (OrderDetailsFragmentArgs) object;
    if (arguments.containsKey("orderId") != that.arguments.containsKey("orderId")) {
      return false;
    }
    if (getOrderId() != null ? !getOrderId().equals(that.getOrderId()) : that.getOrderId() != null) {
      return false;
    }
    return true;
  }

  @Override
  public int hashCode() {
    int result = 1;
    result = 31 * result + (getOrderId() != null ? getOrderId().hashCode() : 0);
    return result;
  }

  @Override
  public String toString() {
    return "OrderDetailsFragmentArgs{"
        + "orderId=" + getOrderId()
        + "}";
  }

  public static final class Builder {
    private final HashMap arguments = new HashMap();

    @SuppressWarnings("unchecked")
    public Builder(@NonNull OrderDetailsFragmentArgs original) {
      this.arguments.putAll(original.arguments);
    }

    @SuppressWarnings("unchecked")
    public Builder(@NonNull String orderId) {
      if (orderId == null) {
        throw new IllegalArgumentException("Argument \"orderId\" is marked as non-null but was passed a null value.");
      }
      this.arguments.put("orderId", orderId);
    }

    @NonNull
    public OrderDetailsFragmentArgs build() {
      OrderDetailsFragmentArgs result = new OrderDetailsFragmentArgs(arguments);
      return result;
    }

    @NonNull
    @SuppressWarnings("unchecked")
    public Builder setOrderId(@NonNull String orderId) {
      if (orderId == null) {
        throw new IllegalArgumentException("Argument \"orderId\" is marked as non-null but was passed a null value.");
      }
      this.arguments.put("orderId", orderId);
      return this;
    }

    @SuppressWarnings({"unchecked","GetterOnBuilder"})
    @NonNull
    public String getOrderId() {
      return (String) arguments.get("orderId");
    }
  }
}
