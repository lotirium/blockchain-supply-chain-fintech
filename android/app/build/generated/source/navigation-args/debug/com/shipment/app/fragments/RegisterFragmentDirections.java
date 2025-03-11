package com.shipment.app.fragments;

import androidx.annotation.NonNull;
import androidx.navigation.ActionOnlyNavDirections;
import androidx.navigation.NavDirections;
import com.shipment.app.R;

public class RegisterFragmentDirections {
  private RegisterFragmentDirections() {
  }

  @NonNull
  public static NavDirections actionRegisterToProfile() {
    return new ActionOnlyNavDirections(R.id.action_register_to_profile);
  }
}
