/*
 * File: patient.js
 * Purpose: Patient dashboard and functionality
 */

class PatientManager {
    constructor() {
        this.currentView = 'dashboard';
    }

    async loadDashboardContent(container) {
        const userId = authManager.getUserId();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: upcomingAppointments } = await supabase
            .from('appointments')
            .select(`
                *,
                doctor:profiles!appointments_doctor_id_fkey (full_name, specialty, phone)
            `)
            .eq('patient_id', userId)
            .eq('status', 'scheduled')
            .gte('scheduled_at', today.toISOString())
            .order('scheduled_at', { ascending: true })
            .limit(5);

        const { count: totalAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', userId);

        const { count: completedAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', userId)
            .eq('status', 'completed');

        const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .is('read_at', null);

        const { data: prescriptions } = await supabase
            .from('prescriptions')
            .select(`
                *,
                doctor:profiles!prescriptions_doctor_id_fkey (full_name)
            `)
            .eq('patient_id', userId)
            .order('issued_at', { ascending: false })
            .limit(3);

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>Patient Dashboard</h2>
                    <p class="text-muted">Welcome back, ${authManager.getUserProfile().full_name}</p>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="dashboard-card" onclick="app.loadView('appointments')">
                        <div class="icon"><i class="fas fa-calendar-check"></i></div>
                        <h4>${upcomingAppointments?.length || 0}</h4>
                        <p>Upcoming Appointments</p>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="dashboard-card" onclick="app.loadView('appointments')">
                        <div class="icon"><i class="fas fa-clipboard-list"></i></div>
                        <h4>${totalAppointments || 0}</h4>
                        <p>Total Appointments</p>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="dashboard-card">
                        <div class="icon"><i class="fas fa-check-circle"></i></div>
                        <h4>${completedAppointments || 0}</h4>
                        <p>Completed</p>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="dashboard-card" onclick="patientManager.openChat()">
                        <div class="icon"><i class="fas fa-comment-dots"></i></div>
                        <h4>${unreadCount || 0}</h4>
                        <p>Unread Messages ${unreadCount > 0 ? '•' : ''}</p>
                    </div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Upcoming Appointments</h5>
                        </div>
                        <div class="card-body">
                            ${upcomingAppointments && upcomingAppointments.length > 0
                                ? upcomingAppointments.map(apt => `
                                    <div class="appointment-card p-3 mb-2 border rounded">
                                        <div class="d-flex justify-content-between align-items-center flex-wrap">
                                            <div>
                                                <h6 class="mb-1">Dr. ${apt.doctor?.full_name || 'Unknown Doctor'}</h6>
                                                <p class="mb-1"><small>${new Date(apt.scheduled_at).toLocaleString()}</small></p>
                                                <p class="mb-0"><small>${apt.doctor?.specialty || 'General Practice'}</small></p>
                                            </div>
                                            <div class="mt-2 mt-sm-0">
                                                ${apt.consultation_type === 'video' && apt.jitsi_room_id ? `
                                                    <button class="btn btn-sm btn-primary" onclick="patientManager.joinVideoCall('${apt.jitsi_room_id}', 'Dr. ${apt.doctor?.full_name || 'Doctor'}')">
                                                        <i class="fas fa-video"></i> Join Call
                                                    </button>
                                                ` : `
                                                    <span class="badge bg-warning">Physical</span>
                                                `}
                                                <button class="btn btn-sm btn-secondary" onclick="patientManager.openChatWithDoctor('${apt.doctor_id}')">
                                                    <i class="fas fa-comment"></i> Message
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')
                                : '<p class="text-muted text-center my-3">No upcoming appointments</p>'
                            }
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">Recent Prescriptions</h5>
                        </div>
                        <div class="card-body">
                            ${prescriptions && prescriptions.length > 0
                                ? prescriptions.map(rx => `
                                    <div class="border-bottom pb-2 mb-2">
                                        <p class="mb-1"><strong>${rx.medication}</strong> - ${rx.dosage}</p>
                                        <small class="text-muted">Dr. ${rx.doctor?.full_name || 'Unknown'} | ${new Date(rx.issued_at).toLocaleDateString()}</small>
                                    </div>
                                `).join('')
                                : '<p class="text-muted text-center my-3">No prescriptions yet</p>'
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
                doctor:profiles!appointments_doctor_id_fkey (full_name, specialty, phone, email)
            `)
            .eq('patient_id', userId)
            .order('scheduled_at', { ascending: false });

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>My Appointments</h2>
                    <button class="btn btn-primary mt-2" onclick="app.loadView('doctors')"><i class="fas fa-plus"></i> Book New Appointment</button>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            ${appointments && appointments.length > 0
                                ? `<div class="table-responsive">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th>Doctor</th>
                                                <th>Specialty</th>
                                                <th>Date & Time</th>
                                                <th>Type</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${appointments.map(apt => `
                                                <tr>
                                                    <td><strong>Dr. ${apt.doctor?.full_name || 'Unknown'}</strong></td>
                                                    <td>${apt.doctor?.specialty || 'General Practice'}</td>
                                                    <td><small>${new Date(apt.scheduled_at).toLocaleString()}</small></td>
                                                    <td>
                                                        <span class="badge ${apt.consultation_type === 'video' ? 'bg-primary' : 'bg-warning'}">
                                                            ${apt.consultation_type || 'video'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span class="badge ${apt.status === 'scheduled' ? 'bg-success' : apt.status === 'completed' ? 'bg-secondary' : 'bg-danger'}">
                                                            ${apt.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        ${apt.status === 'scheduled' ? `
                                                            ${apt.consultation_type === 'video' && apt.jitsi_room_id ? `
                                                                <button class="btn btn-sm btn-primary mb-1 w-100" onclick="patientManager.joinVideoCall('${apt.jitsi_room_id}', 'Dr. ${apt.doctor?.full_name || 'Doctor'}')"><i class="fas fa-video"></i> Join</button>
                                                            ` : `
                                                                <span class="text-muted">Physical</span>
                                                            `}
                                                            <button class="btn btn-sm btn-danger w-100" onclick="patientManager.cancelAppointment('${apt.id}')"><i class="fas fa-times"></i> Cancel</button>
                                                        ` : apt.status === 'completed' ? `
                                                            <button class="btn btn-sm btn-info w-100" onclick="patientManager.viewAppointmentDetails('${apt.id}')"><i class="fas fa-eye"></i> View</button>
                                                        ` : '-'}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>`
                                : '<p class="text-muted text-center my-3">No appointments found</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadDoctorsContent(container) {
        const { data: doctors } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'doctor')
            .eq('is_active', true);

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>Available Doctors</h2>
                    <p class="text-muted">Browse doctors and book appointments</p>
                </div>
            </div>
            <div class="row mt-3">
                ${doctors && doctors.length > 0
                    ? doctors.map(doc => `
                        <div class="col-md-4 mb-3">
                            <div class="card h-100">
                                <div class="card-body text-center">
                                    <div class="doctor-avatar mb-3" style="width:80px;height:80px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;margin:0 auto;font-size:32px;color:var(--primary);">
                                        <i class="fas fa-user-md"></i>
                                    </div>
                                    <h5 class="card-title">Dr. ${doc.full_name}</h5>
                                    <p class="card-text"><span class="badge bg-primary">${doc.specialty || 'General Practice'}</span></p>
                                    <p class="card-text"><small>${doc.email}</small></p>
                                    <p class="card-text"><small>${doc.phone || 'No phone'}</small></p>
                                    <button class="btn btn-primary w-100" onclick="patientManager.bookWithDoctor('${doc.id}', '${doc.full_name}')">
                                        <i class="fas fa-calendar-plus"></i> Book Appointment
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')
                    : '<p class="text-muted text-center my-3">No doctors available at the moment</p>'
                }
            </div>
        `;
    }

    bookWithDoctor(doctorId, doctorName) {
        const modalHtml = `
            <div class="modal-overlay" id="bookModal">
                <div class="modal">
                    <div class="modal-header" style="background:var(--primary);border-radius:var(--radius-lg) var(--radius-lg) 0 0;margin:-32px -32px 0 -32px;padding:20px 32px;">
                        <h5 class="modal-title" style="color:white;">Book Appointment with Dr. ${doctorName}</h5>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="color:white;">×</button>
                    </div>
                    <div class="modal-body" style="margin-top:20px;">
                        <form id="bookForm">
                            <div class="form-group">
                                <label class="form-label">Date & Time *</label>
                                <input type="datetime-local" class="form-control" id="appointmentDate" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Consultation Type</label>
                                <select class="form-control" id="consultationType">
                                    <option value="video">Video Consultation</option>
                                    <option value="physical">Physical Consultation</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Notes</label>
                                <textarea class="form-control" id="appointmentNotes" rows="2" placeholder="Reason for visit..."></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block">
                                <i class="fas fa-calendar-plus"></i> Book Appointment
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('bookModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 1);
        defaultDate.setHours(9, 0, 0, 0);
        document.getElementById('appointmentDate').value = defaultDate.toISOString().slice(0, 16);

        document.getElementById('bookForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const scheduledAt = document.getElementById('appointmentDate').value;
            const consultationType = document.getElementById('consultationType').value;
            const notes = document.getElementById('appointmentNotes').value.trim();

            if (!scheduledAt) {
                alert('Please select a date and time.');
                return;
            }

            const result = await this.createAppointment(doctorId, scheduledAt, consultationType, notes);
            alert(result.message);
            if (result.success) {
                document.getElementById('bookModal').remove();
                app.loadView('appointments');
            }
        });
    }

    async createAppointment(doctorId, scheduledAt, consultationType, notes) {
        try {
            const patientId = authManager.getUserId();
            
            const roomId = consultationType === 'video' ? 
                `telehealth-${patientId}-${doctorId}-${Date.now()}` : null;

            const { error } = await supabase
                .from('appointments')
                .insert([{
                    patient_id: patientId,
                    doctor_id: doctorId,
                    scheduled_at: new Date(scheduledAt).toISOString(),
                    status: 'scheduled',
                    consultation_type: consultationType,
                    payment_status: 'pending',
                    amount_paid: consultationType === 'video' ? 300 : 500,
                    notes: notes || '',
                    jitsi_room_id: roomId,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

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

            alert('Appointment cancelled successfully.');
            app.loadView('appointments');
        } catch (error) {
            alert('Failed to cancel appointment: ' + error.message);
        }
    }

    async viewAppointmentDetails(appointmentId) {
        const { data: appointment } = await supabase
            .from('appointments')
            .select(`
                *,
                doctor:profiles!appointments_doctor_id_fkey (full_name, specialty, phone, email)
            `)
            .eq('id', appointmentId)
            .single();

        if (!appointment) {
            alert('Appointment not found.');
            return;
        }

        const { data: records } = await supabase
            .from('medical_records')
            .select('*')
            .eq('appointment_id', appointmentId);

        const modalHtml = `
            <div class="modal-overlay" id="viewAppointmentModal">
                <div class="modal">
                    <div class="modal-header" style="background:var(--info);border-radius:var(--radius-lg) var(--radius-lg) 0 0;margin:-32px -32px 0 -32px;padding:20px 32px;">
                        <h5 class="modal-title" style="color:white;">Appointment Details</h5>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="color:white;">×</button>
                    </div>
                    <div class="modal-body" style="margin-top:20px;">
                        <p><strong>Doctor:</strong> Dr. ${appointment.doctor?.full_name || 'Unknown'}</p>
                        <p><strong>Specialty:</strong> ${appointment.doctor?.specialty || 'General Practice'}</p>
                        <p><strong>Date & Time:</strong> ${new Date(appointment.scheduled_at).toLocaleString()}</p>
                        <p><strong>Type:</strong> ${appointment.consultation_type || 'video'}</p>
                        <p><strong>Status:</strong> <span class="badge bg-success">${appointment.status}</span></p>
                        ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
                        ${records && records.length > 0 ? `
                            <hr>
                            <h6>Consultation Notes</h6>
                            ${records.map(r => `
                                <div class="border rounded p-2 mb-2">
                                    <small>${new Date(r.created_at).toLocaleString()}</small>
                                    <p>${r.soap_notes || 'No notes available'}</p>
                                </div>
                            `).join('')}
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('viewAppointmentModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    async loadProfileContent(container) {
        const profile = authManager.getUserProfile();
        
        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>My Profile</h2>
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

            return { success: true, message: 'Profile updated successfully!' };
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, message: error.message || 'Failed to update profile.' };
        }
    }

    joinVideoCall(roomId, doctorName) {
        if (!roomId || roomId === 'null' || roomId === 'undefined' || roomId === '') {
            alert('No video room found for this appointment.');
            return;
        }
        
        const profile = authManager?.getUserProfile();
        const displayName = profile?.full_name || 'Patient';
        
        const videoUrl = `video-call.html?room=${roomId}&name=${encodeURIComponent(displayName)}&doctor=${encodeURIComponent(doctorName || 'Doctor')}`;
        window.open(videoUrl, '_blank', 'width=900,height=700');
    }

    openChat() {
        if (window.chatManager) {
            window.chatManager.showChatInterface();
        } else {
            alert('Chat feature is being loaded. Please try again.');
        }
    }

    openChatWithDoctor(doctorId) {
        if (!doctorId) {
            alert('Invalid doctor.');
            return;
        }
        
        if (window.chatManager) {
            window.chatManager.openChatWithUser(doctorId);
        } else {
            alert('Chat feature is being loaded. Please try again.');
        }
    }
}

const patientManager = new PatientManager();
window.patientManager = patientManager;
console.log('PatientManager loaded');