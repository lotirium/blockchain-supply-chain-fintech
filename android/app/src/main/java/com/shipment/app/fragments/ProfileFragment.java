package com.shipment.app.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.content.res.AppCompatResources;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.NavOptions;
import androidx.navigation.Navigation;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.shipment.app.R;
import com.shipment.app.api.responses.AuthResponse;
import com.shipment.app.utils.Resource;
import com.shipment.app.viewmodels.AuthViewModel;

public class ProfileFragment extends Fragment {
    private AuthViewModel viewModel;
    private View progressBar;
    private TextInputEditText usernameEdit;
    private TextInputEditText firstNameEdit;
    private TextInputEditText lastNameEdit;
    private TextInputEditText emailEdit;
    private MaterialButton logoutButton;
    private MaterialButton viewOrdersButton;
    private MaterialButton editProfileButton;
    private boolean isEditMode = false;

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        viewModel = new ViewModelProvider(this).get(AuthViewModel.class);
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                           @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_profile, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        initializeViews(view);
        setupListeners();
        loadProfile();
        observeAuthState();
    }

    private void initializeViews(View view) {
        progressBar = view.findViewById(R.id.progressBar);
        usernameEdit = view.findViewById(R.id.usernameEdit);
        firstNameEdit = view.findViewById(R.id.firstNameEdit);
        lastNameEdit = view.findViewById(R.id.lastNameEdit);
        emailEdit = view.findViewById(R.id.emailEdit);
        logoutButton = view.findViewById(R.id.logoutButton);
        viewOrdersButton = view.findViewById(R.id.viewOrdersButton);
        editProfileButton = view.findViewById(R.id.editProfileButton);
    }

    private void setupListeners() {
        logoutButton.setOnClickListener(v -> logout());
        viewOrdersButton.setOnClickListener(v -> navigateToOrders());
        editProfileButton.setOnClickListener(v -> handleEditProfile());
    }

    private void loadProfile() {
        viewModel.getProfile().observe(getViewLifecycleOwner(), result -> {
            if (result.getStatus() == Resource.Status.SUCCESS && result.getData() != null) {
                updateProfileUI(result.getData());
            } else if (result.getStatus() == Resource.Status.ERROR) {
                Toast.makeText(requireContext(), 
                    result.getMessage() != null ? result.getMessage() : "Failed to load profile",
                    Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void handleEditProfile() {
        if (isEditMode) {
            // Save changes
            String username = usernameEdit.getText().toString().trim();
            String firstName = firstNameEdit.getText().toString().trim();
            String lastName = lastNameEdit.getText().toString().trim();
            String email = emailEdit.getText().toString().trim();

            viewModel.updateProfile(firstName, lastName, email, username).observe(getViewLifecycleOwner(), result -> {
                if (result.getStatus() == Resource.Status.SUCCESS && result.getData() != null) {
                    Toast.makeText(requireContext(), "Profile updated successfully", Toast.LENGTH_SHORT).show();
                    updateProfileUI(result.getData());
                    toggleEditMode(false);
                } else if (result.getStatus() == Resource.Status.ERROR) {
                    Toast.makeText(requireContext(), 
                        result.getMessage() != null ? result.getMessage() : "Failed to update profile",
                        Toast.LENGTH_SHORT).show();
                }
            });
        } else {
            toggleEditMode(true);
        }
    }

    private void toggleEditMode(boolean enabled) {
        isEditMode = enabled;
        usernameEdit.setEnabled(enabled);
        firstNameEdit.setEnabled(enabled);
        lastNameEdit.setEnabled(enabled);
        emailEdit.setEnabled(enabled);
        editProfileButton.setText(enabled ? "Save Changes" : "Edit Profile");
        editProfileButton.setIcon(enabled ? null : 
            AppCompatResources.getDrawable(requireContext(), R.drawable.ic_person));
    }

    private void updateProfileUI(AuthResponse userData) {
        usernameEdit.setText(userData.getUsername());
        firstNameEdit.setText(userData.getFirstName());
        lastNameEdit.setText(userData.getLastName());
        emailEdit.setText(userData.getEmail());

        // Show store info if user is a seller
        if ("seller".equals(userData.getRole()) && userData.getStore() != null) {
            View storeSection = requireView().findViewById(R.id.storeSection);
            if (storeSection != null) {
                storeSection.setVisibility(View.VISIBLE);
                TextView storeNameText = requireView().findViewById(R.id.storeNameText);
                TextView storeStatusText = requireView().findViewById(R.id.storeStatusText);
                if (storeNameText != null) {
                    storeNameText.setText(userData.getStore().getName());
                }
                if (storeStatusText != null) {
                    storeStatusText.setText(userData.getStore().getStatus());
                }
            }
        }
    }

    private void observeAuthState() {
        viewModel.isAuthenticated().observe(getViewLifecycleOwner(), isAuthenticated -> {
            if (!isAuthenticated) {
                navigateToLogin();
            }
        });

        viewModel.getIsLoading().observe(getViewLifecycleOwner(), isLoading -> {
            progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        });
    }

    private void logout() {
        // Trigger logout and let auth state observer handle navigation
        viewModel.logout();
    }

    private void navigateToLogin() {
        Navigation.findNavController(requireView())
            .navigate(R.id.navigation_login, null, 
                new NavOptions.Builder()
                    .setPopUpTo(R.id.nav_graph, true)
                    .build());
    }

    private void navigateToOrders() {
        Navigation.findNavController(requireView())
            .navigate(R.id.action_profile_to_orders);
    }
}