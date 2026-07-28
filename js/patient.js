/*
 * File: patient.js - Complete Patient Manager with Fixed Chat Navigation
 */

class PatientManager {
    constructor() {
        this.currentView = 'dashboard';
        this.isSidebarOpen = true;
        this.availableDoctors = [];
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
    // CHAT CONTENT - FIXED (no routeBasedOnRole)
    // =============================================
    async loadChatContent(container) {
        console.log('💬 Loading chat content...');
        
        const userId = authManager.getUserId();
        
        // Get conversations
        const { data: conversations } = await supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey (id, full_name, role),
                receiver:profiles!messages_receiver_id_fkey (id, full_name, role)
            `)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('sent_at', { ascending: false });

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
                            <button class="btn btn-sm btn-primary" onclick="alert('📱 New message composer opened')">✏️ New</button>
                        </div>
                        <div class="card-body">
                            ${chatPartners && chatPartners.length > 0
                                ? chatPartners.map(partner => `
                                    <div class="d-flex justify-content-between align-items-center p-2 border-bottom clickable" onclick="patientManager.openChatWithUser('${partner.id}')" style="cursor:pointer;">
                                        <div>
                                            <strong>${partner.role === 'doctor' ? '👨‍⚕️' : '👤'} ${partner.full_name}</strong>
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
                                    <p class="text-muted small">Start a conversation with your doctors.</p>
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
            // Pass the partner ID to chat manager
            window.chatManager.showChatInterface(null, userId);
        } else {
            alert('💬 Chat feature is being loaded. Please try again.');
        }
    }

    // =============================================
    // DASHBOARD CONTENT
    // =============================================
    async loadDashboardContent(container) {
        const userId = authManager.getUserId();
        
        const { data: upcomingAppointments } = await supabase
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

        const today = new Date().toISOString().split('T')[0];
        const { data: todaysMeds } = await supabase
            .from('medication_schedule')
            .select('*')
            .eq('patient_id', userId)
            .eq('taken', false)
            .gte('scheduled_time', new Date().toISOString())
            .order('scheduled_time', { ascending: true })
            .limit(10);

        await this.refreshDoctors();

        const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .is('read_at', null);

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>🏥 Patient Dashboard</h2>
                    <p class="text-muted">Welcome to your telehealth portal</p>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card" onclick="patientManager.loadView('appointments')" style="cursor:pointer;">
                    <div class="stat-label">📅 Upcoming</div>
                    <div class="stat-value accent">${upcomingAppointments?.length || 0}</div>
                </div>
                <div class="stat-card" onclick="patientManager.loadView('medications')" style="cursor:pointer;">
                    <div class="stat-label">💊 Today's Meds</div>
                    <div class="stat-value warning">${todaysMeds?.length || 0}</div>
                </div>
                <div class="stat-card" onclick="patientManager.loadView('doctors')" style="cursor:pointer;">
                    <div class="stat-label">👨‍⚕️ Doctors</div>
                    <div class="stat-value success">${this.availableDoctors.length}</div>
                </div>
                <div class="stat-card" onclick="patientManager.loadView('chat')" style="cursor:pointer;">
                    <div class="stat-label">💬 Messages</div>
                    <div class="stat-value danger">${unreadCount || 0}</div>
                </div>
            </div>

            ${todaysMeds && todaysMeds.length > 0 ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="card border-success clickable" onclick="patientManager.loadView('medications')" style="cursor:pointer;">
                            <div class="card-header bg-success text-white">
                                <h5 class="mb-0">⏰ Today's Medication Schedule</h5>
                                <span class="badge bg-light text-dark">${todaysMeds.length} pending</span>
                            </div>
                            <div class="card-body">
                                ${todaysMeds.map(med => `
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
                    <div class="card clickable" onclick="patientManager.loadView('appointments')" style="cursor:pointer;">
                        <div class="card-header">
                            <h5 class="card-title">📅 Upcoming Appointments</h5>
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
                                        <div>
                                            ${apt.consultation_type === 'video' ? `
                                                <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); patientManager.joinVideoCall('${apt.id}', '${apt.jitsi_room_id}', '${apt.doctor?.full_name || 'Doctor'}')">
                                                    🎥 Join
                                                </button>
                                            ` : `
                                                <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); alert('📍 Physical consultation at clinic.')">
                                                    📍 Location
                                                </button>
                                            `}
                                            <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); patientManager.loadView('appointments')">📅 View</button>
                                        </div>
                                    </div>
                                `).join('')
                                : '<p class="text-muted text-center py-3">No upcoming appointments</p>'
                            }
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
        const userId = authManager.getUserId();
        
        const { data: appointments } = await supabase
            .from('appointments')
            .select(`
                *,
                doctor:profiles!appointments_doctor_id_fkey (id, full_name, specialty)
            `)
            .eq('patient_id', userId)
            .order('scheduled_at', { ascending: false });

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
                    <button class="btn btn-primary mb-3" onclick="patientManager.showBookingModal()">➕ Book New</button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card" onclick="patientManager.loadView('appointments')" style="cursor:pointer;">
                    <div class="stat-label">📅 Today</div>
                    <div class="stat-value accent">${today.length}</div>
                </div>
                <div class="stat-card" onclick="patientManager.loadView('appointments')" style="cursor:pointer;">
                    <div class="stat-label">📅 Upcoming</div>
                    <div class="stat-value success">${upcoming.length}</div>
                </div>
                <div class="stat-card" onclick="patientManager.loadView('appointments')" style="cursor:pointer;">
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
                                                    <td><strong>Dr. ${apt.doctor?.full_name || 'Unknown'}</strong><br><small>${apt.doctor?.specialty || ''}</small></td>
                                                    <td>
                                                        <span class="badge ${apt.consultation_type === 'video' ? 'bg-primary' : 'bg-warning'}">
                                                            ${apt.consultation_type === 'video' ? '🎥' : '🏥'} ${apt.consultation_type || 'video'}
                                                        </span>
                                                        ${apt.is_follow_up ? '<span class="badge bg-info">🔄 Follow-up</span>' : ''}
                                                    </td>
                                                    <td><small>⏰ ${new Date(apt.scheduled_at).toLocaleString()}</small></td>
                                                    <td>
                                                        <span class="badge ${apt.status === 'scheduled' ? 'bg-success' : apt.status === 'completed' ? 'bg-secondary' : 'bg-danger'}">
                                                            ${apt.status}
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
                                                            ${apt.consultation_type === 'video' ? `
                                                                <button class="btn btn-sm btn-primary mb-1 w-100" onclick="patientManager.joinVideoCall('${apt.id}', '${apt.jitsi_room_id}', '${apt.doctor?.full_name || 'Doctor'}')">🎥 Join</button>
                                                            ` : `
                                                                <button class="btn btn-sm btn-success mb-1 w-100" onclick="alert('📍 Physical consultation at clinic.')">📍 Location</button>
                                                            `}
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
                                </div>`
                            }
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
        await this.refreshDoctors();

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>👨‍⚕️ Find Doctors</h2>
                    <p class="text-muted">Browse available doctors and book appointments</p>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card" onclick="patientManager.loadView('doctors')" style="cursor:pointer;">
                    <div class="stat-label">👨‍⚕️ Available</div>
                    <div class="stat-value success">${this.availableDoctors.length}</div>
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
        const userId = authManager.getUserId();
        
        const { data: prescriptions } = await supabase
            .from('prescriptions')
            .select(`
                *,
                doctor:profiles!prescriptions_doctor_id_fkey (full_name, specialty)
            `)
            .eq('patient_id', userId)
            .order('issued_at', { ascending: false });

        const { data: medicationSchedule } = await supabase
            .from('medication_schedule')
            .select('*')
            .eq('patient_id', userId)
            .order('scheduled_time', { ascending: true });

        const today = new Date().toISOString().split('T')[0];
        const upcomingMeds = medicationSchedule?.filter(m => 
            !m.taken && new Date(m.scheduled_time).toISOString().split('T')[0] === today
        ) || [];
        
        const allUpcomingMeds = medicationSchedule?.filter(m => !m.taken) || [];

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>💊 Prescriptions & Medications</h2>
                    <p class="text-muted">View all your prescriptions and medication schedule</p>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card" onclick="patientManager.loadView('medications')" style="cursor:pointer;">
                    <div class="stat-label">💊 Prescriptions</div>
                    <div class="stat-value success">${prescriptions?.length || 0}</div>
                </div>
                <div class="stat-card" onclick="patientManager.loadView('medications')" style="cursor:pointer;">
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
                                            ${med.is_refill_reminder ? '<br><span class="badge bg-warning">🔄 Refill Reminder</span>' : ''}
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
            ` : `
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="card border-info">
                            <div class="card-header bg-info text-white">
                                <h5 class="mb-0">✅ Today's Medications</h5>
                            </div>
                            <div class="card-body text-center py-3">
                                <p class="mb-0">🎉 No pending medications for today</p>
                            </div>
                        </div>
                    </div>
                </div>
            `}

            <div class="row mt-3">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">📋 All Prescriptions (${prescriptions?.length || 0})</h5>
                        </div>
                        <div class="card-body">
                            ${prescriptions && prescriptions.length > 0
                                ? prescriptions.map(rx => `
                                    <div class="border-bottom pb-3 mb-3">
                                        <div class="d-flex justify-content-between">
                                            <div>
                                                <h6 class="mb-0">💊 ${rx.medication} - ${rx.dosage}</h6>
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

            ${allUpcomingMeds.length > 0 ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">📅 Upcoming Medication Schedule (${allUpcomingMeds.length})</h5>
                            </div>
                            <div class="card-body">
                                ${allUpcomingMeds.slice(0, 20).map(med => `
                                    <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                                        <div>
                                            <strong>💊 ${med.medication}</strong>
                                            <br><small>${med.dosage} - 📅 ${new Date(med.scheduled_time).toLocaleDateString()} ⏰ ${new Date(med.scheduled_time).toLocaleTimeString()}</small>
                                        </div>
                                        <div>
                                            <span class="badge ${med.taken ? 'bg-success' : 'bg-warning'}">
                                                ${med.taken ? '✅ Taken' : '⏳ Pending'}
                                            </span>
                                        </div>
                                    </div>
                                `).join('')}
                                ${allUpcomingMeds.length > 20 ? `<p class="text-muted mt-2">... and ${allUpcomingMeds.length - 20} more</p>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}
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
    // NOTIFICATIONS
    // =============================================
    async showNotifications() {
        const userId = authManager.getUserId();
        
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
    // SHOW BOOKING MODAL
    // =============================================
    showBookingModal(preSelectedDoctorId = null, preSelectedDoctorName = null) {
        this.refreshDoctors();
        
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
                                    ${doctorsHtml || '<option value="">No doctors available</option>'}
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
                            <button type="submit" class="btn btn-primary btn-block" id="bookBtn">📅 Book Now</button>
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
            const btn = document.getElementById('bookBtn');
            
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

        document.getElementById('bookingForm').addEventListener('submit', async (e) => {
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

            const result = await this.bookAppointment(doctorId, consultationType, scheduledAt, notes, fee);
            alert(result.message);
            
            if (result.success) {
                document.getElementById('bookingModal').remove();
                this.loadView('appointments');
            }
        });
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
        try {
            const { error } = await supabase
                .from('medication_schedule')
                .update({ 
                    taken: true,
                    taken_at: new Date().toISOString()
                })
                .eq('id', scheduleId);

            if (error) throw error;

            alert('✅ Medication marked as taken!');
            this.loadView('medications');
        } catch (error) {
            console.error('Error marking medication:', error);
            alert('❌ Failed to mark medication as taken.');
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
        
        if (window.videoManager) {
            window.videoManager.joinRoom(roomId, displayName);
        } else {
            alert(`🎥 Video call started\nRoom: ${roomId}\nName: ${displayName}`);
        }
    }
}

// Initialize patient manager
const patientManager = new PatientManager();
window.patientManager = patientManager;
console.log('PatientManager initialized');