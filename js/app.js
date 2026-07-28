/*
 * File: app.js
 * Purpose: Main application with sidebar layout
 */

class App {
    constructor() {
        this.currentRole = null;
        this.currentView = 'dashboard';
        this.isSidebarCollapsed = false;
        this.isMobileSidebarOpen = false;
        this.navItems = [];
        this.init();
    }

    init() {
        console.log('App initializing...');
        this.waitForAuth();
    }

    waitForAuth() {
        const checkAuth = () => {
            if (authManager && authManager.currentUser) {
                console.log('Auth ready, rendering layout...');
                this.renderLayout();
            } else if (authManager && !authManager.currentUser) {
                console.log('No user, auth.js will handle login');
            } else {
                console.log('Waiting for auth...');
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
        
        setTimeout(() => {
            this.attachEvents();
            this.loadView('dashboard');
        }, 50);
    }

    getNavItems(role) {
        const common = [
            { id: 'dashboard', icon: 'fas fa-chart-pie', label: 'Dashboard' }
        ];

        const roleSpecific = {
            admin: [
                { id: 'users', icon: 'fas fa-users', label: 'Users' },
                { id: 'appointments', icon: 'fas fa-calendar-check', label: 'Appointments' },
                { id: 'payments', icon: 'fas fa-credit-card', label: 'Payments' },
                { id: 'reports', icon: 'fas fa-chart-bar', label: 'Reports' },
                { id: 'logs', icon: 'fas fa-clipboard-list', label: 'Activity Logs' }
            ],
            doctor: [
                { id: 'appointments', icon: 'fas fa-calendar-check', label: 'Appointments' },
                { id: 'patients', icon: 'fas fa-user-injured', label: 'Patients' },
                { id: 'chat', icon: 'fas fa-comment-dots', label: 'Messages' },
                { id: 'profile', icon: 'fas fa-user-cog', label: 'Profile' }
            ],
            patient: [
                { id: 'appointments', icon: 'fas fa-calendar-check', label: 'My Appointments' },
                { id: 'doctors', icon: 'fas fa-user-md', label: 'Find Doctors' },
                { id: 'chat', icon: 'fas fa-comment-dots', label: 'Messages' },
                { id: 'profile', icon: 'fas fa-user-cog', label: 'Profile' }
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
                <span class="nav-icon"><i class="${item.icon}"></i></span>
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
                        <button class="nav-item" id="logoutBtnSidebar">
                            <span class="nav-icon"><i class="fas fa-sign-out-alt"></i></span>
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
                            <button class="btn btn-sm btn-danger header-logout-btn" id="logoutBtnHeader">
                                <i class="fas fa-sign-out-alt"></i>
                            </button>
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
        const toggleBtn = document.getElementById('sidebarToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSidebar();
            });
        }

        const hamburger = document.getElementById('hamburgerBtn');
        if (hamburger) {
            hamburger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMobileSidebar();
            });
        }

        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeMobileSidebar();
            });
        }

        document.querySelectorAll('.sidebar-nav .nav-item[data-view]').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                console.log('📱 Nav item clicked:', view);
                this.loadView(view);
                this.closeMobileSidebar();
            });
        });

        const logoutBtnSidebar = document.getElementById('logoutBtnSidebar');
        if (logoutBtnSidebar) {
            logoutBtnSidebar.addEventListener('click', async () => {
                await this.handleLogout();
            });
        }

        const logoutBtnHeader = document.getElementById('logoutBtnHeader');
        if (logoutBtnHeader) {
            logoutBtnHeader.addEventListener('click', async () => {
                await this.handleLogout();
            });
        }

        const notifBtn = document.getElementById('notificationBtn');
        if (notifBtn) {
            notifBtn.addEventListener('click', () => {
                alert('Notifications coming soon!');
            });
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth > 992) {
                this.closeMobileSidebar();
            }
        });

        this.updateActiveNav('dashboard');
    }

    toggleSidebar() {
        const sidebar = document.getElementById('app-sidebar');
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
        const sidebar = document.getElementById('app-sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) {
            sidebar.classList.toggle('open');
            this.isMobileSidebarOpen = sidebar.classList.contains('open');
        }
        if (overlay) {
            overlay.classList.toggle('active');
        }
    }

    closeMobileSidebar() {
        const sidebar = document.getElementById('app-sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) {
            sidebar.classList.remove('open');
            this.isMobileSidebarOpen = false;
        }
        if (overlay) {
            overlay.classList.remove('active');
        }
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
        console.log('📱 App.loadView called with view:', view);
        this.currentView = view;
        this.updateActiveNav(view);

        const content = document.getElementById('app-content');
        if (!content) {
            console.error('❌ app-content not found');
            return;
        }

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
            console.log('📱 Current role:', role);
            let result = null;

            try {
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

                if (result !== undefined && result !== null) {
                    // Only update content if we got a result (chat view handles itself)
                    if (typeof result === 'string') {
                        content.innerHTML = result;
                    }
                }
            } catch (error) {
                console.error('❌ Error in loadView:', error);
                content.innerHTML = `
                    <div class="alert alert-danger">
                        ❌ Error loading view: ${error.message}
                        <br><button class="btn btn-primary mt-2" onclick="app.loadView('dashboard')">⬅️ Go to Dashboard</button>
                    </div>
                `;
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
        console.log('📱 handleDoctorView called with view:', view);
        
        if (!doctorManager) {
            console.error('❌ doctorManager not defined');
            return `<p class="text-danger">Doctor manager not loaded. Please refresh the page.</p>`;
        }

        try {
            const content = document.getElementById('app-content');
            if (!content) {
                console.error('❌ app-content element not found');
                return `<p class="text-danger">Content area not found.</p>`;
            }

            // Handle chat view specially
            if (view === 'chat') {
                console.log('💬 Loading chat via doctorManager.loadView()');
                await doctorManager.loadView('chat');
                // Return current content (it will be updated by loadView)
                return content.innerHTML;
            }

            // For other views, use the container approach
            const container = document.createElement('div');
            container.id = 'tempContainer';
            
            switch(view) {
                case 'dashboard':
                    await doctorManager.loadDashboardContent(container);
                    break;
                case 'appointments':
                    await doctorManager.loadAppointmentsContent(container);
                    break;
                case 'patients':
                    await doctorManager.loadPatientsContent(container);
                    break;
                case 'profile':
                    await doctorManager.loadProfileContent(container);
                    break;
                default:
                    await doctorManager.loadDashboardContent(container);
            }
            
            return container.innerHTML;
        } catch (error) {
            console.error('❌ Error in handleDoctorView:', error);
            return `<p class="text-danger">Error loading view: ${error.message}</p>`;
        }
    }

    async handlePatientView(view) {
        console.log('📱 handlePatientView called with view:', view);
        
        if (!patientManager) {
            console.error('❌ patientManager not defined');
            return `<p class="text-danger">Patient manager not loaded. Please refresh the page.</p>`;
        }

        try {
            const content = document.getElementById('app-content');
            if (!content) {
                console.error('❌ app-content element not found');
                return `<p class="text-danger">Content area not found.</p>`;
            }

            // Handle chat view specially
            if (view === 'chat') {
                console.log('💬 Loading chat via patientManager.loadView()');
                await patientManager.loadView('chat');
                // Return current content (it will be updated by loadView)
                return content.innerHTML;
            }

            // For other views, use the container approach
            const container = document.createElement('div');
            container.id = 'tempContainer';
            
            switch(view) {
                case 'dashboard':
                    await patientManager.loadDashboardContent(container);
                    break;
                case 'appointments':
                    await patientManager.loadAppointmentsContent(container);
                    break;
                case 'doctors':
                    await patientManager.loadDoctorsContent(container);
                    break;
                case 'profile':
                    await patientManager.loadProfileContent(container);
                    break;
                default:
                    await patientManager.loadDashboardContent(container);
            }
            
            return container.innerHTML;
        } catch (error) {
            console.error('❌ Error in handlePatientView:', error);
            return `<p class="text-danger">Error loading view: ${error.message}</p>`;
        }
    }

    async handleLogout() {
        const result = await authManager.logout();
        if (result.success) {
            window.location.reload();
        }
    }
}

// Initialize app
const app = new App();
window.app = app;
console.log('✅ App initialized');