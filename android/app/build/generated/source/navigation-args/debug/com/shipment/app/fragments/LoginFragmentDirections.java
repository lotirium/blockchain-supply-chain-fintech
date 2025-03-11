package com.shipment.app.fragments;

import androidx.annotation.NonNull;
import androidx.navigation.ActionOnlyNavDirections;
import androidx.navigation.NavDirections;
import com.shipment.app.R;

public class LoginFragmentDirections {
  private LoginFragmentDirections() {
  }

  @NonNull
  public static NavDirections actionLoginToRegister() {
    return new ActionOnlyNavDirections(R.id.action_login_to_register);
  }

  @NonNull
  public static NavDirections actionLoginToProfile() {
    return new ActionOnlyNavDirections(R.id.action_login_to_profile);
  }
}
