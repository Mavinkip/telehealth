/*
 * File: doctor.js - Updated with proper video call support
 * Purpose: Handle doctor-specific functionality
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
            <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
                <div class="container">
                    <a class="navbar-brand" href="#">🏥 Telehealth System</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="dashboard">Dashboard</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="appointments">Appointments</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="patients">Patients</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="profile">Profile</a>
                            </li>
                        </ul>
                        <span class="navbar-text me-3">👨‍⚕️ Dr. ${profile.full_name}</span>
                        <button class="btn btn-outline-danger btn-sm" id="logoutBtn">Logout</button>
                    </div>
                </div>
            </nav>
            <div class="container mt-4" id="doctorContent">
                <!-- Content will be loaded here -->
            </div>
        `;

        document.querySelectorAll('[data-view]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentView = e.target.dataset.view;
                this.loadView(this.currentView);
            });
        });

        document.getElementById('logoutBtn').addEventListener('click', async () => {
            const result = await authManager.logout();
            if (result.success) {
                alert(result.message);
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
            case 'profile':
                await this.loadProfileContent(content);
                break;
        }
    }

    async loadDashboardContent(container) {
        const userId = authManager.getUserId();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: todayAppointments } = await supabase
            .from('appointments')
            .select(`
                *,
                patient:profiles!appointments_patient_id_fkey (full_name, email, phone)
            `)
            .eq('doctor_id', userId)
            .eq('status', 'scheduled')
            .gte('scheduled_at', today.toISOString())
            .lt('scheduled_at', tomorrow.toISOString())
            .order('scheduled_at', { ascending: true });

        const { count: patientCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('doctor_id', userId);

        const thisMonth = new Date();
        thisMonth.setDate(1);
        const { count: completedCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('doctor_id', userId)
            .eq('status', 'completed')
            .gte('scheduled_at', thisMonth.toISOString());

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>Doctor Dashboard</h2>
                    <p class="text-muted">Welcome, Dr. ${authManager.getUserProfile().full_name}</p>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-4">
                    <div class="card dashboard-card">
                        <div class="icon">📅</div>
                        <h4>${todayAppointments?.length || 0}</h4>
                        <p class="text-muted">Today's Appointments</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card dashboard-card">
                        <div class="icon">👥</div>
                        <h4>${patientCount || 0}</h4>
                        <p class="text-muted">Total Patients</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card dashboard-card">
                        <div class="icon">✅</div>
                        <h4>${completedCount || 0}</h4>
                        <p class="text-muted">Completed This Month</p>
                    </div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Today's Schedule</h5>
                        </div>
                        <div class="card-body">
                            ${todayAppointments && todayAppointments.length > 0
                                ? todayAppointments.map(apt => `
                                    <div class="appointment-card upcoming p-3 mb-2 bg-light rounded">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6>${apt.patient.full_name}</h6>
                                                <p class="mb-1"><small>${new Date(apt.scheduled_at).toLocaleTimeString()}</small></p>
                                                <p class="mb-0"><small>${apt.patient.email} | ${apt.patient.phone || 'No phone'}</small></p>
                                            </div>
                                            <div>
                                                <button class="btn btn-sm btn-primary" onclick="doctorManager.joinVideoCall('${apt.id}', '${apt.jitsi_room_id}', '${apt.patient.full_name}')">
                                                    🎥 Start Call
                                                </button>
                                                <button class="btn btn-sm btn-secondary" onclick="doctorManager.openConsultationModal('${apt.id}', '${apt.patient_id}', '${apt.patient.full_name}')">
                                                    📋 Consult
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')
                                : '<p class="text-muted">No appointments scheduled for today</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadAppointmentsContent(container) {
        const userId = authManager.getUserId();
        
        const { data: appointments } = await supabase
            .from('appointments')
            .select(`
                *,
                patient:profiles!appointments_patient_id_fkey (full_name, email, phone)
            `)
            .eq('doctor_id', userId)
            .order('scheduled_at', { ascending: false });

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>My Appointments</h2>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            ${appointments && appointments.length > 0
                                ? `<div class="table-responsive">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th>Patient</th>
                                                <th>Contact</th>
                                                <th>Date & Time</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${appointments.map(apt => `
                                                <tr>
                                                    <td>${apt.patient.full_name}</td>
                                                    <td>${apt.patient.email}<br><small>${apt.patient.phone || 'No phone'}</small></td>
                                                    <td>${new Date(apt.scheduled_at).toLocaleString()}</td>
                                                    <td><span class="badge ${apt.status === 'scheduled' ? 'bg-success' : apt.status === 'completed' ? 'bg-secondary' : 'bg-danger'}">${apt.status}</span></td>
                                                    <td>
                                                        ${apt.status === 'scheduled' ? `
                                                            <button class="btn btn-sm btn-primary" onclick="doctorManager.joinVideoCall('${apt.id}', '${apt.jitsi_room_id}', '${apt.patient.full_name}')">🎥 Call</button>
                                                            <button class="btn btn-sm btn-secondary" onclick="doctorManager.openConsultationModal('${apt.id}', '${apt.patient_id}', '${apt.patient.full_name}')">📋 Consult</button>
                                                        ` : apt.status === 'completed' ? `
                                                            <button class="btn btn-sm btn-info" onclick="doctorManager.viewConsultation('${apt.id}')">📄 View</button>
                                                        ` : '-'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>`
                                : '<p class="text-muted">No appointments found</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadPatientsContent(container) {
        const userId = authManager.getUserId();
        
        const { data: patients } = await supabase
            .from('appointments')
            .select(`
                patient_id,
                patient:profiles!appointments_patient_id_fkey (full_name, email, phone, created_at)
            `)
            .eq('doctor_id', userId);

        const uniquePatients = patients ? [...new Map(patients.map(p => [p.patient_id, p.patient])).values()] : [];

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>My Patients</h2>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            ${uniquePatients && uniquePatients.length > 0
                                ? `<div class="table-responsive">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Member Since</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${uniquePatients.map(patient => `
                                                <tr>
                                                    <td>${patient.full_name}</td>
                                                    <td>${patient.email}</td>
                                                    <td>${patient.phone || '-'}</td>
                                                    <td>${new Date(patient.created_at).toLocaleDateString()}</td>
                                                    <td>
                                                        <button class="btn btn-sm btn-primary" onclick="doctorManager.viewPatientHistory('${patient.id}', '${patient.full_name}')">
                                                            📄 History
                                                        </button>
                                                        <button class="btn btn-sm btn-secondary" onclick="doctorManager.openChatWithPatient('${patient.id}')">
                                                            💬 Message
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>`
                                : '<p class="text-muted">No patients found</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadProfileContent(container) {
        const profile = authManager.getUserProfile();
        
        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>My Profile</h2>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-body">
                            <form id="profileForm">
                                <div class="mb-3">
                                    <label class="form-label">Full Name</label>
                                    <input type="text" class="form-control" id="fullName" value="${profile.full_name}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" id="email" value="${profile.email}" disabled>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Specialty</label>
                                    <input type="text" class="form-control" id="specialty" value="${profile.specialty || 'General Practice'}" disabled>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Phone</label>
                                    <input type="tel" class="form-control" id="phone" value="${profile.phone || ''}">
                                </div>
                                <button type="submit" class="btn btn-primary">Update Profile</button>
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

            await authManager.logActivity(userId, 'UPDATE_PROFILE', 'Updated profile information');

            return { success: true, message: 'Profile updated successfully!' };
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, message: error.message || 'Failed to update profile.' };
        }
    }

    // =============================================
    // VIDEO CALL - UPDATED
    // =============================================
    joinVideoCall(appointmentId, roomId, patientName) {
        console.log('📞 Doctor joinVideoCall called:', { appointmentId, roomId, patientName });
        
        // Check if roomId exists
        if (!roomId || roomId === 'null' || roomId === 'undefined' || roomId === '') {
            alert('❌ No video room found for this appointment. Please book a new appointment.');
            return;
        }
        
        // Check if videoManager exists
        if (typeof videoManager === 'undefined' || !videoManager) {
            console.error('❌ VideoManager not found!');
            alert('❌ Video service not available. Please refresh the page and try again.');
            return;
        }
        
        // Get doctor's name
        const profile = authManager?.getUserProfile();
        const displayName = `Dr. ${profile?.full_name || 'Doctor'}`;
        
        console.log('🎥 Starting video call with:', { roomId, displayName, patientName });
        
        // Show confirmation
        if (patientName) {
            if (!confirm(`Start video call with ${patientName}?`)) {
                return;
            }
        }
        
        // Join the room
        try {
            videoManager.joinRoom(roomId, displayName);
        } catch (error) {
            console.error('❌ Error joining video call:', error);
            alert('Failed to start video call: ' + error.message);
        }
    }

    // =============================================
    // CONSULTATION MODAL
    // =============================================
    openConsultationModal(appointmentId, patientId, patientName) {
        const modalHtml = `
            <div class="modal fade" id="consultationModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">📋 Consultation - ${patientName}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="consultationForm">
                                <div class="mb-3">
                                    <label class="form-label">SOAP Notes</label>
                                    <textarea class="form-control" id="soapNotes" rows="5" placeholder="Subjective, Objective, Assessment, Plan" required></textarea>
                                </div>
                                <div class="mb-3">
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
                                                <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">×</button>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="button" class="btn btn-sm btn-secondary mt-2" onclick="doctorManager.addPrescriptionField()">+ Add Medication</button>
                                </div>
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="completeAppointment">
                                    <label class="form-check-label" for="completeAppointment">
                                        ✅ Mark appointment as completed
                                    </label>
                                </div>
                                <button type="submit" class="btn btn-primary">💾 Save Consultation</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('consultationModal'));
        modal.show();

        document.getElementById('consultationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const soapNotes = document.getElementById('soapNotes').value;
            const completeAppointment = document.getElementById('completeAppointment').checked;

            const prescriptions = [];
            document.querySelectorAll('.prescription-row').forEach(row => {
                const medication = row.querySelector('[name="medication"]').value;
                const dosage = row.querySelector('[name="dosage"]').value;
                const instructions = row.querySelector('[name="instructions"]').value;
                if (medication) {
                    prescriptions.push({ medication, dosage, instructions });
                }
            });

            const result = await this.saveConsultation(appointmentId, patientId, soapNotes, prescriptions, completeAppointment);
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
                    <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">×</button>
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
                const { error: aptError } = await supabase
                    .from('appointments')
                    .update({ status: 'completed' })
                    .eq('id', appointmentId);

                if (aptError) throw aptError;
            }

            await authManager.logActivity(doctorId, 'SAVE_CONSULTATION', `Saved consultation for appointment ${appointmentId}`);

            return { success: true, message: '✅ Consultation saved successfully!' };
        } catch (error) {
            console.error('Consultation save error:', error);
            return { success: false, message: error.message || 'Failed to save consultation.' };
        }
    }

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
            <div class="modal fade" id="historyModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">📄 Medical History - ${patientName}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${records && records.length > 0
                                ? records.map(record => `
                                    <div class="card mb-3">
                                        <div class="card-header">
                                            <h6 class="mb-0">${record.doctor.full_name} - ${new Date(record.created_at).toLocaleString()}</h6>
                                        </div>
                                        <div class="card-body">
                                            <p>${record.soap_notes || 'No notes available'}</p>
                                            ${record.prescriptions && record.prescriptions.length > 0 ? `
                                                <h6>💊 Prescriptions:</h6>
                                                <ul>
                                                    ${record.prescriptions.map(rx => `
                                                        <li><strong>${rx.medication}</strong> - ${rx.dosage} (${rx.instructions})</li>
                                                    `).join('')}
                                                </ul>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')
                                : '<p class="text-muted">No medical history found</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('historyModal'));
        modal.show();

        modal._element.addEventListener('hidden.bs.modal', () => {
            modal._element.remove();
        });
    }

    openChatWithPatient(patientId) {
        if (window.chatManager) {
            window.chatManager.showChatInterface(null, patientId);
        } else {
            alert('💬 Chat feature coming soon!');
        }
    }
}

// Initialize doctor manager
const doctorManager = new DoctorManager();
window.doctorManager = doctorManager;
console.log('✅ DoctorManager initialized');