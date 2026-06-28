/*
 * File: app.js
 * Purpose: Main application entry point and initialization
 * Dependencies: All other JS modules
 * Fits in: Application initialization layer
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Telehealth Communication System initializing...');
    
    try {
        const config = window.SUPABASE_CONFIG || (typeof SUPABASE_CONFIG !== 'undefined' ? SUPABASE_CONFIG : null);

        if (!config) {
            showError('Configuration not loaded. Ensure js/config.js is present and reload the page.');
            return;
        }

        if (typeof supabase === 'undefined' || !supabase?.auth) {
            showError('Supabase client failed to initialize. Check js/config.js credentials and refresh the page.');
            return;
        }

        if (isUnconfigured(config)) {
            showConfigurationWarning();
            return;
        }

        console.log('Supabase configured successfully');
        
        // Check if authManager exists
        if (typeof authManager === 'undefined') {
            console.error('AuthManager not loaded!');
            showError('Failed to load authentication module. Please refresh the page.');
            return;
        }

        // Initialize the application
        initializeApp();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize application: ' + error.message);
    }
});

function isUnconfigured(config) {
    return !config.url || !config.anonKey ||
        config.url.includes('YOUR_SUPABASE') ||
        config.anonKey.includes('YOUR_SUPABASE') ||
        config.url === 'https://your-project.supabase.co';
}

function showConfigurationWarning() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container mt-5">
            <div class="alert alert-warning">
                <h4 class="alert-heading">⚠️ Configuration Required</h4>
                <p>Please configure your Supabase credentials before using the application.</p>
                <hr>
                <p>Open <code>js/config.js</code> and replace the placeholder values:</p>
                <ul>
                    <li><code>YOUR_SUPABASE_PROJECT_URL</code> with your Supabase project URL</li>
                    <li><code>YOUR_SUPABASE_ANON_KEY</code> with your Supabase anonymous key</li>
                </ul>
                <p>You can find these in your Supabase dashboard under Project Settings > API</p>
                <hr>
                <p class="mb-0">After configuring, refresh this page to continue.</p>
            </div>
        </div>
    `;
}

function showError(message) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container mt-5">
            <div class="alert alert-danger">
                <h4 class="alert-heading">❌ Error</h4>
                <p>${message}</p>
                <hr>
                <p class="mb-0">Please check the browser console (F12) for more details.</p>
            </div>
        </div>
    `;
}

async function initializeApp() {
    try {
        console.log('Initializing app...');
        
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session:', session ? 'Found' : 'None');
        
        if (session) {
            console.log('User already logged in, loading profile...');
            // Auth manager will handle routing based on role
            await authManager.loadUserProfile();
        } else {
            console.log('No active session, showing login page...');
            authManager.showLoginPage();
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize application: ' + error.message);
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error || event.message);
    const app = document.getElementById('app');
    if (app && !app.innerHTML.trim()) {
        showError('An error occurred: ' + (event.error?.message || event.message || 'Unknown error'));
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    const app = document.getElementById('app');
    if (app && !app.innerHTML.trim()) {
        showError('An error occurred: ' + (event.reason?.message || 'Unknown error'));
    }
});

// Export for debugging
if (typeof window !== 'undefined') {
    window.TelehealthApp = {
        authManager: typeof authManager !== 'undefined' ? authManager : null,
        patientManager: typeof patientManager !== 'undefined' ? patientManager : null,
        doctorManager: typeof doctorManager !== 'undefined' ? doctorManager : null,
        adminManager: typeof adminManager !== 'undefined' ? adminManager : null,
        chatManager: typeof chatManager !== 'undefined' ? chatManager : null,
        videoManager: typeof videoManager !== 'undefined' ? videoManager : null,
        supabase: typeof supabase !== 'undefined' ? supabase : null
    };
}