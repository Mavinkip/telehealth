/*
 * File: auth.js
 * Purpose: Handle user authentication (login, register, logout, session management)
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.retryCount = 0;
        this.init();
    }

    async init() {
        try {
            console.log('🔐 AuthManager initializing...');
            
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                this.currentUser = session.user;
                await this.loadUserProfile();
            } else {
                this.showLoginPage();
            }

            supabase.auth.onAuthStateChange((event, session) => {
                console.log('🔄 Auth state changed:', event);
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
            console.error('❌ Auth init error:', error);
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
            
            // Wait for managers to be ready
            this.waitForManagersAndRoute();
            
        } catch (error) {
            console.error('❌ Profile error:', error);
        }
    }

    waitForManagersAndRoute() {
        let attempts = 0;
        const maxAttempts = 20;
        
        const checkManagers = () => {
            attempts++;
            console.log(`⏳ Checking managers... attempt ${attempts}`);
            
            // Check if the appropriate manager exists
            const role = this.userProfile?.role;
            let managerExists = false;
            
            if (role === 'patient') {
                managerExists = typeof patientManager !== 'undefined' || window.patientManager;
            } else if (role === 'doctor') {
                managerExists = typeof doctorManager !== 'undefined' || window.doctorManager;
            } else if (role === 'admin') {
                managerExists = typeof adminManager !== 'undefined' || window.adminManager;
            }
            
            if (managerExists) {
                console.log(`✅ Manager found for role: ${role}`);
                this.routeBasedOnRole();
            } else if (attempts < maxAttempts) {
                console.log(`⏳ Waiting for manager... (${attempts}/${maxAttempts})`);
                setTimeout(checkManagers, 200);
            } else {
                console.error(`❌ Manager not found after ${maxAttempts} attempts`);
                // Try to route anyway
                this.routeBasedOnRole();
            }
        };
        
        // Start checking after a short delay
        setTimeout(checkManagers, 300);
    }

    async register(email, password, fullName, role, phone = '', specialty = '') {
        try {
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

                await this.logActivity(authData.user.id, 'REGISTER', `User registered as ${role}`);

                return { success: true, message: 'Registration successful! Please check your email to verify your account.' };
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
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

            this.currentUser = data.user;
            await this.loadUserProfile();

            return { success: true, message: 'Login successful!' };
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, message: error.message || 'Login failed. Please check your credentials.' };
        }
    }

    async logout() {
        if (this.currentUser) {
            await this.logActivity(this.currentUser.id, 'LOGOUT', 'User logged out');
        }

        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('❌ Logout error:', error);
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
            console.error('❌ Password reset error:', error);
            return { success: false, message: error.message || 'Password reset failed.' };
        }
    }

    routeBasedOnRole() {
        if (!this.userProfile) {
            this.showLoginPage();
            return;
        }

        const role = this.userProfile.role;
        console.log(`🎯 Routing based on role: ${role}`);

        // Try multiple ways to get the manager
        let manager = null;
        
        if (role === 'patient') {
            manager = window.patientManager || (typeof patientManager !== 'undefined' ? patientManager : null);
            if (manager) {
                console.log('✅ Found patientManager');
                manager.showDashboard();
                return;
            }
            console.error('❌ patientManager not found');
        } else if (role === 'doctor') {
            manager = window.doctorManager || (typeof doctorManager !== 'undefined' ? doctorManager : null);
            if (manager) {
                console.log('✅ Found doctorManager');
                manager.showDashboard();
                return;
            }
            console.error('❌ doctorManager not found');
        } else if (role === 'admin') {
            manager = window.adminManager || (typeof adminManager !== 'undefined' ? adminManager : null);
            if (manager) {
                console.log('✅ Found adminManager');
                manager.showDashboard();
                return;
            }
            console.error('❌ adminManager not found');
        }

        // If we get here, the manager wasn't found
        console.error(`❌ No manager found for role: ${role}`);
        
        // Show the appropriate dashboard anyway using direct rendering
        if (role === 'patient') {
            this.showPatientDashboardFallback();
        } else if (role === 'doctor') {
            this.showDoctorDashboardFallback();
        } else if (role === 'admin') {
            this.showAdminDashboardFallback();
        } else {
            this.showLoginPage();
        }
    }

    // Fallback methods - render dashboard directly without manager
    showPatientDashboardFallback() {
        console.log('📊 Rendering patient dashboard (fallback)...');
        const app = document.getElementById('app');
        const profile = this.userProfile;
        
        if (!profile) {
            this.showLoginPage();
            return;
        }

        app.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
                <div class="container">
                    <a class="navbar-brand" href="#">🏥 Telehealth</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item"><a class="nav-link active" href="#">Dashboard</a></li>
                            <li class="nav-item"><a class="nav-link" href="#" onclick="alert('Appointments coming soon!')">Appointments</a></li>
                            <li class="nav-item"><a class="nav-link" href="#" onclick="alert('Medical Records coming soon!')">Medical Records</a></li>
                        </ul>
                        <span class="navbar-text me-3">👤 ${profile.full_name}</span>
                        <button class="btn btn-outline-danger btn-sm" id="logoutBtn">Logout</button>
                    </div>
                </div>
            </nav>
            <div class="container mt-4">
                <div class="row">
                    <div class="col-12">
                        <h2>Patient Dashboard</h2>
                        <p class="text-muted">Welcome to your telehealth portal</p>
                    </div>
                </div>
                <div class="row mt-4">
                    <div class="col-md-4">
                        <div class="card dashboard-card" onclick="alert('Book Appointment coming soon!')">
                            <div class="card-body text-center">
                                <div class="icon">📅</div>
                                <h4>Book Appointment</h4>
                                <p class="text-muted">Schedule consultation</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card dashboard-card" onclick="alert('Medical Records coming soon!')">
                            <div class="card-body text-center">
                                <div class="icon">📋</div>
                                <h4>Medical Records</h4>
                                <p class="text-muted">View health history</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card dashboard-card" onclick="alert('Messages coming soon!')">
                            <div class="card-body text-center">
                                <div class="icon">💬</div>
                                <h4>Messages</h4>
                                <p class="text-muted">Chat with doctors</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('logoutBtn').addEventListener('click', async () => {
            const result = await this.logout();
            if (result.success) alert(result.message);
        });
    }

    showDoctorDashboardFallback() {
        const app = document.getElementById('app');
        const profile = this.userProfile;
        
        if (!profile) {
            this.showLoginPage();
            return;
        }

        app.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
                <div class="container">
                    <a class="navbar-brand" href="#">🏥 Telehealth</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item"><a class="nav-link active" href="#">Dashboard</a></li>
                            <li class="nav-item"><a class="nav-link" href="#" onclick="alert('Appointments coming soon!')">Appointments</a></li>
                            <li class="nav-item"><a class="nav-link" href="#" onclick="alert('Patients coming soon!')">Patients</a></li>
                        </ul>
                        <span class="navbar-text me-3">👨‍⚕️ Dr. ${profile.full_name}</span>
                        <button class="btn btn-outline-danger btn-sm" id="logoutBtn">Logout</button>
                    </div>
                </div>
            </nav>
            <div class="container mt-4">
                <h2>Doctor Dashboard</h2>
                <p class="text-muted">Welcome to your practice portal</p>
                <div class="row mt-4">
                    <div class="col-md-4">
                        <div class="card dashboard-card" onclick="alert('Today\'s Schedule coming soon!')">
                            <div class="card-body text-center">
                                <div class="icon">📅</div>
                                <h4>Today's Schedule</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card dashboard-card" onclick="alert('Patients coming soon!')">
                            <div class="card-body text-center">
                                <div class="icon">👥</div>
                                <h4>My Patients</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card dashboard-card" onclick="alert('Video Call coming soon!')">
                            <div class="card-body text-center">
                                <div class="icon">🎥</div>
                                <h4>Video Consult</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('logoutBtn').addEventListener('click', async () => {
            const result = await this.logout();
            if (result.success) alert(result.message);
        });
    }

    showAdminDashboardFallback() {
        const app = document.getElementById('app');
        const profile = this.userProfile;
        
        if (!profile) {
            this.showLoginPage();
            return;
        }

        app.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
                <div class="container">
                    <a class="navbar-brand" href="#">🏥 Admin Panel</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item"><a class="nav-link active" href="#">Dashboard</a></li>
                            <li class="nav-item"><a class="nav-link" href="#" onclick="alert('Users coming soon!')">Users</a></li>
                            <li class="nav-item"><a class="nav-link" href="#" onclick="alert('Reports coming soon!')">Reports</a></li>
                        </ul>
                        <span class="navbar-text me-3">🔐 Admin: ${profile.full_name}</span>
                        <button class="btn btn-outline-danger btn-sm" id="logoutBtn">Logout</button>
                    </div>
                </div>
            </nav>
            <div class="container mt-4">
                <h2>Admin Dashboard</h2>
                <p class="text-muted">System Administration</p>
                <div class="row mt-4">
                    <div class="col-md-3">
                        <div class="card dashboard-card" onclick="alert('User Management coming soon!')">
                            <div class="card-body text-center">
                                <div class="icon">👥</div>
                                <h4>Users</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card dashboard-card" onclick="alert('Appointments coming soon!')">
                            <div class="card-body text-center">
                                <div class="icon">📅</div>
                                <h4>Appointments</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card dashboard-card" onclick="alert('Reports coming soon!')">
                            <div class="card-body text-center">
                                <div class="icon">📊</div>
                                <h4>Reports</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card dashboard-card" onclick="alert('Logs coming soon!')">
                            <div class="card-body text-center">
                                <div class="icon">📋</div>
                                <h4>Logs</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('logoutBtn').addEventListener('click', async () => {
            const result = await this.logout();
            if (result.success) alert(result.message);
        });
    }

    showLoginPage() {
        console.log('📝 Showing login page...');
        const app = document.getElementById('app');
        if (!app) {
            console.error('❌ App element not found!');
            return;
        }
        
        try {
            app.innerHTML = `
                <div class="container mt-5">
                    <div class="row justify-content-center">
                        <div class="col-md-6">
                            <div class="card shadow">
                                <div class="card-header bg-primary text-white text-center">
                                    <h3>🏥 Telehealth System</h3>
                                    <p class="mb-0">Login to your account</p>
                                </div>
                                <div class="card-body">
                                    <form id="loginForm">
                                        <div class="mb-3">
                                            <label class="form-label">Email</label>
                                            <input type="email" class="form-control" id="email" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Password</label>
                                            <input type="password" class="form-control" id="password" required>
                                        </div>
                                        <button type="submit" class="btn btn-primary w-100">Login</button>
                                    </form>
                                    <div class="text-center mt-3">
                                        <p>Don't have an account? <a href="#" id="showRegister">Register</a></p>
                                        <p><a href="#" id="forgotPassword">Forgot Password?</a></p>
                                    </div>
                                    <div id="loginMessage" class="mt-3"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const message = document.getElementById('loginMessage');
                
                message.innerHTML = '<div class="alert alert-info">⏳ Logging in...</div>';
                
                const result = await this.login(email, password);
                if (result.success) {
                    message.innerHTML = '<div class="alert alert-success">✅ Login successful!</div>';
                } else {
                    message.innerHTML = '<div class="alert alert-danger">❌ ' + result.message + '</div>';
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
            
            console.log('✅ Login page rendered');
        } catch (error) {
            console.error('❌ Error rendering login page:', error);
            app.innerHTML = `<div class="alert alert-danger m-5">Failed to load login page: ${error.message}</div>`;
        }
    }

    showRegisterPage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-8">
                        <div class="card shadow">
                            <div class="card-header bg-primary text-white text-center">
                                <h3>📝 Create Account</h3>
                                <p class="mb-0">Join the Telehealth System</p>
                            </div>
                            <div class="card-body">
                                <form id="registerForm">
                                    <div class="mb-3">
                                        <label class="form-label">Full Name</label>
                                        <input type="text" class="form-control" id="fullName" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Email</label>
                                        <input type="email" class="form-control" id="regEmail" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Password</label>
                                        <input type="password" class="form-control" id="regPassword" required minlength="6">
                                        <small class="text-muted">Minimum 6 characters</small>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Confirm Password</label>
                                        <input type="password" class="form-control" id="confirmPassword" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Role</label>
                                        <select class="form-select" id="role" required>
                                            <option value="">Select your role</option>
                                            <option value="patient">Patient</option>
                                            <option value="doctor">Doctor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">Register</button>
                                </form>
                                <div class="text-center mt-3">
                                    <p>Already have an account? <a href="#" id="showLogin">Login</a></p>
                                </div>
                                <div id="registerMessage" class="mt-3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const role = document.getElementById('role').value;
            const message = document.getElementById('registerMessage');

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            message.innerHTML = '<div class="alert alert-info">⏳ Registering...</div>';

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
            console.error('❌ Error logging activity:', error);
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
window.authManager = authManager;
console.log('✅ AuthManager initialized');