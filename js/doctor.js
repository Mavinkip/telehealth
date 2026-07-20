/*
 * File: doctor.js
 * Purpose: Doctor dashboard with premium UI, appointments, patients, prescriptions
 * Features: Modern appointment cards, timeline view, glassmorphism elements
 */

class DoctorManager {
    constructor() {
        this.currentView = 'dashboard';
    }

    showDashboard() {
        const app = document.getElementById('app');
        const profile = authManager.getUserProfile();
        
        if (!profile) {
            authManager.showLoginPage();
            return;
        }

        app.innerHTML = `
            <nav class="navbar">
                <div class="container">
                    <a class="navbar-brand" href="#">
                        <i class="fas fa-heartbeat"></i>
                        <span>Telehealth System</span>
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav">
                            <li class="nav-item">
                                <a class="nav-link active" href="#" data-view="dashboard">
                                    <i class="fas fa-chart-pie"></i> Dashboard
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="appointments">
                                    <i class="fas fa-calendar-check"></i> Appointments
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="patients">
                                    <i class="fas fa-users"></i> Patients
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="chat">
                                    <i class="fas fa-comments"></i> Messages
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="profile">
                                    <i class="fas fa-user-cog"></i> Profile
                                </a>
                            </li>
                        </ul>
                        <div class="nav-user">
                            <div class="avatar">${profile.full_name?.charAt(0) || 'D'}</div>
                            <span class="user-name">Dr. ${profile.full_name}</span>
                            <button class="btn btn-sm btn-outline-danger" id="logoutBtn">
                                <i class="fas fa-sign-out-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <div class="container mt-4" id="doctorContent"></div>
        `;

        document.querySelectorAll('[data-view]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('[data-view]').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                this.currentView = link.dataset.view;
                this.loadView(this.currentView);
            });
        });

        document.getElementById('logoutBtn').addEventListener('click', async () => {
            const result = await authManager.logout();
            if (result.success) {
                window.location.reload();
            }
        });

        this.loadView('dashboard');
    }

    async loadView(view) {
        const content = document.getElementById('doctorContent');
        if (!content) return;
        
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
                this.openChat();
                break;
            case 'profile':
                await this.loadProfileContent(content);
                break;
            default:
                await this.loadDashboardContent(content);
        }
    }

    // =============================================
    // DASHBOARD
    // =============================================
    async loadDashboardContent(container) {
        const userId = authManager.getUserId();
        
        // Today's appointments
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

        // Total patients (distinct)
        const { data: patientData } = await supabase
            .from('appointments')
            .select('patient_id')
            .eq('doctor_id', userId);
        
        const uniquePatients = patientData ? [...new Set(patientData.map(p => p.patient_id))] : [];
        const patientCount = uniquePatients.length;

        // Completed this month
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const { count: completedCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('doctor_id', userId)
            .eq('status', 'completed')
            .gte('scheduled_at', thisMonth.toISOString());

        // Unread messages
        const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .is('read_at', null);

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>🏥 Doctor Dashboard</h2>
                    <p class="text-muted">Welcome back, Dr. ${authManager.getUserProfile().full_name}</p>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="dashboard-card" onclick="doctorManager.loadView('appointments')">
                        <div class="icon">📅</div>
                        <h4>${todayAppointments?.length || 0}</h4>
                        <p>Today's Appointments</p>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="dashboard-card" onclick="doctorManager.loadView('patients')">
                        <div class="icon">👥</div>
                        <h4>${patientCount || 0}</h4>
                        <p>Total Patients</p>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="dashboard-card">
                        <div class="icon">✅</div>
                        <h4>${completedCount || 0}</h4>
                        <p>Completed This Month</p>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="dashboard-card" onclick="doctorManager.openChat()">
                        <div class="icon">💬</div>
                        <h4>${unreadCount || 0}</h4>
                        <p>Unread Messages ${unreadCount > 0 ? '🔴' : ''}</p>
                    </div>
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
                                ? todayAppointments.map(apt => this._renderAppointmentCard(apt, 'doctor')).join('')
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

    // =============================================
    // RENDER PREMIUM APPOINTMENT CARD
    // =============================================
    _renderAppointmentCard(apt, role = 'doctor') {
        const statusMap = {
            'scheduled': 'confirmed',
            'pending': 'pending',
            'in-progress': 'in-progress',
            'completed': 'completed',
            'cancelled': 'cancelled'
        };
        const statusClass = statusMap[apt.status] || 'pending';
        const statusLabel = apt.status === 'scheduled' ? 'Confirmed' :
                           apt.status === 'in-progress' ? 'In Progress' :
                           apt.status.charAt(0).toUpperCase() + apt.status.slice(1);

        const patientName = apt.patient?.full_name || 'Unknown Patient';
        const patientInitial = patientName.charAt(0) || 'P';
        const appointmentTime = new Date(apt.scheduled_at);
        const timeStr = appointmentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = appointmentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

        // Doctor view actions
        const actions = role === 'doctor' ? `
            <div class="appointment-actions">
                <button class="btn btn-sm btn-primary" onclick="doctorManager.joinVideoCall('${apt.id}', '${apt.jitsi_room_id}', '${patientName}')">
                    <i class="fas fa-video"></i> Start Call
                </button>
                <button class="btn btn-sm btn-outline-primary" onclick="doctorManager.openConsultationModal('${apt.id}', '${apt.patient_id}', '${patientName}')">
                    <i class="fas fa-notes-medical"></i> Consult
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="doctorManager.openChatWithPatient('${apt.patient_id}')">
                    <i class="fas fa-comment"></i> Message
                </button>
            </div>
        ` : `
            <div class="appointment-actions">
                <button class="btn btn-sm btn-primary" onclick="patientManager.joinVideoCall('${apt.jitsi_room_id}', 'Dr. ${apt.doctor?.full_name || 'Doctor'}')">
                    <i class="fas fa-video"></i> Join Call
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="patientManager.openChatWithDoctor('${apt.doctor_id}')">
                    <i class="fas fa-comment"></i> Message
                </button>
            </div>
        `;

        return `
            <div class="appointment-card status-${statusClass}">
                <div class="appointment-top">
                    <div class="appointment-doctor">
                        <div class="doctor-avatar" style="background: ${this._getColor(patientName)}; color: white;">
                            ${patientInitial}
                        </div>
                        <div>
                            <div class="doctor-name">${patientName}</div>
                            <div class="doctor-specialty">${apt.patient?.email || 'No email'} • ${apt.patient?.phone || 'No phone'}</div>
                        </div>
                    </div>
                    <div class="appointment-time-large">
                        <span class="time">${timeStr}</span>
                        <span class="date">${dateStr}</span>
                    </div>
                </div>
                <div class="appointment-details">
                    <span class="detail-item">
                        <i class="fas fa-stethoscope"></i>
                        ${apt.consultation_type === 'video' ? 'Video Consultation' : 'Physical Consultation'}
                    </span>
                    <span class="detail-item">
                        <i class="fas fa-clock"></i>
                        30 minutes
                    </span>
                    <span class="detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        ${apt.consultation_type === 'video' ? 'Online' : 'Clinic'}
                    </span>
                    <span style="margin-left:auto;">
                        <span class="status-badge ${statusClass}">
                            <span class="status-dot"></span>
                            ${statusLabel}
                        </span>
                    </span>
                </div>
                ${actions}
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
    // APPOINTMENTS
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

        // Split into upcoming and past
        const now = new Date();
        const upcoming = appointments?.filter(a => new Date(a.scheduled_at) > now && a.status === 'scheduled') || [];
        const today = appointments?.filter(a => {
            const date = new Date(a.scheduled_at);
            return date.toDateString() === now.toDateString() && a.status === 'scheduled';
        }) || [];
        const past = appointments?.filter(a => new Date(a.scheduled_at) < now && a.status !== 'scheduled') || [];
        const pending = appointments?.filter(a => a.status === 'pending') || [];

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>📅 My Appointments</h2>
                    <p class="text-muted">View and manage all your appointments</p>
                </div>
            </div>

            <!-- Stats -->
            <div class="row mt-3">
                <div class="col-md-3 col-6 mb-2">
                    <div class="card text-center" style="padding:12px;">
                        <h4 style="color:var(--primary);">${today.length}</h4>
                        <p class="text-muted small">Today</p>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-2">
                    <div class="card text-center" style="padding:12px;">
                        <h4 style="color:var(--success);">${upcoming.length}</h4>
                        <p class="text-muted small">Upcoming</p>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-2">
                    <div class="card text-center" style="padding:12px;">
                        <h4 style="color:var(--warning);">${pending.length}</h4>
                        <p class="text-muted small">Pending</p>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-2">
                    <div class="card text-center" style="padding:12px;">
                        <h4 style="color:var(--text-light);">${past.length}</h4>
                        <p class="text-muted small">Past</p>
                    </div>
                </div>
            </div>

            <!-- Today's Appointments -->
            ${today.length > 0 ? `
            <div class="mt-4">
                <h5>🟢 Today's Appointments</h5>
                ${today.map(apt => this._renderAppointmentCard(apt, 'doctor')).join('')}
            </div>` : ''}

            <!-- Upcoming Appointments -->
            ${upcoming.length > 0 ? `
            <div class="mt-4">
                <h5>📅 Upcoming Appointments</h5>
                ${upcoming.map(apt => this._renderAppointmentCard(apt, 'doctor')).join('')}
            </div>` : ''}

            <!-- Past Appointments -->
            ${past.length > 0 ? `
            <div class="mt-4">
                <h5>📋 Past Appointments</h5>
                ${past.map(apt => this._renderAppointmentCard(apt, 'doctor')).join('')}
            </div>` : ''}

            ${!today.length && !upcoming.length && !past.length ? `
                <div class="card mt-4">
                    <div class="card-body text-center py-5">
                        <div style="font-size:4rem;margin-bottom:16px;">📭</div>
                        <p class="text-muted">No appointments found</p>
                        <p class="text-muted small">Patients will book appointments with you through the system.</p>
                    </div>
                </div>
            ` : ''}
        `;
    }

    // =============================================
    // PATIENTS
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

        // Get unique patients
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
                    <p class="text-muted">Manage your patients, write prescriptions, and schedule follow-ups</p>
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
                                ? `<div class="table-responsive">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th>Patient</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Member Since</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${uniquePatients.map(patient => `
                                                <tr>
                                                    <td>
                                                        <div class="d-flex align-items-center gap-2">
                                                            <div class="doctor-avatar" style="width:36px;height:36px;font-size:14px;background:${this._getColor(patient.full_name)};color:white;">
                                                                ${patient.full_name?.charAt(0) || 'P'}
                                                            </div>
                                                            <strong>${patient.full_name || 'Unknown'}</strong>
                                                        </div>
                                                    </td>
                                                    <td>${patient.email || 'N/A'}</td>
                                                    <td>${patient.phone || '-'}</td>
                                                    <td>${patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}</td>
                                                    <td>
                                                        <div class="d-flex flex-wrap gap-1">
                                                            <button class="btn btn-sm btn-primary" onclick="doctorManager.viewPatientHistory('${patient.id}', '${patient.full_name || 'Patient'}')">
                                                                <i class="fas fa-history"></i>
                                                            </button>
                                                            <button class="btn btn-sm btn-success" onclick="doctorManager.writePrescription('${patient.id}', '${patient.full_name || 'Patient'}')">
                                                                <i class="fas fa-prescription"></i>
                                                            </button>
                                                            <button class="btn btn-sm btn-warning" onclick="doctorManager.scheduleFollowUp('${patient.id}', '${patient.full_name || 'Patient'}')">
                                                                <i class="fas fa-calendar-plus"></i>
                                                            </button>
                                                            <button class="btn btn-sm btn-info" onclick="doctorManager.openChatWithPatient('${patient.id}')">
                                                                <i class="fas fa-comment"></i>
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
    // WRITE PRESCRIPTION
    // =============================================
    writePrescription(patientId, patientName) {
        if (!patientId || patientId === 'undefined' || patientId === 'null') {
            alert('Error: Invalid patient ID. Please try again.');
            return;
        }

        const modalHtml = `
            <div class="modal-overlay" id="prescriptionModal">
                <div class="modal">
                    <div class="modal-header" style="background:var(--success);border-radius:var(--radius-lg) var(--radius-lg) 0 0;margin:-32px -32px 0 -32px;padding:20px 32px;">
                        <h5 class="modal-title" style="color:white;">💊 Write Prescription - ${patientName || 'Patient'}</h5>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="color:white;">×</button>
                    </div>
                    <div class="modal-body" style="margin-top:20px;">
                        <form id="prescriptionForm">
                            <div class="form-group">
                                <label class="form-label">Patient</label>
                                <input type="text" class="form-control" value="${patientName || 'Patient'}" disabled>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Medication Name *</label>
                                <input type="text" class="form-control" id="medicationName" placeholder="e.g., Amoxicillin" required>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="form-label">Dosage *</label>
                                        <input type="text" class="form-control" id="dosage" placeholder="e.g., 500mg" required>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="form-label">Times Per Day</label>
                                        <select class="form-control" id="timesPerDay">
                                            <option value="1 time per day">1 time per day</option>
                                            <option value="2 times per day" selected>2 times per day</option>
                                            <option value="3 times per day">3 times per day</option>
                                            <option value="4 times per day">4 times per day</option>
                                            <option value="As needed">As needed</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="form-label">Duration (Days) *</label>
                                        <input type="number" class="form-control" id="durationDays" placeholder="e.g., 7" min="1" max="90" required>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">When to Take</label>
                                <select class="form-control" id="whenToTake">
                                    <option value="After meals">After meals</option>
                                    <option value="Before meals">Before meals</option>
                                    <option value="With food">With food</option>
                                    <option value="On empty stomach">On empty stomach</option>
                                    <option value="At bedtime">At bedtime</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Special Instructions</label>
                                <textarea class="form-control" id="instructions" rows="2" placeholder="Any special instructions..."></textarea>
                            </div>
                            <div class="form-group">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="sendReminders" checked>
                                    <label class="form-check-label" for="sendReminders">🔔 Send medication reminders</label>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-success btn-block">
                                <i class="fas fa-save"></i> Save Prescription
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('prescriptionModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('prescriptionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const medication = document.getElementById('medicationName').value.trim();
            const dosage = document.getElementById('dosage').value.trim();
            const timesPerDay = document.getElementById('timesPerDay').value;
            const durationDays = parseInt(document.getElementById('durationDays').value) || 7;
            const whenToTake = document.getElementById('whenToTake').value;
            const instructions = document.getElementById('instructions').value.trim();
            const sendReminders = document.getElementById('sendReminders').checked;

            if (!medication || !dosage || !durationDays) {
                alert('Please fill in all required fields.');
                return;
            }

            const result = await this.savePrescription(patientId, {
                medication,
                dosage,
                frequency: timesPerDay,
                duration: `${durationDays} days`,
                duration_days: durationDays,
                when_to_take: whenToTake,
                times_per_day: timesPerDay,
                instructions: instructions || whenToTake,
                send_reminders: sendReminders,
                notes: ''
            });
            
            alert(result.message);
            if (result.success) {
                document.getElementById('prescriptionModal').remove();
                this.loadView('patients');
            }
        });
    }

    async savePrescription(patientId, prescriptionData) {
        try {
            const doctorId = authManager.getUserId();
            
            if (!patientId || patientId === 'undefined' || patientId === 'null') {
                throw new Error('Invalid patient ID');
            }
            
            const prescription = {
                patient_id: patientId,
                doctor_id: doctorId,
                medication: prescriptionData.medication,
                dosage: prescriptionData.dosage,
                frequency: prescriptionData.frequency || '',
                duration: prescriptionData.duration || '',
                duration_days: prescriptionData.duration_days || null,
                when_to_take: prescriptionData.when_to_take || '',
                times_per_day: prescriptionData.times_per_day || '',
                instructions: prescriptionData.instructions || '',
                send_reminders: prescriptionData.send_reminders || false,
                notes: prescriptionData.notes || '',
                issued_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('prescriptions')
                .insert([prescription]);

            if (error) throw error;

            // Send notification to patient
            if (prescriptionData.send_reminders) {
                await this.sendPrescriptionNotification(patientId, prescriptionData);
            }

            return { success: true, message: '✅ Prescription saved successfully!' };
        } catch (error) {
            console.error('Prescription error:', error);
            return { success: false, message: error.message || 'Failed to save prescription.' };
        }
    }

    async sendPrescriptionNotification(patientId, prescriptionData) {
        try {
            const doctorId = authManager.getUserId();
            const { data: doctorData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', doctorId)
                .single();

            const doctorName = doctorData?.full_name || 'Doctor';

            const messageContent = `💊 **New Prescription**\n\nDr. ${doctorName} has prescribed:\n📋 ${prescriptionData.medication} - ${prescriptionData.dosage}\n⏰ Take ${prescriptionData.frequency}\n📅 Duration: ${prescriptionData.duration}\n📝 ${prescriptionData.instructions}`;

            await supabase
                .from('messages')
                .insert([{
                    sender_id: doctorId,
                    receiver_id: patientId,
                    appointment_id: null,
                    content: messageContent,
                    sent_at: new Date().toISOString()
                }]);

        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    // =============================================
    // SCHEDULE FOLLOW-UP
    // =============================================
    scheduleFollowUp(patientId, patientName) {
        if (!patientId || patientId === 'undefined' || patientId === 'null') {
            alert('Error: Invalid patient ID.');
            return;
        }

        const modalHtml = `
            <div class="modal-overlay" id="followUpModal">
                <div class="modal">
                    <div class="modal-header" style="background:var(--warning);border-radius:var(--radius-lg) var(--radius-lg) 0 0;margin:-32px -32px 0 -32px;padding:20px 32px;">
                        <h5 class="modal-title" style="color:white;">📅 Schedule Follow-up - ${patientName || 'Patient'}</h5>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="color:white;">×</button>
                    </div>
                    <div class="modal-body" style="margin-top:20px;">
                        <form id="followUpForm">
                            <div class="form-group">
                                <label class="form-label">Patient</label>
                                <input type="text" class="form-control" value="${patientName || 'Patient'}" disabled>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Follow-up Date & Time *</label>
                                <input type="datetime-local" class="form-control" id="followUpDate" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Reason for Follow-up</label>
                                <select class="form-control" id="followUpReason">
                                    <option value="Review medication">Review medication</option>
                                    <option value="Check progress">Check progress</option>
                                    <option value="Test results">Test results</option>
                                    <option value="Symptom check">Symptom check</option>
                                    <option value="Routine checkup">Routine checkup</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Notes</label>
                                <textarea class="form-control" id="followUpNotes" rows="2" placeholder="Additional notes..."></textarea>
                            </div>
                            <button type="submit" class="btn btn-warning btn-block">
                                <i class="fas fa-calendar-plus"></i> Schedule Follow-up
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('followUpModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 14);
        document.getElementById('followUpDate').value = defaultDate.toISOString().slice(0, 16);

        document.getElementById('followUpForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const scheduledAt = document.getElementById('followUpDate').value;
            const reason = document.getElementById('followUpReason').value;
            const notes = document.getElementById('followUpNotes').value;

            if (!scheduledAt) {
                alert('Please select a date and time.');
                return;
            }

            const result = await this.bookFollowUp(patientId, scheduledAt, reason, notes);
            alert(result.message);
            if (result.success) {
                document.getElementById('followUpModal').remove();
                this.loadView('patients');
            }
        });
    }

    async bookFollowUp(patientId, scheduledAt, reason, notes) {
        try {
            if (!patientId || patientId === 'undefined' || patientId === 'null') {
                throw new Error('Invalid patient ID');
            }

            const doctorId = authManager.getUserId();
            
            const { error } = await supabase
                .from('appointments')
                .insert([{
                    patient_id: patientId,
                    doctor_id: doctorId,
                    scheduled_at: new Date(scheduledAt).toISOString(),
                    status: 'scheduled',
                    consultation_type: 'physical',
                    payment_status: 'pending',
                    amount_paid: 500,
                    notes: `Follow-up - ${reason}\n${notes}`,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            return { success: true, message: '✅ Follow-up scheduled successfully!' };
        } catch (error) {
            console.error('Follow-up error:', error);
            return { success: false, message: error.message || 'Failed to schedule follow-up.' };
        }
    }

    // =============================================
    // CONSULTATION MODAL
    // =============================================
    openConsultationModal(appointmentId, patientId, patientName) {
        const modalHtml = `
            <div class="modal-overlay" id="consultationModal">
                <div class="modal">
                    <div class="modal-header" style="background:var(--primary);border-radius:var(--radius-lg) var(--radius-lg) 0 0;margin:-32px -32px 0 -32px;padding:20px 32px;">
                        <h5 class="modal-title" style="color:white;">📋 Consultation - ${patientName}</h5>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="color:white;">×</button>
                    </div>
                    <div class="modal-body" style="margin-top:20px;">
                        <form id="consultationForm">
                            <div class="form-group">
                                <label class="form-label">SOAP Notes *</label>
                                <textarea class="form-control" id="soapNotes" rows="5" placeholder="Subjective, Objective, Assessment, Plan" required></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Prescription (Optional)</label>
                                <div id="prescriptionFields">
                                    <div class="row mb-2 prescription-row">
                                        <div class="col-md-4">
                                            <input type="text" class="form-control" placeholder="Medication" name="medication">
                                        </div>
                                        <div class="col-md-3">
                                            <input type="text" class="form-control" placeholder="Dosage" name="dosage">
                                        </div>
                                        <div class="col-md-4">
                                            <input type="text" class="form-control" placeholder="Instructions" name="instructions">
                                        </div>
                                        <div class="col-md-1">
                                            <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.prescription-row').remove()">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" class="btn btn-sm btn-secondary mt-2" onclick="doctorManager.addPrescriptionField()">
                                    <i class="fas fa-plus"></i> Add Medication
                                </button>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="completeAppointment">
                                <label class="form-check-label" for="completeAppointment">✅ Mark appointment as completed</label>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block">
                                <i class="fas fa-save"></i> Save Consultation
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('consultationModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('consultationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const soapNotes = document.getElementById('soapNotes').value.trim();
            const completeAppointment = document.getElementById('completeAppointment').checked;

            if (!soapNotes) {
                alert('Please enter SOAP notes.');
                return;
            }

            const prescriptions = [];
            document.querySelectorAll('.prescription-row').forEach(row => {
                const medication = row.querySelector('[name="medication"]').value.trim();
                const dosage = row.querySelector('[name="dosage"]').value.trim();
                const instructions = row.querySelector('[name="instructions"]').value.trim();
                if (medication) {
                    prescriptions.push({ medication, dosage, instructions });
                }
            });

            const result = await this.saveConsultation(appointmentId, patientId, soapNotes, prescriptions, completeAppointment);
            alert(result.message);
            
            if (result.success) {
                document.getElementById('consultationModal').remove();
                this.loadView('appointments');
            }
        });
    }

    addPrescriptionField() {
        const fieldHtml = `
            <div class="row mb-2 prescription-row">
                <div class="col-md-4">
                    <input type="text" class="form-control" placeholder="Medication" name="medication">
                </div>
                <div class="col-md-3">
                    <input type="text" class="form-control" placeholder="Dosage" name="dosage">
                </div>
                <div class="col-md-4">
                    <input type="text" class="form-control" placeholder="Instructions" name="instructions">
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.prescription-row').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        document.getElementById('prescriptionFields').insertAdjacentHTML('beforeend', fieldHtml);
    }

    async saveConsultation(appointmentId, patientId, soapNotes, prescriptions, completeAppointment) {
        try {
            const doctorId = authManager.getUserId();

            const { error: recordError } = await supabase
                .from('medical_records')
                .insert([{
                    patient_id: patientId,
                    doctor_id: doctorId,
                    appointment_id: appointmentId,
                    soap_notes: soapNotes,
                    created_at: new Date().toISOString()
                }]);

            if (recordError) throw recordError;

            if (prescriptions.length > 0) {
                const prescriptionData = prescriptions.map(rx => ({
                    patient_id: patientId,
                    doctor_id: doctorId,
                    appointment_id: appointmentId,
                    medication: rx.medication,
                    dosage: rx.dosage,
                    instructions: rx.instructions,
                    issued_at: new Date().toISOString()
                }));

                const { error: rxError } = await supabase
                    .from('prescriptions')
                    .insert(prescriptionData);

                if (rxError) throw rxError;
            }

            if (completeAppointment) {
                const { error: updateError } = await supabase
                    .from('appointments')
                    .update({ 
                        status: 'completed',
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', appointmentId);

                if (updateError) throw updateError;
            }

            return { success: true, message: '✅ Consultation saved successfully!' };
        } catch (error) {
            console.error('Consultation save error:', error);
            return { success: false, message: error.message || 'Failed to save consultation.' };
        }
    }

    // =============================================
    // VIEW CONSULTATION
    // =============================================
    async viewConsultation(appointmentId) {
        const { data: records } = await supabase
            .from('medical_records')
            .select(`
                *,
                doctor:profiles!medical_records_doctor_id_fkey (full_name),
                appointment:appointments (scheduled_at),
                prescriptions:prescriptions (*)
            `)
            .eq('appointment_id', appointmentId)
            .order('created_at', { ascending: false });

        if (!records || records.length === 0) {
            alert('No consultation notes found.');
            return;
        }

        const record = records[0];
        const modalHtml = `
            <div class="modal-overlay" id="viewConsultationModal">
                <div class="modal">
                    <div class="modal-header" style="background:var(--info);border-radius:var(--radius-lg) var(--radius-lg) 0 0;margin:-32px -32px 0 -32px;padding:20px 32px;">
                        <h5 class="modal-title" style="color:white;">📄 Consultation Notes</h5>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="color:white;">×</button>
                    </div>
                    <div class="modal-body" style="margin-top:20px;">
                        <p><strong>Doctor:</strong> ${record.doctor?.full_name || 'Unknown'}</p>
                        <p><strong>Date:</strong> ${new Date(record.created_at).toLocaleString()}</p>
                        <hr>
                        <h6>📝 SOAP Notes</h6>
                        <p style="background:var(--background);padding:16px;border-radius:var(--radius-sm);">${record.soap_notes || 'No notes available'}</p>
                        ${record.prescriptions && record.prescriptions.length > 0 ? `
                            <h6>💊 Prescriptions:</h6>
                            <ul>
                                ${record.prescriptions.map(rx => `
                                    <li><strong>${rx.medication}</strong> - ${rx.dosage} (${rx.instructions || 'Take as directed'})</li>
                                `).join('')}
                            </ul>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('viewConsultationModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // =============================================
    // VIEW PATIENT HISTORY
    // =============================================
    async viewPatientHistory(patientId, patientName) {
        const { data: records } = await supabase
            .from('medical_records')
            .select(`
                *,
                doctor:profiles!medical_records_doctor_id_fkey (full_name),
                appointment:appointments (scheduled_at),
                prescriptions:prescriptions (*)
            `)
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        const modalHtml = `
            <div class="modal-overlay" id="historyModal">
                <div class="modal" style="max-width:700px;">
                    <div class="modal-header" style="background:var(--primary);border-radius:var(--radius-lg) var(--radius-lg) 0 0;margin:-32px -32px 0 -32px;padding:20px 32px;">
                        <h5 class="modal-title" style="color:white;">📄 Medical History - ${patientName}</h5>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="color:white;">×</button>
                    </div>
                    <div class="modal-body" style="margin-top:20px;">
                        ${records && records.length > 0
                            ? records.map(record => `
                                <div class="card mb-3">
                                    <div class="card-header" style="background:var(--background);">
                                        <h6 class="mb-0">${record.doctor?.full_name || 'Unknown Doctor'} - ${new Date(record.created_at).toLocaleString()}</h6>
                                    </div>
                                    <div class="card-body">
                                        <p><strong>SOAP Notes:</strong></p>
                                        <p>${record.soap_notes || 'No notes available'}</p>
                                        ${record.prescriptions && record.prescriptions.length > 0 ? `
                                            <p><strong>💊 Prescriptions:</strong></p>
                                            <ul>
                                                ${record.prescriptions.map(rx => `
                                                    <li><strong>${rx.medication}</strong> - ${rx.dosage} (${rx.instructions || 'Take as directed'})</li>
                                                `).join('')}
                                            </ul>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')
                            : `<div class="text-center py-4">
                                <div style="font-size:3rem;margin-bottom:12px;">📭</div>
                                <p class="text-muted">No medical records found for this patient</p>
                            </div>`
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
    // PROFILE
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
                                    <label class="form-label">Full Name</label>
                                    <input type="text" class="form-control" id="fullName" value="${profile.full_name || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" id="email" value="${profile.email || ''}" disabled>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Specialty</label>
                                    <input type="text" class="form-control" id="specialty" value="${profile.specialty || 'General Practice'}" disabled>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Phone</label>
                                    <input type="tel" class="form-control" id="phone" value="${profile.phone || ''}">
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Update Profile
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value.trim();
            const phone = document.getElementById('phone').value.trim();

            if (!fullName) {
                alert('Full name is required.');
                return;
            }

            const result = await this.updateProfile(fullName, phone);
            alert(result.message);
        });
    }

    async updateProfile(fullName, phone) {
        try {
            const userId = authManager.getUserId();
            
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName, phone: phone })
                .eq('id', userId);

            if (error) throw error;

            authManager.userProfile.full_name = fullName;
            authManager.userProfile.phone = phone;

            return { success: true, message: '✅ Profile updated successfully!' };
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, message: error.message || 'Failed to update profile.' };
        }
    }

    // =============================================
    // VIDEO CALL
    // =============================================
    joinVideoCall(appointmentId, roomId, patientName) {
        if (!roomId || roomId === 'null' || roomId === 'undefined' || roomId === '') {
            alert('❌ No video room found for this appointment.');
            return;
        }
        
        if (patientName && !confirm(`Start video call with ${patientName}?`)) {
            return;
        }
        
        const profile = authManager?.getUserProfile();
        const displayName = `Dr. ${profile?.full_name || 'Doctor'}`;
        
        // Open video call in a new window/tab
        const videoUrl = `video-call.html?room=${roomId}&name=${encodeURIComponent(displayName)}&appointment=${appointmentId}`;
        window.open(videoUrl, '_blank', 'width=900,height=700');
    }

    // =============================================
    // CHAT
    // =============================================
    openChat() {
        if (window.chatManager) {
            window.chatManager.showChatInterface();
        } else {
            alert(' Chat feature is being loaded. Please try again.');
        }
    }

    openChatWithPatient(patientId) {
        if (!patientId) {
            alert('Invalid patient.');
            return;
        }
        
        if (window.chatManager) {
            window.chatManager.openChatWithUser(patientId);
        } else {
            alert('💬 Chat feature is being loaded. Please try again.');
        }
    }
}

// Initialize doctor manager
const doctorManager = new DoctorManager();
window.doctorManager = doctorManager;
console.log('✅ DoctorManager initialized with premium UI');