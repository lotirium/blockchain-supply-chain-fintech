package com.shipment.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import java.util.HashMap;
import java.util.Map;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.Navigation;
import androidx.navigation.NavController;
import com.google.android.material.textfield.TextInputEditText;
import com.shipment.app.R;
import com.shipment.app.ShipmentApplication;
import com.shipment.app.utils.Resource;
import com.shipment.app.viewmodels.AuthViewModel;

public class RegisterFragment extends Fragment {
    private AuthViewModel viewModel;
    private TextInputEditText usernameInput;
    private TextInputEditText emailInput;
    private TextInputEditText passwordInput;
    private TextInputEditText firstNameInput;
    private TextInputEditText lastNameInput;
    private View progressBar;

    private View rootView;
    private ShipmentApplication.InitializationCallback initCallback;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                           @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_register, container, false);
    }

    private void initializeViewModel() {
        if (!isAdded()) return;
        viewModel = new ViewModelProvider(requireActivity()).get(AuthViewModel.class);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        this.rootView = view;

        initializeViews(view);
        
        // Initially hide the register form until we confirm the app is initialized
        View registerForm = view.findViewById(R.id.registerForm);
        registerForm.setVisibility(View.GONE);
        progressBar.setVisibility(View.VISIBLE);

        initializeRegisterForm(registerForm);
    }

    private void initializeRegisterForm(View registerForm) {
        ShipmentApplication app = ShipmentApplication.getInstance();
        if (app != null) {
            if (app.isInitialized()) {
                setupRegisterForm(registerForm);
            } else {
                initCallback = new ShipmentApplication.InitializationCallback() {
                    @Override
                    public void onInitialized() {
                        if (isAdded()) {
                            requireActivity().runOnUiThread(() -> setupRegisterForm(registerForm));
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
            progressBar.setVisibility(View.GONE);
            Toast.makeText(requireContext(),
                getString(R.string.error_generic),
                Toast.LENGTH_LONG).show();
        }
    }

    private void initializeViews(View view) {
        usernameInput = view.findViewById(R.id.usernameInput);
        emailInput = view.findViewById(R.id.emailInput);
        passwordInput = view.findViewById(R.id.passwordInput);
        firstNameInput = view.findViewById(R.id.firstNameInput);
        lastNameInput = view.findViewById(R.id.lastNameInput);
        progressBar = view.findViewById(R.id.progressBar);
    }

    private void setupRegisterForm(View registerForm) {
        if (!isAdded()) return;

        registerForm.setVisibility(View.VISIBLE);
        progressBar.setVisibility(View.GONE);

        initializeViewModel();
        setupListeners();
        observeViewModel();
    }

    private void setupListeners() {
        rootView.findViewById(R.id.registerButton).setOnClickListener(v -> attemptRegister());
        rootView.findViewById(R.id.loginLink).setOnClickListener(v ->
            Navigation.findNavController(v).navigateUp()
        );
    }

    private void navigateToProfile() {
        if (isAdded() && getView() != null) {
            NavController navController = Navigation.findNavController(requireView());
            if (navController.getCurrentDestination() != null &&
                navController.getCurrentDestination().getId() != R.id.navigation_profile) {
                navController.navigate(R.id.action_register_to_profile);
            }
        }
    }

    private void attemptRegister() {
        String username = getInputText(usernameInput);
        String email = getInputText(emailInput);
        String password = getInputText(passwordInput);
        String firstName = getInputText(firstNameInput);
        String lastName = getInputText(lastNameInput);

        // Validate inputs
        if (!validateInputs(username, email, password, firstName, lastName)) {
            return;
        }

        viewModel.register(username, email, password, firstName, lastName, "buyer", new HashMap<>())
            .observe(getViewLifecycleOwner(), result -> {
                if (result.getStatus() == Resource.Status.SUCCESS) {
                    navigateToProfile();
                } else if (result.getStatus() == Resource.Status.ERROR) {
                    Toast.makeText(requireContext(), 
                        result.getMessage() != null ? result.getMessage() : getString(R.string.error_registration_failed),
                        Toast.LENGTH_SHORT).show();
                }
            });
    }

    private void observeViewModel() {
        // Observe loading state
        viewModel.getIsLoading().observe(getViewLifecycleOwner(), isLoading -> {
            if (progressBar != null) {
                progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
            }
        });

        // Check if already authenticated
        viewModel.isAuthenticated().observe(getViewLifecycleOwner(), isAuthenticated -> {
            if (isAuthenticated) {
                navigateToProfile();
            }
        });
    }

    private boolean validateInputs(String username, String email, String password,
                                 String firstName, String lastName) {
        if (username.isEmpty()) {
            usernameInput.setError(getString(R.string.error_field_required));
            return false;
        }
        if (email.isEmpty()) {
            emailInput.setError(getString(R.string.error_field_required));
            return false;
        }
        if (password.isEmpty()) {
            passwordInput.setError(getString(R.string.error_field_required));
            return false;
        }
        if (password.length() < 6) {
            passwordInput.setError(getString(R.string.error_invalid_password));
            return false;
        }
        if (firstName.isEmpty()) {
            firstNameInput.setError(getString(R.string.error_field_required));
            return false;
        }
        if (lastName.isEmpty()) {
            lastNameInput.setError(getString(R.string.error_field_required));
            return false;
        }
        return true;
    }

    private String getInputText(TextInputEditText input) {
        return input.getText() != null ? input.getText().toString().trim() : "";
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
        rootView = null;
    }
}