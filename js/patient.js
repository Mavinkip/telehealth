/*
 * File: patient.js
 * Purpose: Handle patient-specific functionality (dashboard, appointments, medical records)
 * Dependencies: supabase-js (from config.js), auth.js
 * Fits in: Patient module
 */

class PatientManager {
    constructor() {
        this.currentView = 'dashboard';
        this.availableDoctors = [];
    }

    showDashboard() {
        const app = document.getElementById('app');
        const profile = authManager.getUserProfile();
        
        app.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-light">
                <div class="container">
                    <a class="navbar-brand" href="#">Telehealth System</a>
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
                                <a class="nav-link" href="#" data-view="medical-records">Medical Records</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="profile">Profile</a>
                            </li>
                        </ul>
                        <span class="navbar-text me-3">Welcome, ${profile.full_name}</span>
                        <button class="btn btn-outline-danger btn-sm" id="logoutBtn">Logout</button>
                    </div>
                </div>
            </nav>
            <div class="container mt-4" id="patientContent">
                <!-- Content will be loaded here -->
            </div>
        `;

        // Attach event listeners
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
        const content = document.getElementById('patientContent');
        
        switch(view) {
            case 'dashboard':
                await this.loadDashboardContent(content);
                break;
            case 'appointments':
                await this.loadAppointmentsContent(content);
                break;
            case 'medical-records':
                await this.loadMedicalRecordsContent(content);
                break;
            case 'profile':
                await this.loadProfileContent(content);
                break;
        }
    }

    async loadDashboardContent(container) {
        const userId = authManager.getUserId();
        
        // Get upcoming appointments
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

        // Get recent medical records
        const { data: recentRecords } = await supabase
            .from('medical_records')
            .select(`
                *,
                doctor:profiles!medical_records_doctor_id_fkey (full_name),
                appointment:appointments (scheduled_at)
            `)
            .eq('patient_id', userId)
            .order('created_at', { ascending: false })
            .limit(3);

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>Patient Dashboard</h2>
                    <p class="text-muted">Welcome to your telehealth portal</p>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-3">
                    <div class="card dashboard-card" onclick="patientManager.loadView('appointments')">
                        <div class="icon">📅</div>
                        <h4>Book Appointment</h4>
                        <p class="text-muted">Schedule a consultation</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card dashboard-card" onclick="patientManager.loadView('medical-records')">
                        <div class="icon">📋</div>
                        <h4>Medical Records</h4>
                        <p class="text-muted">View your health history</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card dashboard-card" onclick="patientManager.openChat()">
                        <div class="icon">💬</div>
                        <h4>Messages</h4>
                        <p class="text-muted">Chat with your doctor</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card dashboard-card" onclick="patientManager.loadView('profile')">
                        <div class="icon">👤</div>
                        <h4>Profile</h4>
                        <p class="text-muted">Manage your account</p>
                    </div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Upcoming Appointments</h5>
                        </div>
                        <div class="card-body">
                            ${upcomingAppointments && upcomingAppointments.length > 0 
                                ? upcomingAppointments.map(apt => `
                                    <div class="appointment-card upcoming p-3 mb-2 bg-light rounded">
                                        <h6>${apt.doctor.full_name} - ${apt.doctor.specialty}</h6>
                                        <p class="mb-1"><small>${new Date(apt.scheduled_at).toLocaleString()}</small></p>
                                        <button class="btn btn-sm btn-primary" onclick="patientManager.joinVideoCall('${apt.id}', '${apt.jitsi_room_id}')">
                                            Join Video Call
                                        </button>
                                        <button class="btn btn-sm btn-secondary" onclick="patientManager.openChatForAppointment('${apt.id}', '${apt.doctor_id}')">
                                            Chat
                                        </button>
                                    </div>
                                `).join('')
                                : '<p class="text-muted">No upcoming appointments</p>'
                            }
                            <button class="btn btn-primary mt-2" onclick="patientManager.loadView('appointments')">
                                View All Appointments
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Recent Medical Records</h5>
                        </div>
                        <div class="card-body">
                            ${recentRecords && recentRecords.length > 0
                                ? recentRecords.map(record => `
                                    <div class="p-3 mb-2 bg-light rounded">
                                        <h6>${record.doctor.full_name}</h6>
                                        <p class="mb-1"><small>${new Date(record.created_at).toLocaleDateString()}</small></p>
                                        <p class="mb-0 text-muted">${record.soap_notes?.substring(0, 100)}...</p>
                                    </div>
                                `).join('')
                                : '<p class="text-muted">No recent medical records</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadAppointmentsContent(container) {
        const userId = authManager.getUserId();
        
        // Get all appointments
        const { data: appointments } = await supabase
            .from('appointments')
            .select(`
                *,
                doctor:profiles!appointments_doctor_id_fkey (full_name, specialty)
            `)
            .eq('patient_id', userId)
            .order('scheduled_at', { ascending: false });

        // Get available doctors
        const { data: doctors } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'doctor');

        this.availableDoctors = doctors || [];

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>My Appointments</h2>
                    <button class="btn btn-primary mb-3" onclick="patientManager.showBookingModal()">Book New Appointment</button>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            ${appointments && appointments.length > 0
                                ? `<table class="table">
                                    <thead>
                                        <tr>
                                            <th>Doctor</th>
                                            <th>Specialty</th>
                                            <th>Date & Time</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${appointments.map(apt => `
                                            <tr>
                                                <td>${apt.doctor.full_name}</td>
                                                <td>${apt.doctor.specialty}</td>
                                                <td>${new Date(apt.scheduled_at).toLocaleString()}</td>
                                                <td><span class="badge ${apt.status === 'scheduled' ? 'bg-success' : apt.status === 'completed' ? 'bg-secondary' : 'bg-danger'}">${apt.status}</span></td>
                                                <td>
                                                    ${apt.status === 'scheduled' ? `
                                                        <button class="btn btn-sm btn-primary" onclick="patientManager.joinVideoCall('${apt.id}', '${apt.jitsi_room_id}')">Join Call</button>
                                                        <button class="btn btn-sm btn-secondary" onclick="patientManager.openChatForAppointment('${apt.id}', '${apt.doctor_id}')">Chat</button>
                                                        <button class="btn btn-sm btn-danger" onclick="patientManager.cancelAppointment('${apt.id}')">Cancel</button>
                                                    ` : '-'}
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>`
                                : '<p class="text-muted">No appointments found</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showBookingModal() {
        const doctorsHtml = this.availableDoctors.map(doc => 
            `<option value="${doc.id}">${doc.full_name} - ${doc.specialty}</option>`
        ).join('');

        const modalHtml = `
            <div class="modal fade" id="bookingModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Book Appointment</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="bookingForm">
                                <div class="mb-3">
                                    <label class="form-label">Select Doctor</label>
                                    <select class="form-select" id="doctorSelect" required>
                                        ${doctorsHtml || '<option value="">No doctors available</option>'}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Date & Time</label>
                                    <input type="datetime-local" class="form-control" id="appointmentDate" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Notes (Optional)</label>
                                    <textarea class="form-control" id="appointmentNotes" rows="3"></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary">Book Appointment</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
        modal.show();

        document.getElementById('bookingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const doctorId = document.getElementById('doctorSelect').value;
            const scheduledAt = document.getElementById('appointmentDate').value;
            const notes = document.getElementById('appointmentNotes').value;

            if (!scheduledAt) {
                alert('Please select a date and time.');
                return;
            }

            const result = await this.bookAppointment(doctorId, scheduledAt, notes);
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

    async bookAppointment(doctorId, scheduledAt, notes) {
        try {
            const userId = authManager.getUserId();
            const jitsiRoomId = `telehealth-${userId}-${doctorId}-${Date.now()}`;

            const { error } = await supabase
                .from('appointments')
                .insert([{
                    patient_id: userId,
                    doctor_id: doctorId,
                    scheduled_at: new Date(scheduledAt).toISOString(),
                    status: 'scheduled',
                    jitsi_room_id: jitsiRoomId,
                    notes: notes
                }]);

            if (error) throw error;

            await authManager.logActivity(userId, 'BOOK_APPOINTMENT', `Booked appointment with doctor ${doctorId}`);

            return { success: true, message: 'Appointment booked successfully!' };
        } catch (error) {
            console.error('Booking error:', error);
            return { success: false, message: error.message || 'Failed to book appointment.' };
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

            await authManager.logActivity(authManager.getUserId(), 'CANCEL_APPOINTMENT', `Cancelled appointment ${appointmentId}`);

            alert('Appointment cancelled successfully!');
            this.loadView('appointments');
        } catch (error) {
            console.error('Cancellation error:', error);
            alert('Failed to cancel appointment.');
        }
    }

    async loadMedicalRecordsContent(container) {
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

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>Medical Records</h2>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    ${records && records.length > 0
                        ? records.map(record => `
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h5 class="mb-0">${record.doctor.full_name} - ${record.doctor.specialty}</h5>
                                    <small>${new Date(record.created_at).toLocaleString()}</small>
                                </div>
                                <div class="card-body">
                                    <h6>SOAP Notes</h6>
                                    <p>${record.soap_notes || 'No notes available'}</p>
                                    ${record.prescriptions && record.prescriptions.length > 0 ? `
                                        <h6 class="mt-3">Prescriptions</h6>
                                        <ul>
                                            ${record.prescriptions.map(rx => `
                                                <li>
                                                    <strong>${rx.medication}</strong> - ${rx.dosage}
                                                    <br><small>${rx.instructions}</small>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')
                        : '<div class="alert alert-info">No medical records found</div>'
                    }
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

    openChat() {
        if (window.chatManager) {
            window.chatManager.showChatInterface();
        }
    }

    openChatForAppointment(appointmentId, doctorId) {
        if (window.chatManager) {
            window.chatManager.showChatInterface(appointmentId, doctorId);
        }
    }

    joinVideoCall(appointmentId, roomId) {
        if (window.videoManager) {
            window.videoManager.joinRoom(roomId, authManager.getUserProfile().full_name);
        }
    }
}

// Initialize patient manager
const patientManager = new PatientManager();