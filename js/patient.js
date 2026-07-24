/*
 * File: patient.js - Complete Patient Manager with Sidebar Navigation
 */

class PatientManager {
    constructor() {
        this.currentView = 'dashboard';
        this.isSidebarOpen = true;
        this.availableDoctors = [
            { id: 'd1', full_name: 'Sarah Wilson', specialty: 'Cardiology', email: 'sarah@email.com', phone: '0712345678' },
            { id: 'd2', full_name: 'Michael Chen', specialty: 'Dermatology', email: 'michael@email.com', phone: '0723456789' },
            { id: 'd3', full_name: 'Emily Rodriguez', specialty: 'Pediatrics', email: 'emily@email.com', phone: '0734567890' }
        ];
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
            <div class="app-layout patient-layout">
                <!-- Sidebar -->
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
                                <div class="avatar" style="background: #10B981;">${profile.full_name?.charAt(0) || 'U'}</div>
                                <div class="user-info">
                                    <span class="name">${profile.full_name}</span>
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
                alert('🔔 Notifications:\n\n• 1 appointment reminder\n• 2 medication reminders\n• 1 message from doctor');
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
        const sidebar = document.getElementById('patientSidebar');
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
        const sidebar = document.getElementById('patientSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
        if (overlay) {
            overlay.classList.toggle('active');
        }
    }

    closeMobileSidebar() {
        const sidebar = document.getElementById('patientSidebar');
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
        
        const content = document.getElementById('patientContent');
        if (!content) {
            console.error('❌ Content element not found');
            return;
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
                <button class="btn btn-primary mt-3" onclick="patientManager.loadView('dashboard')">⬅️ Back to Dashboard</button>
            `;
        }
    }

    // =============================================
    // DASHBOARD CONTENT
    // =============================================
    async loadDashboardContent(container) {
        const appointments = [
            { id: '1', doctor: { full_name: 'Dr. Sarah Wilson', specialty: 'Cardiology' }, scheduled_at: new Date(Date.now() + 86400000).toISOString(), consultation_type: 'video', status: 'scheduled' },
            { id: '2', doctor: { full_name: 'Dr. Michael Chen', specialty: 'Dermatology' }, scheduled_at: new Date(Date.now() + 172800000).toISOString(), consultation_type: 'physical', status: 'scheduled' }
        ];

        const medications = [
            { id: 'm1', medication: 'Amoxicillin', dosage: '500mg', scheduled_time: new Date(Date.now() + 3600000).toISOString() },
            { id: 'm2', medication: 'Lisinopril', dosage: '10mg', scheduled_time: new Date(Date.now() + 7200000).toISOString() }
        ];

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>🏥 Patient Dashboard</h2>
                    <p class="text-muted">Welcome to your telehealth portal</p>
                </div>
            </div>

            <!-- CLICKABLE STATS CARDS -->
            <div class="stats-grid">
                <div class="stat-card" onclick="patientManager.loadView('appointments')">
                    <div class="stat-label">📅 Upcoming</div>
                    <div class="stat-value accent">${appointments.length}</div>
                </div>
                <div class="stat-card" onclick="patientManager.loadView('medications')">
                    <div class="stat-label">💊 Medications</div>
                    <div class="stat-value warning">${medications.length}</div>
                </div>
                <div class="stat-card" onclick="patientManager.loadView('doctors')">
                    <div class="stat-label">👨‍⚕️ Doctors</div>
                    <div class="stat-value success">${this.availableDoctors.length}</div>
                </div>
                <div class="stat-card" onclick="patientManager.loadView('chat')">
                    <div class="stat-label">💬 Messages</div>
                    <div class="stat-value danger">2</div>
                </div>
            </div>

            ${medications.length > 0 ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="card border-success clickable" onclick="patientManager.loadView('medications')">
                            <div class="card-header bg-success text-white">
                                <h5 class="mb-0">⏰ Today's Medication Schedule</h5>
                                <span class="badge bg-light text-dark">${medications.length} pending</span>
                            </div>
                            <div class="card-body">
                                ${medications.map(med => `
                                    <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                                        <div>
                                            <strong>💊 ${med.medication}</strong>
                                            <br><small>${med.dosage} - ⏰ ${new Date(med.scheduled_time).toLocaleTimeString()}</small>
                                        </div>
                                        <div>
                                            <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); patientManager.markMedicationTaken('${med.id}')">✅ Mark Taken</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <div class="row mt-4">
                <div class="col-12">
                    <div class="card clickable" onclick="patientManager.loadView('appointments')">
                        <div class="card-header">
                            <h5 class="card-title">📅 Upcoming Appointments</h5>
                            <span class="badge bg-primary">${appointments.length}</span>
                        </div>
                        <div class="card-body">
                            ${appointments.map(apt => `
                                <div class="p-2 mb-2 bg-light rounded d-flex justify-content-between align-items-center flex-wrap">
                                    <div>
                                        <h6 class="mb-0">👨‍⚕️ ${apt.doctor.full_name}</h6>
                                        <p class="mb-0 small">⏰ ${new Date(apt.scheduled_at).toLocaleString()}</p>
                                        <span class="badge ${apt.consultation_type === 'video' ? 'bg-primary' : 'bg-warning'}">
                                            ${apt.consultation_type === 'video' ? '🎥' : '🏥'} ${apt.consultation_type}
                                        </span>
                                    </div>
                                    <div>
                                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); patientManager.loadView('appointments')">📅 View</button>
                                    </div>
                                </div>
                            `).join('')}
                            <button class="btn btn-primary mt-2 w-100" onclick="patientManager.loadView('appointments')">📅 View All Appointments</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // =============================================
    // APPOINTMENTS CONTENT
    // =============================================
    async loadAppointmentsContent(container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>📅 My Appointments</h2>
                    <button class="btn btn-primary mb-3" onclick="patientManager.showBookingModal()">➕ Book New</button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card" onclick="patientManager.loadView('appointments')">
                    <div class="stat-label">📅 Scheduled</div>
                    <div class="stat-value accent">2</div>
                </div>
                <div class="stat-card" onclick="patientManager.loadView('appointments')">
                    <div class="stat-label">✅ Completed</div>
                    <div class="stat-value success">5</div>
                </div>
                <div class="stat-card" onclick="patientManager.loadView('appointments')">
                    <div class="stat-label">⏳ Pending</div>
                    <div class="stat-value warning">1</div>
                </div>
            </div>

            <div class="row mt-3">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <div class="table-wrap">
                                <table class="table">
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
                                        <tr>
                                            <td><strong>Dr. Sarah Wilson</strong><br><small>Cardiology</small></td>
                                            <td><span class="badge bg-primary">🎥 Video</span></td>
                                            <td><small>⏰ ${new Date(Date.now() + 86400000).toLocaleString()}</small></td>
                                            <td><span class="badge bg-success">scheduled</span></td>
                                            <td><span class="badge bg-secondary">-</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-primary mb-1 w-100" onclick="patientManager.joinVideoCall('1', 'room-1', 'Dr. Sarah Wilson')">🎥 Join</button>
                                                <button class="btn btn-sm btn-danger w-100" onclick="patientManager.cancelAppointment('1')">❌ Cancel</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Dr. Michael Chen</strong><br><small>Dermatology</small></td>
                                            <td><span class="badge bg-warning">🏥 Physical</span></td>
                                            <td><small>⏰ ${new Date(Date.now() + 172800000).toLocaleString()}</small></td>
                                            <td><span class="badge bg-success">scheduled</span></td>
                                            <td><span class="badge bg-success">✅ Paid</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary mb-1 w-100" onclick="alert('📍 Physical consultation at clinic.')">📍 Location</button>
                                                <button class="btn btn-sm btn-danger w-100" onclick="patientManager.cancelAppointment('2')">❌ Cancel</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Dr. Emily Rodriguez</strong><br><small>Pediatrics</small></td>
                                            <td><span class="badge bg-primary">🎥 Video</span></td>
                                            <td><small>⏰ ${new Date(Date.now() - 86400000).toLocaleString()}</small></td>
                                            <td><span class="badge bg-secondary">completed</span></td>
                                            <td><span class="badge bg-warning">⏳ Due</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-warning w-100" onclick="alert('💳 Payment processing...')">💳 Pay Now</button>
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
    // DOCTORS CONTENT
    // =============================================
    async loadDoctorsContent(container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>👨‍⚕️ Find Doctors</h2>
                    <p class="text-muted">Browse available doctors and book appointments</p>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card" onclick="patientManager.loadView('doctors')">
                    <div class="stat-label">👨‍⚕️ Available</div>
                    <div class="stat-value success">${this.availableDoctors.length}</div>
                </div>
                <div class="stat-card" onclick="patientManager.showBookingModal()">
                    <div class="stat-label">➕ Book Now</div>
                    <div class="stat-value accent">+</div>
                </div>
            </div>

            <div class="row mt-3">
                ${this.availableDoctors.map(doc => `
                    <div class="col-md-4 col-sm-6 mb-3">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <div style="font-size: 4rem; margin-bottom: 12px;">👨‍⚕️</div>
                                <h5 class="card-title">Dr. ${doc.full_name}</h5>
                                <p class="card-text"><span class="badge bg-primary">${doc.specialty || 'General Practice'}</span></p>
                                <p class="card-text"><small>📧 ${doc.email}</small></p>
                                <p class="card-text"><small>📱 ${doc.phone || 'No phone'}</small></p>
                                <button class="btn btn-primary w-100" onclick="patientManager.showBookingModal('${doc.id}', '${doc.full_name}')">
                                    📅 Book Appointment
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // =============================================
    // MEDICATIONS CONTENT
    // =============================================
    async loadMedicationsContent(container) {
        const prescriptions = [
            { id: 'p1', medication: 'Amoxicillin', dosage: '500mg', frequency: '2 times per day', duration: '7 days', when_to_take: 'After meals', issued_at: new Date().toISOString() },
            { id: 'p2', medication: 'Lisinopril', dosage: '10mg', frequency: '1 time per day', duration: '30 days', when_to_take: 'In the morning', issued_at: new Date(Date.now() - 86400000).toISOString() }
        ];

        const upcomingMeds = [
            { id: 'm1', medication: 'Amoxicillin', dosage: '500mg', scheduled_time: new Date(Date.now() + 3600000).toISOString() },
            { id: 'm2', medication: 'Lisinopril', dosage: '10mg', scheduled_time: new Date(Date.now() + 7200000).toISOString() }
        ];

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>💊 Prescriptions & Medications</h2>
                    <p class="text-muted">View all your prescriptions and medication schedule</p>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card" onclick="patientManager.loadView('medications')">
                    <div class="stat-label">💊 Active</div>
                    <div class="stat-value success">${prescriptions.length}</div>
                </div>
                <div class="stat-card" onclick="patientManager.loadView('medications')">
                    <div class="stat-label">⏰ Today's Meds</div>
                    <div class="stat-value warning">${upcomingMeds.length}</div>
                </div>
            </div>

            ${upcomingMeds.length > 0 ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="card border-success">
                            <div class="card-header bg-success text-white">
                                <h5 class="mb-0">⏰ Today's Medication Schedule</h5>
                                <span class="badge bg-light text-dark">${upcomingMeds.length} pending</span>
                            </div>
                            <div class="card-body">
                                ${upcomingMeds.map(med => `
                                    <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                                        <div>
                                            <strong>💊 ${med.medication}</strong>
                                            <br><small>${med.dosage} - ⏰ ${new Date(med.scheduled_time).toLocaleTimeString()}</small>
                                        </div>
                                        <div>
                                            <button class="btn btn-sm btn-success" onclick="patientManager.markMedicationTaken('${med.id}')">✅ Mark Taken</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <div class="row mt-3">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">📋 All Prescriptions (${prescriptions.length})</h5>
                        </div>
                        <div class="card-body">
                            ${prescriptions.map(rx => `
                                <div class="border-bottom pb-3 mb-3">
                                    <div class="d-flex justify-content-between">
                                        <div>
                                            <h6 class="mb-0">💊 ${rx.medication} - ${rx.dosage}</h6>
                                            <p class="mb-0 small">
                                                <strong>⏰ Frequency:</strong> ${rx.frequency}
                                                <br><strong>📅 Duration:</strong> ${rx.duration}
                                                <br><strong>🍽️ When to take:</strong> ${rx.when_to_take}
                                            </p>
                                            <small>📅 Issued: ${new Date(rx.issued_at).toLocaleDateString()}</small>
                                        </div>
                                        <div>
                                            <span class="badge bg-success">✅ Active</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
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
                                <div class="d-flex justify-content-between align-items-center p-2 border-bottom clickable" onclick="alert('💬 Opening chat with Dr. Sarah Wilson')">
                                    <div>
                                        <strong>👨‍⚕️ Dr. Sarah Wilson</strong>
                                        <p class="mb-0 small text-muted">Last message: 10:30 AM</p>
                                    </div>
                                    <span class="badge bg-danger">1</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center p-2 border-bottom clickable" onclick="alert('💬 Opening chat with Dr. Michael Chen')">
                                    <div>
                                        <strong>👨‍⚕️ Dr. Michael Chen</strong>
                                        <p class="mb-0 small text-muted">Last message: Yesterday</p>
                                    </div>
                                    <span class="badge bg-secondary">0</span>
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
                    <h2>👤 My Profile</h2>
                </div>
            </div>
            <div class="row mt-4">
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
                            <h5>${profile.full_name}</h5>
                            <p class="text-muted">Patient</p>
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

            try {
                const userId = authManager.getUserId();
                const { error } = await supabase
                    .from('profiles')
                    .update({ full_name: fullName, phone: phone })
                    .eq('id', userId);

                if (error) throw error;

                authManager.userProfile.full_name = fullName;
                authManager.userProfile.phone = phone;

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

    showBookingModal(preSelectedDoctorId = null, preSelectedDoctorName = null) {
        const doctorsHtml = this.availableDoctors.map(doc =>
            `<option value="${doc.id}" ${doc.id === preSelectedDoctorId ? 'selected' : ''}>👨‍⚕️ Dr. ${doc.full_name} - ${doc.specialty || 'General Practice'}</option>`
        ).join('');

        const modalHtml = `
            <div class="modal-overlay" id="bookingModal">
                <div class="modal">
                    <div class="modal-header">
                        <h5 class="modal-title">📅 Book Appointment</h5>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="bookingForm">
                            <div class="form-group">
                                <label class="form-label">👨‍⚕️ Select Doctor</label>
                                <select class="form-control" id="doctorSelect" required>
                                    <option value="">Select a doctor...</option>
                                    ${doctorsHtml}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">⚙️ Consultation Type</label>
                                <select class="form-control" id="consultationType" required>
                                    <option value="video">🎥 Video Call - KES 300 (pay after call)</option>
                                    <option value="physical">🏥 Physical - KES 500 (pay now)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">📅 Date & Time</label>
                                <input type="datetime-local" class="form-control" id="appointmentDate" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">📝 Notes (Optional)</label>
                                <textarea class="form-control" id="appointmentNotes" rows="2" placeholder="Any specific concerns..."></textarea>
                            </div>
                            <div id="paymentInfo" class="alert alert-info">
                                🎥 <strong>Video Call:</strong> KES 300 (pay after call)<br>
                                🏥 <strong>Physical:</strong> KES 500 (pay now)
                            </div>
                            <button type="submit" class="btn btn-primary btn-block">📅 Book Now</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('bookingModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 1);
        defaultDate.setHours(9, 0, 0, 0);
        document.getElementById('appointmentDate').value = defaultDate.toISOString().slice(0, 16);

        document.getElementById('consultationType').addEventListener('change', (e) => {
            const type = e.target.value;
            const info = document.getElementById('paymentInfo');
            const btn = document.querySelector('#bookingForm button[type="submit"]');

            if (type === 'video') {
                info.innerHTML = '🎥 <strong>Video Call:</strong> KES 300 - Pay <strong>after</strong> the call';
                btn.innerHTML = '📅 Book Now (Pay Later)';
                btn.className = 'btn btn-primary btn-block';
            } else {
                info.innerHTML = '🏥 <strong>Physical Consultation:</strong> KES 500 - Pay <strong>now</strong> to book';
                btn.innerHTML = '💳 Pay KES 500 & Book';
                btn.className = 'btn btn-warning btn-block';
            }
        });

        document.getElementById('bookingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            alert('✅ Appointment booked successfully!');
            document.getElementById('bookingModal').remove();
            this.loadView('appointments');
        });
    }

    joinVideoCall(appointmentId, roomId, doctorName) {
        if (!roomId || roomId === 'null' || roomId === 'undefined') {
            alert('No video room found. Please contact your doctor.');
            return;
        }

        if (doctorName && !confirm(`Join video call with Dr. ${doctorName}?`)) {
            return;
        }

        const profile = authManager.getUserProfile();
        const displayName = profile?.full_name || 'Patient';

        if (window.videoManager) {
            window.videoManager.joinRoom(roomId, displayName);
        } else {
            alert(`🎥 Video call started\nRoom: ${roomId}\nName: ${displayName}`);
        }
    }

    markMedicationTaken(scheduleId) {
        alert('✅ Medication marked as taken!');
        this.loadView('medications');
    }

    cancelAppointment(appointmentId) {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;
        alert('✅ Appointment cancelled successfully!');
        this.loadView('appointments');
    }
}

// Initialize patient manager
const patientManager = new PatientManager();
window.patientManager = patientManager;
console.log('PatientManager initialized');