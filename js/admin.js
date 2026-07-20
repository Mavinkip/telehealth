/*
 * File: admin.js
 * Purpose: Admin portal - user management, appointments, payments, reports, logs
 */

class AdminManager {

    async _dashboard(el) {
        const [{ count: patients }, { count: activeDoctors }, { data: allDoctors }, { count: appts },
               { data: revenue }] = await Promise.all([
            supabase.from('profiles').select('id',{count:'exact',head:true}).eq('role','patient'),
            supabase.from('profiles').select('id',{count:'exact',head:true}).eq('role','doctor').eq('is_active',true),
            supabase.from('profiles').select('id,is_active').eq('role','doctor'),
            supabase.from('appointments').select('id',{count:'exact',head:true}),
            supabase.from('payments').select('amount').eq('status','paid'),
        ]);

        const pendingDoctors = allDoctors ? allDoctors.filter(d => !d.is_active).length : 0;
        const totalRevenue = (revenue||[]).reduce((s,p) => s + Number(p.amount), 0);

        el.innerHTML = `
            <div class="page-header">
                <h2>System Overview</h2>
                <p class="text-muted">Live snapshot of platform activity</p>
            </div>
            ${pendingDoctors > 0 ? `
                <div class="alert alert-warning">
                    <span><strong>${pendingDoctors}</strong> doctor${pendingDoctors>1?'s':''} awaiting activation</span>
                    <button class="btn btn-sm btn-primary" onclick="app.loadView('users')">Review now</button>
                </div>` : `
                <div class="alert alert-success">All doctors are activated</div>`}
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-label">Active Patients</div><div class="stat-value accent">${patients||0}</div></div>
                <div class="stat-card"><div class="stat-label">Active Doctors</div><div class="stat-value">${activeDoctors||0}</div></div>
                <div class="stat-card"><div class="stat-label">Pending Activation</div><div class="stat-value warning">${pendingDoctors||0}</div></div>
                <div class="stat-card"><div class="stat-label">Total Appointments</div><div class="stat-value">${appts||0}</div></div>
                <div class="stat-card"><div class="stat-label">Revenue Collected</div><div class="stat-value success">KES ${(totalRevenue).toLocaleString()}</div></div>
            </div>
            <div class="card mt-4">
                <div class="card-header"><span class="card-title">Quick Actions</span></div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;padding:4px 0;">
                    ${['users','appointments','payments','reports','logs'].map(v => `
                        <button class="btn btn-secondary" onclick="app.loadView('${v}')">
                            ${this._viewLabel(v)}
                        </button>`).join('')}
                </div>
            </div>`;
    }

    _viewLabel(v) {
        return { dashboard:'Overview', users:'Users', appointments:'Appointments',
                 payments:'Payments', reports:'Reports', logs:'Logs' }[v] || v;
    }

    async _users(el) {
        const { data: users } = await supabase
            .from('profiles')
            .select('id,full_name,email,role,specialty,is_active,created_at,phone')
            .order('created_at',{ascending:false});

        const byRole = r => (users||[]).filter(u => u.role === r);
        const doctors = byRole('doctor');
        const patients = byRole('patient');
        const admins = byRole('admin');
        const pendingDoctors = doctors.filter(d => !d.is_active);
        const activeDoctors = doctors.filter(d => d.is_active);

        el.innerHTML = `
            <div class="page-header">
                <h2>Manage Users</h2>
                <p class="text-muted">Activate doctors, disable or delete accounts.</p>
            </div>
            <div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr));">
                <div class="stat-card"><div class="stat-label">Total Doctors</div><div class="stat-value accent">${doctors.length}</div></div>
                <div class="stat-card"><div class="stat-label">Active</div><div class="stat-value success">${activeDoctors.length}</div></div>
                <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value warning">${pendingDoctors.length}</div></div>
                <div class="stat-card"><div class="stat-label">Patients</div><div class="stat-value">${patients.length}</div></div>
            </div>

            ${pendingDoctors.length > 0 ? `
            <div class="card mb-4" style="border:2px solid #FCD34D;background:#FFFBEB;">
                <div class="card-header" style="background:#FEF3C7;">
                    <span class="card-title">Pending Activation (${pendingDoctors.length})</span>
                    <span style="font-size:0.8rem;color:#92400E;">Click "Activate" to approve</span>
                </div>
                ${this._userTable(pendingDoctors, true, true)}
            </div>` : `
            <div class="alert alert-success">All doctors are activated! No pending approvals.</div>`}

            <div class="card mb-4">
                <div class="card-header"><span class="card-title">Active Doctors (${activeDoctors.length})</span></div>
                ${this._userTable(activeDoctors, true)}
            </div>

            <div class="card mb-4">
                <div class="card-header"><span class="card-title">Patients (${patients.length})</span></div>
                ${this._userTable(patients, false)}
            </div>

            <div class="card">
                <div class="card-header"><span class="card-title">Administrators (${admins.length})</span></div>
                ${this._userTable(admins, false, false, true)}
            </div>

            <div class="alert alert-info mt-4">
                <strong>Note:</strong> New admin accounts must be created directly in the Supabase dashboard.
            </div>`;
    }

    _userTable(users, showSpecialty, isPending=false, isAdmin=false) {
        if (!users.length) return `<p class="text-muted" style="padding:16px;">None yet.</p>`;
        
        return `
        <div class="table-wrap">
            <table>
                <thead><tr>
                    <th>Name</th>
                    <th>Email</th>
                    ${showSpecialty ? '<th>Specialty</th>' : ''}
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                </tr></thead>
                <tbody>
                    ${users.map(u => `
                    <tr style="${isPending ? 'background:#FFFBEB;' : ''}">
                        <td><strong>${u.full_name}</strong></td>
                        <td>${u.email}</td>
                        ${showSpecialty ? `<td>${u.specialty||'—'}</td>` : ''}
                        <td><span class="pill ${u.is_active ? 'pill-active' : 'pill-disabled'}">${u.is_active ? 'Active' : 'Pending'}</span></td>
                        <td>${new Date(u.created_at).toLocaleDateString()}</td>
                        <td style="white-space:nowrap;">
                            ${!isAdmin ? `
                                ${!u.is_active ? `
                                    <button class="btn btn-sm btn-success" onclick="adminManager._toggleActive('${u.id}',false)">Activate</button>
                                ` : `
                                    <button class="btn btn-sm btn-secondary" onclick="adminManager._toggleActive('${u.id}',true)">Disable</button>
                                `}
                                <button class="btn btn-sm btn-danger" onclick="adminManager._deleteUser('${u.id}','${u.full_name}')">Delete</button>
                            ` : '<span class="text-muted">—</span>'}
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    }

    async _toggleActive(userId, currentlyActive) {
        const newState = !currentlyActive;
        if (!confirm(newState ? 'Activate this doctor?' : 'Disable this account?')) return;

        try {
            await supabase.from('profiles').update({ is_active: newState }).eq('id', userId);
            alert(newState ? 'Doctor activated!' : 'Account disabled.');
            app.loadView('users');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async _deleteUser(userId, name) {
        if (!confirm(`Permanently delete ${name}?`)) return;

        try {
            await supabase.from('profiles').delete().eq('id', userId);
            alert(`${name} has been removed.`);
            app.loadView('users');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async _appointments(el) {
        const { data: apts } = await supabase
            .from('appointments')
            .select('id,scheduled_at,status,consultation_type,notes,patient:patient_id(full_name,email),doctor:doctor_id(full_name,specialty)')
            .order('scheduled_at',{ascending:false});

        el.innerHTML = `
            <div class="page-header"><h2>All Appointments</h2></div>
            <div class="card">
                <div class="table-wrap">
                    <table>
                        <thead><tr>
                            <th>Patient</th>
                            <th>Doctor</th>
                            <th>Type</th>
                            <th>Date &amp; Time</th>
                            <th>Status</th>
                            <th></th>
                        </tr></thead>
                        <tbody>
                        ${(apts||[]).map(a => `
                            <tr>
                                <td><strong>${a.patient?.full_name||'—'}</strong></td>
                                <td>${a.doctor?.full_name||'—'}</td>
                                <td><span class="pill" style="background:var(--primary-light);color:var(--primary);">${a.consultation_type||'video'}</span></td>
                                <td>${new Date(a.scheduled_at).toLocaleString()}</td>
                                <td><span class="pill pill-${a.status}">${a.status}</span></td>
                                <td>${a.status==='scheduled' ? `<button class="btn btn-sm btn-danger" onclick="adminManager._cancelApt('${a.id}')">Cancel</button>` : '—'}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    async _cancelApt(id) {
        if (!confirm('Cancel this appointment?')) return;
        await supabase.from('appointments').update({status:'cancelled'}).eq('id',id);
        app.loadView('appointments');
    }

    async _payments(el) {
        const { data: payments } = await supabase
            .from('payments')
            .select('id,amount,currency,status,payment_method,paid_at,created_at,patient:patient_id(full_name),doctor:doctor_id(full_name)')
            .order('created_at',{ascending:false});

        const total = (payments||[]).filter(p=>p.status==='paid').reduce((s,p)=>s+Number(p.amount),0);
        const pending = (payments||[]).filter(p=>p.status==='pending').length;

        el.innerHTML = `
            <div class="page-header"><h2>Payments</h2></div>
            <div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));">
                <div class="stat-card"><div class="stat-label">Total Collected</div><div class="stat-value success">KES ${total.toLocaleString()}</div></div>
                <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value warning">${pending}</div></div>
            </div>
            <div class="card">
                <div class="table-wrap">
                    <table>
                        <thead><tr>
                            <th>Patient</th>
                            <th>Doctor</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr></thead>
                        <tbody>
                        ${(payments||[]).map(p => `
                            <tr>
                                <td><strong>${p.patient?.full_name||'—'}</strong></td>
                                <td>${p.doctor?.full_name||'—'}</td>
                                <td>${p.currency} ${Number(p.amount).toLocaleString()}</td>
                                <td>${p.payment_method||'—'}</td>
                                <td><span class="pill pill-${p.status}">${p.status}</span></td>
                                <td>${p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    async _reports(el) {
        const [{ data: apts }, { data: patients }, { data: doctors }] = await Promise.all([
            supabase.from('appointments').select('status,scheduled_at,consultation_type'),
            supabase.from('profiles').select('gender').eq('role','patient'),
            supabase.from('profiles').select('specialty,is_active').eq('role','doctor'),
        ]);

        const total = apts?.length || 0;
        const counts = { scheduled:0, completed:0, cancelled:0 };
        (apts||[]).forEach(a => { if (counts[a.status]!==undefined) counts[a.status]++; });

        const typeCounts = {};
        (apts||[]).forEach(a => { typeCounts[a.consultation_type||'video'] = (typeCounts[a.consultation_type||'video']||0)+1; });

        const specialtyCounts = {};
        (doctors||[]).forEach(d => { if (d.is_active) { const s=d.specialty||'General'; specialtyCounts[s]=(specialtyCounts[s]||0)+1; } });

        const genderCounts = {};
        (patients||[]).forEach(p => { const g=p.gender||'Not specified'; genderCounts[g]=(genderCounts[g]||0)+1; });

        const bar = (label, count, tot, color) => {
            const pct = tot > 0 ? Math.round(count/tot*100) : 0;
            return `<div style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;font-size:13px;">
                    <span>${label}</span><span class="text-muted">${count} (${pct}%)</span>
                </div>
                <div style="background:var(--background);border-radius:999px;height:6px;overflow:hidden;">
                    <div style="width:${pct}%;background:${color};height:100%;border-radius:999px;"></div>
                </div>
            </div>`;
        };

        el.innerHTML = `
            <div class="page-header"><h2>Reports &amp; Analytics</h2></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;">
                <div class="card"><h4 style="font-size:1rem;margin-bottom:16px;">Appointment Status</h4>
                    ${bar('Scheduled', counts.scheduled, total, 'var(--primary)')}
                    ${bar('Completed', counts.completed, total, 'var(--success)')}
                    ${bar('Cancelled', counts.cancelled, total, 'var(--danger)')}
                </div>
                <div class="card"><h4 style="font-size:1rem;margin-bottom:16px;">Appointment Types</h4>
                    ${Object.entries(typeCounts).map(([l,c])=>bar(l,c,total,'var(--info)')).join('')}
                </div>
                <div class="card"><h4 style="font-size:1rem;margin-bottom:16px;">Doctor Specialties</h4>
                    ${Object.entries(specialtyCounts).length > 0 ? Object.entries(specialtyCounts).map(([l,c])=>bar(l,c,doctors?.filter(d=>d.is_active).length||1,'var(--primary)')).join('') : '<p class="text-muted">No active doctors</p>'}
                </div>
                <div class="card"><h4 style="font-size:1rem;margin-bottom:16px;">Patient Gender</h4>
                    ${Object.entries(genderCounts).map(([l,c])=>bar(l,c,patients?.length||1,'var(--success)')).join('')}
                </div>
            </div>`;
    }

    async _logs(el) {
        const { data: logs } = await supabase
            .from('activity_logs')
            .select('id,action,details,created_at,user:user_id(full_name,role)')
            .order('created_at',{ascending:false})
            .limit(100);

        const ACTION_LABELS = {
            login:'Logged in', logout:'Logged out', register:'Registered',
            appointment_booked:'Booked appointment',
            admin_activate_user:'Activated user', admin_disable_user:'Disabled user',
            admin_delete_user:'Deleted user', admin_cancel_appointment:'Cancelled appointment'
        };

        el.innerHTML = `
            <div class="page-header"><h2>Activity Logs</h2><p class="text-muted">Last 100 events</p></div>
            <div class="card">
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>User</th><th>Role</th><th>Action</th><th>Date &amp; Time</th></tr></thead>
                        <tbody>
                        ${(logs||[]).map(l => `
                            <tr>
                                <td><strong>${l.user?.full_name||'Unknown'}</strong></td>
                                <td>${l.user?.role||'—'}</td>
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
console.log('AdminManager loaded');