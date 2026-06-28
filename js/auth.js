/*
 * File: auth.js
 * Purpose: Handle user authentication (login, register, logout, session management)
 * Dependencies: supabase-js (from config.js)
 * Fits in: Authentication module
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.init();
    }

    async init() {
        try {
            // Check for existing session
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                this.currentUser = session.user;
                await this.loadUserProfile();
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN') {
                    this.currentUser = session.user;
                    this.loadUserProfile();
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    this.userProfile = null;
                    this.showLoginPage();
                }
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
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
                console.error('Error loading profile:', error);
                return;
            }

            this.userProfile = data;
            this.routeBasedOnRole();
        } catch (error) {
            console.error('Profile load error:', error);
        }
    }

    async register(email, password, fullName, role, phone = '', specialty = '') {
        try {
            // Register user with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // Create profile record
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: authData.user.id,
                        full_name: fullName,
                        email: email,
                        role: role,
                        phone: phone,
                        specialty: specialty,
                        created_at: new Date().toISOString()
                    }]);

                if (profileError) throw profileError;

                // Log activity
                await this.logActivity(authData.user.id, 'REGISTER', `User registered as ${role}`);

                return { success: true, message: 'Registration successful! Please check your email to verify your account.' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: error.message || 'Registration failed. Please try again.' };
        }
    }

    async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Log activity
            await this.logActivity(data.user.id, 'LOGIN', 'User logged in');

            return { success: true, message: 'Login successful!' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message || 'Login failed. Please check your credentials.' };
        }
    }

    async logout() {
        if (this.currentUser) {
            await this.logActivity(this.currentUser.id, 'LOGOUT', 'User logged out');
        }

        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
            return { success: false, message: 'Logout failed.' };
        }

        this.currentUser = null;
        this.userProfile = null;
        return { success: true, message: 'Logged out successfully.' };
    }

    async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;

            return { success: true, message: 'Password reset email sent!' };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, message: error.message || 'Password reset failed.' };
        }
    }

    routeBasedOnRole() {
        if (!this.userProfile) return;

        console.log('Routing based on role:', this.userProfile.role);

        switch (this.userProfile.role) {
            case 'patient':
                this.showPatientDashboard();
                break;
            case 'doctor':
                this.showDoctorDashboard();
                break;
            case 'admin':
                this.showAdminDashboard();
                break;
            default:
                this.showLoginPage();
        }
    }

    showLoginPage() {
        console.log('Showing login page...');
        const app = document.getElementById('app');
        if (!app) {
            console.error('App element not found!');
            return;
        }
        
        try {
            app.innerHTML = `
                <div class="container mt-5">
                    <div class="row justify-content-center">
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header text-center">
                                    <h3>Telehealth Communication System</h3>
                                    <p class="mb-0">Login to your account</p>
                                </div>
                                <div class="card-body">
                                    <form id="loginForm">
                                        <div class="mb-3">
                                            <label for="email" class="form-label">Email</label>
                                            <input type="email" class="form-control" id="email" required>
                                        </div>
                                        <div class="mb-3">
                                            <label for="password" class="form-label">Password</label>
                                            <input type="password" class="form-control" id="password" required>
                                        </div>
                                        <button type="submit" class="btn btn-primary w-100">Login</button>
                                    </form>
                                    <div class="text-center mt-3">
                                        <p>Don't have an account? <a href="#" id="showRegister">Register</a></p>
                                        <p><a href="#" id="forgotPassword">Forgot Password?</a></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Attach event listeners
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                const result = await this.login(email, password);
                if (result.success) {
                    // Will be redirected by auth state change
                } else {
                    alert(result.message);
                }
            });

            document.getElementById('showRegister').addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterPage();
            });

            document.getElementById('forgotPassword').addEventListener('click', async (e) => {
                e.preventDefault();
                const email = prompt('Enter your email address:');
                if (email) {
                    const result = await this.resetPassword(email);
                    alert(result.message);
                }
            });
            
            console.log('Login page rendered successfully');
        } catch (error) {
            console.error('Error rendering login page:', error);
            app.innerHTML = `<div class="alert alert-danger m-5">Failed to load login page: ${error.message}</div>`;
        }
    }

    showRegisterPage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header text-center">
                                <h3>Create New Account</h3>
                                <p class="mb-0">Join the Telehealth Communication System</p>
                            </div>
                            <div class="card-body">
                                <form id="registerForm">
                                    <div class="mb-3">
                                        <label for="fullName" class="form-label">Full Name</label>
                                        <input type="text" class="form-control" id="fullName" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="regEmail" class="form-label">Email</label>
                                        <input type="email" class="form-control" id="regEmail" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="regPassword" class="form-label">Password</label>
                                        <input type="password" class="form-control" id="regPassword" required minlength="6">
                                        <small class="text-muted">Minimum 6 characters</small>
                                    </div>
                                    <div class="mb-3">
                                        <label for="confirmPassword" class="form-label">Confirm Password</label>
                                        <input type="password" class="form-control" id="confirmPassword" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="role" class="form-label">Role</label>
                                        <select class="form-select" id="role" required>
                                            <option value="">Select your role</option>
                                            <option value="patient">Patient</option>
                                            <option value="doctor">Doctor</option>
                                        </select>
                                    </div>
                                    <div class="mb-3" id="specialtyField" style="display: none;">
                                        <label for="specialty" class="form-label">Medical Specialty</label>
                                        <select class="form-select" id="specialty">
                                            <option value="">Select specialty</option>
                                            <option value="General Practice">General Practice</option>
                                            <option value="Cardiology">Cardiology</option>
                                            <option value="Dermatology">Dermatology</option>
                                            <option value="Pediatrics">Pediatrics</option>
                                            <option value="Orthopedics">Orthopedics</option>
                                            <option value="Neurology">Neurology</option>
                                            <option value="Psychiatry">Psychiatry</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label for="phone" class="form-label">Phone Number (Optional)</label>
                                        <input type="tel" class="form-control" id="phone">
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">Register</button>
                                </form>
                                <div class="text-center mt-3">
                                    <p>Already have an account? <a href="#" id="showLogin">Login</a></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Show/hide specialty field based on role
        document.getElementById('role').addEventListener('change', (e) => {
            const specialtyField = document.getElementById('specialtyField');
            specialtyField.style.display = e.target.value === 'doctor' ? 'block' : 'none';
        });

        // Attach event listeners
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const role = document.getElementById('role').value;
            const phone = document.getElementById('phone').value;
            const specialty = document.getElementById('specialty').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            const result = await this.register(email, password, fullName, role, phone, specialty);
            alert(result.message);
            
            if (result.success) {
                this.showLoginPage();
            }
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginPage();
        });
    }

    showPatientDashboard() {
        if (window.patientManager) {
            window.patientManager.showDashboard();
        } else {
            console.error('PatientManager not found');
            this.showLoginPage();
        }
    }

    showDoctorDashboard() {
        if (window.doctorManager) {
            window.doctorManager.showDashboard();
        } else {
            console.error('DoctorManager not found');
            this.showLoginPage();
        }
    }

    showAdminDashboard() {
        if (window.adminManager) {
            window.adminManager.showDashboard();
        } else {
            console.error('AdminManager not found');
            this.showLoginPage();
        }
    }

    async logActivity(userId, action, details) {
        try {
            await supabase
                .from('activity_logs')
                .insert([{
                    user_id: userId,
                    action: action,
                    details: details,
                    timestamp: new Date().toISOString()
                }]);
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getUserRole() {
        return this.userProfile ? this.userProfile.role : null;
    }

    getUserId() {
        return this.currentUser ? this.currentUser.id : null;
    }

    getUserProfile() {
        return this.userProfile;
    }
}

// Initialize auth manager
const authManager = new AuthManager();