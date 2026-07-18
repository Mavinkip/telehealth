/*
 * File: auth.js
 * Purpose: Authentication, registration, session management, routing
 *
 * KEY CHANGES vs original:
 *  1. Registration no longer allows 'admin' role — admins are created directly
 *     in the Supabase dashboard or via the seed script.
 *  2. Doctor registration creates the account but sets is_active = false.
 *     An admin must activate the doctor before patients can book them.
 *  3. *** FIX: We no longer manually insert into `profiles` after signUp().
 *     The Supabase trigger `handle_new_user` (in 01_schema.sql) creates the
 *     profiles row automatically.  Doing both caused:
 *       "duplicate key value violates unique constraint profiles_pkey"
 *  4. Inactive doctor accounts CAN log in but a banner tells them they are
 *     awaiting activation.
 */

class AuthManager {
    constructor() {
        this.currentUser  = null;
        this.userProfile  = null;
    }

    // ── Called once on DOMContentLoaded by app.js ─────────────────────────
    async init() {
        console.log('🔐 AuthManager: initialising...');

        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            this.currentUser = session.user;
            await this.loadAndRoute();
        } else {
            this.showLoginPage();
        }

        // Keep session in sync
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                await this.loadAndRoute();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser  = null;
                this.userProfile  = null;
                this.showLoginPage();
            }
        });
    }

    // ── Load profile then route ───────────────────────────────────────────
    async loadAndRoute() {
        await this.loadUserProfile();
        if (this.userProfile) this.routeBasedOnRole();
    }

    async loadUserProfile() {
        if (!this.currentUser) return;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', this.currentUser.id)
            .single();

        if (error) {
            console.error('❌ Profile load error:', error.message);
            // Profile may not exist yet (trigger latency) — wait and retry once
            await new Promise(r => setTimeout(r, 800));
            const { data: retry } = await supabase
                .from('profiles').select('*').eq('id', this.currentUser.id).single();
            this.userProfile = retry || null;
        } else {
            this.userProfile = data;
        }
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────
    async login(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, message: error.message };

        this.currentUser = data.user;
        await this.loadUserProfile();

        if (!this.userProfile) {
            return { success: false, message: 'Profile not found. Please contact support.' };
        }

        // Blocked accounts
        if (!this.userProfile.is_active) {
            // Doctors pending activation can still log in — we show a banner
            if (this.userProfile.role === 'doctor') {
                await this.logActivity(data.user.id, 'login', { email, note: 'pending_activation' });
                return { success: true, pendingActivation: true };
            }
            // Disabled patients / other roles are fully blocked
            await supabase.auth.signOut();
            return { success: false, message: 'Your account has been disabled. Contact an administrator.' };
        }

        await this.logActivity(data.user.id, 'login', { email });
        return { success: true };
    }

    // ── REGISTER ──────────────────────────────────────────────────────────
    // Only 'patient' and 'doctor' are allowed here.
    // Admin accounts are created exclusively in the Supabase dashboard.
    async register(email, password, fullName, role, phone = '', specialty = '') {

        // Hard block: admin cannot be self-registered
        if (role === 'admin') {
            return { success: false, message: 'Admin accounts cannot be created here. Contact the system administrator.' };
        }

        if (!['patient', 'doctor'].includes(role)) {
            return { success: false, message: 'Invalid role selected.' };
        }

        // ⚠️  IMPORTANT: Only call auth.signUp() here.
        //     The Postgres trigger `handle_new_user` (see 01_schema.sql) will
        //     automatically INSERT a row into `profiles` using the metadata below.
        //     Do NOT manually insert into profiles — that causes the
        //     "duplicate key violates constraint profiles_pkey" error.
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role,
                    // Doctors start inactive; patients start active
                    is_active: role === 'patient'
                }
            }
        });

        if (authError) return { success: false, message: authError.message };
        if (!authData.user) return { success: false, message: 'Registration failed. Try again.' };

        // Update extra fields (phone, specialty) that the trigger can't set
        // We do this with a separate update rather than insert to avoid the duplicate error
        if (phone || specialty) {
            await supabase
                .from('profiles')
                .update({ phone: phone || null, specialty: specialty || null })
                .eq('id', authData.user.id);
        }

        await this.logActivity(authData.user.id, 'register', { email, role });

        if (role === 'doctor') {
            return {
                success: true,
                message: 'Account created! Your account is pending administrator approval. You can log in, but patients cannot book appointments with you until you are activated.'
            };
        }

        return { success: true, message: 'Account created! Please check your email to confirm, then log in.' };
    }

    // ── LOGOUT ────────────────────────────────────────────────────────────
    async logout() {
        if (this.currentUser) {
            await this.logActivity(this.currentUser.id, 'logout', {});
        }
        const { error } = await supabase.auth.signOut();
        if (error) return { success: false, message: error.message };
        this.currentUser  = null;
        this.userProfile  = null;
        return { success: true, message: 'Logged out successfully.' };
    }

    // ── ROUTING ───────────────────────────────────────────────────────────
    routeBasedOnRole() {
        const role = this.userProfile?.role;
        if (!role) { this.showLoginPage(); return; }

        // Doctor pending activation — allow login but show holding page
        if (role === 'doctor' && !this.userProfile.is_active) {
            this.showDoctorPendingPage();
            return;
        }

        if (role === 'patient') {
            window.patientManager?.showDashboard();
        } else if (role === 'doctor') {
            window.doctorManager?.showDashboard();
        } else if (role === 'admin') {
            window.adminManager?.showDashboard();
        } else {
            this.showLoginPage();
        }
    }

    // ── PAGES ─────────────────────────────────────────────────────────────
    showLoginPage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="auth-page">
                <div class="auth-card">
                    <div class="auth-header">
                        <div class="auth-logo">TH</div>
                        <h2>Telehealth System</h2>
                        <p>Sign in to your account</p>
                    </div>
                    <div id="loginMsg"></div>
                    <form id="loginForm">
                        <div class="field">
                            <label>Email address</label>
                            <input type="email" id="loginEmail" class="input" required autocomplete="email" placeholder="you@example.com">
                        </div>
                        <div class="field">
                            <label>Password</label>
                            <input type="password" id="loginPw" class="input" required autocomplete="current-password" placeholder="••••••••">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="loginBtn">Sign in</button>
                    </form>
                    <div class="auth-links">
                        <a href="#" id="showForgotPw">Forgot password?</a>
                        &nbsp;·&nbsp;
                        <a href="#" id="showRegister">Create an account</a>
                    </div>
                </div>
            </div>`;

        document.getElementById('loginForm').addEventListener('submit', async e => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const pw    = document.getElementById('loginPw').value;
            const msg   = document.getElementById('loginMsg');
            const btn   = document.getElementById('loginBtn');

            btn.disabled = true;
            btn.textContent = 'Signing in…';
            msg.innerHTML = '';

            const result = await this.login(email, pw);

            if (result.success) {
                if (result.pendingActivation) {
                    this.showDoctorPendingPage();
                } else {
                    this.routeBasedOnRole();
                }
            } else {
                msg.innerHTML = `<div class="alert alert-error">${result.message}</div>`;
                btn.disabled = false;
                btn.textContent = 'Sign in';
            }
        });

        document.getElementById('showRegister').addEventListener('click', e => {
            e.preventDefault(); this.showRegisterPage();
        });

        document.getElementById('showForgotPw').addEventListener('click', async e => {
            e.preventDefault();
            const email = prompt('Enter your email address:');
            if (!email) return;
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            alert(error ? `Error: ${error.message}` : 'Password reset email sent! Check your inbox.');
        });
    }

    showRegisterPage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="auth-page">
                <div class="auth-card" style="max-width:520px">
                    <div class="auth-header">
                        <div class="auth-logo">TH</div>
                        <h2>Create Account</h2>
                        <p>Join the Telehealth System</p>
                    </div>
                    <div id="regMsg"></div>
                    <form id="registerForm">
                        <div class="field">
                            <label>Full name</label>
                            <input type="text" id="regName" class="input" required placeholder="Jane Mwangi">
                        </div>
                        <div class="field">
                            <label>Email address</label>
                            <input type="email" id="regEmail" class="input" required placeholder="you@example.com">
                        </div>
                        <div class="form-row">
                            <div class="field">
                                <label>Password</label>
                                <input type="password" id="regPw" class="input" required minlength="8">
                            </div>
                            <div class="field">
                                <label>Confirm password</label>
                                <input type="password" id="regPwConfirm" class="input" required>
                            </div>
                        </div>
                        <p class="field-hint" style="margin-top:-8px;margin-bottom:12px">Minimum 8 characters.</p>
                        <div class="field">
                            <label>I am registering as</label>
                            <select id="regRole" class="input" required>
                                <option value="">— select —</option>
                                <option value="patient">Patient</option>
                                <option value="doctor">Doctor / Clinician</option>
                                <!-- Admin is intentionally omitted. Admin accounts are
                                     created by the system administrator directly. -->
                            </select>
                        </div>
                        <div id="doctorFields" style="display:none">
                            <div class="alert alert-info" style="margin-bottom:12px">
                                <strong>Doctor accounts</strong> require administrator approval before
                                patients can book appointments with you. You will be notified when
                                your account is activated.
                            </div>
                            <div class="field">
                                <label>Specialty</label>
                                <select id="regSpecialty" class="input">
                                    <option value="">Select specialty</option>
                                    <option>General Practice</option>
                                    <option>Cardiology</option>
                                    <option>Dermatology</option>
                                    <option>Pediatrics</option>
                                    <option>Orthopedics</option>
                                    <option>Neurology</option>
                                    <option>Psychiatry</option>
                                    <option>Obstetrics &amp; Gynecology</option>
                                    <option>Ophthalmology</option>
                                    <option>ENT</option>
                                </select>
                            </div>
                        </div>
                        <div class="field">
                            <label>Phone number</label>
                            <input type="tel" id="regPhone" class="input" placeholder="+254 7XX XXX XXX">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="regBtn">Create account</button>
                    </form>
                    <div class="auth-links">
                        Already have an account? <a href="#" id="showLogin">Sign in</a>
                    </div>
                </div>
            </div>`;

        document.getElementById('regRole').addEventListener('change', e => {
            document.getElementById('doctorFields').style.display =
                e.target.value === 'doctor' ? 'block' : 'none';
        });

        document.getElementById('registerForm').addEventListener('submit', async e => {
            e.preventDefault();
            const name      = document.getElementById('regName').value.trim();
            const email     = document.getElementById('regEmail').value.trim();
            const pw        = document.getElementById('regPw').value;
            const pwConfirm = document.getElementById('regPwConfirm').value;
            const role      = document.getElementById('regRole').value;
            const specialty = document.getElementById('regSpecialty')?.value || '';
            const phone     = document.getElementById('regPhone').value.trim();
            const msg       = document.getElementById('regMsg');
            const btn       = document.getElementById('regBtn');

            msg.innerHTML = '';

            if (!role) {
                msg.innerHTML = '<div class="alert alert-error">Please select your role.</div>';
                return;
            }
            if (pw !== pwConfirm) {
                msg.innerHTML = '<div class="alert alert-error">Passwords do not match.</div>';
                return;
            }
            if (pw.length < 8) {
                msg.innerHTML = '<div class="alert alert-error">Password must be at least 8 characters.</div>';
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Creating account…';

            const result = await this.register(email, pw, name, role, phone, specialty);

            msg.innerHTML = `<div class="alert alert-${result.success ? 'success' : 'error'}">${result.message}</div>`;
            btn.disabled = false;
            btn.textContent = 'Create account';

            if (result.success) {
                setTimeout(() => this.showLoginPage(), 3000);
            }
        });

        document.getElementById('showLogin').addEventListener('click', e => {
            e.preventDefault(); this.showLoginPage();
        });
    }

    showDoctorPendingPage() {
        const app     = document.getElementById('app');
        const profile = this.userProfile;

        app.innerHTML = `
            <div class="auth-page">
                <div class="auth-card" style="max-width:500px;text-align:center">
                    <div style="font-size:48px;margin-bottom:16px">⏳</div>
                    <h2>Awaiting Activation</h2>
                    <p class="text-muted" style="margin-bottom:20px">
                        Hello, Dr. <strong>${profile?.full_name || ''}</strong>.<br><br>
                        Your account is pending administrator approval.
                        Once an admin activates your account, patients will be able to book
                        appointments with you and you will have full access to your dashboard.
                    </p>
                    <div class="alert alert-info">
                        You will receive an email notification when your account is activated.
                        If you believe this is taking too long, contact the system administrator.
                    </div>
                    <button class="btn btn-secondary btn-block" id="pendingLogoutBtn">
                        Sign out
                    </button>
                </div>
            </div>`;

        document.getElementById('pendingLogoutBtn').addEventListener('click', async () => {
            await this.logout();
            this.showLoginPage();
        });
    }

    // ── HELPERS ───────────────────────────────────────────────────────────
    async logActivity(userId, action, details = {}) {
        try {
            await supabase.from('activity_logs').insert({
                user_id: userId, action, details
            });
        } catch (_) { /* non-fatal */ }
    }

    isAuthenticated()  { return !!this.currentUser; }
    getUserRole()      { return this.userProfile?.role || null; }
    getUserId()        { return this.currentUser?.id || null; }
    getUserProfile()   { return this.userProfile; }
}

const authManager = new AuthManager();
window.authManager = authManager;
console.log('✅ AuthManager loaded');