/*
 * File: doctor.js - Complete with Prescriptions & Reminders
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
                                <a class="nav-link" href="#" data-view="patients">👥 Patients</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="chat">💬 Messages</a>
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
            case 'chat':
                this.openChat();
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

        const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .is('read_at', null);

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>Doctor Dashboard</h2>
                    <p class="text-muted">Welcome, Dr. ${authManager.getUserProfile().full_name}</p>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-3">
                    <div class="card dashboard-card" onclick="doctorManager.loadView('appointments')">
                        <div class="icon">📅</div>
                        <h4>${todayAppointments?.length || 0}</h4>
                        <p class="text-muted">Today's Appointments</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card dashboard-card" onclick="doctorManager.loadView('patients')">
                        <div class="icon">👥</div>
                        <h4>${patientCount || 0}</h4>
                        <p class="text-muted">Total Patients</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card dashboard-card">
                        <div class="icon">✅</div>
                        <h4>${completedCount || 0}</h4>
                        <p class="text-muted">Completed This Month</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card dashboard-card" onclick="doctorManager.openChat()">
                        <div class="icon">💬</div>
                        <h4>${unreadCount || 0}</h4>
                        <p class="text-muted">Unread Messages ${unreadCount > 0 ? '🔴' : ''}</p>
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
                                                <button class="btn btn-sm btn-info" onclick="doctorManager.openChatWithPatient('${apt.patient_id}')">
                                                    💬 Message
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
                                                <th>Type</th>
                                                <th>Status</th>
                                                <th>Payment</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${appointments.map(apt => `
                                                <tr>
                                                    <td><strong>${apt.patient.full_name}</strong></td>
                                                    <td>${apt.patient.email}<br><small>${apt.patient.phone || 'No phone'}</small></td>
                                                    <td><small>${new Date(apt.scheduled_at).toLocaleString()}</small></td>
                                                    <td><span class="badge ${apt.consultation_type === 'video' ? 'bg-primary' : 'bg-warning'}">${apt.consultation_type || 'video'}</span></td>
                                                    <td><span class="badge ${apt.status === 'scheduled' ? 'bg-success' : apt.status === 'completed' ? 'bg-secondary' : 'bg-danger'}">${apt.status}</span></td>
                                                    <td>
                                                        ${apt.payment_status === 'paid' 
                                                            ? '<span class="badge bg-success">✅ Paid</span>' 
                                                            : apt.payment_status === 'pending' && apt.status === 'completed'
                                                            ? '<span class="badge bg-warning">⏳ Pending</span>'
                                                            : '<span class="badge bg-secondary">-</span>'
                                                        }
                                                        ${apt.amount_paid ? `<br><small>KES ${apt.amount_paid}</small>` : ''}
                                                    </td>
                                                    <td>
                                                        ${apt.status === 'scheduled' ? `
                                                            ${apt.consultation_type === 'video' ? `
                                                                <button class="btn btn-sm btn-primary mb-1 w-100" onclick="doctorManager.joinVideoCall('${apt.id}', '${apt.jitsi_room_id}', '${apt.patient.full_name}')">🎥 Call</button>
                                                            ` : `
                                                                <button class="btn btn-sm btn-success mb-1 w-100" onclick="alert('📍 Physical consultation at your clinic.')">📍 Clinic</button>
                                                            `}
                                                            <button class="btn btn-sm btn-secondary mb-1 w-100" onclick="doctorManager.openConsultationModal('${apt.id}', '${apt.patient_id}', '${apt.patient.full_name}')">📋 Consult</button>
                                                            <button class="btn btn-sm btn-info w-100" onclick="doctorManager.openChatWithPatient('${apt.patient_id}')">💬 Chat</button>
                                                        ` : apt.status === 'completed' ? `
                                                            <button class="btn btn-sm btn-info mb-1 w-100" onclick="doctorManager.viewConsultation('${apt.id}')">📄 View</button>
                                                            <button class="btn btn-sm btn-secondary w-100" onclick="doctorManager.openChatWithPatient('${apt.patient_id}')">💬 Chat</button>
                                                            <button class="btn btn-sm btn-warning w-100" onclick="doctorManager.scheduleFollowUp('${apt.patient_id}', '${apt.patient.full_name}')">📅 Follow-up</button>
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
                    <h2>👥 My Patients</h2>
                    <p class="text-muted">Manage your patients, write prescriptions, and schedule follow-ups</p>
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
                                                    <td><strong>${patient.full_name}</strong></td>
                                                    <td>${patient.email}</td>
                                                    <td>${patient.phone || '-'}</td>
                                                    <td>${new Date(patient.created_at).toLocaleDateString()}</td>
                                                    <td>
                                                        <div class="btn-group-vertical btn-group-sm w-100">
                                                            <button class="btn btn-primary" onclick="doctorManager.viewPatientHistory('${patient.id}', '${patient.full_name}')">
                                                                📄 History
                                                            </button>
                                                            <button class="btn btn-success" onclick="doctorManager.writePrescription('${patient.id}', '${patient.full_name}')">
                                                                💊 Prescription
                                                            </button>
                                                            <button class="btn btn-warning" onclick="doctorManager.scheduleFollowUp('${patient.id}', '${patient.full_name}')">
                                                                📅 Follow-up
                                                            </button>
                                                            <button class="btn btn-info" onclick="doctorManager.openChatWithPatient('${patient.id}')">
                                                                💬 Message
                                                            </button>
                                                        </div>
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

    // =============================================
    // WRITE PRESCRIPTION
    // =============================================
    writePrescription(patientId, patientName) {
        console.log('💊 Writing prescription for:', patientId, patientName);
        
        const modalHtml = `
            <div class="modal fade" id="prescriptionModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">💊 Write Prescription - ${patientName}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="prescriptionForm">
                                <div class="mb-3">
                                    <label class="form-label">Patient</label>
                                    <input type="text" class="form-control" value="${patientName}" disabled>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Medication Name</label>
                                    <input type="text" class="form-control" id="medicationName" placeholder="e.g., Amoxicillin" required>
                                </div>
                                <div class="row">
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Dosage</label>
                                        <input type="text" class="form-control" id="dosage" placeholder="e.g., 500mg" required>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Times Per Day</label>
                                        <select class="form-select" id="timesPerDay" required>
                                            <option value="1">1 time per day</option>
                                            <option value="2" selected>2 times per day</option>
                                            <option value="3">3 times per day</option>
                                            <option value="4">4 times per day</option>
                                            <option value="As needed">As needed</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Duration (Days)</label>
                                        <input type="number" class="form-control" id="durationDays" placeholder="e.g., 7" min="1" max="90" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">When to Take</label>
                                    <select class="form-select" id="whenToTake" required>
                                        <option value="After meals">After meals</option>
                                        <option value="Before meals">Before meals</option>
                                        <option value="With food">With food</option>
                                        <option value="On empty stomach">On empty stomach</option>
                                        <option value="At bedtime">At bedtime</option>
                                        <option value="With water">With water</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Special Instructions</label>
                                    <textarea class="form-control" id="instructions" rows="2" placeholder="Any special instructions..."></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Reminder Settings</label>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="sendReminders" checked>
                                        <label class="form-check-label" for="sendReminders">
                                            🔔 Send medication reminders to patient
                                        </label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="sendRefillReminder">
                                        <label class="form-check-label" for="sendRefillReminder">
                                            📅 Send refill reminder when medication is about to finish
                                        </label>
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-success w-100">💾 Save & Send Reminders</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('prescriptionModal'));
        modal.show();

        document.getElementById('prescriptionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const medication = document.getElementById('medicationName').value;
            const dosage = document.getElementById('dosage').value;
            const timesPerDay = document.getElementById('timesPerDay').value;
            const durationDays = parseInt(document.getElementById('durationDays').value) || 7;
            const whenToTake = document.getElementById('whenToTake').value;
            const instructions = document.getElementById('instructions').value;
            const sendReminders = document.getElementById('sendReminders').checked;
            const sendRefillReminder = document.getElementById('sendRefillReminder').checked;

            if (!medication || !dosage || !durationDays) {
                alert('Please fill in all required fields.');
                return;
            }

            const prescriptionData = {
                medication,
                dosage,
                frequency: `${timesPerDay} times per day`,
                duration: `${durationDays} days`,
                duration_days: durationDays,
                when_to_take: whenToTake,
                times_per_day: timesPerDay,
                instructions: instructions || whenToTake,
                send_reminders: sendReminders,
                send_refill_reminder: sendRefillReminder,
                notes: ''
            };

            const result = await this.savePrescription(patientId, prescriptionData);
            
            alert(result.message);
            if (result.success) {
                modal.hide();
                if (sendReminders) {
                    await this.sendMedicationReminders(patientId, patientName, medication, dosage, timesPerDay, durationDays, whenToTake);
                }
                await this.notifyPatientPrescription(patientId, patientName, medication, dosage, timesPerDay, durationDays);
                this.loadView('patients');
            }
        });

        modal._element.addEventListener('hidden.bs.modal', () => {
            modal._element.remove();
        });
    }

    async savePrescription(patientId, prescriptionData) {
        try {
            const doctorId = authManager.getUserId();
            
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
                send_refill_reminder: prescriptionData.send_refill_reminder || false,
                notes: prescriptionData.notes || '',
                issued_at: new Date().toISOString()
            };

            console.log('💾 Saving prescription:', prescription);

            const { data, error } = await supabase
                .from('prescriptions')
                .insert([prescription])
                .select();

            if (error) {
                console.error('❌ Prescription save error:', error);
                throw error;
            }

            await authManager.logActivity(doctorId, 'WRITE_PRESCRIPTION', 
                `Prescribed ${prescriptionData.medication} to patient ${patientId}`);

            return { success: true, message: '✅ Prescription saved with reminders!' };
        } catch (error) {
            console.error('❌ Prescription error:', error);
            return { success: false, message: error.message || 'Failed to save prescription.' };
        }
    }

    // =============================================
    // SEND MEDICATION REMINDERS
    // =============================================
    async sendMedicationReminders(patientId, patientName, medication, dosage, timesPerDay, durationDays, whenToTake) {
        try {
            const doctorId = authManager.getUserId();
            const { data: doctorData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', doctorId)
                .single();

            const doctorName = doctorData?.full_name || 'Doctor';

            const { data: aptData } = await supabase
                .from('appointments')
                .select('id')
                .eq('doctor_id', doctorId)
                .eq('patient_id', patientId)
                .in('status', ['scheduled', 'completed'])
                .order('scheduled_at', { ascending: false })
                .limit(1);

            const appointmentId = aptData && aptData.length > 0 ? aptData[0].id : null;

            if (!appointmentId) {
                console.log('No appointment found, but reminders will still be sent');
                return;
            }

            const timesPerDayNum = parseInt(timesPerDay) || 2;
            const intervalHours = Math.floor(12 / timesPerDayNum);
            const reminderTimes = [];
            
            for (let i = 0; i < timesPerDayNum; i++) {
                const hour = 8 + (i * intervalHours);
                const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                reminderTimes.push(timeStr);
            }

            const timesStr = reminderTimes.join(', ');
            
            const messageContent = `💊 **Medication Reminder Schedule**\n\n` +
                `Dr. ${doctorName} has prescribed:\n` +
                `📋 **${medication}** - ${dosage}\n` +
                `⏰ **Take ${timesPerDay} time(s) per day** at: ${timesStr}\n` +
                `🍽️ **When to take:** ${whenToTake}\n` +
                `📅 **Duration:** ${durationDays} days\n` +
                `💡 **Instructions:** ${whenToTake}. Take as directed.\n\n` +
                `🔔 You will receive reminders when it's time to take your medication.\n` +
                `📱 Please mark each dose as taken in your Medications section.`;

            await supabase
                .from('messages')
                .insert([{
                    sender_id: doctorId,
                    receiver_id: patientId,
                    appointment_id: appointmentId,
                    content: messageContent,
                    sent_at: new Date().toISOString()
                }]);

            // Create medication schedule entries
            const scheduleEntries = [];
            const startDate = new Date();
            
            for (let d = 0; d < durationDays; d++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + d);
                
                for (let t = 0; t < timesPerDayNum; t++) {
                    const hour = 8 + (t * intervalHours);
                    const reminderTime = new Date(date);
                    reminderTime.setHours(hour, 0, 0, 0);
                    
                    scheduleEntries.push({
                        patient_id: patientId,
                        medication: medication,
                        dosage: dosage,
                        scheduled_time: reminderTime.toISOString(),
                        taken: false,
                        created_at: new Date().toISOString()
                    });
                }
            }

            // Store medication schedule
            const { error: scheduleError } = await supabase
                .from('medication_schedule')
                .insert(scheduleEntries);

            if (scheduleError) {
                console.error('Error creating medication schedule:', scheduleError);
            }

            // Schedule refill reminder if enabled
            if (true) {
                const refillDate = new Date();
                refillDate.setDate(refillDate.getDate() + durationDays - 2);
                
                await supabase
                    .from('medication_schedule')
                    .insert([{
                        patient_id: patientId,
                        medication: medication,
                        dosage: dosage,
                        scheduled_time: refillDate.toISOString(),
                        taken: false,
                        is_refill_reminder: true,
                        created_at: new Date().toISOString()
                    }]);
            }

            console.log('✅ Medication reminders scheduled successfully');
            return true;

        } catch (error) {
            console.error('Error sending medication reminders:', error);
            return false;
        }
    }

    async notifyPatientPrescription(patientId, patientName, medication, dosage, timesPerDay, durationDays) {
        try {
            const doctorId = authManager.getUserId();
            const { data: doctorData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', doctorId)
                .single();

            const doctorName = doctorData?.full_name || 'Doctor';

            const { data: aptData } = await supabase
                .from('appointments')
                .select('id')
                .eq('doctor_id', doctorId)
                .eq('patient_id', patientId)
                .in('status', ['scheduled', 'completed'])
                .order('scheduled_at', { ascending: false })
                .limit(1);

            const appointmentId = aptData && aptData.length > 0 ? aptData[0].id : null;

            if (appointmentId) {
                await supabase
                    .from('messages')
                    .insert([{
                        sender_id: doctorId,
                        receiver_id: patientId,
                        appointment_id: appointmentId,
                        content: `💊 **New Prescription**\n\nDr. ${doctorName} has prescribed:\n📋 ${medication} - ${dosage}\n⏰ Take ${timesPerDay} time(s) per day\n📅 Duration: ${durationDays} days\n\n🔔 You will receive reminders when it's time to take your medication.`,
                        sent_at: new Date().toISOString()
                    }]);
            }
        } catch (error) {
            console.error('Error notifying patient:', error);
        }
    }

    // =============================================
    // SCHEDULE FOLLOW-UP
    // =============================================
    scheduleFollowUp(patientId, patientName) {
        const modalHtml = `
            <div class="modal fade" id="followUpModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-warning">
                            <h5 class="modal-title">📅 Schedule Follow-up - ${patientName}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="followUpForm">
                                <div class="mb-3">
                                    <label class="form-label">Patient</label>
                                    <input type="text" class="form-control" value="${patientName}" disabled>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Follow-up Date & Time</label>
                                    <input type="datetime-local" class="form-control" id="followUpDate" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Reason for Follow-up</label>
                                    <select class="form-select" id="followUpReason" required>
                                        <option value="Review medication">Review medication</option>
                                        <option value="Check progress">Check progress</option>
                                        <option value="Test results">Test results</option>
                                        <option value="Symptom check">Symptom check</option>
                                        <option value="Routine checkup">Routine checkup</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Notes</label>
                                    <textarea class="form-control" id="followUpNotes" rows="2" placeholder="Additional notes..."></textarea>
                                </div>
                                <button type="submit" class="btn btn-warning w-100">📅 Schedule Follow-up</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('followUpModal'));
        modal.show();

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
                modal.hide();
                await this.notifyPatientFollowUp(patientId, patientName, scheduledAt);
                this.loadView('patients');
            }
        });

        modal._element.addEventListener('hidden.bs.modal', () => {
            modal._element.remove();
        });
    }

    async bookFollowUp(patientId, scheduledAt, reason, notes) {
        try {
            const doctorId = authManager.getUserId();
            
            const { data, error } = await supabase
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
                    created_at: new Date().toISOString(),
                    is_follow_up: true
                }])
                .select();

            if (error) throw error;

            await authManager.logActivity(doctorId, 'SCHEDULE_FOLLOW_UP', 
                `Scheduled follow-up for patient ${patientId}`);

            return { success: true, message: '✅ Follow-up scheduled successfully!' };
        } catch (error) {
            console.error('Follow-up error:', error);
            return { success: false, message: error.message || 'Failed to schedule follow-up.' };
        }
    }

    async notifyPatientFollowUp(patientId, patientName, scheduledAt) {
        try {
            const doctorId = authManager.getUserId();
            const { data: doctorData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', doctorId)
                .single();

            const doctorName = doctorData?.full_name || 'Doctor';
            const dateFormatted = new Date(scheduledAt).toLocaleString();

            const { data: aptData } = await supabase
                .from('appointments')
                .select('id')
                .eq('doctor_id', doctorId)
                .eq('patient_id', patientId)
                .in('status', ['scheduled', 'completed'])
                .order('scheduled_at', { ascending: false })
                .limit(1);

            const appointmentId = aptData && aptData.length > 0 ? aptData[0].id : null;

            if (appointmentId) {
                await supabase
                    .from('messages')
                    .insert([{
                        sender_id: doctorId,
                        receiver_id: patientId,
                        appointment_id: appointmentId,
                        content: `📅 **Follow-up Scheduled**\n\nDr. ${doctorName} has scheduled a follow-up for:\n📆 ${dateFormatted}\n\nPlease check your appointments for details.`,
                        sent_at: new Date().toISOString()
                    }]);
            }
        } catch (error) {
            console.error('Error notifying patient:', error);
        }
    }

    // =============================================
    // OTHER METHODS
    // =============================================
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

            return { success: true, message: '✅ Profile updated successfully!' };
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, message: error.message || 'Failed to update profile.' };
        }
    }

    joinVideoCall(appointmentId, roomId, patientName) {
        console.log('📞 Doctor joinVideoCall called:', { appointmentId, roomId, patientName });
        
        if (!roomId || roomId === 'null' || roomId === 'undefined' || roomId === '') {
            alert('❌ No video room found for this appointment.');
            return;
        }
        
        let vm = window.videoManager || videoManager || null;
        
        if (!vm) {
            alert('❌ Video service not available. Please refresh.');
            return;
        }
        
        const profile = authManager?.getUserProfile();
        const displayName = `Dr. ${profile?.full_name || 'Doctor'}`;
        
        if (patientName && !confirm(`Start video call with ${patientName}?`)) {
            return;
        }
        
        try {
            vm.joinRoom(roomId, displayName);
        } catch (error) {
            console.error('❌ Error joining video call:', error);
            alert('Failed to start video call: ' + error.message);
        }
    }

    openChat() {
        if (window.chatManager) {
            window.chatManager.showChatInterface();
        } else {
            alert('💬 Chat feature coming soon!');
        }
    }

    openChatWithPatient(patientId) {
        if (window.chatManager) {
            this.findAppointmentWithPatient(patientId).then(appointmentId => {
                if (appointmentId) {
                    window.chatManager.showChatInterface(appointmentId, patientId);
                } else {
                    alert('No appointment found with this patient to chat.');
                }
            });
        } else {
            alert('💬 Chat feature coming soon!');
        }
    }

    async findAppointmentWithPatient(patientId) {
        const userId = authManager.getUserId();
        
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('id')
                .eq('doctor_id', userId)
                .eq('patient_id', patientId)
                .in('status', ['scheduled', 'completed'])
                .order('scheduled_at', { ascending: false })
                .limit(1);

            if (error) return null;
            return data && data.length > 0 ? data[0].id : null;
        } catch (error) {
            return null;
        }
    }

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
                                        ✅ Mark appointment as completed (Patient will be charged)
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
                const { data: aptData, error: aptError } = await supabase
                    .from('appointments')
                    .select('consultation_type, amount_paid')
                    .eq('id', appointmentId)
                    .single();

                if (aptError) throw aptError;

                const paymentStatus = aptData.consultation_type === 'video' ? 'pending' : 'paid';
                
                const { error: updateError } = await supabase
                    .from('appointments')
                    .update({ 
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        payment_status: paymentStatus
                    })
                    .eq('id', appointmentId);

                if (updateError) throw updateError;

                if (aptData.consultation_type === 'video') {
                    await this.sendPaymentNotification(appointmentId, patientId, aptData.amount_paid || 300);
                    alert(`✅ Consultation completed!\n\n💰 Patient will be charged KES ${aptData.amount_paid || 300}`);
                } else {
                    alert('✅ Physical consultation completed! Payment was already made.');
                }
            }

            await authManager.logActivity(doctorId, 'SAVE_CONSULTATION', `Saved consultation for appointment ${appointmentId}`);

            return { success: true, message: '✅ Consultation saved successfully!' };
        } catch (error) {
            console.error('Consultation save error:', error);
            return { success: false, message: error.message || 'Failed to save consultation.' };
        }
    }

    async sendPaymentNotification(appointmentId, patientId, amount) {
        try {
            const doctorId = authManager.getUserId();
            const { data: doctorData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', doctorId)
                .single();

            const doctorName = doctorData?.full_name || 'Doctor';

            await supabase
                .from('messages')
                .insert([{
                    sender_id: doctorId,
                    receiver_id: patientId,
                    appointment_id: appointmentId,
                    content: `✅ **Consultation Complete!**\n\n💳 Please pay KES ${amount}.\nPay from Appointments page.\n\nDr. ${doctorName}`,
                    sent_at: new Date().toISOString()
                }]);
        } catch (error) {
            console.error('Error sending payment notification:', error);
        }
    }

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
            <div class="modal fade" id="viewConsultationModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">📄 Consultation Notes</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>Doctor:</strong> ${record.doctor.full_name}</p>
                            <p><strong>Date:</strong> ${new Date(record.created_at).toLocaleString()}</p>
                            <hr>
                            <h6>📝 SOAP Notes</h6>
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
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('viewConsultationModal'));
        modal.show();

        modal._element.addEventListener('hidden.bs.modal', () => {
            modal._element.remove();
        });
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

        const { data: standalonePrescriptions } = await supabase
            .from('prescriptions')
            .select(`
                *,
                doctor:profiles!prescriptions_doctor_id_fkey (full_name)
            `)
            .eq('patient_id', patientId)
            .is('appointment_id', null)
            .order('issued_at', { ascending: false });

        const modalHtml = `
            <div class="modal fade" id="historyModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">📄 Medical History - ${patientName}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${standalonePrescriptions && standalonePrescriptions.length > 0 ? `
                                <div class="card mb-3 border-success">
                                    <div class="card-header bg-success text-white">
                                        <h6 class="mb-0">💊 Active Prescriptions</h6>
                                    </div>
                                    <div class="card-body">
                                        ${standalonePrescriptions.map(rx => `
                                            <div class="border-bottom pb-2 mb-2">
                                                <strong>${rx.medication}</strong> - ${rx.dosage}
                                                <br><small>Frequency: ${rx.frequency || 'As directed'}</small>
                                                <br><small>Duration: ${rx.duration || 'N/A'}</small>
                                                <br><small>Instructions: ${rx.instructions || 'Take as directed'}</small>
                                                <br><small>Issued: ${new Date(rx.issued_at).toLocaleDateString()}</small>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}

                            ${records && records.length > 0
                                ? records.map(record => `
                                    <div class="card mb-3">
                                        <div class="card-header">
                                            <h6 class="mb-0">${record.doctor.full_name} - ${new Date(record.created_at).toLocaleString()}</h6>
                                        </div>
                                        <div class="card-body">
                                            <p><strong>SOAP Notes:</strong></p>
                                            <p>${record.soap_notes || 'No notes available'}</p>
                                            ${record.prescriptions && record.prescriptions.length > 0 ? `
                                                <p><strong>💊 Prescriptions:</strong></p>
                                                <ul>
                                                    ${record.prescriptions.map(rx => `
                                                        <li><strong>${rx.medication}</strong> - ${rx.dosage} (${rx.instructions})</li>
                                                    `).join('')}
                                                </ul>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')
                                : '<p class="text-muted">No medical records found</p>'
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
}

// Initialize doctor manager
const doctorManager = new DoctorManager();
window.doctorManager = doctorManager;
console.log('✅ DoctorManager initialized');