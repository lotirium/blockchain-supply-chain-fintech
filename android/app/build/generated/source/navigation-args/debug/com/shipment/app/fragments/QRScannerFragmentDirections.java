package com.shipment.app.fragments;

import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.navigation.NavDirections;
import com.shipment.app.R;
import java.lang.IllegalArgumentException;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.HashMap;

public class QRScannerFragmentDirections {
  private QRScannerFragmentDirections() {
  }

  @NonNull
  public static ActionQrScannerToProductVerification actionQrScannerToProductVerification(
      @NonNull String qrData) {
    return new ActionQrScannerToProductVerification(qrData);
  }

  public static class ActionQrScannerToProductVerification implements NavDirections {
    private final HashMap arguments = new HashMap();

    @SuppressWarnings("unchecked")
    private ActionQrScannerToProductVerification(@NonNull String qrData) {
      if (qrData == null) {
        throw new IllegalArgumentException("Argument \"qrData\" is marked as non-null but was passed a null value.");
      }
      this.arguments.put("qrData", qrData);
    }

    @NonNull
    @SuppressWarnings("unchecked")
    public ActionQrScannerToProductVerification setQrData(@NonNull String qrData) {
      if (qrData == null) {
        throw new IllegalArgumentException("Argument \"qrData\" is marked as non-null but was passed a null value.");
      }
      this.arguments.put("qrData", qrData);
      return this;
    }

    @Override
    @SuppressWarnings("unchecked")
    @NonNull
    public Bundle getArguments() {
      Bundle __result = new Bundle();
      if (arguments.containsKey("qrData")) {
        String qrData = (String) arguments.get("qrData");
        __result.putString("qrData", qrData);
      }
      return __result;
    }

    @Override
    public int getActionId() {
      return R.id.action_qr_scanner_to_product_verification;
    }

    @SuppressWarnings("unchecked")
    @NonNull
    public String getQrData() {
      return (String) arguments.get("qrData");
    }

    @Override
    public boolean equals(Object object) {
      if (this == object) {
          return true;
      }
      if (object == null || getClass() != object.getClass()) {
          return false;
      }
      ActionQrScannerToProductVerification that = (ActionQrScannerToProductVerification) object;
      if (arguments.containsKey("qrData") != that.arguments.containsKey("qrData")) {
        return false;
      }
      if (getQrData() != null ? !getQrData().equals(that.getQrData()) : that.getQrData() != null) {
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
      result = 31 * result + (getQrData() != null ? getQrData().hashCode() : 0);
      result = 31 * result + getActionId();
      return result;
    }

    @Override
    public String toString() {
      return "ActionQrScannerToProductVerification(actionId=" + getActionId() + "){"
          + "qrData=" + getQrData()
          + "}";
    }
  }
}
