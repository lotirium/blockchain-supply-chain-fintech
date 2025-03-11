package com.shipment.app;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.NavController;
import androidx.navigation.Navigation;
import androidx.navigation.fragment.NavHostFragment;
import androidx.navigation.ui.AppBarConfiguration;
import androidx.navigation.ui.NavigationUI;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.shipment.app.viewmodels.AuthViewModel;

public class MainActivity extends AppCompatActivity {
    private NavController navController;
    private BottomNavigationView bottomNavigationView;
    private AppBarConfiguration appBarConfiguration;
    private androidx.appcompat.app.AlertDialog loadingDialog;
    private ShipmentApplication.InitializationCallback initCallback;
    private AuthViewModel authViewModel;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Setup toolbar first to avoid ActionBar errors
        androidx.appcompat.widget.Toolbar toolbar = findViewById(R.id.toolbar);
        if (toolbar != null) {
            setSupportActionBar(toolbar);
        }
        
        // Initialize views before checking app state
        bottomNavigationView = findViewById(R.id.bottom_navigation);
        if (bottomNavigationView != null) {
            bottomNavigationView.setVisibility(View.GONE);
        }
        
        ShipmentApplication app = ShipmentApplication.getInstance();
        if (app == null) {
            handleInitializationError("Application instance not available");
            return;
        }

        showLoadingDialog();
        
        initCallback = new ShipmentApplication.InitializationCallback() {
            @Override
            public void onInitialized() {
                hideLoadingDialog();
                setupUI();
            }

            @Override
            public void onError(String error) {
                hideLoadingDialog();
                handleInitializationError(error);
            }
        };
        
        if (app.isInitialized()) {
            setupUI();
        } else {
            app.registerInitCallback(initCallback);
            if (!app.isInitializing()) {
                app.retryInitialization();
            }
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (loadingDialog != null) {
            loadingDialog.dismiss();
            loadingDialog = null;
        }
        ShipmentApplication app = ShipmentApplication.getInstance();
        if (app != null && initCallback != null) {
            app.unregisterInitCallback(initCallback);
            initCallback = null;
        }
    }

    private void showLoadingDialog() {
        if (isFinishing()) return;
        
        if (loadingDialog == null) {
            loadingDialog = new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("Loading")
                .setMessage("Initializing application...")
                .setCancelable(false)
                .create();
        }
        
        if (!loadingDialog.isShowing()) {
            loadingDialog.show();
        }
    }

    private void hideLoadingDialog() {
        if (loadingDialog != null && loadingDialog.isShowing()) {
            loadingDialog.dismiss();
        }
    }

    private void handleInitializationError(String errorMessage) {
        android.util.Log.e("MainActivity", errorMessage);
        if (!isFinishing()) {
            hideLoadingDialog();
            new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("Initialization Error")
                .setMessage("Could not initialize the application. Please try again.")
                .setPositiveButton("Retry", (dialog, which) -> {
                    showLoadingDialog();
                    ShipmentApplication app = ShipmentApplication.getInstance();
                    if (app != null) {
                        app.retryInitialization();
                    } else {
                        hideLoadingDialog();
                        finish();
                    }
                })
                .setNegativeButton("Exit", (dialog, which) -> finish())
                .setCancelable(false)
                .show();
        }
    }

    private void setupUI() {
        try {
            setupNavigation();
            
            // Initialize ViewModels after app is initialized
            authViewModel = new ViewModelProvider(this).get(AuthViewModel.class);
            
            // Observe authentication state
            authViewModel.isAuthenticated().observe(this, isAuthenticated -> {
                if (bottomNavigationView != null) {
                    bottomNavigationView.setVisibility(isAuthenticated ? View.VISIBLE : View.GONE);
                }
            });

            android.util.Log.d("MainActivity", "UI setup completed successfully");
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Error setting up UI", e);
            handleInitializationError("Error setting up UI: " + e.getMessage());
        }
    }

    private void setupNavigation() {
        try {
            NavHostFragment navHostFragment = (NavHostFragment) getSupportFragmentManager()
                    .findFragmentById(R.id.nav_host_fragment);
            
            if (navHostFragment != null) {
                navController = navHostFragment.getNavController();
                
                // Setup the bottom navigation with the NavController
                NavigationUI.setupWithNavController(bottomNavigationView, navController);

                // Setup the ActionBar with NavController
                appBarConfiguration = new AppBarConfiguration.Builder(
                        R.id.navigation_login,
                        R.id.navigation_register,
                        R.id.navigation_profile,
                        R.id.navigation_orders,
                        R.id.navigation_order_details,
                        R.id.navigation_qr_scanner
                ).build();
                
                NavigationUI.setupActionBarWithNavController(this, navController, appBarConfiguration);
            } else {
                throw new IllegalStateException("NavHostFragment not found");
            }
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Error in setupNavigation", e);
            throw e;
        }
    }

    @Override
    public boolean onSupportNavigateUp() {
        return NavigationUI.navigateUp(navController, appBarConfiguration)
                || super.onSupportNavigateUp();
    }

    @Override
    public void onBackPressed() {
        if (getSupportFragmentManager().getBackStackEntryCount() > 0) {
            getSupportFragmentManager().popBackStack();
        } else {
            super.onBackPressed();
        }
    }
}