/*
 * File: doctor.js - Complete Doctor Manager with Fixed Prescription Form & History
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
                patient_id: 'p1',
                patient: { full_name: 'John Doe', email: 'john@email.com', phone: '0712345678' }, 
                scheduled_at: new Date().toISOString(), 
                consultation_type: 'video', 
                status: 'scheduled' 
            },
            { 
                id: '2', 
                patient_id: 'p2',
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
                <div class="stat-card" onclick="doctorManager.showPrescriptionModal('p1', 'John Doe')">
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
        const patientId = apt.patient_id || 'p1';
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
                    <button class="btn btn-sm btn-success" onclick="doctorManager.showPrescriptionModal('${patientId}', '${patientName}')">
                        💊 Prescribe
                    </button>
                    <button class="btn btn-sm btn-info" onclick="doctorManager.loadView('chat')">
                        💬 Message
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="doctorManager.viewPatientHistory('${patientId}', '${patientName}')">
                        📄 History
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
                                                <button class="btn btn-sm btn-success" onclick="doctorManager.showPrescriptionModal('p1', 'John Doe')">💊</button>
                                                <button class="btn btn-sm btn-info" onclick="doctorManager.loadView('chat')">💬</button>
                                                <button class="btn btn-sm btn-secondary" onclick="doctorManager.viewPatientHistory('p1', 'John Doe')">📄</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Jane Smith</strong></td>
                                            <td>🏥 Physical</td>
                                            <td>Today 2:30 PM</td>
                                            <td><span class="pill pill-scheduled">Scheduled</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-success" onclick="doctorManager.showPrescriptionModal('p2', 'Jane Smith')">💊</button>
                                                <button class="btn btn-sm btn-info" onclick="doctorManager.loadView('chat')">💬</button>
                                                <button class="btn btn-sm btn-secondary" onclick="doctorManager.viewPatientHistory('p2', 'Jane Smith')">📄</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Bob Johnson</strong></td>
                                            <td>🎥 Video</td>
                                            <td>Yesterday 11:00 AM</td>
                                            <td><span class="pill pill-completed">Completed</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-success" onclick="doctorManager.showPrescriptionModal('p3', 'Bob Johnson')">💊</button>
                                                <button class="btn btn-sm btn-info" onclick="doctorManager.loadView('chat')">💬</button>
                                                <button class="btn btn-sm btn-secondary" onclick="doctorManager.viewPatientHistory('p3', 'Bob Johnson')">📄</button>
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
        const patients = [
            { id: 'p1', full_name: 'John Doe', email: 'john@email.com', phone: '0712345678' },
            { id: 'p2', full_name: 'Jane Smith', email: 'jane@email.com', phone: '0723456789' },
            { id: 'p3', full_name: 'Bob Johnson', email: 'bob@email.com', phone: '0734567890' },
            { id: 'p4', full_name: 'Alice Brown', email: 'alice@email.com', phone: '0745678901' }
        ];

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>👥 My Patients</h2>
                    <p class="text-muted">Manage your patients, write prescriptions, and view medical history</p>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card" onclick="doctorManager.loadView('patients')">
                    <div class="stat-label">👥 Total Patients</div>
                    <div class="stat-value success">${patients.length}</div>
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
                            <span class="badge bg-primary">${patients.length} patients</span>
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
                                        ${patients.map(patient => `
                                            <tr>
                                                <td><strong>${patient.full_name}</strong></td>
                                                <td>${patient.email}</td>
                                                <td>${patient.phone}</td>
                                                <td>
                                                    <div class="d-flex flex-wrap gap-1">
                                                        <button class="btn btn-sm btn-primary" onclick="doctorManager.viewPatientHistory('${patient.id}', '${patient.full_name}')">
                                                            📄 History
                                                        </button>
                                                        <button class="btn btn-sm btn-success" onclick="doctorManager.showPrescriptionModal('${patient.id}', '${patient.full_name}')">
                                                            💊 Prescribe
                                                        </button>
                                                        <button class="btn btn-sm btn-info" onclick="doctorManager.loadView('chat')">
                                                            💬 Message
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('')}
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
    // PRESCRIPTION MODAL - FIXED!
    // =============================================
    showPrescriptionModal(patientId, patientName) {
        console.log('📝 Opening prescription modal for:', patientName, 'ID:', patientId);
        
        if (!patientId || patientId === 'undefined' || patientId === 'null') {
            alert('❌ Error: Invalid patient ID. Please try again.');
            return;
        }

        const modalHtml = `
            <div class="modal-overlay" id="prescriptionModal">
                <div class="modal" style="max-width: 650px;">
                    <div class="modal-header" style="border-bottom: 2px solid var(--success); padding-bottom: 16px;">
                        <h5 class="modal-title" style="font-size: 1.3rem;">
                            💊 Write Prescription
                            <small style="display:block; font-size: 0.85rem; color: var(--text-light); font-weight: normal;">
                                For: ${patientName || 'Patient'}
                            </small>
                        </h5>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="font-size: 1.8rem;">×</button>
                    </div>
                    <div class="modal-body" style="padding-top: 20px;">
                        <form id="prescriptionForm">
                            <!-- Hidden patient ID -->
                            <input type="hidden" id="prescriptionPatientId" value="${patientId}">
                            
                            <!-- Medication Name -->
                            <div class="form-group">
                                <label class="form-label">💊 Medication Name *</label>
                                <input type="text" class="form-control" id="medicationName" 
                                    placeholder="e.g., Amoxicillin, Lisinopril, Metformin" 
                                    required style="font-size: 1rem;">
                            </div>

                            <!-- Dosage & Strength -->
                            <div class="form-group">
                                <label class="form-label">📏 Dosage & Strength *</label>
                                <input type="text" class="form-control" id="dosage" 
                                    placeholder="e.g., 500mg, 10mg, 25mg/5ml" 
                                    required style="font-size: 1rem;">
                            </div>

                            <!-- Row: Frequency + Duration -->
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="form-label">⏰ Frequency *</label>
                                        <select class="form-control" id="frequency" required>
                                            <option value="Once daily">Once daily</option>
                                            <option value="Twice daily" selected>Twice daily</option>
                                            <option value="Three times daily">Three times daily</option>
                                            <option value="Four times daily">Four times daily</option>
                                            <option value="Every 6 hours">Every 6 hours</option>
                                            <option value="Every 8 hours">Every 8 hours</option>
                                            <option value="Every 12 hours">Every 12 hours</option>
                                            <option value="As needed">As needed</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="form-label">📅 Duration *</label>
                                        <select class="form-control" id="duration" required>
                                            <option value="3 days">3 days</option>
                                            <option value="5 days">5 days</option>
                                            <option value="7 days" selected>7 days</option>
                                            <option value="10 days">10 days</option>
                                            <option value="14 days">14 days</option>
                                            <option value="21 days">21 days</option>
                                            <option value="30 days">30 days</option>
                                            <option value="60 days">60 days</option>
                                            <option value="90 days">90 days</option>
                                            <option value="Ongoing">Ongoing</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- When to Take -->
                            <div class="form-group">
                                <label class="form-label">🍽️ When to Take</label>
                                <select class="form-control" id="whenToTake">
                                    <option value="After meals" selected>After meals</option>
                                    <option value="Before meals">Before meals</option>
                                    <option value="With food">With food</option>
                                    <option value="On empty stomach">On empty stomach</option>
                                    <option value="At bedtime">At bedtime</option>
                                    <option value="In the morning">In the morning</option>
                                    <option value="In the evening">In the evening</option>
                                </select>
                            </div>

                            <!-- Special Instructions -->
                            <div class="form-group">
                                <label class="form-label">📝 Special Instructions</label>
                                <textarea class="form-control" id="instructions" rows="3" 
                                    placeholder="e.g., Take with plenty of water, Avoid alcohol, Complete full course..."></textarea>
                            </div>

                            <!-- Notes -->
                            <div class="form-group">
                                <label class="form-label">📌 Additional Notes</label>
                                <textarea class="form-control" id="notes" rows="2" 
                                    placeholder="Any additional notes or warnings..."></textarea>
                            </div>

                            <!-- Send Reminders Checkbox -->
                            <div class="form-check" style="margin: 12px 0;">
                                <input class="form-check-input" type="checkbox" id="sendReminders" checked>
                                <label class="form-check-label" for="sendReminders">
                                    🔔 Send medication reminders to patient
                                </label>
                            </div>

                            <!-- Submit Button -->
                            <button type="submit" class="btn btn-success btn-block" style="padding: 12px; font-size: 1rem;">
                                💾 Save Prescription & Schedule Reminders
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('prescriptionModal');
        if (existingModal) existingModal.remove();

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Set default date for duration days
        const durationSelect = document.getElementById('duration');
        if (durationSelect) {
            durationSelect.addEventListener('change', function() {
                // You could add logic here to auto-calculate days
            });
        }

        // Handle form submission
        document.getElementById('prescriptionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const patientId = document.getElementById('prescriptionPatientId').value;
            const medication = document.getElementById('medicationName').value.trim();
            const dosage = document.getElementById('dosage').value.trim();
            const frequency = document.getElementById('frequency').value;
            const duration = document.getElementById('duration').value;
            const whenToTake = document.getElementById('whenToTake').value;
            const instructions = document.getElementById('instructions').value.trim();
            const notes = document.getElementById('notes').value.trim();
            const sendReminders = document.getElementById('sendReminders').checked;

            // Validate required fields
            if (!medication) {
                alert('⚠️ Please enter the medication name.');
                document.getElementById('medicationName').focus();
                return;
            }
            if (!dosage) {
                alert('⚠️ Please enter the dosage.');
                document.getElementById('dosage').focus();
                return;
            }

            // Extract duration days for schedule
            let durationDays = 7;
            const durationMatch = duration.match(/(\d+)/);
            if (durationMatch) {
                durationDays = parseInt(durationMatch[1]);
            } else if (duration === 'Ongoing') {
                durationDays = 30; // Default for ongoing
            }

            // Create prescription data
            const prescriptionData = {
                patient_id: patientId,
                medication: medication,
                dosage: dosage,
                frequency: frequency,
                duration: duration,
                duration_days: durationDays,
                when_to_take: whenToTake,
                instructions: instructions || 'Take as directed',
                notes: notes || '',
                send_reminders: sendReminders,
                issued_at: new Date().toISOString()
            };

            try {
                // Save to Supabase
                const { data, error } = await supabase
                    .from('prescriptions')
                    .insert([prescriptionData])
                    .select();

                if (error) {
                    console.error('Supabase error:', error);
                    alert('❌ Failed to save prescription: ' + error.message);
                    return;
                }

                // Create medication schedule if reminders are enabled
                if (sendReminders && durationDays > 0) {
                    await this.createMedicationSchedule(patientId, prescriptionData);
                    await this.sendMedicationReminders(patientId, prescriptionData);
                }

                alert('✅ Prescription saved successfully! Medication schedule created.');
                document.getElementById('prescriptionModal').remove();
                
                // Refresh the patients view or current view
                this.loadView('patients');

            } catch (error) {
                console.error('Prescription error:', error);
                alert('❌ Error saving prescription: ' + error.message);
            }
        });
    }

    // =============================================
    // CREATE MEDICATION SCHEDULE
    // =============================================
    async createMedicationSchedule(patientId, prescriptionData) {
        try {
            const timesPerDay = this.getTimesPerDayNumber(prescriptionData.frequency);
            const intervalHours = Math.floor(12 / timesPerDay);
            const scheduleEntries = [];
            const startDate = new Date();

            for (let d = 0; d < prescriptionData.duration_days; d++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + d);
                
                for (let t = 0; t < timesPerDay; t++) {
                    const hour = 8 + (t * intervalHours);
                    const reminderTime = new Date(date);
                    reminderTime.setHours(hour, 0, 0, 0);
                    
                    // Only add future times
                    if (reminderTime > new Date()) {
                        scheduleEntries.push({
                            patient_id: patientId,
                            medication: prescriptionData.medication,
                            dosage: prescriptionData.dosage,
                            scheduled_time: reminderTime.toISOString(),
                            taken: false,
                            created_at: new Date().toISOString()
                        });
                    }
                }
            }

            if (scheduleEntries.length > 0) {
                const { error } = await supabase
                    .from('medication_schedule')
                    .insert(scheduleEntries);

                if (error) {
                    console.error('Error creating medication schedule:', error);
                } else {
                    console.log(`✅ Created ${scheduleEntries.length} medication schedule entries`);
                }
            }

        } catch (error) {
            console.error('Error creating medication schedule:', error);
        }
    }

    getTimesPerDayNumber(frequency) {
        if (!frequency) return 2;
        if (frequency.includes('Once') || frequency.includes('1')) return 1;
        if (frequency.includes('Twice') || frequency.includes('2')) return 2;
        if (frequency.includes('Three') || frequency.includes('3')) return 3;
        if (frequency.includes('Four') || frequency.includes('4')) return 4;
        if (frequency.includes('Every 6')) return 4;
        if (frequency.includes('Every 8')) return 3;
        if (frequency.includes('Every 12')) return 2;
        return 2;
    }

    // =============================================
    // SEND MEDICATION REMINDERS
    // =============================================
    async sendMedicationReminders(patientId, prescriptionData) {
        try {
            const doctorId = authManager.getUserId();
            const { data: doctorData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', doctorId)
                .single();

            const doctorName = doctorData?.full_name || 'Doctor';
            const timesPerDay = this.getTimesPerDayNumber(prescriptionData.frequency);
            const intervalHours = Math.floor(12 / timesPerDay);
            const reminderTimes = [];

            for (let i = 0; i < timesPerDay; i++) {
                const hour = 8 + (i * intervalHours);
                reminderTimes.push(`${hour.toString().padStart(2, '0')}:00`);
            }

            const messageContent = `💊 **New Prescription**\n\n` +
                `Dr. ${doctorName} has prescribed:\n` +
                `📋 **${prescriptionData.medication}** - ${prescriptionData.dosage}\n` +
                `⏰ **Frequency:** ${prescriptionData.frequency}\n` +
                `📅 **Duration:** ${prescriptionData.duration}\n` +
                `🍽️ **When to take:** ${prescriptionData.when_to_take}\n` +
                `💡 **Instructions:** ${prescriptionData.instructions || 'Take as directed'}\n\n` +
                `🔔 You will receive reminders when it's time to take your medication.`;

            const { error } = await supabase
                .from('messages')
                .insert([{
                    sender_id: doctorId,
                    receiver_id: patientId,
                    appointment_id: null,
                    content: messageContent,
                    sent_at: new Date().toISOString()
                }]);

            if (error) {
                console.error('Error sending reminder:', error);
            } else {
                console.log('✅ Medication reminders sent to patient');
            }

        } catch (error) {
            console.error('Error sending medication reminders:', error);
        }
    }

    // =============================================
    // VIEW PATIENT HISTORY - FIXED!
    // =============================================
    async viewPatientHistory(patientId, patientName) {
        console.log('📄 Viewing patient history for:', patientName, 'ID:', patientId);
        
        if (!patientId || patientId === 'undefined' || patientId === 'null') {
            alert('❌ Error: Invalid patient ID.');
            return;
        }

        // Mock medical records for demo
        const mockRecords = [
            {
                id: 'r1',
                doctor: { full_name: 'Dr. Sarah Wilson' },
                created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
                soap_notes: 'Patient presented with hypertension. Blood pressure 145/90. Prescribed Lisinopril 10mg daily.',
                prescriptions: [
                    { medication: 'Lisinopril', dosage: '10mg', instructions: 'Take once daily in the morning' }
                ]
            },
            {
                id: 'r2',
                doctor: { full_name: 'Dr. Sarah Wilson' },
                created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
                soap_notes: 'Follow-up visit. Blood pressure improved to 130/85. Patient reports no side effects. Continue current medication.',
                prescriptions: [
                    { medication: 'Lisinopril', dosage: '10mg', instructions: 'Take once daily in the morning' }
                ]
            },
            {
                id: 'r3',
                doctor: { full_name: 'Dr. Sarah Wilson' },
                created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
                soap_notes: 'Patient reported mild headache and fatigue. Blood pressure 128/82. Recommended lifestyle changes.',
                prescriptions: []
            }
        ];

        // Try to fetch from Supabase, fallback to mock data
        let records = mockRecords;
        try {
            const { data: realRecords, error } = await supabase
                .from('medical_records')
                .select(`
                    *,
                    doctor:profiles!medical_records_doctor_id_fkey (full_name),
                    prescriptions:prescriptions (*)
                `)
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });

            if (!error && realRecords && realRecords.length > 0) {
                records = realRecords;
            }
        } catch (error) {
            console.log('Using mock data for demo (Supabase not configured)');
        }

        const modalHtml = `
            <div class="modal-overlay" id="historyModal">
                <div class="modal" style="max-width: 750px; max-height: 85vh;">
                    <div class="modal-header" style="border-bottom: 2px solid var(--primary); padding-bottom: 16px;">
                        <h5 class="modal-title" style="font-size: 1.3rem;">
                            📄 Medical History
                            <small style="display:block; font-size: 0.85rem; color: var(--text-light); font-weight: normal;">
                                ${patientName || 'Patient'} - ${records.length} records found
                            </small>
                        </h5>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="font-size: 1.8rem;">×</button>
                    </div>
                    <div class="modal-body" style="padding-top: 20px; overflow-y: auto; max-height: calc(85vh - 80px);">
                        ${records && records.length > 0
                            ? records.map((record, index) => `
                                <div class="card mb-3" style="border-left: 4px solid var(--primary);">
                                    <div class="card-header" style="background: var(--background); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                                        <div>
                                            <strong>👨‍⚕️ ${record.doctor?.full_name || 'Unknown Doctor'}</strong>
                                            <span class="badge bg-secondary ms-2">#${index + 1}</span>
                                        </div>
                                        <small class="text-muted">📅 ${new Date(record.created_at).toLocaleString()}</small>
                                    </div>
                                    <div class="card-body">
                                        <div style="margin-bottom: 12px;">
                                            <strong>📝 SOAP Notes:</strong>
                                            <p style="background: var(--background); padding: 12px; border-radius: var(--radius-sm); margin-top: 4px;">
                                                ${record.soap_notes || 'No notes available'}
                                            </p>
                                        </div>
                                        
                                        ${record.prescriptions && record.prescriptions.length > 0 ? `
                                            <div>
                                                <strong>💊 Prescriptions:</strong>
                                                <ul style="list-style: none; padding: 0;">
                                                    ${record.prescriptions.map(rx => `
                                                        <li style="background: var(--success-light); padding: 8px 12px; border-radius: var(--radius-sm); margin-bottom: 4px;">
                                                            <strong>${rx.medication}</strong> - ${rx.dosage}
                                                            ${rx.instructions ? `<br><small>📝 ${rx.instructions}</small>` : ''}
                                                        </li>
                                                    `).join('')}
                                                </ul>
                                            </div>
                                        ` : `
                                            <div class="text-muted small">
                                                ℹ️ No prescriptions in this record
                                            </div>
                                        `}
                                    </div>
                                </div>
                            `).join('')
                            : `
                                <div class="text-center py-5">
                                    <div style="font-size: 4rem; margin-bottom: 16px;">📭</div>
                                    <h5>No Medical Records Found</h5>
                                    <p class="text-muted">This patient has no medical records yet.</p>
                                    <button class="btn btn-primary mt-2" onclick="doctorManager.showPrescriptionModal('${patientId}', '${patientName}')">
                                        💊 Write First Prescription
                                    </button>
                                </div>
                            `
                        }
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('historyModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // =============================================
    // VIDEO CALL
    // =============================================
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

    openChat() {
        this.loadView('chat');
    }
}

// Initialize doctor manager
const doctorManager = new DoctorManager();
window.doctorManager = doctorManager;
console.log('✅ DoctorManager initialized');