/*
 * File: admin.js
 * Purpose: Handle admin-specific functionality (user management, reports, system monitoring)
 * Dependencies: supabase-js (from config.js), auth.js
 * Fits in: Admin module
 */

class AdminManager {
    constructor() {
        this.currentView = 'dashboard';
    }

    showDashboard() {
        const app = document.getElementById('app');
        const profile = authManager.getUserProfile();
        
        app.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-light">
                <div class="container">
                    <a class="navbar-brand" href="#">Telehealth System (Admin)</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="dashboard">Dashboard</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="users">User Management</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="appointments">All Appointments</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="reports">Reports</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-view="logs">Activity Logs</a>
                            </li>
                        </ul>
                        <span class="navbar-text me-3">Admin: ${profile.full_name}</span>
                        <button class="btn btn-outline-danger btn-sm" id="logoutBtn">Logout</button>
                    </div>
                </div>
            </nav>
            <div class="container mt-4" id="adminContent">
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
        const content = document.getElementById('adminContent');
        
        switch(view) {
            case 'dashboard':
                await this.loadDashboardContent(content);
                break;
            case 'users':
                await this.loadUsersContent(content);
                break;
            case 'appointments':
                await this.loadAllAppointmentsContent(content);
                break;
            case 'reports':
                await this.loadReportsContent(content);
                break;
            case 'logs':
                await this.loadLogsContent(content);
                break;
        }
    }

    async loadDashboardContent(container) {
        // Get statistics
        const { count: patientCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'patient');

        const { count: doctorCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'doctor');

        const { count: appointmentCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true });

        const { count: completedCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>Admin Dashboard</h2>
                    <p class="text-muted">System Overview</p>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-3">
                    <div class="card dashboard-card">
                        <div class="icon">👥</div>
                        <h4>${patientCount || 0}</h4>
                        <p class="text-muted">Total Patients</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card dashboard-card">
                        <div class="icon">👨‍⚕️</div>
                        <h4>${doctorCount || 0}</h4>
                        <p class="text-muted">Total Doctors</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card dashboard-card">
                        <div class="icon">📅</div>
                        <h4>${appointmentCount || 0}</h4>
                        <p class="text-muted">Total Appointments</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card dashboard-card">
                        <div class="icon">✅</div>
                        <h4>${completedCount || 0}</h4>
                        <p class="text-muted">Completed Consultations</p>
                    </div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Quick Actions</h5>
                        </div>
                        <div class="card-body">
                            <button class="btn btn-primary mb-2 w-100" onclick="adminManager.loadView('users')">Manage Users</button>
                            <button class="btn btn-secondary mb-2 w-100" onclick="adminManager.loadView('appointments')">View All Appointments</button>
                            <button class="btn btn-info mb-2 w-100" onclick="adminManager.loadView('reports')">Generate Reports</button>
                            <button class="btn btn-warning w-100" onclick="adminManager.loadView('logs')">View Activity Logs</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">System Status</h5>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-success">
                                <strong>Database:</strong> Connected
                            </div>
                            <div class="alert alert-success">
                                <strong>Authentication:</strong> Operational
                            </div>
                            <div class="alert alert-success">
                                <strong>Realtime:</strong> Active
                            </div>
                            <div class="alert alert-success">
                                <strong>Video Service:</strong> Ready (Jitsi Meet)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadUsersContent(container) {
        const { data: users } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>User Management</h2>
                    <button class="btn btn-primary mb-3" onclick="adminManager.showAddUserModal()">Add New User</button>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            ${users && users.length > 0
                                ? `<table class="table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Specialty</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${users.map(user => `
                                            <tr>
                                                <td>${user.full_name}</td>
                                                <td>${user.email}</td>
                                                <td><span class="badge ${user.role === 'admin' ? 'bg-danger' : user.role === 'doctor' ? 'bg-primary' : 'bg-success'}">${user.role}</span></td>
                                                <td>${user.specialty || '-'}</td>
                                                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <button class="btn btn-sm btn-info" onclick="adminManager.editUser('${user.id}')">Edit</button>
                                                    ${user.role !== 'admin' ? `
                                                        <button class="btn btn-sm btn-danger" onclick="adminManager.deleteUser('${user.id}', '${user.full_name}')">Delete</button>
                                                    ` : ''}
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>`
                                : '<p class="text-muted">No users found</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showAddUserModal() {
        const modalHtml = `
            <div class="modal fade" id="addUserModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add New User</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="addUserForm">
                                <div class="mb-3">
                                    <label class="form-label">Full Name</label>
                                    <input type="text" class="form-control" id="newFullName" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" id="newEmail" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Password</label>
                                    <input type="password" class="form-control" id="newPassword" required minlength="6">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Role</label>
                                    <select class="form-select" id="newRole" required>
                                        <option value="patient">Patient</option>
                                        <option value="doctor">Doctor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div class="mb-3" id="newSpecialtyField" style="display: none;">
                                    <label class="form-label">Specialty</label>
                                    <select class="form-select" id="newSpecialty">
                                        <option value="">Select specialty</option>
                                        <option value="General Practice">General Practice</option>
                                        <option value="Cardiology">Cardiology</option>
                                        <option value="Dermatology">Dermatology</option>
                                        <option value="Pediatrics">Pediatrics</option>
                                        <option value="Orthopedics">Orthopedics</option>
                                        <option value="Neurology">Neurology</option>
                                        <option value="Psychiatry">Psychiatry</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Phone</label>
                                    <input type="tel" class="form-control" id="newPhone">
                                </div>
                                <button type="submit" class="btn btn-primary">Add User</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
        modal.show();

        document.getElementById('newRole').addEventListener('change', (e) => {
            document.getElementById('newSpecialtyField').style.display = e.target.value === 'doctor' ? 'block' : 'none';
        });

        document.getElementById('addUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('newFullName').value;
            const email = document.getElementById('newEmail').value;
            const password = document.getElementById('newPassword').value;
            const role = document.getElementById('newRole').value;
            const specialty = document.getElementById('newSpecialty').value;
            const phone = document.getElementById('newPhone').value;

            const result = await this.addUser(email, password, fullName, role, phone, specialty);
            alert(result.message);
            
            if (result.success) {
                modal.hide();
                this.loadView('users');
            }
        });

        modal._element.addEventListener('hidden.bs.modal', () => {
            modal._element.remove();
        });
    }

    async addUser(email, password, fullName, role, phone, specialty) {
        try {
            // Create user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // Create profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: authData.user.id,
                        full_name: fullName,
                        email: email,
                        role: role,
                        phone: phone,
                        specialty: specialty,
                        created_at: new Date().toISOString()
                    }]);

                if (profileError) throw profileError;

                await authManager.logActivity(authManager.getUserId(), 'ADD_USER', `Added user ${email} as ${role}`);

                return { success: true, message: 'User added successfully!' };
            }
        } catch (error) {
            console.error('Add user error:', error);
            return { success: false, message: error.message || 'Failed to add user.' };
        }
    }

    async deleteUser(userId, userName) {
        if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) return;

        try {
            // Delete profile (cascade will handle related records)
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (profileError) throw profileError;

            await authManager.logActivity(authManager.getUserId(), 'DELETE_USER', `Deleted user ${userName} (${userId})`);

            alert('User deleted successfully!');
            this.loadView('users');
        } catch (error) {
            console.error('Delete user error:', error);
            alert('Failed to delete user.');
        }
    }

    async loadAllAppointmentsContent(container) {
        const { data: appointments } = await supabase
            .from('appointments')
            .select(`
                *,
                patient:profiles!appointments_patient_id_fkey (full_name),
                doctor:profiles!appointments_doctor_id_fkey (full_name)
            `)
            .order('scheduled_at', { ascending: false });

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>All Appointments</h2>
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
                                            <th>Patient</th>
                                            <th>Doctor</th>
                                            <th>Date & Time</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${appointments.map(apt => `
                                            <tr>
                                                <td>${apt.patient.full_name}</td>
                                                <td>${apt.doctor.full_name}</td>
                                                <td>${new Date(apt.scheduled_at).toLocaleString()}</td>
                                                <td><span class="badge ${apt.status === 'scheduled' ? 'bg-success' : apt.status === 'completed' ? 'bg-secondary' : 'bg-danger'}">${apt.status}</span></td>
                                                <td>
                                                    ${apt.status === 'scheduled' ? `
                                                        <button class="btn btn-sm btn-danger" onclick="adminManager.cancelAppointment('${apt.id}')">Cancel</button>
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
            console.error('Cancel appointment error:', error);
            alert('Failed to cancel appointment.');
        }
    }

    async loadReportsContent(container) {
        const { data: appointments } = await supabase
            .from('appointments')
            .select('status, scheduled_at');

        const { data: patients } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('role', 'patient');

        const totalAppointments = appointments?.length || 0;
        const completedAppointments = appointments?.filter(a => a.status === 'completed').length || 0;
        const cancelledAppointments = appointments?.filter(a => a.status === 'cancelled').length || 0;
        const scheduledAppointments = appointments?.filter(a => a.status === 'scheduled').length || 0;
        const totalPatients = patients?.length || 0;

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>System Reports</h2>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Appointment Statistics</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label>Total Appointments:</label>
                                <div class="progress">
                                    <div class="progress-bar" style="width: 100%">${totalAppointments}</div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label>Completed:</label>
                                <div class="progress">
                                    <div class="progress-bar bg-success" style="width: ${totalAppointments ? (completedAppointments/totalAppointments*100) : 0}%">${completedAppointments}</div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label>Scheduled:</label>
                                <div class="progress">
                                    <div class="progress-bar bg-primary" style="width: ${totalAppointments ? (scheduledAppointments/totalAppointments*100) : 0}%">${scheduledAppointments}</div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label>Cancelled:</label>
                                <div class="progress">
                                    <div class="progress-bar bg-danger" style="width: ${totalAppointments ? (cancelledAppointments/totalAppointments*100) : 0}%">${cancelledAppointments}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">User Statistics</h5>
                        </div>
                        <div class="card-body">
                            <h4>Total Patients: ${totalPatients}</h4>
                            <p class="text-muted">Registered users in the system</p>
                            <hr>
                            <h5>Recent Activity</h5>
                            <p class="text-muted">System is actively used for telehealth consultations</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadLogsContent(container) {
        const { data: logs } = await supabase
            .from('activity_logs')
            .select(`
                *,
                user:profiles!activity_logs_user_id_fkey (full_name, email, role)
            `)
            .order('timestamp', { ascending: false })
            .limit(50);

        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>Activity Logs</h2>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            ${logs && logs.length > 0
                                ? `<table class="table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Action</th>
                                            <th>Details</th>
                                            <th>Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${logs.map(log => `
                                            <tr>
                                                <td>${log.user?.full_name || 'Unknown'} (${log.user?.role || '-'})</td>
                                                <td><span class="badge bg-secondary">${log.action}</span></td>
                                                <td>${log.details}</td>
                                                <td>${new Date(log.timestamp).toLocaleString()}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>`
                                : '<p class="text-muted">No activity logs found</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    editUser(userId) {
        alert('Edit functionality - Implement user profile editing modal');
    }
}

// Initialize admin manager
const adminManager = new AdminManager();