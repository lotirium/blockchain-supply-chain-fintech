package com.shipment.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.Navigation;
import androidx.navigation.NavController;
import com.google.android.material.textfield.TextInputEditText;
import com.shipment.app.R;
import com.shipment.app.ShipmentApplication;
import com.shipment.app.api.responses.AuthResponse;
import com.shipment.app.utils.Resource;
import com.shipment.app.viewmodels.AuthViewModel;

public class LoginFragment extends Fragment {
    private AuthViewModel viewModel;
    private TextInputEditText emailInput;
    private TextInputEditText passwordInput;
    private View progressBar;

    private View rootView;
    private ShipmentApplication.InitializationCallback initCallback;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                           @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_login, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        this.rootView = view;

        emailInput = view.findViewById(R.id.emailInput);
        passwordInput = view.findViewById(R.id.passwordInput);
        progressBar = view.findViewById(R.id.progressBar);

        // Initially hide the login form until we confirm the app is initialized
        View loginForm = view.findViewById(R.id.loginForm);
        loginForm.setVisibility(View.GONE);
        progressBar.setVisibility(View.VISIBLE);

        ShipmentApplication app = ShipmentApplication.getInstance();
        if (app != null) {
            if (app.isInitialized()) {
                initializeViewModel();
                setupLoginForm(loginForm);
            } else {
                initCallback = new ShipmentApplication.InitializationCallback() {
                    @Override
                    public void onInitialized() {
                        if (isAdded()) {
                            requireActivity().runOnUiThread(() -> {
                                initializeViewModel();
                                setupLoginForm(loginForm);
                            });
                        }
                    }

                    @Override
                    public void onError(String error) {
                        if (isAdded()) {
                            requireActivity().runOnUiThread(() -> {
                                Toast.makeText(requireContext(),
                                    getString(R.string.error_generic),
                                    Toast.LENGTH_LONG).show();
                                progressBar.setVisibility(View.GONE);
                            });
                        }
                    }
                };
                app.registerInitCallback(initCallback);
            }
        } else {
            Toast.makeText(requireContext(),
                getString(R.string.error_generic),
                Toast.LENGTH_LONG).show();
            progressBar.setVisibility(View.GONE);
        }
    }

    private void initializeViewModel() {
        if (!isAdded()) return;
        viewModel = new ViewModelProvider(requireActivity()).get(AuthViewModel.class);
    }

    private void setupLoginForm(View loginForm) {
        if (!isAdded()) return;

        loginForm.setVisibility(View.VISIBLE);
        progressBar.setVisibility(View.GONE);

        rootView.findViewById(R.id.loginButton).setOnClickListener(v -> attemptLogin());
        rootView.findViewById(R.id.registerLink).setOnClickListener(v ->
            Navigation.findNavController(v).navigate(R.id.action_login_to_register)
        );

        observeAuthState();
    }

    private void observeAuthState() {
        // Observe loading state
        viewModel.getIsLoading().observe(getViewLifecycleOwner(), isLoading -> {
            if (progressBar != null) {
                progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
            }
        });

        // Check if already authenticated
        viewModel.isAuthenticated().observe(getViewLifecycleOwner(), isAuthenticated -> {
            if (isAuthenticated) {
                navigateToHome();
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        if (initCallback != null) {
            ShipmentApplication app = ShipmentApplication.getInstance();
            if (app != null) {
                app.unregisterInitCallback(initCallback);
            }
        }
        // Remove login observer
        if (loginObserver != null) {
            loginObserver.removeObservers(getViewLifecycleOwner());
            loginObserver = null;
        }
        rootView = null;
    }

    private LiveData<Resource<AuthResponse>> loginObserver;

    private void attemptLogin() {
        String email = emailInput.getText() != null ? emailInput.getText().toString().trim() : "";
        String password = passwordInput.getText() != null ? passwordInput.getText().toString() : "";

        if (email.isEmpty()) {
            emailInput.setError(getString(R.string.error_field_required));
            return;
        }

        if (password.isEmpty()) {
            passwordInput.setError(getString(R.string.error_field_required));
            return;
        }

        ShipmentApplication app = ShipmentApplication.getInstance();
        if (app != null && !app.isNetworkAvailable()) {
            Toast.makeText(requireContext(), 
                "No internet connection or server unavailable. Please check your connection and try again.",
                Toast.LENGTH_LONG).show();
            return;
        }

        // Remove previous observer if exists
        if (loginObserver != null) {
            loginObserver.removeObservers(getViewLifecycleOwner());
        }

        // Create new login observer
        loginObserver = viewModel.login(email, password);
        loginObserver.observe(getViewLifecycleOwner(), result -> {
            if (result.getStatus() == Resource.Status.SUCCESS) {
                navigateToHome();
            } else if (result.getStatus() == Resource.Status.ERROR) {
                String errorMessage = result.getMessage();
                if (errorMessage != null && (
                    errorMessage.contains("Failed to connect") || 
                    errorMessage.contains("timeout") ||
                    errorMessage.contains("Unable to resolve host"))) {
                    errorMessage = "Server is currently unavailable. Please try again later.";
                }
                Toast.makeText(requireContext(), 
                    errorMessage != null ? errorMessage : getString(R.string.error_login_failed), 
                    Toast.LENGTH_LONG).show();
                progressBar.setVisibility(View.GONE);
            }
        });
    }

    private void navigateToHome() {
        if (isAdded() && getView() != null) {
            NavController navController = Navigation.findNavController(requireView());
            if (navController.getCurrentDestination() != null &&
                navController.getCurrentDestination().getId() != R.id.navigation_profile) {
                navController.navigate(R.id.action_login_to_profile);
            }
        }
    }
}