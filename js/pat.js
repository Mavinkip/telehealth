/*
 * File: patient.js - Complete Patient Manager with FIXED Navigation & Profile
 */

class PatientManager {
    constructor() {
        this.currentView = 'dashboard';
        this.isSidebarOpen = true;
        this.availableDoctors = [];
        this.chatManager = null;
    }

    getChatManager() {
        if (!this.chatManager) {
            if (window.chatManager) {
                this.chatManager = window.chatManager;
            } else {
                console.warn('⚠️ Chat manager not initialized yet');
                window.chatManager = new ChatManager();
                this.chatManager = window.chatManager;
            }
        }
        return this.chatManager;
    }

    showDashboard() {
        const app = document.getElementById('app');
        const profile = authManager ? authManager.getUserProfile() : null;
        
        if (!profile) {
            if (authManager) {
                authManager.showLoginPage();
            } else {
                console.error('❌ Auth manager not initialized');
                app.innerHTML = '<div class="alert alert-danger">Please refresh the page and try again.</div>';
            }
            return;
        }

        app.innerHTML = this.getDashboardHTML(profile);
        
        setTimeout(() => {
            this.attachEvents();
            this.loadView('dashboard');
        }, 100);
    }

    getDashboardHTML(profile) {
        return `
            <div class="app-layout patient-layout">
                <aside class="sidebar" id="patientSidebar">
                    <div class="sidebar-header">
                        <div class="brand" onclick="patientManager.loadView('dashboard')">
                            <span class="brand-icon">🏥</span>
                            <span class="brand-text">TeleHealth</span>
                        </div>
                        <button class="sidebar-toggle" id="sidebarToggle">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                    </div>
                    <nav class="sidebar-nav">
                        <div class="nav-section-title">Main Menu</div>
                        <button class="nav-item active" data-view="dashboard">
                            <span class="nav-icon">📊</span>
                            <span class="nav-label">Dashboard</span>
                        </button>
                        <button class="nav-item" data-view="appointments">
                            <span class="nav-icon">📅</span>
                            <span class="nav-label">My Appointments</span>
                        </button>
                        <button class="nav-item" data-view="doctors">
                            <span class="nav-icon">👨‍⚕️</span>
                            <span class="nav-label">Find Doctors</span>
                        </button>
                        <button class="nav-item" data-view="medications">
                            <span class="nav-icon">💊</span>
                            <span class="nav-label">Prescriptions</span>
                        </button>
                        <button class="nav-item" data-view="chat">
                            <span class="nav-icon">💬</span>
                            <span class="nav-label">Messages</span>
                        </button>
                        <button class="nav-item" data-view="profile">
                            <span class="nav-icon">👤</span>
                            <span class="nav-label">Profile</span>
                        </button>
                    </nav>
                    <div class="sidebar-footer">
                        <button class="nav-item" id="logoutBtn">
                            <span class="nav-icon">🚪</span>
                            <span class="nav-label">Logout</span>
                        </button>
                    </div>
                </aside>

                <main class="main-content">
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
                                <div class="avatar" style="background: #10B981;">${profile.full_name?.charAt(0) || 'U'}</div>
                                <div class="user-info">
                                    <span class="name">${profile.full_name || 'User'}</span>
                                    <span class="role">Patient</span>
                                </div>
                            </div>
                            <button class="header-logout-btn" id="logoutBtnHeader">
                                <i class="fas fa-sign-out-alt"></i>
                                <span>Logout</span>
                            </button>
                        </div>
                    </header>

                    <div class="content-area" id="patientContent">
                        <!-- Dynamic content -->
                    </div>
                </main>
            </div>

            <div class="sidebar-overlay" id="sidebarOverlay"></div>
        `;
    }

    attachEvents() {
        const navLinks = document.querySelectorAll('.nav-item[data-view]');
        if (navLinks.length > 0) {
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const view = link.dataset.view;
                    console.log('📱 Navigating to:', view);
                    
                    document.querySelectorAll('.nav-item[data-view]').forEach(l => {
                        l.classList.remove('active');
                    });
                    link.classList.add('active');
                    
                    this.loadView(view);
                    this.closeMobileSidebar();
                });
            });
        }

        const toggleBtn = document.getElementById('sidebarToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        const hamburger = document.getElementById('hamburgerBtn');
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                this.toggleMobileSidebar();
            });
        }

        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeMobileSidebar();
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if (authManager) {
                    const result = await authManager.logout();
                    if (result.success) {
                        window.location.reload();
                    }
                }
            });
        }

        const logoutBtnHeader = document.getElementById('logoutBtnHeader');
        if (logoutBtnHeader) {
            logoutBtnHeader.addEventListener('click', async () => {
                if (authManager) {
                    const result = await authManager.logout();
                    if (result.success) {
                        window.location.reload();
                    }
                }
            });
        }

        const notifBtn = document.getElementById('notificationBtn');
        if (notifBtn) {
            notifBtn.addEventListener('click', () => {
                this.showNotifications();
            });
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth > 992) {
                this.closeMobileSidebar();
            }
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('patientSidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (window.innerWidth > 992) {
            this.isSidebarOpen = !this.isSidebarOpen;
            if (sidebar) sidebar.classList.toggle('collapsed');
            if (mainContent) mainContent.classList.toggle('expanded');
            
            const icon = document.getElementById('sidebarToggle')?.querySelector('i');
            if (icon) {
                icon.className = this.isSidebarOpen ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
            }
        }
    }

    toggleMobileSidebar() {
        const sidebar = document.getElementById('patientSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
    }

    closeMobileSidebar() {
        const sidebar = document.getElementById('patientSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }

    // =============================================
    // NAVIGATION HELPERS
    // =============================================
    goToDashboard() {
        this.loadView('dashboard');
    }

    goToAppointments() {
        this.loadView('appointments');
    }

    goToDoctors() {
        this.loadView('doctors');
    }

    goToMedications() {
        this.loadView('medications');
    }

    goToChat() {
        this.loadView('chat');
    }

    goToProfile() {
        this.loadView('profile');
    }

    // =============================================
    // FIXED loadView - Uses app-content
    // =============================================
    async loadView(view) {
        console.log('📱 Loading view:', view);
        
        // Use app-content from app.js
        let content = document.getElementById('patientContent');
        if (!content) {
            content = document.getElementById('app-content');
        }
        if (!content) {
            console.error('❌ Content element not found');
            // Create fallback
            const app = document.getElementById('app');
            if (app) {
                const mainContent = app.querySelector('.main-content') || app;
                const fallback = document.createElement('div');
                fallback.id = 'app-content';
                fallback.className = 'content-area';
                mainContent.appendChild(fallback);
                content = fallback;
                console.log('✅ Created fallback content element');
            }
            if (!content) return;
        }

        const titleMap = {
            'dashboard': 'Dashboard',
            'appointments': 'My Appointments',
            'doctors': 'Find Doctors',
            'medications': 'Prescriptions',
            'chat': 'Messages',
            'profile': 'Profile'
        };
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = titleMap[view] || 'Dashboard';
        }

        // Special handling for chat
        if (view === 'chat') {
            console.log('💬 Opening chat via chatManager...');
            content.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="text-muted mt-2">Loading chat...</p>
                </div>
            `;
            
            const chatManager = this.getChatManager();
            
            setTimeout(() => {
                if (chatManager) {
                    console.log('✅ Chat manager found, showing interface');
                    chatManager.showChatInterface();
                } else {
                    console.error('❌ Chat manager not available');
                    content.innerHTML = `
                        <div class="alert alert-danger">
                            ❌ Chat feature is not available. Please refresh and try again.
                        </div>
                    `;
                }
            }, 300);
            return;
        }

        // Show loading for other views
        content.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="text-muted mt-2">Loading...</p>
            </div>
        `;

        try {
            switch(view) {
                case 'dashboard':
                    await this.loadDashboardContent(content);
                    break;
                case 'appointments':
                    await this.loadAppointmentsContent(content);
                    break;
                case 'doctors':
                    await this.loadDoctorsContent(content);
                    break;
                case 'medications':
                    await this.loadMedicationsContent(content);
                    break;
                case 'profile':
                    await this.loadProfileContent(content);
                    break;
                default:
                    await this.loadDashboardContent(content);
            }
        } catch (error) {
            console.error('❌ Error loading view:', error);
            content.innerHTML = `
                <div class="alert alert-danger">
                    ❌ Error loading view: ${error.message}
                </div>
                <button class="btn btn-primary mt-3" onclick="patientManager.goToDashboard()">⬅️ Back to Dashboard</button>
            `;
        }
    }

    openChatWithUser(userId) {
        console.log('💬 Opening chat with user:', userId);
        if (window.chatManager) {
            window.chatManager.showChatInterface(null, userId);
        } else {
            alert('💬 Chat feature is being loaded. Please try again.');
        }
    }

    // =============================================
    // DASHBOARD CONTENT
    // =============================================
    async loadDashboardContent(container) {
        if (!authManager) {
            container.innerHTML = '<div class="alert alert-danger">Authentication not available</div>';
            return;
        }
        
        const userId = authManager.getUserId();
        if (!userId) {
            container.innerHTML = '<div class="alert alert-warning">Please log in to view your dashboard</div>';
            return;
        }
        
        try {
            const { data: upcomingAppointments, error: aptError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    doctor:profiles!appointments_doctor_id_fkey (id, full_name, specialty)
                `)
                .eq('patient_id', userId)
                .eq('status', 'scheduled')
                .gte('scheduled_at', new Date().toISOString())
                .order('scheduled_at', { ascending: true })
                .limit(5);

            if (aptError) console.error('Error fetching appointments:', aptError);

            const { data: todaysMeds, error: medError } = await supabase
                .from('medication_schedule')
                .select('*')
                .eq('patient_id', userId)
                .eq('taken', false)
                .gte('scheduled_time', new Date().toISOString())
                .order('scheduled_time', { ascending: true })
                .limit(10);

            if (medError) console.error('Error fetching medications:', medError);

            await this.refreshDoctors();

            let unreadCount = 0;
            try {
                const { count, error: msgError } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('receiver_id', userId)
                    .is('read_at', null);
                    
                if (!msgError) unreadCount = count || 0;
            } catch (e) {
                console.error('Error fetching message count:', e);
            }

            container.innerHTML = `
                <div class="row">
                    <div class="col-12">
                        <h2>🏥 Patient Dashboard</h2>
                        <p class="text-muted">Welcome to your telehealth portal</p>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card" onclick="patientManager.goToAppointments()" style="cursor:pointer;">
                        <div class="stat-label">📅 Upcoming</div>
                        <div class="stat-value accent">${upcomingAppointments?.length || 0}</div>
                    </div>
                    <div class="stat-card" onclick="patientManager.goToMedications()" style="cursor:pointer;">
                        <div class="stat-label">💊 Today's Meds</div>
                        <div class="stat-value warning">${todaysMeds?.length || 0}</div>
                    </div>
                    <div class="stat-card" onclick="patientManager.goToDoctors()" style="cursor:pointer;">
                        <div class="stat-label">👨‍⚕️ Doctors</div>
                        <div class="stat-value success">${this.availableDoctors?.length || 0}</div>
                    </div>
                    <div class="stat-card" onclick="patientManager.goToChat()" style="cursor:pointer;">
                        <div class="stat-label">💬 Messages</div>
                        <div class="stat-value danger">${unreadCount || 0}</div>
                    </div>
                </div>

                ${todaysMeds && todaysMeds.length > 0 ? `
                    <div class="row mt-3">
                        <div class="col-12">
                            <div class="card border-warning medication-card">
                                <div class="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0">⏰ Today's Medication Schedule</h5>
                                    <span class="badge bg-danger text-white">${todaysMeds.length} pending</span>
                                </div>
                                <div class="card-body">
                                    ${todaysMeds.map(med => `
                                        <div class="medication-item pending" id="med-${med.id}">
                                            <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                                                <div>
                                                    <span class="med-status-badge pending-badge">⏳</span>
                                                    <strong>💊 ${med.medication || 'Unknown'}</strong>
                                                    <br><small>${med.dosage || ''} - ⏰ ${new Date(med.scheduled_time).toLocaleTimeString()}</small>
                                                </div>
                                                <div>
                                                    <button class="btn btn-sm btn-success mark-taken-btn pulse" 
                                                            data-id="${med.id}"
                                                            onclick="event.stopPropagation(); patientManager.markMedicationTaken('${med.id}')">
                                                        ✅ Mark Taken
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                    <div class="mt-2">
                                        <button class="btn btn-sm btn-outline-success w-100" onclick="patientManager.goToMedications()">
                                            📋 View All Medications
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="card-title mb-0">📅 Upcoming Appointments</h5>
                                <span class="badge bg-primary">${upcomingAppointments?.length || 0}</span>
                            </div>
                            <div class="card-body">
                                ${upcomingAppointments && upcomingAppointments.length > 0 
                                    ? upcomingAppointments.map(apt => `
                                        <div class="p-2 mb-2 bg-light rounded d-flex justify-content-between align-items-center flex-wrap">
                                            <div>
                                                <h6 class="mb-0">👨‍⚕️ Dr. ${apt.doctor?.full_name || 'Unknown'}</h6>
                                                <p class="mb-0 small">⏰ ${new Date(apt.scheduled_at).toLocaleString()}</p>
                                                <span class="badge ${apt.consultation_type === 'video' ? 'bg-primary' : 'bg-warning'}">
                                                    ${apt.consultation_type === 'video' ? '🎥' : '🏥'} ${apt.consultation_type || 'video'}
                                                </span>
                                            </div>
                                            <div class="mt-2 mt-sm-0">
                                                ${apt.consultation_type === 'video' && apt.jitsi_room_id ? `
                                                    <button class="btn btn-sm btn-primary me-1" onclick="event.stopPropagation(); patientManager.joinVideoCall('${apt.id}', '${apt.jitsi_room_id}', '${apt.doctor?.full_name || 'Doctor'}')">
                                                        🎥 Join
                                                    </button>
                                                ` : apt.consultation_type === 'physical' ? `
                                                    <button class="btn btn-sm btn-success me-1" onclick="event.stopPropagation(); alert('📍 Physical consultation at clinic.')">
                                                        📍 Location
                                                    </button>
                                                ` : ''}
                                                <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); patientManager.goToAppointments()">📅 View</button>
                                            </div>
                                        </div>
                                    `).join('')
                                    : '<p class="text-muted text-center py-3">No upcoming appointments</p>'
                                }
                                <button class="btn btn-primary mt-2 w-100" onclick="patientManager.goToAppointments()">📅 View All Appointments</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ Error loading dashboard:', error);
            container.innerHTML = `
                <div class="alert alert-danger">
                    Error loading dashboard: ${error.message}
                </div>
            `;
        }
    }

    // =============================================
    // APPOINTMENTS CONTENT
    // =============================================
    async loadAppointmentsContent(container) {
        if (!authManager) {
            container.innerHTML = '<div class="alert alert-danger">Authentication not available</div>';
            return;
        }
        
        const userId = authManager.getUserId();
        if (!userId) {
            container.innerHTML = '<div class="alert alert-warning">Please log in to view appointments</div>';
            return;
        }
        
        try {
            const { data: appointments, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    doctor:profiles!appointments_doctor_id_fkey (id, full_name, specialty)
                `)
                .eq('patient_id', userId)
                .order('scheduled_at', { ascending: false });

            if (error) {
                console.error('Error fetching appointments:', error);
                throw error;
            }

            const now = new Date();
            const today = appointments?.filter(a => {
                const date = new Date(a.scheduled_at);
                return date.toDateString() === now.toDateString() && a.status === 'scheduled';
            }) || [];
            const upcoming = appointments?.filter(a => new Date(a.scheduled_at) > now && a.status === 'scheduled') || [];
            const past = appointments?.filter(a => new Date(a.scheduled_at) < now && a.status !== 'scheduled') || [];

            container.innerHTML = `
                <div class="row">
                    <div class="col-12">
                        <h2>📅 My Appointments</h2>
                        <div class="d-flex gap-2 flex-wrap mb-3">
                            <button class="btn btn-primary" onclick="patientManager.showBookingModal()">➕ Book New</button>
                            <button class="btn btn-outline-secondary" onclick="patientManager.goToDashboard()">⬅️ Dashboard</button>
                        </div>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card" style="cursor:default;">
                        <div class="stat-label">📅 Today</div>
                        <div class="stat-value accent">${today.length}</div>
                    </div>
                    <div class="stat-card" style="cursor:default;">
                        <div class="stat-label">📅 Upcoming</div>
                        <div class="stat-value success">${upcoming.length}</div>
                    </div>
                    <div class="stat-card" style="cursor:default;">
                        <div class="stat-label">📋 Past</div>
                        <div class="stat-value">${past.length}</div>
                    </div>
                </div>

                <div class="row mt-3">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="card-title mb-0">All Appointments</h5>
                                <span class="badge bg-primary">${appointments?.length || 0}</span>
                            </div>
                            <div class="card-body">
                                ${appointments && appointments.length > 0
                                    ? `<div class="table-responsive">
                                        <table class="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>👨‍⚕️ Doctor</th>
                                                    <th>⚙️ Type</th>
                                                    <th>📅 Date</th>
                                                    <th>ℹ️ Status</th>
                                                    <th>💳 Payment</th>
                                                    <th>⚡ Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${appointments.map(apt => `
                                                    <tr>
                                                        <td>
                                                            <strong>Dr. ${apt.doctor?.full_name || 'Unknown'}</strong>
                                                            <br><small class="text-muted">${apt.doctor?.specialty || ''}</small>
                                                        </td>
                                                        <td>
                                                            <span class="badge ${apt.consultation_type === 'video' ? 'bg-primary' : 'bg-warning'}">
                                                                ${apt.consultation_type === 'video' ? '🎥' : '🏥'} ${apt.consultation_type || 'video'}
                                                            </span>
                                                            ${apt.is_follow_up ? '<span class="badge bg-info">🔄 Follow-up</span>' : ''}
                                                        </td>
                                                        <td><small>⏰ ${new Date(apt.scheduled_at).toLocaleString()}</small></td>
                                                        <td>
                                                            <span class="badge ${apt.status === 'scheduled' ? 'bg-success' : apt.status === 'completed' ? 'bg-secondary' : 'bg-danger'}">
                                                                ${apt.status || 'Unknown'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            ${apt.payment_status === 'paid' 
                                                                ? '<span class="badge bg-success">✅ Paid</span>' 
                                                                : apt.payment_status === 'pending' && apt.status === 'completed'
                                                                ? '<span class="badge bg-warning">⏳ Due</span>'
                                                                : '<span class="badge bg-secondary">-</span>'
                                                            }
                                                            ${apt.amount_paid ? `<br><small>KES ${apt.amount_paid}</small>` : ''}
                                                        </td>
                                                        <td>
                                                            ${apt.status === 'scheduled' ? `
                                                                ${apt.consultation_type === 'video' && apt.jitsi_room_id ? `
                                                                    <button class="btn btn-sm btn-primary mb-1 w-100" onclick="patientManager.joinVideoCall('${apt.id}', '${apt.jitsi_room_id}', '${apt.doctor?.full_name || 'Doctor'}')">🎥 Join</button>
                                                                ` : apt.consultation_type === 'physical' ? `
                                                                    <button class="btn btn-sm btn-success mb-1 w-100" onclick="alert('📍 Physical consultation at clinic.')">📍 Location</button>
                                                                ` : ''}
                                                                <button class="btn btn-sm btn-danger w-100" onclick="patientManager.cancelAppointment('${apt.id}')">❌ Cancel</button>
                                                            ` : apt.status === 'completed' && apt.payment_status === 'pending' ? `
                                                                <button class="btn btn-sm btn-warning w-100" onclick="patientManager.payForAppointment('${apt.id}', ${apt.amount_paid || 300})">💳 Pay Now</button>
                                                            ` : apt.status === 'completed' ? '<span class="text-success">✅ Done</span>' : '<span class="text-muted">-</span>'}
                                                        </td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>`
                                    : `<div class="text-center py-4">
                                        <div style="font-size:3rem;margin-bottom:12px;">📭</div>
                                        <p class="text-muted">No appointments found</p>
                                        <button class="btn btn-primary" onclick="patientManager.showBookingModal()">➕ Book Your First Appointment</button>
                                    </div>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ Error loading appointments:', error);
            container.innerHTML = `
                <div class="alert alert-danger">
                    Error loading appointments: ${error.message}
                </div>
            `;
        }
    }

    // =============================================
    // DOCTORS CONTENT
    // =============================================
    async loadDoctorsContent(container) {
        await this.refreshDoctors();

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>👨‍⚕️ Find Doctors</h2>
                    <p class="text-muted">Browse available doctors and book appointments</p>
                    <button class="btn btn-outline-secondary mb-3" onclick="patientManager.goToDashboard()">⬅️ Dashboard</button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card" style="cursor:default;">
                    <div class="stat-label">👨‍⚕️ Available</div>
                    <div class="stat-value success">${this.availableDoctors?.length || 0}</div>
                </div>
                <div class="stat-card" onclick="patientManager.showBookingModal()" style="cursor:pointer;">
                    <div class="stat-label">➕ Book Now</div>
                    <div class="stat-value accent">+</div>
                </div>
            </div>

            <div class="row mt-3">
                ${this.availableDoctors && this.availableDoctors.length > 0
                    ? this.availableDoctors.map(doc => `
                        <div class="col-md-4 col-sm-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body text-center">
                                    <div style="font-size: 4rem; margin-bottom: 12px;">👨‍⚕️</div>
                                    <h5 class="card-title">Dr. ${doc.full_name || 'Unknown'}</h5>
                                    <p class="card-text"><span class="badge bg-primary">${doc.specialty || 'General Practice'}</span></p>
                                    <p class="card-text"><small>📧 ${doc.email || ''}</small></p>
                                    <p class="card-text"><small>📱 ${doc.phone || 'No phone'}</small></p>
                                    <div class="d-grid gap-2">
                                        <button class="btn btn-primary" onclick="patientManager.showBookingModal('${doc.id}', '${doc.full_name}')">
                                            📅 Book Appointment
                                        </button>
                                        <button class="btn btn-outline-info" onclick="patientManager.openChatWithUser('${doc.id}')">
                                            💬 Message
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')
                    : '<p class="text-muted text-center py-5">No doctors available at the moment</p>'
                }
            </div>
        `;
    }

    // =============================================
    // MEDICATIONS CONTENT
    // =============================================
    async loadMedicationsContent(container) {
        if (!authManager) {
            container.innerHTML = '<div class="alert alert-danger">Authentication not available</div>';
            return;
        }
        
        const userId = authManager.getUserId();
        if (!userId) {
            container.innerHTML = '<div class="alert alert-warning">Please log in to view medications</div>';
            return;
        }
        
        try {
            const { data: prescriptions, error: rxError } = await supabase
                .from('prescriptions')
                .select(`
                    *,
                    doctor:profiles!prescriptions_doctor_id_fkey (full_name, specialty)
                `)
                .eq('patient_id', userId)
                .order('issued_at', { ascending: false });

            if (rxError) console.error('Error fetching prescriptions:', rxError);

            const { data: medicationSchedule, error: medError } = await supabase
                .from('medication_schedule')
                .select('*')
                .eq('patient_id', userId)
                .order('scheduled_time', { ascending: true });

            if (medError) console.error('Error fetching medication schedule:', medError);

            const today = new Date().toISOString().split('T')[0];
            const allMeds = medicationSchedule || [];
            const pendingMeds = allMeds.filter(m => !m.taken);
            const takenMeds = allMeds.filter(m => m.taken);
            
            const todayPending = pendingMeds.filter(m => 
                new Date(m.scheduled_time).toISOString().split('T')[0] === today
            );
            
            const todayTaken = takenMeds.filter(m => 
                new Date(m.scheduled_time).toISOString().split('T')[0] === today
            );

            const todayTotal = todayPending.length + todayTaken.length;
            const completionPercent = todayTotal > 0 ? Math.round((todayTaken.length / todayTotal) * 100) : 0;

            container.innerHTML = `
                <div class="row">
                    <div class="col-12">
                        <h2>💊 Prescriptions & Medications</h2>
                        <p class="text-muted">View all your prescriptions and medication schedule</p>
                        <button class="btn btn-outline-secondary mb-3" onclick="patientManager.goToDashboard()">⬅️ Dashboard</button>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card" style="cursor:default;">
                        <div class="stat-label">💊 Prescriptions</div>
                        <div class="stat-value success">${prescriptions?.length || 0}</div>
                    </div>
                    <div class="stat-card" style="cursor:default;">
                        <div class="stat-label">⏰ Today's Total</div>
                        <div class="stat-value accent">${todayTotal}</div>
                    </div>
                    <div class="stat-card" style="cursor:default;">
                        <div class="stat-label">✅ Taken Today</div>
                        <div class="stat-value success">${todayTaken.length}</div>
                    </div>
                    <div class="stat-card" style="cursor:default;">
                        <div class="stat-label">📋 Pending</div>
                        <div class="stat-value danger">${todayPending.length}</div>
                    </div>
                </div>

                ${todayTotal > 0 ? `
                    <div class="row mt-3">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span><strong>Today's Progress</strong></span>
                                        <span class="badge bg-primary">${completionPercent}% Complete</span>
                                    </div>
                                    <div class="progress mt-2" style="height: 25px; border-radius: 12px; background: #e9ecef; overflow: hidden;">
                                        <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                             role="progressbar" 
                                             style="width: ${completionPercent}%; background: linear-gradient(90deg, #10B981, #059669); transition: width 0.8s ease-in-out;"
                                             aria-valuenow="${completionPercent}" 
                                             aria-valuemin="0" 
                                             aria-valuemax="100">
                                            ${completionPercent}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${todayPending.length > 0 ? `
                    <div class="row mt-3">
                        <div class="col-12">
                            <div class="card border-warning">
                                <div class="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0">⏰ Today's Medications - Pending</h5>
                                    <span class="badge bg-danger">${todayPending.length} pending</span>
                                </div>
                                <div class="card-body">
                                    ${todayPending.map(med => `
                                        <div class="medication-item pending" id="med-${med.id}">
                                            <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                                                <div>
                                                    <span class="med-status-badge pending-badge">⏳</span>
                                                    <strong>💊 ${med.medication || 'Unknown'}</strong>
                                                    <br><small>${med.dosage || ''} - ⏰ ${new Date(med.scheduled_time).toLocaleTimeString()}</small>
                                                    ${med.is_refill_reminder ? '<br><span class="badge bg-warning">🔄 Refill Reminder</span>' : ''}
                                                </div>
                                                <div>
                                                    <button class="btn btn-sm btn-success mark-taken-btn pulse" 
                                                            data-id="${med.id}"
                                                            onclick="event.stopPropagation(); patientManager.markMedicationTaken('${med.id}')">
                                                        ✅ Mark Taken
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                    <div class="mt-3">
                                        <button class="btn btn-success w-100" onclick="patientManager.markAllMedicationsTaken()">
                                            ✅ Mark All as Taken
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${todayTaken.length > 0 ? `
                    <div class="row mt-3">
                        <div class="col-12">
                            <div class="card border-success">
                                <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0">✅ Today's Medications - Taken</h5>
                                    <span class="badge bg-light text-dark">${todayTaken.length} completed</span>
                                </div>
                                <div class="card-body">
                                    ${todayTaken.map(med => `
                                        <div class="medication-item taken" id="med-${med.id}">
                                            <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                                                <div>
                                                    <span class="med-status-badge taken-badge">✅</span>
                                                    <strong>💊 ${med.medication || 'Unknown'}</strong>
                                                    <br><small>${med.dosage || ''} - ⏰ ${new Date(med.scheduled_time).toLocaleTimeString()}</small>
                                                    <br><small class="text-success">✓ Taken at ${med.taken_at ? new Date(med.taken_at).toLocaleTimeString() : 'N/A'}</small>
                                                </div>
                                                <div>
                                                    <span class="badge bg-success">✅ Taken</span>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${todayPending.length === 0 && todayTaken.length === 0 ? `
                    <div class="row mt-3">
                        <div class="col-12">
                            <div class="card border-info">
                                <div class="card-header bg-info text-white">
                                    <h5 class="mb-0">📋 Today's Medications</h5>
                                </div>
                                <div class="card-body text-center py-4">
                                    <div style="font-size: 3rem;">📭</div>
                                    <h5 class="mt-2">No Medications Scheduled</h5>
                                    <p class="text-muted">You have no medications scheduled for today</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="row mt-3">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">📋 All Prescriptions</h5>
                                <span class="badge bg-primary">${prescriptions?.length || 0}</span>
                            </div>
                            <div class="card-body">
                                ${prescriptions && prescriptions.length > 0
                                    ? prescriptions.map(rx => `
                                        <div class="border-bottom pb-3 mb-3">
                                            <div class="d-flex justify-content-between">
                                                <div>
                                                    <h6 class="mb-0">💊 ${rx.medication || 'Unknown'} - ${rx.dosage || ''}</h6>
                                                    <p class="mb-0 small">
                                                        <strong>👨‍⚕️ Doctor:</strong> ${rx.doctor?.full_name || 'Unknown'}
                                                        <br><strong>⏰ Frequency:</strong> ${rx.frequency || 'As directed'}
                                                        <br><strong>📅 Duration:</strong> ${rx.duration || 'N/A'}
                                                        <br><strong>🍽️ When to take:</strong> ${rx.when_to_take || 'As directed'}
                                                        <br><strong>📝 Instructions:</strong> ${rx.instructions || 'Take as directed'}
                                                        ${rx.notes ? `<br><strong>📌 Notes:</strong> ${rx.notes}` : ''}
                                                    </p>
                                                    <small>📅 Issued: ${new Date(rx.issued_at).toLocaleDateString()}</small>
                                                </div>
                                                <div>
                                                    <span class="badge ${rx.duration_days ? 'bg-success' : 'bg-secondary'}">
                                                        ${rx.duration_days ? '✅ Active' : 'Completed'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')
                                    : '<p class="text-muted text-center py-3">No prescriptions found</p>'
                                }
                            </div>
                        </div>
                    </div>
                </div>

                ${pendingMeds.length > 0 ? `
                    <div class="row mt-3">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">📅 All Upcoming Medications (${pendingMeds.length})</h5>
                                </div>
                                <div class="card-body">
                                    ${pendingMeds.slice(0, 20).map(med => `
                                        <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                                            <div>
                                                <span class="med-status-badge pending-badge">⏳</span>
                                                <strong>💊 ${med.medication || 'Unknown'}</strong>
                                                <br><small>${med.dosage || ''} - 📅 ${new Date(med.scheduled_time).toLocaleDateString()} ⏰ ${new Date(med.scheduled_time).toLocaleTimeString()}</small>
                                            </div>
                                            <div>
                                                <span class="badge bg-warning">⏳ Pending</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                    ${pendingMeds.length > 20 ? `<p class="text-muted mt-2">... and ${pendingMeds.length - 20} more</p>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
            `;
        } catch (error) {
            console.error('❌ Error loading medications:', error);
            container.innerHTML = `
                <div class="alert alert-danger">
                    Error loading medications: ${error.message}
                </div>
            `;
        }
    }

    // =============================================
    // PROFILE CONTENT - FIXED
    // =============================================
    async loadProfileContent(container) {
        if (!authManager) {
            container.innerHTML = '<div class="alert alert-danger">Authentication not available</div>';
            return;
        }
        
        const profile = authManager.getUserProfile();
        if (!profile) {
            container.innerHTML = '<div class="alert alert-warning">Please log in to view your profile</div>';
            return;
        }

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>👤 My Profile</h2>
                    <button class="btn btn-outline-secondary mb-3" onclick="patientManager.goToDashboard()">⬅️ Dashboard</button>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-body">
                            <form id="patientProfileForm">
                                <div class="form-group">
                                    <label class="form-label">👤 Full Name</label>
                                    <input type="text" class="form-control" id="fullName" value="${profile.full_name || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">📧 Email</label>
                                    <input type="email" class="form-control" id="email" value="${profile.email || ''}" disabled>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">📱 Phone</label>
                                    <input type="tel" class="form-control" id="phone" value="${profile.phone || ''}">
                                </div>
                                <button type="submit" class="btn btn-primary btn-block">💾 Update Profile</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <div style="font-size: 4rem;">👤</div>
                            <h5>${profile.full_name || 'User'}</h5>
                            <p class="text-muted">Patient</p>
                            <p><small>📧 ${profile.email || ''}</small></p>
                            <p><small>📱 ${profile.phone || 'No phone'}</small></p>
                            <button class="btn btn-outline-primary w-100 mt-2" onclick="patientManager.goToAppointments()">
                                📅 My Appointments
                            </button>
                            <button class="btn btn-outline-info w-100 mt-2" onclick="patientManager.goToChat()">
                                💬 Messages
                            </button>
                            <button class="btn btn-outline-success w-100 mt-2" onclick="patientManager.goToDoctors()">
                                👨‍⚕️ Find Doctors
                            </button>
                            <button class="btn btn-outline-secondary w-100 mt-2" onclick="patientManager.goToDashboard()">
                                📊 Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // FIXED: Use unique form ID and check if exists
        const profileForm = document.getElementById('patientProfileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fullName = document.getElementById('fullName').value.trim();
                const phone = document.getElementById('phone').value.trim();

                try {
                    const userId = authManager.getUserId();
                    const { error } = await supabase
                        .from('profiles')
                        .update({ full_name: fullName, phone: phone })
                        .eq('id', userId);

                    if (error) throw error;

                    if (authManager.userProfile) {
                        authManager.userProfile.full_name = fullName;
                        authManager.userProfile.phone = phone;
                    }

                    alert('✅ Profile updated successfully!');
                    this.loadView('profile');
                } catch (error) {
                    alert('Failed to update profile: ' + error.message);
                }
            });
        } else {
            console.warn('⚠️ Patient profile form not found');
        }
    }

    // =============================================
    // NOTIFICATIONS
    // =============================================
    async showNotifications() {
        if (!authManager) {
            alert('Please log in to view notifications');
            return;
        }
        
        const userId = authManager.getUserId();
        if (!userId) {
            alert('Please log in to view notifications');
            return;
        }
        
        try {
            const { count: unreadMessages } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', userId)
                .is('read_at', null);

            const { count: upcomingAppointments } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('patient_id', userId)
                .eq('status', 'scheduled')
                .gte('scheduled_at', new Date().toISOString());

            const { count: pendingMeds } = await supabase
                .from('medication_schedule')
                .select('*', { count: 'exact', head: true })
                .eq('patient_id', userId)
                .eq('taken', false)
                .gte('scheduled_time', new Date().toISOString());

            alert(`🔔 Notifications:\n\n• ${unreadMessages || 0} unread messages\n• ${upcomingAppointments || 0} upcoming appointments\n• ${pendingMeds || 0} pending medications`);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            alert('Error loading notifications: ' + error.message);
        }
    }

    // =============================================
    // REFRESH DOCTORS
    // =============================================
    async refreshDoctors() {
        try {
            const { data: doctors, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'doctor')
                .eq('is_active', true);

            if (error) {
                console.error('Error fetching doctors:', error);
                this.availableDoctors = [];
                return;
            }

            this.availableDoctors = doctors || [];
            console.log('Available doctors:', this.availableDoctors.length);
        } catch (error) {
            console.error('Error refreshing doctors:', error);
            this.availableDoctors = [];
        }
    }

    // =============================================
    // BOOK APPOINTMENT
    // =============================================
    async bookAppointment(doctorId, consultationType, scheduledAt, notes, fee) {
        try {
            if (!authManager) throw new Error('Authentication not available');
            
            const userId = authManager.getUserId();
            if (!userId) throw new Error('User not authenticated. Please log in again.');
            if (!doctorId) throw new Error('Please select a doctor.');

            const jitsiRoomId = consultationType === 'video' ? `telehealth-${Date.now()}-${userId.substring(0, 8)}` : null;

            let paymentStatus = 'pending';
            let amountPaid = fee;
            let paymentRef = null;

            if (consultationType === 'physical') {
                const paymentResult = await this.processPayment(fee, userId, null);
                if (paymentResult.success) {
                    paymentStatus = 'paid';
                    paymentRef = paymentResult.reference;
                } else {
                    throw new Error('Payment failed. Please try again.');
                }
            }

            const appointmentData = {
                patient_id: userId,
                doctor_id: doctorId,
                consultation_type: consultationType,
                scheduled_at: new Date(scheduledAt).toISOString(),
                status: 'scheduled',
                payment_status: paymentStatus,
                amount_paid: amountPaid,
                payment_reference: paymentRef,
                jitsi_room_id: jitsiRoomId,
                notes: notes || '',
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('appointments')
                .insert([appointmentData])
                .select();

            if (error) {
                console.error('Supabase error:', error);
                throw new Error(error.message);
            }

            const paymentMsg = consultationType === 'video' 
                ? `\nPayment: KES ${fee} (pay after call)` 
                : `\nPayment: KES ${fee} (paid)`;

            return { 
                success: true, 
                message: `✅ Appointment booked successfully!${paymentMsg}` 
            };
        } catch (error) {
            console.error('Booking error:', error);
            return { success: false, message: error.message || 'Failed to book appointment. Please try again.' };
        }
    }

    // =============================================
    // SHOW BOOKING MODAL - FIXED with proper styling
    // =============================================
    showBookingModal(preSelectedDoctorId = null, preSelectedDoctorName = null) {
        console.log('📅 Opening booking modal...');
        console.log('Selected doctor:', preSelectedDoctorId, preSelectedDoctorName);
        
        this.refreshDoctors();
        
        const doctorsHtml = (this.availableDoctors || []).map(doc => 
            `<option value="${doc.id}" ${doc.id === preSelectedDoctorId ? 'selected' : ''}>👨‍⚕️ Dr. ${doc.full_name || 'Unknown'} - ${doc.specialty || 'General Practice'}</option>`
        ).join('');

        // Remove existing modal
        const existingModal = document.getElementById('bookingModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHtml = `
            <div class="modal-overlay" id="bookingModal" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                padding: 20px;
                animation: fadeIn 0.3s ease;
            ">
                <div class="modal" style="
                    background: #ffffff;
                    border-radius: 16px;
                    padding: 30px 32px;
                    max-width: 600px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    position: relative;
                    border: 1px solid #e2e8f0;
                    animation: slideUp 0.3s ease;
                ">
                    <div class="modal-header" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        border-bottom: 2px solid #10B981;
                        padding-bottom: 14px;
                        margin-bottom: 18px;
                    ">
                        <h5 class="modal-title" style="font-size: 1.25rem; font-weight: 700; margin: 0; color: #0F172A;">
                            📅 Book Appointment
                            ${preSelectedDoctorName ? `<br><small style="font-weight:normal;font-size:0.85rem;color:#64748B;">with Dr. ${preSelectedDoctorName}</small>` : ''}
                        </h5>
                        <button onclick="document.getElementById('bookingModal').remove()" style="
                            background: none;
                            border: none;
                            font-size: 1.8rem;
                            cursor: pointer;
                            color: #94A3B8;
                            padding: 0 6px;
                            transition: 0.2s;
                            line-height: 1;
                        " onmouseover="this.style.color='#0F172A'" onmouseout="this.style.color='#94A3B8'">
                            ×
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="bookingForm">
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display:block;font-weight:600;margin-bottom:4px;font-size:0.85rem;color:#0F172A;">
                                    👨‍⚕️ Select Doctor
                                </label>
                                <select class="form-control" id="doctorSelect" required style="
                                    width:100%;
                                    padding:10px 14px;
                                    border:2px solid #E2E8F0;
                                    border-radius:8px;
                                    font-size:0.95rem;
                                    background:#F8FAFC;
                                    font-family:Inter,sans-serif;
                                ">
                                    <option value="">Select a doctor...</option>
                                    ${doctorsHtml || '<option value="">No doctors available</option>'}
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display:block;font-weight:600;margin-bottom:4px;font-size:0.85rem;color:#0F172A;">
                                    ⚙️ Consultation Type
                                </label>
                                <select class="form-control" id="consultationType" required style="
                                    width:100%;
                                    padding:10px 14px;
                                    border:2px solid #E2E8F0;
                                    border-radius:8px;
                                    font-size:0.95rem;
                                    background:#F8FAFC;
                                    font-family:Inter,sans-serif;
                                ">
                                    <option value="video">🎥 Video Call - KES 300 (pay after call)</option>
                                    <option value="physical">🏥 Physical - KES 500 (pay now)</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display:block;font-weight:600;margin-bottom:4px;font-size:0.85rem;color:#0F172A;">
                                    📅 Date & Time
                                </label>
                                <input type="datetime-local" class="form-control" id="appointmentDate" required style="
                                    width:100%;
                                    padding:10px 14px;
                                    border:2px solid #E2E8F0;
                                    border-radius:8px;
                                    font-size:0.95rem;
                                    background:#F8FAFC;
                                    font-family:Inter,sans-serif;
                                ">
                            </div>
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display:block;font-weight:600;margin-bottom:4px;font-size:0.85rem;color:#0F172A;">
                                    📝 Notes (Optional)
                                </label>
                                <textarea class="form-control" id="appointmentNotes" rows="2" placeholder="Any specific concerns..." style="
                                    width:100%;
                                    padding:10px 14px;
                                    border:2px solid #E2E8F0;
                                    border-radius:8px;
                                    font-size:0.95rem;
                                    background:#F8FAFC;
                                    font-family:Inter,sans-serif;
                                    resize:vertical;
                                "></textarea>
                            </div>
                            <div id="paymentInfo" class="alert alert-info" style="
                                padding:12px 16px;
                                border-radius:8px;
                                background:#EFF6FF;
                                border:1px solid #BFDBFE;
                                color:#1E40AF;
                                margin-bottom:16px;
                                font-size:0.9rem;
                            ">
                                🎥 <strong>Video Call:</strong> KES 300 (pay after call)<br>
                                🏥 <strong>Physical:</strong> KES 500 (pay now)
                            </div>
                            <button type="submit" class="btn btn-primary btn-block" id="bookBtn" style="
                                width:100%;
                                padding:13px;
                                background:#2563EB;
                                color:white;
                                border:none;
                                border-radius:8px;
                                font-size:1rem;
                                font-weight:600;
                                cursor:pointer;
                                transition:0.3s;
                                font-family:Inter,sans-serif;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                gap:8px;
                            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(37,99,235,0.35)'" 
                               onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
                                📅 Book Now
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 999999;
                    padding: 20px;
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Set default date/time
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 1);
        defaultDate.setHours(9, 0, 0, 0);
        const dateInput = document.getElementById('appointmentDate');
        if (dateInput) {
            dateInput.value = defaultDate.toISOString().slice(0, 16);
        }

        // Set pre-selected doctor if provided
        if (preSelectedDoctorId) {
            const doctorSelect = document.getElementById('doctorSelect');
            if (doctorSelect) {
                doctorSelect.value = preSelectedDoctorId;
            }
        }

        // Consultation type change handler
        const consultationType = document.getElementById('consultationType');
        if (consultationType) {
            consultationType.addEventListener('change', (e) => {
                const type = e.target.value;
                const info = document.getElementById('paymentInfo');
                const btn = document.getElementById('bookBtn');
                
                if (type === 'video') {
                    if (info) {
                        info.innerHTML = '🎥 <strong>Video Call:</strong> KES 300 - Pay <strong>after</strong> the call';
                        info.style.background = '#EFF6FF';
                        info.style.borderColor = '#BFDBFE';
                        info.style.color = '#1E40AF';
                    }
                    if (btn) {
                        btn.innerHTML = '📅 Book Now (Pay Later)';
                        btn.className = 'btn btn-primary btn-block';
                        btn.style.background = '#2563EB';
                    }
                } else {
                    if (info) {
                        info.innerHTML = '🏥 <strong>Physical Consultation:</strong> KES 500 - Pay <strong>now</strong> to book';
                        info.style.background = '#FEF3C7';
                        info.style.borderColor = '#FCD34D';
                        info.style.color = '#92400E';
                    }
                    if (btn) {
                        btn.innerHTML = '💳 Pay KES 500 & Book';
                        btn.className = 'btn btn-warning btn-block';
                        btn.style.background = '#F59E0B';
                    }
                }
            });
        }

        // Form submission
        const bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
            bookingForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const doctorId = document.getElementById('doctorSelect').value;
                const consultationType = document.getElementById('consultationType').value;
                const scheduledAt = document.getElementById('appointmentDate').value;
                const notes = document.getElementById('appointmentNotes').value;

                if (!doctorId) {
                    alert('Please select a doctor.');
                    return;
                }

                if (!scheduledAt) {
                    alert('Please select a date and time.');
                    return;
                }

                const fee = consultationType === 'video' ? 300 : 500;
                
                if (consultationType === 'physical') {
                    if (!confirm(`Pay KES ${fee} now to book physical consultation?`)) return;
                } else {
                    if (!confirm(`Book video consultation? You'll pay KES ${fee} after the call.`)) return;
                }

                // Show loading on button
                const btn = document.getElementById('bookBtn');
                if (btn) {
                    btn.innerHTML = '⏳ Booking...';
                    btn.disabled = true;
                }

                const result = await this.bookAppointment(doctorId, consultationType, scheduledAt, notes, fee);
                alert(result.message);
                
                if (result.success) {
                    const modal = document.getElementById('bookingModal');
                    if (modal) modal.remove();
                    this.loadView('appointments');
                } else {
                    if (btn) {
                        btn.innerHTML = '📅 Book Now';
                        btn.disabled = false;
                    }
                }
            });
        }

        // Close modal when clicking on overlay background
        const overlay = document.getElementById('bookingModal');
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.remove();
                }
            });
        }
    }

    // =============================================
    // PAYMENT FUNCTIONS
    // =============================================
    async processPayment(amount, userId, appointmentId) {
        console.log(`Processing payment: KES ${amount} for user ${userId}`);
        
        return new Promise((resolve) => {
            setTimeout(() => {
                const reference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
                resolve({
                    success: true,
                    reference: reference,
                    message: 'Payment processed successfully'
                });
            }, 1500);
        });
    }

    async payForAppointment(appointmentId, amount) {
        if (!confirm(`Pay KES ${amount} for this completed video consultation?`)) return;

        try {
            if (!authManager) throw new Error('Authentication not available');
            
            const userId = authManager.getUserId();
            const paymentResult = await this.processPayment(amount, userId, appointmentId);
            
            if (paymentResult.success) {
                const { error } = await supabase
                    .from('appointments')
                    .update({ 
                        payment_status: 'paid',
                        payment_date: new Date().toISOString(),
                        payment_reference: paymentResult.reference
                    })
                    .eq('id', appointmentId);

                if (error) throw error;

                alert(`✅ Payment successful!\nReference: ${paymentResult.reference}\nAmount: KES ${amount}`);
                this.loadView('appointments');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed: ' + error.message);
        }
    }

    // =============================================
    // MEDICATION TRACKING
    // =============================================
    async markMedicationTaken(scheduleId) {
        console.log('💊 markMedicationTaken called for ID:', scheduleId);
        
        if (!scheduleId) {
            alert('❌ Error: Invalid medication ID.');
            return;
        }

        if (!confirm('✅ Mark this medication as taken?')) {
            return;
        }

        try {
            const userId = authManager.getUserId();
            if (!userId) {
                alert('❌ Please log in to mark medications.');
                return;
            }

            const button = document.querySelector(`.mark-taken-btn[data-id="${scheduleId}"]`);
            if (button) {
                button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
                button.disabled = true;
                button.classList.remove('pulse');
            }

            const { error } = await supabase
                .from('medication_schedule')
                .update({ 
                    taken: true
                })
                .eq('id', scheduleId)
                .eq('patient_id', userId);

            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }

            console.log('✅ Medication marked as taken!');

            const medItem = document.getElementById(`med-${scheduleId}`);
            if (medItem) {
                medItem.classList.remove('pending');
                medItem.classList.add('taken-animation');
                
                const badge = medItem.querySelector('.med-status-badge');
                if (badge) {
                    badge.textContent = '✅';
                    badge.className = 'med-status-badge taken-badge';
                }
                
                if (button) {
                    button.innerHTML = '✅ Taken';
                    button.className = 'btn btn-sm btn-success';
                    button.disabled = true;
                }
                
                medItem.style.background = '#d1fae5';
                medItem.style.borderLeft = '4px solid #10B981';
                medItem.style.transition = 'all 0.5s ease';
            }

            const successMsg = document.createElement('div');
            successMsg.className = 'alert alert-success alert-dismissible fade show mt-2';
            successMsg.innerHTML = `
                ✅ Medication marked as taken! 🎉
                <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
            `;
            
            const cardBody = medItem?.closest('.card-body');
            if (cardBody) {
                cardBody.prepend(successMsg);
            }

            setTimeout(() => {
                this.loadView('medications');
            }, 1200);

        } catch (error) {
            console.error('❌ Error marking medication:', error);
            alert('❌ Failed to mark medication as taken. Please try again.\n\nError: ' + error.message);
            
            const button = document.querySelector(`.mark-taken-btn[data-id="${scheduleId}"]`);
            if (button) {
                button.innerHTML = '✅ Mark Taken';
                button.disabled = false;
                button.classList.add('pulse');
            }
        }
    }

    // =============================================
    // MARK ALL MEDICATIONS AS TAKEN
    // =============================================
    async markAllMedicationsTaken() {
        if (!confirm('Mark all pending medications as taken?')) {
            return;
        }

        try {
            const userId = authManager.getUserId();
            if (!userId) {
                alert('❌ Please log in to mark medications.');
                return;
            }

            const buttons = document.querySelectorAll('.mark-taken-btn');
            buttons.forEach(btn => {
                btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
                btn.disabled = true;
            });

            const { data, error } = await supabase
                .from('medication_schedule')
                .update({ 
                    taken: true
                })
                .eq('patient_id', userId)
                .eq('taken', false)
                .gte('scheduled_time', new Date().toISOString())
                .select();

            if (error) throw error;

            const count = data?.length || 0;
            
            document.querySelectorAll('.medication-item.pending').forEach(item => {
                item.classList.remove('pending');
                item.classList.add('taken-animation');
                item.style.background = '#d1fae5';
                item.style.borderLeft = '4px solid #10B981';
                
                const badge = item.querySelector('.med-status-badge');
                if (badge) {
                    badge.textContent = '✅';
                    badge.className = 'med-status-badge taken-badge';
                }
                
                const btn = item.querySelector('.mark-taken-btn');
                if (btn) {
                    btn.innerHTML = '✅ Taken';
                    btn.className = 'btn btn-sm btn-success';
                    btn.disabled = true;
                }
            });

            alert(`✅ Marked ${count} medications as taken! 🎉`);

            setTimeout(() => {
                this.loadView('medications');
            }, 1000);

        } catch (error) {
            console.error('Error marking all medications:', error);
            alert('❌ Failed to mark medications: ' + error.message);
            
            const buttons = document.querySelectorAll('.mark-taken-btn');
            buttons.forEach(btn => {
                btn.innerHTML = '✅ Mark Taken';
                btn.disabled = false;
            });
        }
    }

    // =============================================
    // CANCEL APPOINTMENT
    // =============================================
    async cancelAppointment(appointmentId) {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', appointmentId);

            if (error) throw error;

            alert('✅ Appointment cancelled successfully!');
            this.loadView('appointments');
        } catch (error) {
            console.error('Cancellation error:', error);
            alert('Failed to cancel appointment.');
        }
    }

    // =============================================
    // VIDEO CALL
    // =============================================
    joinVideoCall(appointmentId, roomId, doctorName) {
        console.log('Patient joinVideoCall called:', { appointmentId, roomId, doctorName });
        
        if (!roomId || roomId === 'null' || roomId === 'undefined' || roomId === '') {
            alert('No video room found. Please contact your doctor.');
            return;
        }
        
        const profile = authManager?.getUserProfile();
        const displayName = profile?.full_name || 'Patient';
        
        if (doctorName && !confirm(`Join video call with Dr. ${doctorName}?`)) {
            return;
        }
        
        if (window.videoManager && typeof window.videoManager.joinRoom === 'function') {
            window.videoManager.joinRoom(roomId, displayName);
        } else {
            alert(`🎥 Video call started\nRoom: ${roomId}\nName: ${displayName}`);
            window.open(`/video-call.html?room=${roomId}&name=${displayName}`, '_blank');
        }
    }
}

// Initialize patient manager
console.log('🚀 Creating PatientManager instance...');
const patientManager = new PatientManager();
window.patientManager = patientManager;
console.log('✅ PatientManager initialized and attached to window');