/*
 * File: admin.js
 * Purpose: Admin portal — user management (with doctor activation), appointments,
 *          payments, reports, activity logs.
 */

class AdminManager {

    showDashboard() {
        const app     = document.getElementById('app');
        const profile = authManager.getUserProfile();

        app.innerHTML = `
            ${this._navbar(profile)}
            <div class="container mt-4" id="adminContent"></div>`;

        this._attachNavEvents();
        this._loadView('dashboard');
    }

    _navbar(profile) {
        return `
        <nav class="topnav">
            <div class="topnav-brand">
                <div class="brand-mark">TH</div>
                <span>Admin Portal</span>
            </div>
            <div class="topnav-links">
                ${['dashboard','users','appointments','payments','reports','logs'].map(v => `
                    <a href="#" class="nav-link" data-view="${v}">${this._viewLabel(v)}</a>
                `).join('')}
            </div>
            <div class="topnav-right">
                <span class="nav-user">${profile.full_name}</span>
                <button class="btn btn-sm btn-danger-outline" id="logoutBtn">Sign out</button>
            </div>
        </nav>`;
    }

    _viewLabel(v) {
        return { dashboard:'Overview', users:'Users', appointments:'Appointments',
                 payments:'Payments', reports:'Reports', logs:'Logs' }[v] || v;
    }

    _attachNavEvents() {
        document.querySelectorAll('[data-view]').forEach(el =>
            el.addEventListener('click', e => {
                e.preventDefault();
                document.querySelectorAll('[data-view]').forEach(l => l.classList.remove('active'));
                el.classList.add('active');
                this._loadView(el.dataset.view);
            })
        );
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            await authManager.logout();
        });
    }

    _loadView(view) {
        const el = document.getElementById('adminContent');
        if (!el) return;
        const map = {
            dashboard:    () => this._dashboard(el),
            users:        () => this._users(el),
            appointments: () => this._appointments(el),
            payments:     () => this._payments(el),
            reports:      () => this._reports(el),
            logs:         () => this._logs(el),
        };
        (map[view] || map.dashboard)();
    }

    // ── DASHBOARD ─────────────────────────────────────────────────────────
    async _dashboard(el) {
        const [{ count: patients }, { count: doctors }, { count: appts },
               { count: pendingDoctors }, { data: revenue }] = await Promise.all([
            supabase.from('profiles').select('id',{count:'exact',head:true}).eq('role','patient'),
            supabase.from('profiles').select('id',{count:'exact',head:true}).eq('role','doctor').eq('is_active',true),
            supabase.from('appointments').select('id',{count:'exact',head:true}),
            supabase.from('profiles').select('id',{count:'exact',head:true}).eq('role','doctor').eq('is_active',false),
            supabase.from('payments').select('amount').eq('status','paid'),
        ]);

        const totalRevenue = (revenue||[]).reduce((s,p) => s + Number(p.amount), 0);

        el.innerHTML = `
            <div class="page-header">
                <h2>System Overview</h2>
                <p class="text-muted">Live snapshot of platform activity</p>
            </div>
            ${pendingDoctors > 0 ? `
                <div class="alert alert-warning" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <span>⚠️ <strong>${pendingDoctors}</strong> doctor${pendingDoctors>1?'s':''} awaiting activation</span>
                    <button class="btn btn-sm btn-primary" onclick="adminManager._loadView('users');document.querySelector('[data-view=users]')?.click()">Review now</button>
                </div>` : ''}
            <div class="stats-grid">
                ${this._stat('Active Patients', patients||0, 'accent')}
                ${this._stat('Active Doctors', doctors||0, '')}
                ${this._stat('Pending Activation', pendingDoctors||0, 'warning')}
                ${this._stat('Total Appointments', appts||0, '')}
                ${this._stat('Revenue Collected', 'KES ' + (totalRevenue).toLocaleString(), 'success')}
            </div>
            <div class="card mt-4">
                <div class="card-header"><h3>Quick Actions</h3></div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;padding:4px">
                    ${['users','appointments','payments','reports','logs'].map(v => `
                        <button class="btn btn-secondary" onclick="adminManager._loadView('${v}')">
                            ${this._viewLabel(v)}
                        </button>`).join('')}
                </div>
            </div>`;
    }

    _stat(label, value, cls='') {
        return `<div class="stat-card">
            <div class="stat-label">${label}</div>
            <div class="stat-value ${cls ? 'stat-'+cls : ''}">${value}</div>
        </div>`;
    }

    // ── USERS (with doctor activation) ────────────────────────────────────
    async _users(el) {
        const { data: users } = await supabase
            .from('profiles')
            .select('id,full_name,email,role,specialty,is_active,created_at')
            .order('created_at',{ascending:false});

        const byRole = r => (users||[]).filter(u => u.role === r);
        const doctors  = byRole('doctor');
        const patients = byRole('patient');
        const admins   = byRole('admin');

        el.innerHTML = `
            <div class="page-header">
                <h2>Manage Users</h2>
                <p class="text-muted">Activate doctors, disable or delete accounts.</p>
            </div>

            <div class="card mb-4">
                <div class="card-header">
                    <h3>Doctors (${doctors.length})</h3>
                    <span class="badge-warning">${doctors.filter(d=>!d.is_active).length} pending</span>
                </div>
                ${this._userTable(doctors, true)}
            </div>

            <div class="card mb-4">
                <div class="card-header"><h3>Patients (${patients.length})</h3></div>
                ${this._userTable(patients, false)}
            </div>

            <div class="card">
                <div class="card-header"><h3>Administrators (${admins.length})</h3></div>
                ${this._userTable(admins, false, true)}
            </div>

            <div class="alert alert-info mt-4">
                <strong>Note:</strong> New admin accounts must be created directly in the
                Supabase dashboard (Authentication → Add user) with role = 'admin' in the metadata.
                Patients and doctors can self-register from the login page.
            </div>`;
    }

    _userTable(users, showSpecialty, isAdmin=false) {
        if (!users.length) return '<p class="text-muted" style="padding:16px">None yet.</p>';
        return `
        <div class="table-wrap">
            <table class="dt">
                <thead><tr>
                    <th>Name</th><th>Email</th>
                    ${showSpecialty ? '<th>Specialty</th>' : ''}
                    <th>Status</th><th>Joined</th><th></th>
                </tr></thead>
                <tbody>
                    ${users.map(u => `
                    <tr>
                        <td class="fw-600">${u.full_name}</td>
                        <td>${u.email}</td>
                        ${showSpecialty ? `<td>${u.specialty||'—'}</td>` : ''}
                        <td><span class="pill pill-${u.is_active?'active':'disabled'}">${u.is_active?'Active':'Pending / Disabled'}</span></td>
                        <td>${new Date(u.created_at).toLocaleDateString()}</td>
                        <td style="white-space:nowrap">
                            ${!isAdmin ? `
                                <button class="btn btn-sm btn-secondary"
                                    onclick="adminManager._toggleActive('${u.id}',${u.is_active})">
                                    ${u.is_active ? 'Disable' : 'Activate'}
                                </button>
                                <button class="btn btn-sm btn-danger"
                                    onclick="adminManager._deleteUser('${u.id}','${u.full_name}')">
                                    Delete
                                </button>
                            ` : '<span class="text-muted text-sm">—</span>'}
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    }

    async _toggleActive(userId, currentlyActive) {
        const newState = !currentlyActive;
        const action   = newState ? 'activate' : 'disable';
        if (!confirm(`${action.charAt(0).toUpperCase()+action.slice(1)} this account?`)) return;

        const { error } = await supabase
            .from('profiles').update({ is_active: newState }).eq('id', userId);
        if (error) { alert('Error: ' + error.message); return; }

        await authManager.logActivity(authManager.getUserId(), `admin_${action}_user`, { targetId: userId });
        this._users(document.getElementById('adminContent'));
    }

    async _deleteUser(userId, name) {
        if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return;

        // Delete the profile row; the `on delete cascade` on auth.users will clean up
        // related records. The actual auth login can only be removed from the Supabase
        // dashboard (Authentication → Users) since deleting from auth.users requires
        // the service_role key which must not appear in client-side code.
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) { alert('Error: ' + error.message); return; }

        await authManager.logActivity(authManager.getUserId(), 'admin_delete_user', { targetId: userId, name });
        alert(`${name} has been removed. To fully delete their login, go to Supabase → Authentication → Users.`);
        this._users(document.getElementById('adminContent'));
    }

    // ── ALL APPOINTMENTS ──────────────────────────────────────────────────
    async _appointments(el) {
        const { data: apts } = await supabase
            .from('appointments')
            .select('id,scheduled_at,status,appointment_type,reason,patient:patient_id(full_name),doctor:doctor_id(full_name)')
            .order('scheduled_at',{ascending:false});

        el.innerHTML = `
            <div class="page-header"><h2>All Appointments</h2></div>
            <div class="card">
                <div class="table-wrap">
                    <table class="dt">
                        <thead><tr>
                            <th>Patient</th><th>Doctor</th><th>Type</th>
                            <th>Date &amp; Time</th><th>Status</th><th></th>
                        </tr></thead>
                        <tbody>
                        ${(apts||[]).map(a => `
                            <tr>
                                <td class="fw-600">${a.patient?.full_name||'—'}</td>
                                <td>${a.doctor?.full_name||'—'}</td>
                                <td>${(a.appointment_type||'general').replace('_',' ')}</td>
                                <td>${new Date(a.scheduled_at).toLocaleString()}</td>
                                <td><span class="pill pill-${a.status}">${a.status.replace('_',' ')}</span></td>
                                <td>
                                    ${a.status==='scheduled'||a.status==='pending_payment' ? `
                                        <button class="btn btn-sm btn-danger"
                                            onclick="adminManager._cancelApt('${a.id}')">Cancel</button>` : '—'}
                                </td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    async _cancelApt(id) {
        if (!confirm('Cancel this appointment?')) return;
        await supabase.from('appointments').update({status:'cancelled'}).eq('id',id);
        await authManager.logActivity(authManager.getUserId(), 'admin_cancel_appointment', {appointmentId:id});
        this._appointments(document.getElementById('adminContent'));
    }

    // ── ALL PAYMENTS ──────────────────────────────────────────────────────
    async _payments(el) {
        const { data: payments } = await supabase
            .from('payments')
            .select('id,amount,currency,status,payment_method,paid_at,created_at,patient:patient_id(full_name),doctor:doctor_id(full_name)')
            .order('created_at',{ascending:false});

        const total    = (payments||[]).filter(p=>p.status==='paid').reduce((s,p)=>s+Number(p.amount),0);
        const pending  = (payments||[]).filter(p=>p.status==='pending').length;
        const refunded = (payments||[]).filter(p=>p.status==='refunded').reduce((s,p)=>s+Number(p.amount),0);

        el.innerHTML = `
            <div class="page-header"><h2>Payments</h2></div>
            <div class="stats-grid" style="margin-bottom:20px">
                ${this._stat('Total Collected','KES '+total.toLocaleString(),'success')}
                ${this._stat('Pending',pending,'')}
                ${this._stat('Refunded','KES '+refunded.toLocaleString(),'')}
            </div>
            <div class="card">
                <div class="table-wrap">
                    <table class="dt">
                        <thead><tr>
                            <th>Patient</th><th>Doctor</th><th>Amount</th>
                            <th>Method</th><th>Status</th><th>Date</th>
                        </tr></thead>
                        <tbody>
                        ${(payments||[]).map(p => `
                            <tr>
                                <td class="fw-600">${p.patient?.full_name||'—'}</td>
                                <td>${p.doctor?.full_name||'—'}</td>
                                <td>${p.currency} ${Number(p.amount).toLocaleString()}</td>
                                <td style="text-transform:capitalize">${p.payment_method||'—'}</td>
                                <td><span class="pill pill-${p.status}">${p.status}</span></td>
                                <td>${p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    // ── REPORTS ───────────────────────────────────────────────────────────
    async _reports(el) {
        const [{ data: apts }, { data: patients }, { data: doctors }] = await Promise.all([
            supabase.from('appointments').select('status,scheduled_at,appointment_type'),
            supabase.from('profiles').select('gender,date_of_birth').eq('role','patient'),
            supabase.from('profiles').select('specialty').eq('role','doctor'),
        ]);

        const total = apts?.length || 0;
        const counts = { scheduled:0, completed:0, cancelled:0, pending_payment:0, no_show:0 };
        (apts||[]).forEach(a => { if (counts[a.status]!==undefined) counts[a.status]++; });

        const typeCounts = {};
        (apts||[]).forEach(a => { typeCounts[a.appointment_type||'general'] = (typeCounts[a.appointment_type||'general']||0)+1; });

        const specialtyCounts = {};
        (doctors||[]).forEach(d => { const s=d.specialty||'Not specified'; specialtyCounts[s]=(specialtyCounts[s]||0)+1; });

        const genderCounts = {};
        (patients||[]).forEach(p => { const g=p.gender||'Not specified'; genderCounts[g]=(genderCounts[g]||0)+1; });

        const bar = (label, count, tot, color='var(--primary)') => {
            const pct = tot > 0 ? Math.round(count/tot*100) : 0;
            return `<div style="margin-bottom:14px">
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
                    <span>${label}</span><span class="text-muted">${count} (${pct}%)</span>
                </div>
                <div style="background:var(--bg);border-radius:999px;height:8px;overflow:hidden">
                    <div style="width:${pct}%;background:${color};height:100%;border-radius:999px"></div>
                </div>
            </div>`;
        };

        el.innerHTML = `
            <div class="page-header"><h2>Reports &amp; Analytics</h2></div>
            <div class="grid grid-2">
                <div class="card">
                    <h3>Appointment Status</h3>
                    ${bar('Scheduled',    counts.scheduled,    total,'var(--primary)')}
                    ${bar('Completed',    counts.completed,    total,'var(--success)')}
                    ${bar('Cancelled',    counts.cancelled,    total,'var(--danger)')}
                    ${bar('No-show',      counts.no_show,      total,'var(--warning)')}
                    ${bar('Pending Pay.', counts.pending_payment, total,'#f59e0b')}
                </div>
                <div class="card">
                    <h3>Appointment Types</h3>
                    ${Object.entries(typeCounts).map(([l,c])=>bar(l.replace('_',' '),c,total)).join('')}
                </div>
                <div class="card">
                    <h3>Doctor Specialties</h3>
                    ${Object.entries(specialtyCounts).map(([l,c])=>bar(l,c,doctors?.length||1)).join('')}
                </div>
                <div class="card">
                    <h3>Patient Gender</h3>
                    ${Object.entries(genderCounts).map(([l,c])=>bar(l,c,patients?.length||1,'var(--success)')).join('')}
                </div>
            </div>`;
    }

    // ── ACTIVITY LOGS ─────────────────────────────────────────────────────
    async _logs(el) {
        const { data: logs } = await supabase
            .from('activity_logs')
            .select('id,action,details,created_at,user:user_id(full_name,role)')
            .order('created_at',{ascending:false})
            .limit(100);

        const ACTION_LABELS = {
            login:'Logged in', logout:'Logged out', register:'Registered',
            appointment_booked:'Booked appointment', payment_completed:'Payment completed',
            admin_activate_user:'Activated user', admin_disable_user:'Disabled user',
            admin_delete_user:'Deleted user', admin_cancel_appointment:'Cancelled appointment',
        };

        el.innerHTML = `
            <div class="page-header">
                <h2>Activity Logs</h2>
                <p class="text-muted">Last 100 events</p>
            </div>
            <div class="card">
                <div class="table-wrap">
                    <table class="dt">
                        <thead><tr><th>User</th><th>Role</th><th>Action</th><th>Date &amp; Time</th></tr></thead>
                        <tbody>
                        ${(logs||[]).map(l => `
                            <tr>
                                <td class="fw-600">${l.user?.full_name||'Unknown'}</td>
                                <td style="text-transform:capitalize">${l.user?.role||'—'}</td>
                                <td>${ACTION_LABELS[l.action]||l.action}</td>
                                <td>${new Date(l.created_at).toLocaleString()}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }
}

const adminManager = new AdminManager();
window.adminManager = adminManager;
console.log('✅ AdminManager loaded');