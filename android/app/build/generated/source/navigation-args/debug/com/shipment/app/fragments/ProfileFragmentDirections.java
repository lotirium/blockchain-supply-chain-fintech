package com.shipment.app.fragments;

import androidx.annotation.NonNull;
import androidx.navigation.ActionOnlyNavDirections;
import androidx.navigation.NavDirections;
import com.shipment.app.R;

public class ProfileFragmentDirections {
  private ProfileFragmentDirections() {
  }

  @NonNull
  public static NavDirections actionProfileToOrders() {
    return new ActionOnlyNavDirections(R.id.action_profile_to_orders);
  }
}
