/*
 * File: app.js
 * Purpose: Main application with sidebar layout
 */

class App {
    constructor() {
        this.currentRole = null;
        this.currentView = 'dashboard';
        this.isSidebarCollapsed = false;
        this.navItems = [];
        this.init();
    }

    init() {
        console.log('🚀 App initializing...');
        this.waitForAuth();
    }

    waitForAuth() {
        const checkAuth = () => {
            if (authManager && authManager.currentUser) {
                console.log('✅ Auth ready, rendering layout...');
                this.renderLayout();
            } else if (authManager && !authManager.currentUser) {
                console.log('⏳ No user, auth.js will handle login');
            } else {
                console.log('⏳ Waiting for auth...');
                setTimeout(checkAuth, 200);
            }
        };
        checkAuth();
    }

    renderLayout() {
        const profile = authManager.getUserProfile();
        if (!profile) {
            authManager.showLoginPage();
            return;
        }

        this.currentRole = profile.role;
        this.navItems = this.getNavItems(profile.role);
        
        const app = document.getElementById('app');
        app.innerHTML = this.getLayoutHTML(profile);
        
        this.attachEvents();
        this.loadView('dashboard');
    }

    getNavItems(role) {
        const common = [
            { id: 'dashboard', icon: '🏠', label: 'Dashboard' }
        ];

        const roleSpecific = {
            admin: [
                { id: 'users', icon: '👥', label: 'Users' },
                { id: 'appointments', icon: '📅', label: 'Appointments' },
                { id: 'payments', icon: '💰', label: 'Payments' },
                { id: 'reports', icon: '📊', label: 'Reports' },
                { id: 'logs', icon: '📋', label: 'Activity Logs' }
            ],
            doctor: [
                { id: 'appointments', icon: '📅', label: 'Appointments' },
                { id: 'patients', icon: '👥', label: 'Patients' },
                { id: 'chat', icon: '💬', label: 'Messages' },
                { id: 'profile', icon: '⚙️', label: 'Profile' }
            ],
            patient: [
                { id: 'appointments', icon: '📅', label: 'My Appointments' },
                { id: 'doctors', icon: '👨‍⚕️', label: 'Find Doctors' },
                { id: 'chat', icon: '💬', label: 'Messages' },
                { id: 'profile', icon: '⚙️', label: 'Profile' }
            ]
        };

        return [...common, ...(roleSpecific[role] || [])];
    }

    getLayoutHTML(profile) {
        const roleColors = {
            admin: '#7C3AED',
            doctor: '#2563EB',
            patient: '#10B981'
        };
        const color = roleColors[this.currentRole] || '#2563EB';
        const initial = profile.full_name?.charAt(0)?.toUpperCase() || 'U';
        const roleLabel = this.currentRole.charAt(0).toUpperCase() + this.currentRole.slice(1);

        const navHTML = this.navItems.map(item => `
            <button class="nav-item" data-view="${item.id}">
                <span class="nav-icon">${item.icon}</span>
                <span class="nav-label">${item.label}</span>
            </button>
        `).join('');

        return `
            <div class="app-layout">
                <div class="sidebar-overlay" id="sidebarOverlay"></div>

                <aside class="sidebar" id="app-sidebar">
                    <div class="sidebar-header">
                        <a href="#" class="brand" onclick="app.loadView('dashboard'); return false;">
                            <div class="brand-icon">TH</div>
                            <span class="brand-text">TeleHealth</span>
                        </a>
                        <button class="sidebar-toggle" id="sidebarToggle">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                    </div>
                    <nav class="sidebar-nav">
                        <div class="nav-section-title">Main Menu</div>
                        ${navHTML}
                    </nav>
                    <div class="sidebar-footer">
                        <button class="nav-item" id="logoutBtn">
                            <span class="nav-icon">🚪</span>
                            <span class="nav-label">Logout</span>
                        </button>
                    </div>
                </aside>

                <main class="main-content" id="mainContent">
                    <header class="top-header">
                        <div class="header-left">
                            <button class="hamburger" id="hamburgerBtn">
                                <i class="fas fa-bars"></i>
                            </button>
                            <span class="page-title" id="pageTitle">Dashboard</span>
                        </div>
                        <div class="header-right">
                            <button class="notification-btn" id="notificationBtn">
                                <i class="fas fa-bell"></i>
                                <span class="badge-dot"></span>
                            </button>
                            <div class="user-profile">
                                <div class="avatar" style="background:${color};">${initial}</div>
                                <div class="user-info">
                                    <span class="name">${profile.full_name}</span>
                                    <span class="role">${roleLabel}</span>
                                </div>
                            </div>
                        </div>
                    </header>
                    <div class="content-area" id="app-content">
                        <div class="text-center py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="text-muted mt-2">Loading...</p>
                        </div>
                    </div>
                </main>
            </div>
        `;
    }

    attachEvents() {
        // Sidebar toggle (desktop)
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Hamburger (mobile)
        document.getElementById('hamburgerBtn')?.addEventListener('click', () => {
            this.toggleMobileSidebar();
        });

        // Overlay (mobile)
        document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
            this.closeMobileSidebar();
        });

        // Navigation items
        document.querySelectorAll('.sidebar-nav .nav-item[data-view]').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                this.loadView(view);
                this.closeMobileSidebar();
            });
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
            const result = await authManager.logout();
            if (result.success) {
                window.location.reload();
            }
        });

        // Keyboard shortcut: Ctrl+B
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                if (window.innerWidth > 992) {
                    this.toggleSidebar();
                } else {
                    this.toggleMobileSidebar();
                }
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 992) {
                document.getElementById('sidebarOverlay')?.classList.remove('active');
                document.querySelector('.sidebar')?.classList.remove('open');
            }
        });

        this.updateActiveNav('dashboard');
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.getElementById('mainContent');
        
        if (window.innerWidth > 992) {
            this.isSidebarCollapsed = !this.isSidebarCollapsed;
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
            
            const icon = document.getElementById('sidebarToggle')?.querySelector('i');
            if (icon) {
                icon.className = this.isSidebarCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
            }
        }
    }

    toggleMobileSidebar() {
        document.querySelector('.sidebar')?.classList.toggle('open');
        document.getElementById('sidebarOverlay')?.classList.toggle('active');
    }

    closeMobileSidebar() {
        document.querySelector('.sidebar')?.classList.remove('open');
        document.getElementById('sidebarOverlay')?.classList.remove('active');
    }

    updateActiveNav(view) {
        document.querySelectorAll('.sidebar-nav .nav-item[data-view]').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });
        
        const title = document.getElementById('pageTitle');
        const navItem = this.navItems.find(n => n.id === view);
        if (title && navItem) {
            title.textContent = navItem.label;
        }
    }

    async loadView(view) {
        this.currentView = view;
        this.updateActiveNav(view);

        const content = document.getElementById('app-content');
        if (!content) return;

        // Show loading
        content.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="text-muted mt-2">Loading...</p>
            </div>
        `;

        setTimeout(async () => {
            const role = this.currentRole;
            let result = null;

            switch(role) {
                case 'admin':
                    result = await this.handleAdminView(view);
                    break;
                case 'doctor':
                    result = await this.handleDoctorView(view);
                    break;
                case 'patient':
                    result = await this.handlePatientView(view);
                    break;
                default:
                    content.innerHTML = `<p class="text-danger">Unknown role: ${role}</p>`;
                    return;
            }

            if (result) {
                content.innerHTML = result;
            }
        }, 100);
    }

    async handleAdminView(view) {
        if (!adminManager) return `<p class="text-danger">Admin manager not loaded.</p>`;

        const views = {
            dashboard: () => adminManager._dashboard,
            users: () => adminManager._users,
            appointments: () => adminManager._appointments,
            payments: () => adminManager._payments,
            reports: () => adminManager._reports,
            logs: () => adminManager._logs
        };

        const handler = views[view];
        if (!handler) return `<p class="text-warning">View "${view}" not found.</p>`;

        try {
            const container = document.createElement('div');
            await handler().call(adminManager, container);
            return container.innerHTML;
        } catch (error) {
            return `<p class="text-danger">Error: ${error.message}</p>`;
        }
    }

    async handleDoctorView(view) {
        if (!doctorManager) return `<p class="text-danger">Doctor manager not loaded.</p>`;

        const views = {
            dashboard: () => doctorManager.loadDashboardContent,
            appointments: () => doctorManager.loadAppointmentsContent,
            patients: () => doctorManager.loadPatientsContent,
            chat: () => doctorManager.openChat,
            profile: () => doctorManager.loadProfileContent
        };

        const handler = views[view];
        if (!handler) return `<p class="text-warning">View "${view}" not found.</p>`;

        try {
            const container = document.createElement('div');
            if (view === 'chat') {
                handler().call(doctorManager);
                return `<div id="chatContainer"><p>💬 Chat interface loading...</p></div>`;
            }
            await handler().call(doctorManager, container);
            return container.innerHTML;
        } catch (error) {
            return `<p class="text-danger">Error: ${error.message}</p>`;
        }
    }

    async handlePatientView(view) {
        if (!patientManager) return `<p class="text-danger">Patient manager not loaded.</p>`;

        const views = {
            dashboard: () => patientManager.loadDashboardContent,
            appointments: () => patientManager.loadAppointmentsContent,
            doctors: () => patientManager.loadDoctorsContent,
            chat: () => patientManager.openChat,
            profile: () => patientManager.loadProfileContent
        };

        const handler = views[view];
        if (!handler) return `<p class="text-warning">View "${view}" not found.</p>`;

        try {
            const container = document.createElement('div');
            if (view === 'chat') {
                handler().call(patientManager);
                return `<div id="chatContainer"><p>💬 Chat interface loading...</p></div>`;
            }
            await handler().call(patientManager, container);
            return container.innerHTML;
        } catch (error) {
            return `<p class="text-danger">Error: ${error.message}</p>`;
        }
    }
}

// Initialize app
const app = new App();
window.app = app;
console.log('✅ App initialized');