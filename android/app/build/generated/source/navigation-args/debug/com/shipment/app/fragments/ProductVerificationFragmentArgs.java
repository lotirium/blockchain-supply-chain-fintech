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

public class ProductVerificationFragmentArgs implements NavArgs {
  private final HashMap arguments = new HashMap();

  private ProductVerificationFragmentArgs() {
  }

  @SuppressWarnings("unchecked")
  private ProductVerificationFragmentArgs(HashMap argumentsMap) {
    this.arguments.putAll(argumentsMap);
  }

  @NonNull
  @SuppressWarnings("unchecked")
  public static ProductVerificationFragmentArgs fromBundle(@NonNull Bundle bundle) {
    ProductVerificationFragmentArgs __result = new ProductVerificationFragmentArgs();
    bundle.setClassLoader(ProductVerificationFragmentArgs.class.getClassLoader());
    if (bundle.containsKey("qrData")) {
      String qrData;
      qrData = bundle.getString("qrData");
      if (qrData == null) {
        throw new IllegalArgumentException("Argument \"qrData\" is marked as non-null but was passed a null value.");
      }
      __result.arguments.put("qrData", qrData);
    } else {
      throw new IllegalArgumentException("Required argument \"qrData\" is missing and does not have an android:defaultValue");
    }
    return __result;
  }

  @NonNull
  @SuppressWarnings("unchecked")
  public static ProductVerificationFragmentArgs fromSavedStateHandle(
      @NonNull SavedStateHandle savedStateHandle) {
    ProductVerificationFragmentArgs __result = new ProductVerificationFragmentArgs();
    if (savedStateHandle.contains("qrData")) {
      String qrData;
      qrData = savedStateHandle.get("qrData");
      if (qrData == null) {
        throw new IllegalArgumentException("Argument \"qrData\" is marked as non-null but was passed a null value.");
      }
      __result.arguments.put("qrData", qrData);
    } else {
      throw new IllegalArgumentException("Required argument \"qrData\" is missing and does not have an android:defaultValue");
    }
    return __result;
  }

  @SuppressWarnings("unchecked")
  @NonNull
  public String getQrData() {
    return (String) arguments.get("qrData");
  }

  @SuppressWarnings("unchecked")
  @NonNull
  public Bundle toBundle() {
    Bundle __result = new Bundle();
    if (arguments.containsKey("qrData")) {
      String qrData = (String) arguments.get("qrData");
      __result.putString("qrData", qrData);
    }
    return __result;
  }

  @SuppressWarnings("unchecked")
  @NonNull
  public SavedStateHandle toSavedStateHandle() {
    SavedStateHandle __result = new SavedStateHandle();
    if (arguments.containsKey("qrData")) {
      String qrData = (String) arguments.get("qrData");
      __result.set("qrData", qrData);
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
    ProductVerificationFragmentArgs that = (ProductVerificationFragmentArgs) object;
    if (arguments.containsKey("qrData") != that.arguments.containsKey("qrData")) {
      return false;
    }
    if (getQrData() != null ? !getQrData().equals(that.getQrData()) : that.getQrData() != null) {
      return false;
    }
    return true;
  }

  @Override
  public int hashCode() {
    int result = 1;
    result = 31 * result + (getQrData() != null ? getQrData().hashCode() : 0);
    return result;
  }

  @Override
  public String toString() {
    return "ProductVerificationFragmentArgs{"
        + "qrData=" + getQrData()
        + "}";
  }

  public static final class Builder {
    private final HashMap arguments = new HashMap();

    @SuppressWarnings("unchecked")
    public Builder(@NonNull ProductVerificationFragmentArgs original) {
      this.arguments.putAll(original.arguments);
    }

    @SuppressWarnings("unchecked")
    public Builder(@NonNull String qrData) {
      if (qrData == null) {
        throw new IllegalArgumentException("Argument \"qrData\" is marked as non-null but was passed a null value.");
      }
      this.arguments.put("qrData", qrData);
    }

    @NonNull
    public ProductVerificationFragmentArgs build() {
      ProductVerificationFragmentArgs result = new ProductVerificationFragmentArgs(arguments);
      return result;
    }

    @NonNull
    @SuppressWarnings("unchecked")
    public Builder setQrData(@NonNull String qrData) {
      if (qrData == null) {
        throw new IllegalArgumentException("Argument \"qrData\" is marked as non-null but was passed a null value.");
      }
      this.arguments.put("qrData", qrData);
      return this;
    }

    @SuppressWarnings({"unchecked","GetterOnBuilder"})
    @NonNull
    public String getQrData() {
      return (String) arguments.get("qrData");
    }
  }
}
