/*
 * File: doctor.js - Complete Doctor Manager with Real Data
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
        document.querySelectorAll('.nav-item[data-view]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const view = link.dataset.view;
                
                document.querySelectorAll('.nav-item[data-view]').forEach(l => {
                    l.classList.remove('active');
                });
                link.classList.add('active');
                
                this.loadView(view);
                this.closeMobileSidebar();
            });
        });

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
        const content = document.getElementById('doctorContent');
        if (!content) return;

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
            console.error('Error loading view:', error);
            content.innerHTML = `
                <div class="alert alert-danger">
                    ❌ Error loading view: ${error.message}
                </div>
                <button class="btn btn-primary mt-3" onclick="doctorManager.loadView('dashboard')">⬅️ Back to Dashboard</button>
            `;
        }
    }

    // =============================================
    // DASHBOARD CONTENT - REAL DATA
    // =============================================
    async loadDashboardContent(container) {
        const userId = authManager.getUserId();
        
        // Get today's appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: todayAppointments } = await supabase
            .from('appointments')
            .select(`
                *,
                patient:profiles!appointments_patient_id_fkey (id, full_name, email, phone)
            `)
            .eq('doctor_id', userId)
            .eq('status', 'scheduled')
            .gte('scheduled_at', today.toISOString())
            .lt('scheduled_at', tomorrow.toISOString())
            .order('scheduled_at', { ascending: true });

        // Get total patients (distinct)
        const { data: patientData } = await supabase
            .from('appointments')
            .select('patient_id')
            .eq('doctor_id', userId);
        
        const uniquePatients = patientData ? [...new Set(patientData.map(p => p.patient_id))] : [];
        const patientCount = uniquePatients.length;

        // Get completed appointments this month
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const { count: completedCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('doctor_id', userId)
            .eq('status', 'completed')
            .gte('scheduled_at', thisMonth.toISOString());

        // Get unread messages
        const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .is('read_at', null);

        // Get prescriptions count
        const { count: prescriptionCount } = await supabase
            .from('prescriptions')
            .select('*', { count: 'exact', head: true })
            .eq('doctor_id', userId);

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>🏥 Doctor Dashboard</h2>
                    <p class="text-muted">Welcome back, Dr. ${authManager.getUserProfile().full_name}</p>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card" onclick="doctorManager.loadView('appointments')" style="cursor:pointer;">
                    <div class="stat-label">📅 Today's Appointments</div>
                    <div class="stat-value accent">${todayAppointments?.length || 0}</div>
                </div>
                <div class="stat-card" onclick="doctorManager.loadView('patients')" style="cursor:pointer;">
                    <div class="stat-label">👥 Total Patients</div>
                    <div class="stat-value success">${patientCount || 0}</div>
                </div>
                <div class="stat-card" onclick="doctorManager.loadView('patients')" style="cursor:pointer;">
                    <div class="stat-label">💊 Prescriptions</div>
                    <div class="stat-value warning">${prescriptionCount || 0}</div>
                </div>
                <div class="stat-card" onclick="doctorManager.loadView('chat')" style="cursor:pointer;">
                    <div class="stat-label">💬 Unread Messages</div>
                    <div class="stat-value danger">${unreadCount || 0}</div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">📋 Today's Schedule</h5>
                            <span class="badge bg-primary">${todayAppointments?.length || 0} appointments</span>
                        </div>
                        <div class="card-body">
                            ${todayAppointments && todayAppointments.length > 0
                                ? todayAppointments.map(apt => this._renderAppointmentCard(apt)).join('')
                                : `<div class="text-center py-4">
                                    <div style="font-size:3rem;margin-bottom:12px;">🎉</div>
                                    <p class="text-muted">No appointments scheduled for today</p>
                                    <p class="text-muted small">Enjoy your free time or catch up on patient records.</p>
                                </div>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _renderAppointmentCard(apt) {
        const patientName = apt.patient?.full_name || 'Unknown Patient';
        const patientId = apt.patient_id;
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
                    ${apt.consultation_type === 'video' ? `
                        <button class="btn btn-sm btn-primary" onclick="doctorManager.joinVideoCall('${apt.id}', '${apt.jitsi_room_id}', '${patientName}')">
                            🎥 Start Call
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-success" onclick="alert('📍 Physical consultation at clinic.')">
                            📍 Location
                        </button>
                    `}
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
    // APPOINTMENTS CONTENT - REAL DATA
    // =============================================
    async loadAppointmentsContent(container) {
        const userId = authManager.getUserId();
        
        const { data: appointments } = await supabase
            .from('appointments')
            .select(`
                *,
                patient:profiles!appointments_patient_id_fkey (id, full_name, email, phone)
            `)
            .eq('doctor_id', userId)
            .order('scheduled_at', { ascending: false });

        const now = new Date();
        const upcoming = appointments?.filter(a => new Date(a.scheduled_at) > now && a.status === 'scheduled') || [];
        const today = appointments?.filter(a => {
            const date = new Date(a.scheduled_at);
            return date.toDateString() === now.toDateString() && a.status === 'scheduled';
        }) || [];
        const past = appointments?.filter(a => new Date(a.scheduled_at) < now && a.status !== 'scheduled') || [];

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>📅 My Appointments</h2>
                    <p class="text-muted">View and manage all your appointments</p>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card" onclick="doctorManager.loadView('appointments')" style="cursor:pointer;">
                    <div class="stat-label">📅 Today</div>
                    <div class="stat-value accent">${today.length}</div>
                </div>
                <div class="stat-card" onclick="doctorManager.loadView('appointments')" style="cursor:pointer;">
                    <div class="stat-label">📅 Upcoming</div>
                    <div class="stat-value success">${upcoming.length}</div>
                </div>
                <div class="stat-card" onclick="doctorManager.loadView('appointments')" style="cursor:pointer;">
                    <div class="stat-label">📋 Past</div>
                    <div class="stat-value">${past.length}</div>
                </div>
            </div>

            <div class="row mt-3">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">All Appointments</h5>
                            <span class="badge bg-primary">${appointments?.length || 0}</span>
                        </div>
                        <div class="card-body">
                            ${appointments && appointments.length > 0
                                ? `<div class="table-wrap">
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
                                            ${appointments.map(apt => `
                                                <tr>
                                                    <td><strong>${apt.patient?.full_name || 'Unknown'}</strong></td>
                                                    <td>
                                                        <span class="badge ${apt.consultation_type === 'video' ? 'bg-primary' : 'bg-warning'}">
                                                            ${apt.consultation_type === 'video' ? '🎥' : '🏥'} ${apt.consultation_type || 'video'}
                                                        </span>
                                                    </td>
                                                    <td><small>${new Date(apt.scheduled_at).toLocaleString()}</small></td>
                                                    <td>
                                                        <span class="badge ${apt.status === 'scheduled' ? 'bg-success' : apt.status === 'completed' ? 'bg-secondary' : 'bg-danger'}">
                                                            ${apt.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        ${apt.status === 'scheduled' ? `
                                                            ${apt.consultation_type === 'video' ? `
                                                                <button class="btn btn-sm btn-primary" onclick="doctorManager.joinVideoCall('${apt.id}', '${apt.jitsi_room_id}', '${apt.patient?.full_name || 'Patient'}')">🎥</button>
                                                            ` : `
                                                                <button class="btn btn-sm btn-success" onclick="alert('📍 Physical consultation at clinic.')">📍</button>
                                                            `}
                                                            <button class="btn btn-sm btn-success" onclick="doctorManager.showPrescriptionModal('${apt.patient_id}', '${apt.patient?.full_name || 'Patient'}')">💊</button>
                                                            <button class="btn btn-sm btn-info" onclick="doctorManager.loadView('chat')">💬</button>
                                                            <button class="btn btn-sm btn-secondary" onclick="doctorManager.viewPatientHistory('${apt.patient_id}', '${apt.patient?.full_name || 'Patient'}')">📄</button>
                                                        ` : apt.status === 'completed' ? `
                                                            <button class="btn btn-sm btn-success" onclick="doctorManager.showPrescriptionModal('${apt.patient_id}', '${apt.patient?.full_name || 'Patient'}')">💊</button>
                                                            <button class="btn btn-sm btn-info" onclick="doctorManager.loadView('chat')">💬</button>
                                                            <button class="btn btn-sm btn-secondary" onclick="doctorManager.viewPatientHistory('${apt.patient_id}', '${apt.patient?.full_name || 'Patient'}')">📄</button>
                                                        ` : '<span class="text-muted">-</span>'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>`
                                : `<div class="text-center py-4">
                                    <div style="font-size:3rem;margin-bottom:12px;">📭</div>
                                    <p class="text-muted">No appointments found</p>
                                    <p class="text-muted small">Patients will book appointments with you through the system.</p>
                                </div>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // =============================================
    // PATIENTS CONTENT - REAL DATA
    // =============================================
    async loadPatientsContent(container) {
        const userId = authManager.getUserId();
        
        const { data: patients } = await supabase
            .from('appointments')
            .select(`
                patient_id,
                patient:profiles!appointments_patient_id_fkey (id, full_name, email, phone, created_at)
            `)
            .eq('doctor_id', userId);

        const patientMap = new Map();
        if (patients) {
            patients.forEach(p => {
                if (p.patient && !patientMap.has(p.patient_id)) {
                    patientMap.set(p.patient_id, p.patient);
                }
            });
        }
        const uniquePatients = Array.from(patientMap.values());

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>👥 My Patients</h2>
                    <p class="text-muted">Manage your patients, write prescriptions, and view medical history</p>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card" onclick="doctorManager.loadView('patients')" style="cursor:pointer;">
                    <div class="stat-label">👥 Total Patients</div>
                    <div class="stat-value success">${uniquePatients.length}</div>
                </div>
                <div class="stat-card" onclick="doctorManager.loadView('patients')" style="cursor:pointer;">
                    <div class="stat-label">💊 Prescriptions</div>
                    <div class="stat-value warning">0</div>
                </div>
                <div class="stat-card" onclick="doctorManager.loadView('appointments')" style="cursor:pointer;">
                    <div class="stat-label">📅 Follow-ups</div>
                    <div class="stat-value accent">0</div>
                </div>
            </div>

            <div class="row mt-3">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Patient List</h5>
                            <span class="badge bg-primary">${uniquePatients.length} patients</span>
                        </div>
                        <div class="card-body">
                            ${uniquePatients && uniquePatients.length > 0
                                ? `<div class="table-wrap">
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
                                            ${uniquePatients.map(patient => `
                                                <tr>
                                                    <td><strong>${patient.full_name || 'Unknown'}</strong></td>
                                                    <td>${patient.email || 'N/A'}</td>
                                                    <td>${patient.phone || '-'}</td>
                                                    <td>
                                                        <div class="d-flex flex-wrap gap-1">
                                                            <button class="btn btn-sm btn-primary" onclick="doctorManager.viewPatientHistory('${patient.id}', '${patient.full_name || 'Patient'}')">
                                                                📄 History
                                                            </button>
                                                            <button class="btn btn-sm btn-success" onclick="doctorManager.showPrescriptionModal('${patient.id}', '${patient.full_name || 'Patient'}')">
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
                                </div>`
                                : `<div class="text-center py-4">
                                    <div style="font-size:3rem;margin-bottom:12px;">👥</div>
                                    <p class="text-muted">No patients found</p>
                                    <p class="text-muted small">Start by scheduling appointments with patients.</p>
                                </div>`
                            }
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
        const userId = authManager.getUserId();
        
        // Get recent conversations
        const { data: conversations } = await supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey (id, full_name, role),
                receiver:profiles!messages_receiver_id_fkey (id, full_name, role)
            `)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('sent_at', { ascending: false });

        // Get unique conversation partners
        const partnerMap = new Map();
        if (conversations) {
            conversations.forEach(msg => {
                const partner = msg.sender_id === userId ? msg.receiver : msg.sender;
                if (partner && !partnerMap.has(partner.id)) {
                    partnerMap.set(partner.id, {
                        ...partner,
                        lastMessage: msg.content,
                        lastMessageTime: msg.sent_at,
                        unreadCount: msg.receiver_id === userId && !msg.read_at ? 1 : 0
                    });
                }
            });
        }
        const chatPartners = Array.from(partnerMap.values());

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">💬 Messages</h5>
                        </div>
                        <div class="card-body">
                            ${chatPartners && chatPartners.length > 0
                                ? chatPartners.map(partner => `
                                    <div class="d-flex justify-content-between align-items-center p-2 border-bottom" style="cursor:pointer;" onclick="doctorManager.openChatWithUser('${partner.id}')">
                                        <div>
                                            <strong>${partner.full_name}</strong>
                                            <p class="mb-0 small text-muted">${partner.lastMessage?.substring(0, 50) || 'No messages'}</p>
                                        </div>
                                        <div>
                                            ${partner.unreadCount > 0 ? `<span class="badge bg-danger">${partner.unreadCount}</span>` : ''}
                                            <small class="text-muted">${partner.lastMessageTime ? new Date(partner.lastMessageTime).toLocaleDateString() : ''}</small>
                                        </div>
                                    </div>
                                `).join('')
                                : `<div class="text-center py-4">
                                    <div style="font-size:3rem;margin-bottom:12px;">💬</div>
                                    <p class="text-muted">No messages yet</p>
                                    <p class="text-muted small">Start a conversation with your patients.</p>
                                </div>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    openChatWithUser(userId) {
        if (window.chatManager) {
            window.chatManager.showChatInterface(null, userId);
        } else {
            alert('💬 Chat feature is being loaded. Please try again.');
        }
    }

    // =============================================
    // PROFILE CONTENT - REAL DATA
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
    // NOTIFICATIONS
    // =============================================
    async showNotifications() {
        const userId = authManager.getUserId();
        
        const { count: unreadMessages } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .is('read_at', null);

        const { count: todayAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('doctor_id', userId)
            .eq('status', 'scheduled')
            .gte('scheduled_at', new Date().toISOString());

        alert(`🔔 Notifications:\n\n• ${unreadMessages || 0} unread messages\n• ${todayAppointments || 0} appointments today`);
    }

    // =============================================
    // PRESCRIPTION MODAL
    // =============================================
    showPrescriptionModal(patientId, patientName) {
        if (!patientId || patientId === 'undefined' || patientId === 'null') {
            alert('❌ Error: Invalid patient ID. Please try again.');
            return;
        }

        const existingModal = document.getElementById('prescriptionModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHtml = `
            <div id="prescriptionModal" style="
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
            ">
                <div style="
                    background: #ffffff;
                    border-radius: 16px;
                    padding: 30px 32px;
                    max-width: 580px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    position: relative;
                    border: 1px solid #e2e8f0;
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        border-bottom: 2px solid #10B981;
                        padding-bottom: 14px;
                        margin-bottom: 18px;
                    ">
                        <div>
                            <h5 style="font-size: 1.25rem; font-weight: 700; margin: 0; color: #0F172A;">
                                💊 Write Prescription
                            </h5>
                            <small style="display: block; font-size: 0.85rem; color: #64748B; margin-top: 2px;">
                                For: <strong>${patientName || 'Patient'}</strong>
                            </small>
                        </div>
                        <button onclick="document.getElementById('prescriptionModal').remove()" style="
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

                    <form id="prescriptionForm">
                        <input type="hidden" id="prescriptionPatientId" value="${patientId}">
                        
                        <div style="margin-bottom: 14px;">
                            <label style="display:block;font-weight:600;margin-bottom:4px;font-size:0.85rem;color:#0F172A;">
                                💊 Medication Name *
                            </label>
                            <input type="text" id="medicationName" 
                                placeholder="e.g., Amoxicillin, Lisinopril, Metformin" 
                                style="width:100%;padding:10px 14px;border:2px solid #E2E8F0;border-radius:8px;font-size:0.95rem;background:#F8FAFC;font-family:Inter,sans-serif;"
                                onfocus="this.style.borderColor='#2563EB'"
                                onblur="this.style.borderColor='#E2E8F0'">
                        </div>

                        <div style="margin-bottom: 14px;">
                            <label style="display:block;font-weight:600;margin-bottom:4px;font-size:0.85rem;color:#0F172A;">
                                📏 Dosage & Strength *
                            </label>
                            <input type="text" id="dosage" 
                                placeholder="e.g., 500mg, 10mg, 25mg/5ml" 
                                style="width:100%;padding:10px 14px;border:2px solid #E2E8F0;border-radius:8px;font-size:0.95rem;background:#F8FAFC;font-family:Inter,sans-serif;"
                                onfocus="this.style.borderColor='#2563EB'"
                                onblur="this.style.borderColor='#E2E8F0'">
                        </div>

                        <div style="display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap;">
                            <div style="flex:1;min-width:140px;">
                                <label style="display:block;font-weight:600;margin-bottom:4px;font-size:0.85rem;color:#0F172A;">
                                    ⏰ Frequency *
                                </label>
                                <select id="frequency" style="width:100%;padding:10px 14px;border:2px solid #E2E8F0;border-radius:8px;font-size:0.95rem;background:#F8FAFC;font-family:Inter,sans-serif;">
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
                            <div style="flex:1;min-width:140px;">
                                <label style="display:block;font-weight:600;margin-bottom:4px;font-size:0.85rem;color:#0F172A;">
                                    📅 Duration *
                                </label>
                                <select id="duration" style="width:100%;padding:10px 14px;border:2px solid #E2E8F0;border-radius:8px;font-size:0.95rem;background:#F8FAFC;font-family:Inter,sans-serif;">
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

                        <div style="margin-bottom:14px;">
                            <label style="display:block;font-weight:600;margin-bottom:4px;font-size:0.85rem;color:#0F172A;">
                                🍽️ When to Take
                            </label>
                            <select id="whenToTake" style="width:100%;padding:10px 14px;border:2px solid #E2E8F0;border-radius:8px;font-size:0.95rem;background:#F8FAFC;font-family:Inter,sans-serif;">
                                <option value="After meals" selected>After meals</option>
                                <option value="Before meals">Before meals</option>
                                <option value="With food">With food</option>
                                <option value="On empty stomach">On empty stomach</option>
                                <option value="At bedtime">At bedtime</option>
                                <option value="In the morning">In the morning</option>
                                <option value="In the evening">In the evening</option>
                            </select>
                        </div>

                        <div style="margin-bottom:14px;">
                            <label style="display:block;font-weight:600;margin-bottom:4px;font-size:0.85rem;color:#0F172A;">
                                📝 Special Instructions
                            </label>
                            <textarea id="instructions" rows="2" 
                                placeholder="e.g., Take with plenty of water, Avoid alcohol, Complete full course..."
                                style="width:100%;padding:10px 14px;border:2px solid #E2E8F0;border-radius:8px;font-size:0.95rem;background:#F8FAFC;font-family:Inter,sans-serif;resize:vertical;"
                                onfocus="this.style.borderColor='#2563EB'"
                                onblur="this.style.borderColor='#E2E8F0'"></textarea>
                        </div>

                        <div style="display:flex;align-items:center;gap:10px;margin:12px 0;padding:12px;background:#F8FAFC;border-radius:8px;border:1px solid #E2E8F0;">
                            <input type="checkbox" id="sendReminders" checked style="width:18px;height:18px;cursor:pointer;">
                            <label for="sendReminders" style="font-weight:500;font-size:0.9rem;cursor:pointer;color:#0F172A;">
                                🔔 Send medication reminders to patient
                            </label>
                        </div>

                        <button type="submit" style="
                            width:100%;
                            padding:13px;
                            background:#10B981;
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
                            margin-top:4px;
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(16,185,129,0.35)'" 
                           onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
                            💾 Save Prescription & Schedule Reminders
                        </button>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('prescriptionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const patientId = document.getElementById('prescriptionPatientId').value;
            const medication = document.getElementById('medicationName').value.trim();
            const dosage = document.getElementById('dosage').value.trim();
            const frequency = document.getElementById('frequency').value;
            const duration = document.getElementById('duration').value;
            const whenToTake = document.getElementById('whenToTake').value;
            const instructions = document.getElementById('instructions').value.trim();
            const sendReminders = document.getElementById('sendReminders').checked;

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

            let durationDays = 7;
            const durationMatch = duration.match(/(\d+)/);
            if (durationMatch) {
                durationDays = parseInt(durationMatch[1]);
            } else if (duration === 'Ongoing') {
                durationDays = 30;
            }

            const prescriptionData = {
                patient_id: patientId,
                medication: medication,
                dosage: dosage,
                frequency: frequency,
                duration: duration,
                duration_days: durationDays,
                when_to_take: whenToTake,
                instructions: instructions || 'Take as directed',
                send_reminders: sendReminders,
                issued_at: new Date().toISOString()
            };

            try {
                const doctorId = authManager.getUserId();
                
                const { error } = await supabase
                    .from('prescriptions')
                    .insert([{
                        ...prescriptionData,
                        doctor_id: doctorId
                    }]);

                if (error) throw error;

                if (sendReminders && durationDays > 0) {
                    await this.createMedicationSchedule(patientId, prescriptionData);
                    await this.sendMedicationReminders(patientId, prescriptionData);
                }

                alert('✅ Prescription saved successfully! Medication schedule created.');
                document.getElementById('prescriptionModal').remove();
                this.loadView('patients');

            } catch (error) {
                console.error('Prescription error:', error);
                alert('❌ Error saving prescription: ' + error.message);
            }
        });

        document.getElementById('prescriptionModal').addEventListener('click', function(e) {
            if (e.target === this) {
                this.remove();
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
            }

        } catch (error) {
            console.error('Error sending medication reminders:', error);
        }
    }

    // =============================================
    // VIEW PATIENT HISTORY - REAL DATA
    // =============================================
    async viewPatientHistory(patientId, patientName) {
        if (!patientId || patientId === 'undefined' || patientId === 'null') {
            alert('❌ Error: Invalid patient ID.');
            return;
        }

        const modalHtml = `
            <div id="historyModal" style="
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
            ">
                <div style="
                    background: white;
                    border-radius: 16px;
                    padding: 30px 32px;
                    max-width: 750px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    position: relative;
                    border: 1px solid #e2e8f0;
                ">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #2563EB;padding-bottom:14px;margin-bottom:18px;">
                        <div>
                            <h5 style="font-size:1.25rem;font-weight:700;margin:0;color:#0F172A;">
                                📄 Medical History
                            </h5>
                            <small style="display:block;font-size:0.85rem;color:#64748B;margin-top:2px;">
                                ${patientName || 'Patient'}
                            </small>
                        </div>
                        <button onclick="document.getElementById('historyModal').remove()" style="
                            background:none;border:none;font-size:1.8rem;cursor:pointer;
                            color:#94A3B8;padding:0 6px;transition:0.2s;line-height:1;
                        " onmouseover="this.style.color='#0F172A'" onmouseout="this.style.color='#94A3B8'">
                            ×
                        </button>
                    </div>
                    <div id="historyContent" style="text-align:center;padding:30px;">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="text-muted mt-2">Loading medical records...</p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        try {
            const { data: records, error } = await supabase
                .from('medical_records')
                .select(`
                    *,
                    doctor:profiles!medical_records_doctor_id_fkey (full_name),
                    prescriptions:prescriptions (*)
                `)
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });

            const historyContent = document.getElementById('historyContent');
            
            if (error) throw error;

            if (records && records.length > 0) {
                historyContent.innerHTML = records.map((record, index) => `
                    <div style="border:1px solid #E2E8F0;border-radius:12px;margin-bottom:16px;overflow:hidden;border-left:4px solid #2563EB;">
                        <div style="background:#F8FAFC;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;">
                            <div>
                                <strong>👨‍⚕️ ${record.doctor?.full_name || 'Unknown Doctor'}</strong>
                                <span style="background:#E2E8F0;padding:2px 10px;border-radius:20px;font-size:0.7rem;margin-left:8px;">#${index + 1}</span>
                            </div>
                            <small style="color:#64748B;">📅 ${new Date(record.created_at).toLocaleString()}</small>
                        </div>
                        <div style="padding:16px;">
                            <div style="margin-bottom:12px;">
                                <strong>📝 SOAP Notes:</strong>
                                <p style="background:#F8FAFC;padding:12px;border-radius:8px;margin-top:4px;">
                                    ${record.soap_notes || 'No notes available'}
                                </p>
                            </div>
                            ${record.prescriptions && record.prescriptions.length > 0 ? `
                                <div>
                                    <strong>💊 Prescriptions:</strong>
                                    <ul style="list-style:none;padding:0;margin:4px 0 0 0;">
                                        ${record.prescriptions.map(rx => `
                                            <li style="background:#D1FAE5;padding:8px 12px;border-radius:8px;margin-bottom:4px;">
                                                <strong>${rx.medication}</strong> - ${rx.dosage}
                                                ${rx.instructions ? `<br><small>📝 ${rx.instructions}</small>` : ''}
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : `
                                <div style="color:#64748B;font-size:0.85rem;">
                                    ℹ️ No prescriptions in this record
                                </div>
                            `}
                        </div>
                    </div>
                `).join('');
                historyContent.style.textAlign = 'left';
                historyContent.style.padding = '0';
            } else {
                historyContent.innerHTML = `
                    <div style="text-align:center;padding:40px;">
                        <div style="font-size:4rem;margin-bottom:16px;">📭</div>
                        <h5>No Medical Records Found</h5>
                        <p style="color:#64748B;">This patient has no medical records yet.</p>
                        <button onclick="document.getElementById('historyModal').remove(); doctorManager.showPrescriptionModal('${patientId}', '${patientName}')" 
                            style="margin-top:12px;padding:10px 20px;background:#2563EB;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">
                            💊 Write First Prescription
                        </button>
                    </div>
                `;
            }

        } catch (error) {
            console.error('Error fetching medical records:', error);
            document.getElementById('historyContent').innerHTML = `
                <div class="alert alert-danger">
                    ❌ Error loading medical records: ${error.message}
                </div>
            `;
        }

        document.getElementById('historyModal').addEventListener('click', function(e) {
            if (e.target === this) {
                this.remove();
            }
        });
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