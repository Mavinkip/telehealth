/*
 * File: doctor.js - Complete Doctor Manager with Sidebar Navigation
 */

class DoctorManager {
    constructor() {
        this.currentView = 'dashboard';
        this.isSidebarOpen = true;
    }

    showDashboard() {
        const app = document.getElementById('app');
        const profile = authManager.getUserProfile();
        
        if (!profile) {
            authManager.showLoginPage();
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
            <div class="app-layout doctor-layout">
                <!-- Sidebar -->
                <aside class="sidebar" id="doctorSidebar">
                    <div class="sidebar-header">
                        <div class="brand" onclick="doctorManager.loadView('dashboard')">
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
                            <span class="nav-label">Appointments</span>
                        </button>
                        <button class="nav-item" data-view="patients">
                            <span class="nav-icon">👥</span>
                            <span class="nav-label">Patients</span>
                        </button>
                        <button class="nav-item" data-view="chat">
                            <span class="nav-icon">💬</span>
                            <span class="nav-label">Messages</span>
                        </button>
                        <button class="nav-item" data-view="profile">
                            <span class="nav-icon">⚙️</span>
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

                <!-- Main Content -->
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
                                <div class="avatar" style="background: #2563EB;">${profile.full_name?.charAt(0) || 'D'}</div>
                                <div class="user-info">
                                    <span class="name">Dr. ${profile.full_name}</span>
                                    <span class="role">Doctor</span>
                                </div>
                            </div>
                            <button class="header-logout-btn" id="logoutBtnHeader">
                                <i class="fas fa-sign-out-alt"></i>
                                <span>Logout</span>
                            </button>
                        </div>
                    </header>

                    <div class="content-area" id="doctorContent">
                        <!-- Dynamic content -->
                    </div>
                </main>
            </div>

            <div class="sidebar-overlay" id="sidebarOverlay"></div>
        `;
    }

    attachEvents() {
        // Sidebar navigation
        document.querySelectorAll('.nav-item[data-view]').forEach(link => {
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

        // Sidebar toggle (desktop)
        const toggleBtn = document.getElementById('sidebarToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Hamburger (mobile)
        const hamburger = document.getElementById('hamburgerBtn');
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                this.toggleMobileSidebar();
            });
        }

        // Overlay (mobile)
        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeMobileSidebar();
            });
        }

        // Logout buttons
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const result = await authManager.logout();
                if (result.success) {
                    window.location.reload();
                }
            });
        }

        const logoutBtnHeader = document.getElementById('logoutBtnHeader');
        if (logoutBtnHeader) {
            logoutBtnHeader.addEventListener('click', async () => {
                const result = await authManager.logout();
                if (result.success) {
                    window.location.reload();
                }
            });
        }

        // Notification button
        const notifBtn = document.getElementById('notificationBtn');
        if (notifBtn) {
            notifBtn.addEventListener('click', () => {
                alert('🔔 Notifications:\n\n• 3 new messages\n• 2 upcoming appointments\n• 1 prescription refill request');
            });
        }

        // Window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 992) {
                this.closeMobileSidebar();
            }
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('doctorSidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (window.innerWidth > 992) {
            this.isSidebarOpen = !this.isSidebarOpen;
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
            
            const icon = document.getElementById('sidebarToggle')?.querySelector('i');
            if (icon) {
                icon.className = this.isSidebarOpen ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
            }
        }
    }

    toggleMobileSidebar() {
        const sidebar = document.getElementById('doctorSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
        if (overlay) {
            overlay.classList.toggle('active');
        }
    }

    closeMobileSidebar() {
        const sidebar = document.getElementById('doctorSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) {
            sidebar.classList.remove('open');
        }
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    async loadView(view) {
        console.log('📱 Loading view:', view);
        
        const content = document.getElementById('doctorContent');
        if (!content) {
            console.error('❌ Content element not found');
            return;
        }

        const titleMap = {
            'dashboard': 'Dashboard',
            'appointments': 'Appointments',
            'patients': 'Patients',
            'chat': 'Messages',
            'profile': 'Profile'
        };
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = titleMap[view] || 'Dashboard';
        }

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
                case 'patients':
                    await this.loadPatientsContent(content);
                    break;
                case 'chat':
                    await this.loadChatContent(content);
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
                <button class="btn btn-primary mt-3" onclick="doctorManager.loadView('dashboard')">⬅️ Back to Dashboard</button>
            `;
        }
    }

    // =============================================
    // DASHBOARD CONTENT
    // =============================================
    async loadDashboardContent(container) {
        const userId = authManager.getUserId();
        
        // Mock data
        const todayAppointments = [
            { 
                id: '1', 
                patient: { full_name: 'John Doe', email: 'john@email.com', phone: '0712345678' }, 
                scheduled_at: new Date().toISOString(), 
                consultation_type: 'video', 
                status: 'scheduled' 
            },
            { 
                id: '2', 
                patient: { full_name: 'Jane Smith', email: 'jane@email.com', phone: '0723456789' }, 
                scheduled_at: new Date(Date.now() + 3600000).toISOString(), 
                consultation_type: 'physical', 
                status: 'scheduled' 
            }
        ];

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>🏥 Doctor Dashboard</h2>
                    <p class="text-muted">Welcome back, Dr. ${authManager.getUserProfile().full_name}</p>
                </div>
            </div>

            <!-- CLICKABLE STATS CARDS -->
            <div class="stats-grid">
                <div class="stat-card" onclick="doctorManager.loadView('appointments')">
                    <div class="stat-label">📅 Today's Appointments</div>
                    <div class="stat-value accent">${todayAppointments.length}</div>
                </div>
                <div class="stat-card" onclick="doctorManager.loadView('patients')">
                    <div class="stat-label">👥 Total Patients</div>
                    <div class="stat-value success">12</div>
                </div>
                <div class="stat-card" onclick="doctorManager.writePrescription('1', 'Patient')">
                    <div class="stat-label">💊 New Prescription</div>
                    <div class="stat-value warning">+</div>
                </div>
                <div class="stat-card" onclick="doctorManager.loadView('chat')">
                    <div class="stat-label">💬 Unread Messages</div>
                    <div class="stat-value danger">3</div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">📋 Today's Schedule</h5>
                            <span class="badge bg-primary">${todayAppointments.length} appointments</span>
                        </div>
                        <div class="card-body">
                            ${todayAppointments.map(apt => this._renderAppointmentCard(apt)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _renderAppointmentCard(apt) {
        const patientName = apt.patient?.full_name || 'Unknown Patient';
        const patientInitial = patientName.charAt(0) || 'P';
        const appointmentTime = new Date(apt.scheduled_at);
        const timeStr = appointmentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = appointmentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

        return `
            <div class="appointment-card">
                <div class="appointment-top">
                    <div class="appointment-doctor">
                        <div class="doctor-avatar" style="background: ${this._getColor(patientName)}; color: white;">
                            ${patientInitial}
                        </div>
                        <div>
                            <div class="doctor-name">${patientName}</div>
                            <div class="doctor-specialty">${apt.patient?.email || 'No email'}</div>
                        </div>
                    </div>
                    <div class="appointment-time-large">
                        <span class="time">${timeStr}</span>
                        <span class="date">${dateStr}</span>
                    </div>
                </div>
                <div class="appointment-details">
                    <span class="detail-item">🩺 ${apt.consultation_type === 'video' ? 'Video Consultation' : 'Physical Consultation'}</span>
                    <span class="detail-item">⏰ 30 minutes</span>
                    <span style="margin-left:auto;">
                        <span class="status-badge confirmed">
                            <span class="status-dot"></span>
                            Confirmed
                        </span>
                    </span>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-sm btn-primary" onclick="doctorManager.joinVideoCall('${apt.id}', 'room-${apt.id}', '${patientName}')">
                        🎥 Start Call
                    </button>
                    <button class="btn btn-sm btn-success" onclick="doctorManager.writePrescription('${apt.patient_id || '1'}', '${patientName}')">
                        💊 Prescribe
                    </button>
                    <button class="btn btn-sm btn-info" onclick="doctorManager.loadView('chat')">
                        💬 Message
                    </button>
                </div>
            </div>
        `;
    }

    _getColor(name) {
        const colors = ['#2563EB', '#7C3AED', '#DC2626', '#16A34A', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    // =============================================
    // APPOINTMENTS CONTENT
    // =============================================
    async loadAppointmentsContent(container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>📅 My Appointments</h2>
                    <p class="text-muted">View and manage all your appointments</p>
                </div>
            </div>

            <!-- CLICKABLE STATS -->
            <div class="stats-grid">
                <div class="stat-card" onclick="doctorManager.loadView('appointments')">
                    <div class="stat-label">📅 Today</div>
                    <div class="stat-value accent">2</div>
                </div>
                <div class="stat-card" onclick="doctorManager.loadView('appointments')">
                    <div class="stat-label">📅 Upcoming</div>
                    <div class="stat-value success">5</div>
                </div>
                <div class="stat-card" onclick="doctorManager.loadView('appointments')">
                    <div class="stat-label">📋 Past</div>
                    <div class="stat-value">12</div>
                </div>
            </div>

            <div class="row mt-3">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">All Appointments</h5>
                            <span class="badge bg-primary">19</span>
                        </div>
                        <div class="card-body">
                            <div class="table-wrap">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Patient</th>
                                            <th>Type</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>John Doe</strong></td>
                                            <td>🎥 Video</td>
                                            <td>Today 10:00 AM</td>
                                            <td><span class="pill pill-scheduled">Scheduled</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-primary" onclick="doctorManager.joinVideoCall('1', 'room-1', 'John Doe')">🎥</button>
                                                <button class="btn btn-sm btn-success" onclick="doctorManager.writePrescription('1', 'John Doe')">💊</button>
                                                <button class="btn btn-sm btn-info" onclick="doctorManager.loadView('chat')">💬</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Jane Smith</strong></td>
                                            <td>🏥 Physical</td>
                                            <td>Today 2:30 PM</td>
                                            <td><span class="pill pill-scheduled">Scheduled</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-success" onclick="doctorManager.writePrescription('2', 'Jane Smith')">💊</button>
                                                <button class="btn btn-sm btn-info" onclick="doctorManager.loadView('chat')">💬</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Bob Johnson</strong></td>
                                            <td>🎥 Video</td>
                                            <td>Yesterday 11:00 AM</td>
                                            <td><span class="pill pill-completed">Completed</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-success" onclick="doctorManager.writePrescription('3', 'Bob Johnson')">💊</button>
                                                <button class="btn btn-sm btn-info" onclick="doctorManager.loadView('chat')">💬</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // =============================================
    // PATIENTS CONTENT
    // =============================================
    async loadPatientsContent(container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>👥 My Patients</h2>
                    <p class="text-muted">Manage your patients, write prescriptions, and schedule follow-ups</p>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card" onclick="doctorManager.loadView('patients')">
                    <div class="stat-label">👥 Total Patients</div>
                    <div class="stat-value success">12</div>
                </div>
                <div class="stat-card" onclick="doctorManager.loadView('patients')">
                    <div class="stat-label">💊 Active Prescriptions</div>
                    <div class="stat-value warning">8</div>
                </div>
                <div class="stat-card" onclick="doctorManager.loadView('appointments')">
                    <div class="stat-label">📅 Follow-ups</div>
                    <div class="stat-value accent">3</div>
                </div>
            </div>

            <div class="row mt-3">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Patient List</h5>
                            <span class="badge bg-primary">12 patients</span>
                        </div>
                        <div class="card-body">
                            <div class="table-wrap">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Patient</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>John Doe</strong></td>
                                            <td>john@email.com</td>
                                            <td>0712345678</td>
                                            <td>
                                                <div class="d-flex flex-wrap gap-1">
                                                    <button class="btn btn-sm btn-primary" onclick="doctorManager.viewPatientHistory('1', 'John Doe')">📄 History</button>
                                                    <button class="btn btn-sm btn-success" onclick="doctorManager.writePrescription('1', 'John Doe')">💊 Prescribe</button>
                                                    <button class="btn btn-sm btn-info" onclick="doctorManager.loadView('chat')">💬 Message</button>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Jane Smith</strong></td>
                                            <td>jane@email.com</td>
                                            <td>0723456789</td>
                                            <td>
                                                <div class="d-flex flex-wrap gap-1">
                                                    <button class="btn btn-sm btn-primary" onclick="doctorManager.viewPatientHistory('2', 'Jane Smith')">📄 History</button>
                                                    <button class="btn btn-sm btn-success" onclick="doctorManager.writePrescription('2', 'Jane Smith')">💊 Prescribe</button>
                                                    <button class="btn btn-sm btn-info" onclick="doctorManager.loadView('chat')">💬 Message</button>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Bob Johnson</strong></td>
                                            <td>bob@email.com</td>
                                            <td>0734567890</td>
                                            <td>
                                                <div class="d-flex flex-wrap gap-1">
                                                    <button class="btn btn-sm btn-primary" onclick="doctorManager.viewPatientHistory('3', 'Bob Johnson')">📄 History</button>
                                                    <button class="btn btn-sm btn-success" onclick="doctorManager.writePrescription('3', 'Bob Johnson')">💊 Prescribe</button>
                                                    <button class="btn btn-sm btn-info" onclick="doctorManager.loadView('chat')">💬 Message</button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // =============================================
    // CHAT CONTENT
    // =============================================
    async loadChatContent(container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">💬 Messages</h5>
                            <button class="btn btn-sm btn-primary" onclick="alert('📱 New message composer opened')">✏️ New</button>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <h6>Recent Conversations</h6>
                                <div class="d-flex justify-content-between align-items-center p-2 border-bottom clickable" onclick="alert('💬 Opening chat with John Doe')">
                                    <div>
                                        <strong>👤 John Doe</strong>
                                        <p class="mb-0 small text-muted">Last message: 10:30 AM</p>
                                    </div>
                                    <span class="badge bg-danger">2</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center p-2 border-bottom clickable" onclick="alert('💬 Opening chat with Jane Smith')">
                                    <div>
                                        <strong>👤 Jane Smith</strong>
                                        <p class="mb-0 small text-muted">Last message: Yesterday</p>
                                    </div>
                                    <span class="badge bg-secondary">0</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center p-2 border-bottom clickable" onclick="alert('💬 Opening chat with Bob Johnson')">
                                    <div>
                                        <strong>👤 Bob Johnson</strong>
                                        <p class="mb-0 small text-muted">Last message: 2 days ago</p>
                                    </div>
                                    <span class="badge bg-danger">1</span>
                                </div>
                            </div>
                            <div class="mt-3">
                                <div class="d-flex gap-2">
                                    <input type="text" class="form-control" placeholder="Type a message..." id="chatInput">
                                    <button class="btn btn-primary" onclick="alert('📤 Sending message...')">📤 Send</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // =============================================
    // PROFILE CONTENT
    // =============================================
    async loadProfileContent(container) {
        const profile = authManager.getUserProfile();

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>⚙️ My Profile</h2>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-body">
                            <form id="profileForm">
                                <div class="form-group">
                                    <label class="form-label">👤 Full Name</label>
                                    <input type="text" class="form-control" id="fullName" value="${profile.full_name || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">📧 Email</label>
                                    <input type="email" class="form-control" id="email" value="${profile.email || ''}" disabled>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">🩺 Specialty</label>
                                    <input type="text" class="form-control" id="specialty" value="${profile.specialty || 'General Practice'}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">📱 Phone</label>
                                    <input type="tel" class="form-control" id="phone" value="${profile.phone || ''}">
                                </div>
                                <button type="submit" class="btn btn-primary">💾 Update Profile</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <div style="font-size: 4rem;">👨‍⚕️</div>
                            <h5>Dr. ${profile.full_name}</h5>
                            <p class="text-muted">${profile.specialty || 'General Practice'}</p>
                            <p><small>📧 ${profile.email}</small></p>
                            <p><small>📱 ${profile.phone || 'No phone'}</small></p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const specialty = document.getElementById('specialty').value.trim();

            try {
                const userId = authManager.getUserId();
                const { error } = await supabase
                    .from('profiles')
                    .update({ full_name: fullName, phone: phone, specialty: specialty })
                    .eq('id', userId);

                if (error) throw error;

                authManager.userProfile.full_name = fullName;
                authManager.userProfile.phone = phone;
                authManager.userProfile.specialty = specialty;

                alert('✅ Profile updated successfully!');
                this.loadView('profile');
            } catch (error) {
                alert('Failed to update profile: ' + error.message);
            }
        });
    }

    // =============================================
    // ACTIONS
    // =============================================

    writePrescription(patientId, patientName) {
        const modalHtml = `
            <div class="modal-overlay" id="prescriptionModal">
                <div class="modal">
                    <div class="modal-header">
                        <h5 class="modal-title">💊 Write Prescription - ${patientName || 'Patient'}</h5>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="prescriptionForm">
                            <div class="form-group">
                                <label class="form-label">💊 Medication Name *</label>
                                <input type="text" class="form-control" id="medicationName" placeholder="e.g., Amoxicillin" required>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="form-label">📏 Dosage *</label>
                                        <input type="text" class="form-control" id="dosage" placeholder="e.g., 500mg" required>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="form-label">⏰ Times Per Day</label>
                                        <select class="form-control" id="timesPerDay">
                                            <option value="1 time per day">1 time per day</option>
                                            <option value="2 times per day" selected>2 times per day</option>
                                            <option value="3 times per day">3 times per day</option>
                                            <option value="4 times per day">4 times per day</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="form-label">📅 Duration (Days) *</label>
                                        <input type="number" class="form-control" id="durationDays" placeholder="e.g., 7" min="1" required>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">🍽️ When to Take</label>
                                <select class="form-control" id="whenToTake">
                                    <option value="After meals">After meals</option>
                                    <option value="Before meals">Before meals</option>
                                    <option value="With food">With food</option>
                                    <option value="On empty stomach">On empty stomach</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">📝 Instructions</label>
                                <textarea class="form-control" id="instructions" rows="2" placeholder="Special instructions..."></textarea>
                            </div>
                            <button type="submit" class="btn btn-success btn-block">💾 Save Prescription</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('prescriptionModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('prescriptionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            alert('✅ Prescription saved successfully!');
            document.getElementById('prescriptionModal').remove();
            this.loadView('patients');
        });
    }

    joinVideoCall(appointmentId, roomId, patientName) {
        if (!roomId || roomId === 'null' || roomId === 'undefined') {
            alert('❌ No video room found for this appointment.');
            return;
        }

        if (patientName && !confirm(`Start video call with ${patientName}?`)) {
            return;
        }

        const profile = authManager.getUserProfile();
        const displayName = `Dr. ${profile?.full_name || 'Doctor'}`;

        if (window.videoManager) {
            window.videoManager.joinRoom(roomId, displayName);
        } else {
            alert(`🎥 Video call started\nRoom: ${roomId}\nName: ${displayName}`);
        }
    }

    viewPatientHistory(patientId, patientName) {
        alert(`📄 Medical History for ${patientName}\n\n📋 Last Visit: 2 weeks ago\n💊 Current Medications: Amoxicillin, Lisinopril\n🩺 Diagnosis: Hypertension\n📝 Notes: Patient is responding well to treatment.`);
    }

    openChat() {
        this.loadView('chat');
    }
}

// Initialize doctor manager
const doctorManager = new DoctorManager();
window.doctorManager = doctorManager;
console.log('✅ DoctorManager initialized');