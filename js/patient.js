/*
 * File: patient.js - ALL BUTTONS FIXED WITH CONTENT CONTAINER
 */

class PatientManager {
    constructor() {
        this.currentView = 'dashboard';
        this.availableDoctors = [];
        this.pricing = {
            video_call: 300,
            physical: 500
        };
        this.viewHistory = [];
    }

    showDashboard() {
        const app = document.getElementById('app');
        const profile = authManager.getUserProfile();
        
        if (!profile) {
            authManager.showLoginPage();
            return;
        }

        app.innerHTML = this.getDashboardHTML(profile);
        this.attachEvents();
        this.loadView('dashboard');
    }

    getDashboardHTML(profile) {
        return `
            <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
                <div class="container">
                    <a class="navbar-brand" href="#" onclick="patientManager.loadView('dashboard'); return false;">
                        🏥 Telehealth
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="dashboard">📊 Dashboard</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="appointments">📅 Appointments</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="medications">💊 Medications</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="chat">💬 Messages</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="profile">👤 Profile</a>
                            </li>
                        </ul>
                        <span class="navbar-text me-3">👋 ${profile.full_name}</span>
                        <button class="btn btn-outline-danger btn-sm" id="logoutBtn">🚪 Logout</button>
                    </div>
                </div>
            </nav>
            <div class="container mt-4">
                <div id="backButtonContainer" style="display:none; margin-bottom: 12px;">
                    <button class="btn btn-outline-secondary btn-sm" onclick="patientManager.goBack()">⬅️ Back</button>
                </div>
                <div id="patientContent"></div>
            </div>
        `;
    }

    attachEvents() {
        document.querySelectorAll('[data-view]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const view = link.dataset.view;
                console.log('Navigating to:', view);
                this.loadView(view);
            });
        });

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const result = await authManager.logout();
                if (result.success) {
                    window.location.reload();
                }
            });
        }
    }

    async loadView(view) {
        console.log('Loading view:', view);
        const content = document.getElementById('patientContent');
        if (!content) {
            console.error('Content element not found - recreating...');
            // Try to recreate the content container
            const container = document.querySelector('.container.mt-4');
            if (container) {
                const newContent = document.createElement('div');
                newContent.id = 'patientContent';
                container.appendChild(newContent);
                // Retry loading
                setTimeout(() => this.loadView(view), 100);
                return;
            }
            return;
        }

        const backBtn = document.getElementById('backButtonContainer');
        if (backBtn) {
            backBtn.style.display = view === 'dashboard' ? 'none' : 'block';
        }

        document.querySelectorAll('[data-view]').forEach(link => {
            link.classList.toggle('active', link.dataset.view === view);
        });

        content.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="text-muted mt-2">Loading...</p>
            </div>
        `;

        this.viewHistory.push(view);
        if (this.viewHistory.length > 10) {
            this.viewHistory.shift();
        }

        try {
            switch(view) {
                case 'dashboard':
                    await this.loadDashboardContent(content);
                    break;
                case 'appointments':
                    await this.loadAppointmentsContent(content);
                    break;
                case 'medications':
                    await this.loadMedicalRecordsContent(content);
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
                <button class="btn btn-primary mt-3" onclick="patientManager.loadView('dashboard')">⬅️ Back to Dashboard</button>
            `;
        }
    }

    goBack() {
        this.viewHistory.pop();
        const previous = this.viewHistory.pop() || 'dashboard';
        this.loadView(previous);
    }

    // =============================================
    // CHAT CONTENT - FIXED
    // =============================================
    async loadChatContent(container) {
        console.log('Loading chat content...');
        
        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">💬 Messages</h5>
                        </div>
                        <div class="card-body text-center py-5">
                            <div style="font-size: 4rem; color: var(--text-lighter);">💬</div>
                            <h5 class="mt-3">Chat Feature</h5>
                            <p class="text-muted">Connect with your doctors in real-time</p>
                            <div class="alert alert-info">ℹ️ Chat is being initialized. Please wait...</div>
                            <button class="btn btn-primary mt-3" onclick="patientManager.loadView('chat')">🔄 Retry</button>
                            <button class="btn btn-outline-secondary mt-3 ms-2" onclick="patientManager.loadView('dashboard')">⬅️ Back to Dashboard</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (window.chatManager && typeof window.chatManager.showChatInterface === 'function') {
            setTimeout(() => {
                try {
                    window.chatManager.showChatInterface();
                } catch (error) {
                    console.error('Chat load error:', error);
                }
            }, 500);
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
                doctor:profiles!appointments_doctor_id_fkey (full_name, specialty)
            `)
            .eq('patient_id', userId)
            .eq('status', 'scheduled')
            .gte('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true })
            .limit(3);

        const { data: todaysMeds } = await supabase
            .from('medication_schedule')
            .select('*')
            .eq('patient_id', userId)
            .eq('taken', false)
            .gte('scheduled_time', new Date().toISOString())
            .order('scheduled_time', { ascending: true })
            .limit(5);

        const { data: pendingPayments } = await supabase
            .from('appointments')
            .select(`
                *,
                doctor:profiles!appointments_doctor_id_fkey (full_name, specialty)
            `)
            .eq('patient_id', userId)
            .eq('status', 'completed')
            .eq('payment_status', 'pending')
            .eq('consultation_type', 'video');

        const { data: paidAppointments } = await supabase
            .from('appointments')
            .select('amount_paid')
            .eq('patient_id', userId)
            .eq('payment_status', 'paid');

        const totalSpent = paidAppointments?.reduce((sum, apt) => sum + (apt.amount_paid || 0), 0) || 0;

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>🏥 Patient Dashboard</h2>
                    <p class="text-muted">Welcome to your telehealth portal</p>
                </div>
            </div>

            ${todaysMeds && todaysMeds.length > 0 ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="card border-info">
                            <div class="card-header bg-info text-white">
                                <h5 class="mb-0">💊 Today's Medication Reminders</h5>
                            </div>
                            <div class="card-body">
                                ${todaysMeds.map(med => `
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
            ` : ''}

            ${pendingPayments && pendingPayments.length > 0 ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="card border-warning">
                            <div class="card-header bg-warning text-white">
                                <h5 class="mb-0">⚠️ Pending Payments</h5>
                            </div>
                            <div class="card-body">
                                ${pendingPayments.map(apt => `
                                    <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                                        <div>
                                            <strong>👨‍⚕️ ${apt.doctor.full_name}</strong>
                                            <br><small>🎥 Video Consultation - ${new Date(apt.scheduled_at).toLocaleDateString()}</small>
                                        </div>
                                        <div>
                                            <span class="badge bg-warning">KES ${apt.amount_paid || 300}</span>
                                            <button class="btn btn-sm btn-success ms-2" onclick="patientManager.payForAppointment('${apt.id}', ${apt.amount_paid || 300})">💳 Pay Now</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <div class="row mt-4">
                <div class="col-6 col-md-3 mb-3">
                    <div class="card dashboard-card" onclick="patientManager.loadView('appointments')" style="cursor:pointer;">
                        <div class="card-body text-center">
                            <div class="icon">📅</div>
                            <h4>Book</h4>
                            <p class="text-muted small">Appointment</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3 mb-3">
                    <div class="card dashboard-card" onclick="patientManager.loadView('medications')" style="cursor:pointer;">
                        <div class="card-body text-center">
                            <div class="icon">💊</div>
                            <h4>Medications</h4>
                            <p class="text-muted small">View & Track</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3 mb-3">
                    <div class="card dashboard-card" onclick="patientManager.loadView('chat')" style="cursor:pointer;">
                        <div class="card-body text-center">
                            <div class="icon">💬</div>
                            <h4>Messages</h4>
                            <p class="text-muted small">Chat</p>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3 mb-3">
                    <div class="card dashboard-card" onclick="patientManager.loadView('profile')" style="cursor:pointer;">
                        <div class="card-body text-center">
                            <div class="icon">👤</div>
                            <h4>Profile</h4>
                            <p class="text-muted small">Manage</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-3">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">💰 Payment Summary</h5>
                        </div>
                        <div class="card-body">
                            <p><strong>Total Paid:</strong> KES ${totalSpent.toLocaleString()}</p>
                            <p><strong>Pending Video Payments:</strong> ${pendingPayments?.length || 0}</p>
                            <p><strong>Pricing:</strong></p>
                            <ul class="small">
                                <li>🎥 Video Call: <strong>KES 300</strong> (pay after call)</li>
                                <li>🏥 Physical: <strong>KES 500</strong> (pay at booking)</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">📅 Upcoming</h5>
                        </div>
                        <div class="card-body">
                            ${upcomingAppointments && upcomingAppointments.length > 0 
                                ? upcomingAppointments.map(apt => `
                                    <div class="p-2 mb-2 bg-light rounded">
                                        <h6>👨‍⚕️ ${apt.doctor.full_name}</h6>
                                        <p class="mb-0 small">⏰ ${new Date(apt.scheduled_at).toLocaleString()}</p>
                                        <span class="badge ${apt.consultation_type === 'video' ? 'bg-primary' : 'bg-warning'}">
                                            ${apt.consultation_type === 'video' ? '🎥' : '🏥'} ${apt.consultation_type}
                                        </span>
                                        ${apt.is_follow_up ? '<span class="badge bg-info">🔄 Follow-up</span>' : ''}
                                    </div>
                                `).join('')
                                : '<p class="text-muted">No upcoming appointments</p>'
                            }
                            <button class="btn btn-primary mt-2 w-100" onclick="patientManager.loadView('appointments')">📅 View All</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
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
            this.loadView('dashboard');
        } catch (error) {
            console.error('Error marking medication:', error);
            alert('❌ Failed to mark medication as taken.');
        }
    }

    // =============================================
    // MEDICAL RECORDS WITH MEDICATIONS
    // =============================================
    async loadMedicalRecordsContent(container) {
        console.log('Loading medical records...');
        const userId = authManager.getUserId();
        
        const { data: records } = await supabase
            .from('medical_records')
            .select(`
                *,
                doctor:profiles!medical_records_doctor_id_fkey (full_name, specialty),
                appointment:appointments (scheduled_at),
                prescriptions:prescriptions (*)
            `)
            .eq('patient_id', userId)
            .order('created_at', { ascending: false });

        const { data: standalonePrescriptions } = await supabase
            .from('prescriptions')
            .select(`
                *,
                doctor:profiles!prescriptions_doctor_id_fkey (full_name, specialty)
            `)
            .eq('patient_id', userId)
            .is('appointment_id', null)
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

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>💊 Medications & Medical Records</h2>
                </div>
            </div>

            ${upcomingMeds.length > 0 ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="card border-success">
                            <div class="card-header bg-success text-white">
                                <h5 class="mb-0">⏰ Today's Medication Schedule</h5>
                            </div>
                            <div class="card-body">
                                ${upcomingMeds.map(med => `
                                    <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                                        <div>
                                            <strong>💊 ${med.medication}</strong>
                                            <br><small>${med.dosage}</small>
                                            <br><small>⏰ ${new Date(med.scheduled_time).toLocaleTimeString()}</small>
                                            ${med.is_refill_reminder ? '<br><span class="badge bg-warning">🔄 Refill Reminder</span>' : ''}
                                        </div>
                                        <div>
                                            ${!med.taken ? `
                                                <button class="btn btn-sm btn-success" onclick="patientManager.markMedicationTaken('${med.id}')">✅ Mark Taken</button>
                                            ` : `
                                                <span class="badge bg-success">✅ Taken</span>
                                            `}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}

            ${standalonePrescriptions && standalonePrescriptions.length > 0 ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="card border-info">
                            <div class="card-header bg-info text-white">
                                <h5 class="mb-0">📋 Active Prescriptions</h5>
                            </div>
                            <div class="card-body">
                                ${standalonePrescriptions.map(rx => `
                                    <div class="border-bottom pb-2 mb-2">
                                        <div class="d-flex justify-content-between">
                                            <div>
                                                <h6 class="mb-0">💊 ${rx.medication} - ${rx.dosage}</h6>
                                                <p class="mb-0 small">
                                                    <strong>👨‍⚕️ Doctor:</strong> ${rx.doctor?.full_name}
                                                    <br><strong>⏰ Frequency:</strong> ${rx.frequency || 'As directed'}
                                                    <br><strong>📅 Duration:</strong> ${rx.duration || 'N/A'}
                                                    <br><strong>📝 Instructions:</strong> ${rx.instructions || 'Take as directed'}
                                                    ${rx.notes ? `<br><strong>📌 Notes:</strong> ${rx.notes}` : ''}
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
            ` : ''}

            <div class="row mt-3">
                <div class="col-12">
                    <h4>📄 Medical Records</h4>
                    ${records && records.length > 0
                        ? records.map(record => `
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h6 class="mb-0">👨‍⚕️ ${record.doctor.full_name} - ${record.doctor.specialty}</h6>
                                    <small>📅 ${new Date(record.created_at).toLocaleString()}</small>
                                </div>
                                <div class="card-body">
                                    <h6>📝 SOAP Notes</h6>
                                    <p class="small">${record.soap_notes || 'No notes available'}</p>
                                    ${record.prescriptions && record.prescriptions.length > 0 ? `
                                        <h6 class="mt-3">💊 Prescriptions</h6>
                                        <ul class="small">
                                            ${record.prescriptions.map(rx => `
                                                <li>
                                                    <strong>💊 ${rx.medication}</strong> - ${rx.dosage}
                                                    <br><small>${rx.instructions}</small>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')
                        : '<div class="alert alert-info">ℹ️ No medical records found</div>'
                    }
                </div>
            </div>
        `;
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
                doctor:profiles!appointments_doctor_id_fkey (full_name, specialty)
            `)
            .eq('patient_id', userId)
            .order('scheduled_at', { ascending: false });

        await this.refreshDoctors();

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>📅 My Appointments</h2>
                    <button class="btn btn-primary mb-3" onclick="patientManager.showBookingModal()">➕ Book New</button>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            ${appointments && appointments.length > 0
                                ? `<div class="table-responsive">
                                    <table class="table table-sm">
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
                                                    <td><strong>${apt.doctor.full_name}</strong><br><small>${apt.doctor.specialty}</small></td>
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
                                                                <button class="btn btn-sm btn-primary mb-1 w-100" onclick="patientManager.joinVideoCall('${apt.id}', '${apt.jitsi_room_id}', '${apt.doctor.full_name}')">🎥 Join</button>
                                                            ` : `
                                                                ${apt.payment_status === 'paid' ? `
                                                                    <button class="btn btn-sm btn-success mb-1 w-100" onclick="alert('📍 Physical consultation at clinic.')">📍 Location</button>
                                                                ` : `
                                                                    <button class="btn btn-sm btn-warning mb-1 w-100" onclick="patientManager.payPhysicalBooking('${apt.id}', ${apt.amount_paid || 500})">💳 Pay</button>
                                                                `}
                                                            `}
                                                            <button class="btn btn-sm btn-secondary mb-1 w-100" onclick="patientManager.loadView('chat')">💬 Chat</button>
                                                            <button class="btn btn-sm btn-danger w-100" onclick="patientManager.cancelAppointment('${apt.id}')">❌ Cancel</button>
                                                        ` : apt.status === 'completed' && apt.payment_status === 'pending' && apt.consultation_type === 'video' ? `
                                                            <button class="btn btn-sm btn-warning w-100" onclick="patientManager.payForAppointment('${apt.id}', ${apt.amount_paid || 300})">💳 Pay Now</button>
                                                            <button class="btn btn-sm btn-secondary w-100 mt-1" onclick="patientManager.loadView('chat')">💬 Chat</button>
                                                        ` : apt.status === 'completed' ? '<span class="text-success">✅ Done</span>' : '<span class="text-danger">❌ Cancelled</span>'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>`
                                : '<p class="text-muted">ℹ️ No appointments found</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
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

            console.log('Booking appointment with data:', appointmentData);

            const { data, error } = await supabase
                .from('appointments')
                .insert([appointmentData])
                .select();

            if (error) {
                console.error('Supabase error:', error);
                throw new Error(error.message);
            }

            try {
                if (authManager && typeof authManager.logActivity === 'function') {
                    await authManager.logActivity(userId, 'BOOK_APPOINTMENT', 
                        `Booked ${consultationType} appointment - KES ${fee}`);
                }
            } catch (logError) {
                console.warn('Activity log skipped:', logError.message);
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
    showBookingModal() {
        this.refreshDoctors();
        
        const doctorsHtml = this.availableDoctors.map(doc => 
            `<option value="${doc.id}">👨‍⚕️ Dr. ${doc.full_name} - ${doc.specialty || 'General Practice'}</option>`
        ).join('');

        const modalHtml = `
            <div class="modal fade" id="bookingModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">📅 Book Appointment</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="bookingForm">
                                <div class="mb-3">
                                    <label class="form-label">👨‍⚕️ Select Doctor</label>
                                    <select class="form-select" id="doctorSelect" required>
                                        <option value="">Select a doctor...</option>
                                        ${doctorsHtml || '<option value="">No doctors available</option>'}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">⚙️ Consultation Type</label>
                                    <select class="form-select" id="consultationType" required>
                                        <option value="video">🎥 Video Call - KES 300 (pay after call)</option>
                                        <option value="physical">🏥 Physical - KES 500 (pay now)</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">📅 Date & Time</label>
                                    <input type="datetime-local" class="form-control" id="appointmentDate" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">📝 Notes (Optional)</label>
                                    <textarea class="form-control" id="appointmentNotes" rows="2" placeholder="Any specific concerns..."></textarea>
                                </div>
                                <div id="paymentInfo" class="alert alert-info">
                                    🎥 <strong>Video Call:</strong> KES 300 (pay after call)<br>
                                    🏥 <strong>Physical:</strong> KES 500 (pay now)
                                </div>
                                <button type="submit" class="btn btn-primary w-100" id="bookBtn">📅 Book Now</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('bookingModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
        modal.show();

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
                btn.className = 'btn btn-primary w-100';
            } else {
                info.innerHTML = '🏥 <strong>Physical Consultation:</strong> KES 500 - Pay <strong>now</strong> to book';
                btn.innerHTML = '💳 Pay KES 500 & Book';
                btn.className = 'btn btn-warning w-100';
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
                modal.hide();
                this.loadView('appointments');
            }
        });

        modal._element.addEventListener('hidden.bs.modal', () => {
            modal._element.remove();
        });
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
    // PAYMENT FUNCTIONS
    // =============================================
    async payPhysicalBooking(appointmentId, amount) {
        if (!confirm(`Pay KES ${amount} to confirm your physical consultation booking?`)) return;

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

    // =============================================
    // VIDEO CALL
    // =============================================
    joinVideoCall(appointmentId, roomId, doctorName) {
        console.log('Patient joinVideoCall called:', { appointmentId, roomId, doctorName });
        
        if (!roomId || roomId === 'null' || roomId === 'undefined' || roomId === '') {
            alert('No video room found. Please contact your doctor.');
            return;
        }
        
        let vm = window.videoManager || videoManager || null;
        
        if (!vm) {
            alert('Video service not available. Please refresh.');
            return;
        }
        
        const profile = authManager?.getUserProfile();
        const displayName = profile?.full_name || 'Patient';
        
        if (doctorName && !confirm(`Join video call with Dr. ${doctorName}?`)) {
            return;
        }
        
        try {
            vm.joinRoom(roomId, displayName);
        } catch (error) {
            console.error('Error joining video call:', error);
            alert('Failed to join video call: ' + error.message);
        }
    }

    // =============================================
    // PROFILE
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
                                <div class="mb-3">
                                    <label class="form-label">👤 Full Name</label>
                                    <input type="text" class="form-control" id="fullName" value="${profile.full_name}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">📧 Email</label>
                                    <input type="email" class="form-control" id="email" value="${profile.email}" disabled>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">📱 Phone</label>
                                    <input type="tel" class="form-control" id="phone" value="${profile.phone || ''}">
                                </div>
                                <button type="submit" class="btn btn-primary w-100">💾 Update Profile</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value;
            const phone = document.getElementById('phone').value;

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

            try {
                await authManager.logActivity(userId, 'UPDATE_PROFILE', 'Updated profile information');
            } catch (logError) {
                console.warn('Activity log skipped:', logError.message);
            }

            return { success: true, message: '✅ Profile updated successfully!' };
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, message: error.message || 'Failed to update profile.' };
        }
    }

    async cancelAppointment(appointmentId) {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', appointmentId);

            if (error) throw error;

            try {
                await authManager.logActivity(authManager.getUserId(), 'CANCEL_APPOINTMENT', 
                    `Cancelled appointment ${appointmentId}`);
            } catch (logError) {
                console.warn('Activity log skipped:', logError.message);
            }

            alert('✅ Appointment cancelled successfully!');
            this.loadView('appointments');
        } catch (error) {
            console.error('Cancellation error:', error);
            alert('Failed to cancel appointment.');
        }
    }
}

// Initialize patient manager
const patientManager = new PatientManager();
window.patientManager = patientManager;
console.log('PatientManager initialized');