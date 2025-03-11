package com.shipment.app.fragments;

import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.navigation.NavDirections;
import com.shipment.app.R;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.HashMap;

public class OrderDetailsFragmentDirections {
  private OrderDetailsFragmentDirections() {
  }

  @NonNull
  public static ActionOrderDetailsToQrScanner actionOrderDetailsToQrScanner() {
    return new ActionOrderDetailsToQrScanner();
  }

  public static class ActionOrderDetailsToQrScanner implements NavDirections {
    private final HashMap arguments = new HashMap();

    private ActionOrderDetailsToQrScanner() {
    }

    @NonNull
    @SuppressWarnings("unchecked")
    public ActionOrderDetailsToQrScanner setOrderId(@Nullable String orderId) {
      this.arguments.put("orderId", orderId);
      return this;
    }

    @Override
    @SuppressWarnings("unchecked")
    @NonNull
    public Bundle getArguments() {
      Bundle __result = new Bundle();
      if (arguments.containsKey("orderId")) {
        String orderId = (String) arguments.get("orderId");
        __result.putString("orderId", orderId);
      } else {
        __result.putString("orderId", null);
      }
      return __result;
    }

    @Override
    public int getActionId() {
      return R.id.action_order_details_to_qr_scanner;
    }

    @SuppressWarnings("unchecked")
    @Nullable
    public String getOrderId() {
      return (String) arguments.get("orderId");
    }

    @Override
    public boolean equals(Object object) {
      if (this == object) {
          return true;
      }
      if (object == null || getClass() != object.getClass()) {
          return false;
      }
      ActionOrderDetailsToQrScanner that = (ActionOrderDetailsToQrScanner) object;
      if (arguments.containsKey("orderId") != that.arguments.containsKey("orderId")) {
        return false;
      }
      if (getOrderId() != null ? !getOrderId().equals(that.getOrderId()) : that.getOrderId() != null) {
        return false;
      }
      if (getActionId() != that.getActionId()) {
        return false;
      }
      return true;
    }

    @Override
    public int hashCode() {
      int result = 1;
      result = 31 * result + (getOrderId() != null ? getOrderId().hashCode() : 0);
      result = 31 * result + getActionId();
      return result;
    }

    @Override
    public String toString() {
      return "ActionOrderDetailsToQrScanner(actionId=" + getActionId() + "){"
          + "orderId=" + getOrderId()
          + "}";
    }
  }
}
