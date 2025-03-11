package com.shipment.app.fragments;

import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.SavedStateHandle;
import androidx.navigation.NavArgs;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.HashMap;

public class QRScannerFragmentArgs implements NavArgs {
  private final HashMap arguments = new HashMap();

  private QRScannerFragmentArgs() {
  }

  @SuppressWarnings("unchecked")
  private QRScannerFragmentArgs(HashMap argumentsMap) {
    this.arguments.putAll(argumentsMap);
  }

  @NonNull
  @SuppressWarnings("unchecked")
  public static QRScannerFragmentArgs fromBundle(@NonNull Bundle bundle) {
    QRScannerFragmentArgs __result = new QRScannerFragmentArgs();
    bundle.setClassLoader(QRScannerFragmentArgs.class.getClassLoader());
    if (bundle.containsKey("orderId")) {
      String orderId;
      orderId = bundle.getString("orderId");
      __result.arguments.put("orderId", orderId);
    } else {
      __result.arguments.put("orderId", null);
    }
    return __result;
  }

  @NonNull
  @SuppressWarnings("unchecked")
  public static QRScannerFragmentArgs fromSavedStateHandle(
      @NonNull SavedStateHandle savedStateHandle) {
    QRScannerFragmentArgs __result = new QRScannerFragmentArgs();
    if (savedStateHandle.contains("orderId")) {
      String orderId;
      orderId = savedStateHandle.get("orderId");
      __result.arguments.put("orderId", orderId);
    } else {
      __result.arguments.put("orderId", null);
    }
    return __result;
  }

  @SuppressWarnings("unchecked")
  @Nullable
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
    } else {
      __result.putString("orderId", null);
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
    } else {
      __result.set("orderId", null);
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
    QRScannerFragmentArgs that = (QRScannerFragmentArgs) object;
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
    return "QRScannerFragmentArgs{"
        + "orderId=" + getOrderId()
        + "}";
  }

  public static final class Builder {
    private final HashMap arguments = new HashMap();

    @SuppressWarnings("unchecked")
    public Builder(@NonNull QRScannerFragmentArgs original) {
      this.arguments.putAll(original.arguments);
    }

    public Builder() {
    }

    @NonNull
    public QRScannerFragmentArgs build() {
      QRScannerFragmentArgs result = new QRScannerFragmentArgs(arguments);
      return result;
    }

    @NonNull
    @SuppressWarnings("unchecked")
    public Builder setOrderId(@Nullable String orderId) {
      this.arguments.put("orderId", orderId);
      return this;
    }

    @SuppressWarnings({"unchecked","GetterOnBuilder"})
    @Nullable
    public String getOrderId() {
      return (String) arguments.get("orderId");
    }
  }
}
