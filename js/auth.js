/*
 * File: auth.js
 * Purpose: Authentication, registration, session management, routing
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.init();
    }

    async init() {
        console.log('🔐 AuthManager initializing...');
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                this.currentUser = session.user;
                await this.loadUserProfile();
                // Let app.js handle the routing
                this.handleAuthSuccess();
            } else {
                this.showLoginPage();
            }

            supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('🔄 Auth state changed:', event);
                if (event === 'SIGNED_IN' && session) {
                    this.currentUser = session.user;
                    await this.loadUserProfile();
                    this.handleAuthSuccess();
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    this.userProfile = null;
                    this.showLoginPage();
                }
            });
        } catch (error) {
            console.error('❌ Auth init error:', error);
            this.showLoginPage();
        }
    }

    handleAuthSuccess() {
        console.log('✅ Auth success, checking app...');
        
        // Check if app is already initialized
        if (window.app && typeof window.app.renderLayout === 'function') {
            console.log('🔄 App already initialized, rendering layout...');
            window.app.renderLayout();
        } else {
            // Wait for app to be ready
            console.log('⏳ Waiting for app to be ready...');
            let attempts = 0;
            const maxAttempts = 30;
            
            const checkApp = setInterval(() => {
                attempts++;
                if (window.app && typeof window.app.renderLayout === 'function') {
                    console.log('✅ App ready, rendering layout...');
                    clearInterval(checkApp);
                    window.app.renderLayout();
                } else if (attempts >= maxAttempts) {
                    console.error('❌ App not ready after max attempts');
                    clearInterval(checkApp);
                    // Fallback: try to render dashboard directly
                    this.renderDashboardFallback();
                }
            }, 200);
        }
    }

    renderDashboardFallback() {
        console.log('📊 Rendering dashboard fallback...');
        const profile = this.getUserProfile();
        if (!profile) {
            this.showLoginPage();
            return;
        }
        
        // Try to use the appropriate manager
        const role = profile.role;
        if (role === 'admin' && window.adminManager) {
            // Create a simple layout for admin
            const app = document.getElementById('app');
            app.innerHTML = `
                <div style="padding:20px;">
                    <h2>Admin Dashboard</h2>
                    <p>Welcome, ${profile.full_name}</p>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-top:20px;">
                        <div class="card" style="padding:20px;text-align:center;">
                            <h3>👥 Users</h3>
                            <button onclick="window.adminManager._users(document.getElementById('content'))" class="btn btn-primary">Manage</button>
                        </div>
                        <div class="card" style="padding:20px;text-align:center;">
                            <h3>📅 Appointments</h3>
                            <button onclick="window.adminManager._appointments(document.getElementById('content'))" class="btn btn-primary">View</button>
                        </div>
                    </div>
                    <div id="content" style="margin-top:20px;"></div>
                    <button onclick="authManager.logout()" class="btn btn-danger" style="margin-top:20px;">Logout</button>
                </div>
            `;
        } else {
            this.showLoginPage();
        }
    }

    async loadUserProfile() {
        if (!this.currentUser) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) {
                console.error('❌ Profile load error:', error);
                return;
            }

            this.userProfile = data;
            console.log('✅ Profile loaded:', data);
        } catch (error) {
            console.error('❌ Profile error:', error);
        }
    }

    async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            this.currentUser = data.user;
            await this.loadUserProfile();
            
            console.log('✅ Login successful!');
            return { success: true, message: 'Login successful!' };
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, message: error.message || 'Login failed. Please check your credentials.' };
        }
    }

    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            this.userProfile = null;
            console.log('✅ Logged out');
            return { success: true };
        } catch (error) {
            console.error('❌ Logout error:', error);
            return { success: false, message: error.message };
        }
    }

    showLoginPage() {
        console.log('📝 Showing login page...');
        const app = document.getElementById('app');
        if (!app) return;

        app.innerHTML = `
            <div class="login-page">
                <div class="login-card">
                    <div class="text-center">
                        <div class="logo-icon">TH</div>
                        <h2>Telehealth System</h2>
                        <p class="subtitle">Secure remote healthcare platform</p>
                    </div>
                    
                    <div id="loginMessage"></div>
                    
                    <form id="loginForm">
                        <div class="mb-3">
                            <label class="form-label">Email Address</label>
                            <input type="email" class="form-control" id="loginEmail" placeholder="you@example.com" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Password</label>
                            <input type="password" class="form-control" id="loginPassword" placeholder="••••••••" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-100" id="loginBtn">
                            <i class="fas fa-sign-in-alt me-2"></i>Sign In
                        </button>
                    </form>
                    
                    <div class="auth-links">
                        <a href="#" id="showRegister">Create an account</a>
                        &nbsp;·&nbsp;
                        <a href="#" id="showForgotPassword">Forgot password?</a>
                    </div>
                    
                    <div class="demo-accounts">
                        <div class="demo-title">Demo Accounts</div>
                        
                        <div class="demo-account" onclick="authManager.fillLogin('admin@telehealth.com', 'Admin@2024')">
                            <div class="demo-left">
                                <div class="demo-avatar admin">A</div>
                                <span class="demo-email">admin@telehealth.com</span>
                            </div>
                            <div>
                                <span class="demo-role-badge admin">Admin</span>
                                <span class="demo-password">Admin@2024</span>
                            </div>
                        </div>
                        
                        <div class="demo-account" onclick="authManager.fillLogin('sarah.johnson@telehealth.com', 'Telehealth@2024')">
                            <div class="demo-left">
                                <div class="demo-avatar doctor">D</div>
                                <span class="demo-email">sarah.johnson@telehealth.com</span>
                            </div>
                            <div>
                                <span class="demo-role-badge doctor">Doctor</span>
                                <span class="demo-password">Telehealth@2024</span>
                            </div>
                        </div>
                        
                        <div class="demo-account" onclick="authManager.fillLogin('john.smith@email.com', 'Patient@2024')">
                            <div class="demo-left">
                                <div class="demo-avatar patient">P</div>
                                <span class="demo-email">john.smith@email.com</span>
                            </div>
                            <div>
                                <span class="demo-role-badge patient">Patient</span>
                                <span class="demo-password">Patient@2024</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Login form handler
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const message = document.getElementById('loginMessage');
            const btn = document.getElementById('loginBtn');
            
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';
            message.innerHTML = '';

            const result = await this.login(email, password);
            
            if (result.success) {
                message.innerHTML = '<div class="alert alert-success">✅ Login successful! Redirecting...</div>';
                // Let the auth state change handler handle the redirect
            } else {
                message.innerHTML = `<div class="alert alert-danger">❌ ${result.message}</div>`;
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Sign In';
            }
        });

        // Register link
        document.getElementById('showRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterPage();
        });

        // Forgot password
        document.getElementById('showForgotPassword')?.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = prompt('Enter your email address:');
            if (email) {
                const { error } = await supabase.auth.resetPasswordForEmail(email);
                alert(error ? `Error: ${error.message}` : 'Password reset email sent!');
            }
        });
    }

    fillLogin(email, password) {
        document.getElementById('loginEmail').value = email;
        document.getElementById('loginPassword').value = password;
        setTimeout(() => {
            document.getElementById('loginForm').dispatchEvent(new Event('submit'));
        }, 300);
    }

    showRegisterPage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page">
                <div class="login-card" style="max-width:480px;">
                    <div class="text-center">
                        <div class="logo-icon" style="font-size:1.5rem;width:60px;height:60px;">📝</div>
                        <h2>Create Account</h2>
                        <p class="subtitle">Join the Telehealth System</p>
                    </div>
                    
                    <div id="registerMessage"></div>
                    
                    <form id="registerForm">
                        <div class="mb-3">
                            <label class="form-label">Full Name</label>
                            <input type="text" class="form-control" id="regFullName" placeholder="John Doe" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Email Address</label>
                            <input type="email" class="form-control" id="regEmail" placeholder="you@example.com" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Password</label>
                            <input type="password" class="form-control" id="regPassword" placeholder="Minimum 6 characters" required minlength="6">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Confirm Password</label>
                            <input type="password" class="form-control" id="regConfirmPassword" placeholder="Confirm your password" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Role</label>
                            <select class="form-control" id="regRole" required>
                                <option value="">Select your role</option>
                                <option value="patient">Patient</option>
                                <option value="doctor">Doctor</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Create Account</button>
                    </form>
                    
                    <div class="auth-links">
                        Already have an account? <a href="#" id="showLogin">Sign in</a>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fullName = document.getElementById('regFullName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const role = document.getElementById('regRole').value;
            const message = document.getElementById('registerMessage');

            if (password !== confirmPassword) {
                message.innerHTML = '<div class="alert alert-danger">❌ Passwords do not match!</div>';
                return;
            }

            if (!role) {
                message.innerHTML = '<div class="alert alert-danger">❌ Please select a role.</div>';
                return;
            }

            message.innerHTML = '<div class="alert alert-info">⏳ Creating account...</div>';

            const result = await this.register(email, password, fullName, role);
            message.innerHTML = `<div class="alert alert-${result.success ? 'success' : 'danger'}">${result.message}</div>`;
            
            if (result.success) {
                setTimeout(() => this.showLoginPage(), 2000);
            }
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginPage();
        });
    }

    async register(email, password, fullName, role) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role
                    }
                }
            });

            if (error) throw error;

            // Profile will be created by trigger, but we can also create it directly
            if (data.user) {
                // Check if profile already exists (created by trigger)
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', data.user.id)
                    .single();

                if (!existingProfile) {
                    await supabase
                        .from('profiles')
                        .insert([{
                            id: data.user.id,
                            full_name: fullName,
                            email: email,
                            role: role,
                            is_active: role === 'patient' || role === 'admin',
                            created_at: new Date().toISOString()
                        }]);
                }
            }

            return { success: true, message: 'Registration successful! Please check your email to verify your account.' };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: error.message || 'Registration failed. Please try again.' };
        }
    }

    getUserProfile() {
        return this.userProfile;
    }

    getUserId() {
        return this.currentUser?.id || null;
    }
}

// Initialize auth manager
const authManager = new AuthManager();
window.authManager = authManager;
console.log('✅ AuthManager initialized');