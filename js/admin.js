/*
 * File: admin.js
 * Purpose: Admin portal — user management (with doctor activation), appointments,
 *          payments, reports, activity logs.
 */

class AdminManager {

    constructor() {
        this.currentView = 'dashboard';
    }

    // ── DASHBOARD ─────────────────────────────────────────────────────────
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
                <div class="alert alert-warning" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding:16px 20px;border-radius:12px;background:#FEF3C7;border:1px solid #FCD34D;">
                    <span>⚠️ <strong>${pendingDoctors}</strong> doctor${pendingDoctors>1?'s':''} awaiting activation</span>
                    <button class="btn btn-sm btn-primary" onclick="app.loadView('users')">
                        Review now
                    </button>
                </div>` : `
                <div class="alert alert-success" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding:16px 20px;border-radius:12px;background:#DCFCE7;border:1px solid #86EFAC;">
                    <span>✅ All doctors are activated</span>
                </div>`}
            <div class="stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;">
                ${this._stat('Active Patients', patients||0, 'accent')}
                ${this._stat('Active Doctors', activeDoctors||0, '')}
                ${this._stat('Pending Activation', pendingDoctors||0, 'warning')}
                ${this._stat('Total Appointments', appts||0, '')}
                ${this._stat('Revenue Collected', 'KES ' + (totalRevenue).toLocaleString(), 'success')}
            </div>
            <div class="card mt-4">
                <div class="card-header"><h3>Quick Actions</h3></div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;padding:16px;">
                    ${['users','appointments','payments','reports','logs'].map(v => `
                        <button class="btn btn-secondary" onclick="app.loadView('${v}')">
                            ${this._viewLabel(v)}
                        </button>`).join('')}
                </div>
            </div>`;
    }

    _stat(label, value, cls='') {
        return `<div class="stat-card" style="background:white;border-radius:16px;padding:20px;text-align:center;border:1px solid var(--border);">
            <div class="stat-label" style="font-size:0.85rem;color:var(--text-light);">${label}</div>
            <div class="stat-value ${cls ? 'stat-'+cls : ''}" style="font-size:2rem;font-weight:700;color:var(--text);">${value}</div>
        </div>`;
    }

    _viewLabel(v) {
        return { dashboard:'Overview', users:'Users', appointments:'Appointments',
                 payments:'Payments', reports:'Reports', logs:'Logs' }[v] || v;
    }

    // ── USERS (with doctor activation - ALL DOCTORS SHOW) ────────────────
    async _users(el) {
        const { data: users } = await supabase
            .from('profiles')
            .select('id,full_name,email,role,specialty,is_active,created_at,phone')
            .order('created_at',{ascending:false});

        const byRole = r => (users||[]).filter(u => u.role === r);
        const doctors  = byRole('doctor');
        const patients = byRole('patient');
        const admins   = byRole('admin');

        const pendingDoctors = doctors.filter(d => !d.is_active);
        const activeDoctors = doctors.filter(d => d.is_active);

        el.innerHTML = `
            <div class="page-header">
                <h2>Manage Users</h2>
                <p class="text-muted">Activate doctors, disable or delete accounts.</p>
            </div>

            <!-- Summary Stats -->
            <div class="stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px;">
                <div class="stat-card" style="background:white;border-radius:12px;padding:16px;text-align:center;border:1px solid var(--border);">
                    <div style="font-size:1.5rem;font-weight:700;color:var(--primary);">${doctors.length}</div>
                    <div style="font-size:0.8rem;color:var(--text-light);">Total Doctors</div>
                </div>
                <div class="stat-card" style="background:white;border-radius:12px;padding:16px;text-align:center;border:1px solid var(--border);">
                    <div style="font-size:1.5rem;font-weight:700;color:var(--success);">${activeDoctors.length}</div>
                    <div style="font-size:0.8rem;color:var(--text-light);">Active</div>
                </div>
                <div class="stat-card" style="background:white;border-radius:12px;padding:16px;text-align:center;border:1px solid var(--border);">
                    <div style="font-size:1.5rem;font-weight:700;color:var(--warning);">${pendingDoctors.length}</div>
                    <div style="font-size:0.8rem;color:var(--text-light);">Pending</div>
                </div>
                <div class="stat-card" style="background:white;border-radius:12px;padding:16px;text-align:center;border:1px solid var(--border);">
                    <div style="font-size:1.5rem;font-weight:700;color:var(--info);">${patients.length}</div>
                    <div style="font-size:0.8rem;color:var(--text-light);">Patients</div>
                </div>
            </div>

            <!-- Pending Doctors - Prominent Section -->
            ${pendingDoctors.length > 0 ? `
            <div class="card mb-4" style="border:2px solid #FCD34D;background:#FFFBEB;">
                <div class="card-header" style="background:#FEF3C7;">
                    <h3 style="display:flex;align-items:center;gap:10px;font-size:1.1rem;margin:0;">
                        ⏳ Pending Activation (${pendingDoctors.length})
                        <span style="font-size:0.8rem;font-weight:400;color:#92400E;">Click "Activate" to approve doctors</span>
                    </h3>
                </div>
                ${this._userTable(pendingDoctors, true, false, true)}
            </div>` : `
            <div class="alert alert-success mb-4" style="padding:12px 16px;border-radius:12px;background:#DCFCE7;border:1px solid #86EFAC;">
                ✅ All doctors are activated! No pending approvals.
            </div>`}

            <!-- Active Doctors -->
            <div class="card mb-4">
                <div class="card-header">
                    <h3 style="font-size:1.1rem;margin:0;">Active Doctors (${activeDoctors.length})</h3>
                </div>
                ${this._userTable(activeDoctors, true)}
            </div>

            <!-- Patients -->
            <div class="card mb-4">
                <div class="card-header"><h3 style="font-size:1.1rem;margin:0;">Patients (${patients.length})</h3></div>
                ${this._userTable(patients, false)}
            </div>

            <!-- Administrators -->
            <div class="card">
                <div class="card-header"><h3 style="font-size:1.1rem;margin:0;">Administrators (${admins.length})</h3></div>
                ${this._userTable(admins, false, true)}
            </div>

            <div class="alert alert-info mt-4" style="padding:12px 16px;border-radius:12px;background:#DBEAFE;border:1px solid #93C5FD;">
                <strong>Note:</strong> New admin accounts must be created directly in the
                Supabase dashboard (Authentication → Add user) with role = 'admin' in the metadata.
                Patients and doctors can self-register from the login page.
            </div>`;
    }

    _userTable(users, showSpecialty, isAdmin=false, isPending=false) {
        if (!users.length) {
            return `<p class="text-muted" style="padding:16px;">None yet.</p>`;
        }
        
        return `
        <div class="table-wrap" style="overflow-x:auto;">
            <table class="dt" style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                <thead>
                    <tr style="background:var(--primary);color:white;">
                        <th style="padding:12px 16px;text-align:left;">Name</th>
                        <th style="padding:12px 16px;text-align:left;">Email</th>
                        ${showSpecialty ? '<th style="padding:12px 16px;text-align:left;">Specialty</th>' : ''}
                        <th style="padding:12px 16px;text-align:left;">Status</th>
                        <th style="padding:12px 16px;text-align:left;">Joined</th>
                        <th style="padding:12px 16px;text-align:left;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => `
                    <tr style="${isPending ? 'background:#FFFBEB;' : ''}border-bottom:1px solid var(--border);">
                        <td style="padding:12px 16px;font-weight:600;">${u.full_name} ${isPending ? '⭐' : ''}</td>
                        <td style="padding:12px 16px;">${u.email}</td>
                        ${showSpecialty ? `<td style="padding:12px 16px;">${u.specialty||'—'}</td>` : ''}
                        <td style="padding:12px 16px;">
                            <span class="pill" style="display:inline-block;padding:4px 12px;border-radius:50px;font-size:0.75rem;font-weight:600;${u.is_active ? 'background:#DCFCE7;color:#16A34A;' : 'background:#FEE2E2;color:#DC2626;'}">
                                ${u.is_active ? '✅ Active' : '⏳ Pending'}
                            </span>
                        </td>
                        <td style="padding:12px 16px;">${new Date(u.created_at).toLocaleDateString()}</td>
                        <td style="padding:12px 16px;white-space:nowrap;">
                            ${!isAdmin ? `
                                ${!u.is_active ? `
                                    <button class="btn btn-sm btn-success" style="background:#16A34A;color:white;border:none;padding:6px 14px;border-radius:8px;font-weight:600;cursor:pointer;"
                                        onclick="adminManager._toggleActive('${u.id}',false)">
                                        ✅ Activate
                                    </button>
                                ` : `
                                    <button class="btn btn-sm btn-secondary" style="background:#E2E8F0;color:#475569;border:none;padding:6px 14px;border-radius:8px;font-weight:600;cursor:pointer;"
                                        onclick="adminManager._toggleActive('${u.id}',true)">
                                        ⛔ Disable
                                    </button>
                                `}
                                <button class="btn btn-sm btn-danger" style="background:#DC2626;color:white;border:none;padding:6px 14px;border-radius:8px;font-weight:600;cursor:pointer;"
                                    onclick="adminManager._deleteUser('${u.id}','${u.full_name}')">
                                    🗑️ Delete
                                </button>
                            ` : '<span class="text-muted" style="font-size:0.85rem;">—</span>'}
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    }

    async _toggleActive(userId, currentlyActive) {
        const newState = !currentlyActive;
        const action   = newState ? 'activate' : 'disable';
        const confirmMsg = newState ? 
            'Activate this doctor? They will be able to see patients and book appointments.' :
            'Disable this account? The user will not be able to log in.';
            
        if (!confirm(confirmMsg)) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_active: newState })
                .eq('id', userId);
                
            if (error) throw error;

            await authManager.logActivity(authManager.getUserId(), `admin_${action}_user`, { targetId: userId });
            
            alert(newState ? '✅ Doctor activated successfully!' : '⛔ Account disabled.');
            
            // Refresh the users view
            app.loadView('users');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async _deleteUser(userId, name) {
        if (!confirm(`⚠️ Permanently delete ${name}? This cannot be undone.`)) return;

        try {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) throw error;

            await authManager.logActivity(authManager.getUserId(), 'admin_delete_user', { targetId: userId, name });
            alert(`${name} has been removed.`);
            app.loadView('users');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    // ── ALL APPOINTMENTS ──────────────────────────────────────────────────
    async _appointments(el) {
        const { data: apts } = await supabase
            .from('appointments')
            .select('id,scheduled_at,status,consultation_type,notes,patient:patient_id(full_name,email),doctor:doctor_id(full_name,specialty)')
            .order('scheduled_at',{ascending:false});

        el.innerHTML = `
            <div class="page-header">
                <h2>All Appointments</h2>
            </div>
            <div class="card">
                <div class="table-wrap" style="overflow-x:auto;">
                    <table class="dt" style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <thead>
                            <tr style="background:var(--primary);color:white;">
                                <th style="padding:12px 16px;text-align:left;">Patient</th>
                                <th style="padding:12px 16px;text-align:left;">Doctor</th>
                                <th style="padding:12px 16px;text-align:left;">Type</th>
                                <th style="padding:12px 16px;text-align:left;">Date &amp; Time</th>
                                <th style="padding:12px 16px;text-align:left;">Status</th>
                                <th style="padding:12px 16px;text-align:left;"></th>
                            </tr>
                        </thead>
                        <tbody>
                        ${(apts||[]).map(a => `
                            <tr style="border-bottom:1px solid var(--border);">
                                <td style="padding:12px 16px;font-weight:600;">${a.patient?.full_name||'—'}</td>
                                <td style="padding:12px 16px;">${a.doctor?.full_name||'—'}</td>
                                <td style="padding:12px 16px;"><span class="pill" style="display:inline-block;padding:4px 12px;border-radius:50px;font-size:0.75rem;font-weight:600;background:var(--primary-light);color:var(--primary);">${a.consultation_type||'video'}</span></td>
                                <td style="padding:12px 16px;">${new Date(a.scheduled_at).toLocaleString()}</td>
                                <td style="padding:12px 16px;"><span class="pill" style="display:inline-block;padding:4px 12px;border-radius:50px;font-size:0.75rem;font-weight:600;${a.status === 'scheduled' ? 'background:#DCFCE7;color:#16A34A;' : a.status === 'completed' ? 'background:#E2E8F0;color:#475569;' : 'background:#FEE2E2;color:#DC2626;'}">${a.status.replace('_',' ')}</span></td>
                                <td style="padding:12px 16px;">
                                    ${a.status==='scheduled' ? `
                                        <button class="btn btn-sm btn-danger" style="background:#DC2626;color:white;border:none;padding:4px 12px;border-radius:6px;cursor:pointer;"
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
        app.loadView('appointments');
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
            <div class="stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:20px;">
                ${this._stat('Total Collected','KES '+total.toLocaleString(),'success')}
                ${this._stat('Pending',pending,'')}
                ${this._stat('Refunded','KES '+refunded.toLocaleString(),'')}
            </div>
            <div class="card">
                <div class="table-wrap" style="overflow-x:auto;">
                    <table class="dt" style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <thead>
                            <tr style="background:var(--primary);color:white;">
                                <th style="padding:12px 16px;text-align:left;">Patient</th>
                                <th style="padding:12px 16px;text-align:left;">Doctor</th>
                                <th style="padding:12px 16px;text-align:left;">Amount</th>
                                <th style="padding:12px 16px;text-align:left;">Method</th>
                                <th style="padding:12px 16px;text-align:left;">Status</th>
                                <th style="padding:12px 16px;text-align:left;">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                        ${(payments||[]).map(p => `
                            <tr style="border-bottom:1px solid var(--border);">
                                <td style="padding:12px 16px;font-weight:600;">${p.patient?.full_name||'—'}</td>
                                <td style="padding:12px 16px;">${p.doctor?.full_name||'—'}</td>
                                <td style="padding:12px 16px;">${p.currency} ${Number(p.amount).toLocaleString()}</td>
                                <td style="padding:12px 16px;text-transform:capitalize;">${p.payment_method||'—'}</td>
                                <td style="padding:12px 16px;"><span class="pill" style="display:inline-block;padding:4px 12px;border-radius:50px;font-size:0.75rem;font-weight:600;${p.status === 'paid' ? 'background:#DCFCE7;color:#16A34A;' : p.status === 'pending' ? 'background:#FEF3C7;color:#F59E0B;' : 'background:#FEE2E2;color:#DC2626;'}">${p.status}</span></td>
                                <td style="padding:12px 16px;">${p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    // ── REPORTS ───────────────────────────────────────────────────────────
    async _reports(el) {
        const [{ data: apts }, { data: patients }, { data: doctors }] = await Promise.all([
            supabase.from('appointments').select('status,scheduled_at,consultation_type'),
            supabase.from('profiles').select('gender,date_of_birth').eq('role','patient'),
            supabase.from('profiles').select('specialty,is_active').eq('role','doctor'),
        ]);

        const total = apts?.length || 0;
        const counts = { scheduled:0, completed:0, cancelled:0, pending_payment:0, no_show:0 };
        (apts||[]).forEach(a => { if (counts[a.status]!==undefined) counts[a.status]++; });

        const typeCounts = {};
        (apts||[]).forEach(a => { typeCounts[a.consultation_type||'video'] = (typeCounts[a.consultation_type||'video']||0)+1; });

        const specialtyCounts = {};
        (doctors||[]).forEach(d => { 
            if (d.is_active) {
                const s=d.specialty||'General Practice'; 
                specialtyCounts[s]=(specialtyCounts[s]||0)+1; 
            }
        });

        const genderCounts = {};
        (patients||[]).forEach(p => { const g=p.gender||'Not specified'; genderCounts[g]=(genderCounts[g]||0)+1; });

        const bar = (label, count, tot, color='var(--primary)') => {
            const pct = tot > 0 ? Math.round(count/tot*100) : 0;
            return `<div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                    <span>${label}</span><span class="text-muted" style="color:var(--text-light);">${count} (${pct}%)</span>
                </div>
                <div style="background:var(--background);border-radius:999px;height:8px;overflow:hidden;">
                    <div style="width:${pct}%;background:${color};height:100%;border-radius:999px;"></div>
                </div>
            </div>`;
        };

        el.innerHTML = `
            <div class="page-header"><h2>Reports &amp; Analytics</h2></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;">
                <div class="card">
                    <h3 style="font-size:1rem;margin-bottom:16px;">Appointment Status</h3>
                    ${bar('Scheduled',    counts.scheduled,    total,'var(--primary)')}
                    ${bar('Completed',    counts.completed,    total,'var(--success)')}
                    ${bar('Cancelled',    counts.cancelled,    total,'var(--danger)')}
                    ${bar('No-show',      counts.no_show,      total,'var(--warning)')}
                    ${bar('Pending Pay.', counts.pending_payment, total,'#f59e0b')}
                </div>
                <div class="card">
                    <h3 style="font-size:1rem;margin-bottom:16px;">Appointment Types</h3>
                    ${Object.entries(typeCounts).map(([l,c])=>bar(l.replace('_',' '),c,total)).join('')}
                </div>
                <div class="card">
                    <h3 style="font-size:1rem;margin-bottom:16px;">Active Doctor Specialties</h3>
                    ${Object.entries(specialtyCounts).length > 0 
                        ? Object.entries(specialtyCounts).map(([l,c])=>bar(l,c,doctors?.filter(d=>d.is_active).length||1)).join('')
                        : '<p class="text-muted" style="color:var(--text-light);">No active doctors</p>'}
                </div>
                <div class="card">
                    <h3 style="font-size:1rem;margin-bottom:16px;">Patient Gender</h3>
                    ${Object.entries(genderCounts).map(([l,c])=>bar(l,c,patients?.length||1,'var(--success)')).join('')}
                </div>
            </div>`;
    }

    // ── ACTIVITY LOGS ─────────────────────────────────────────────────────
    async _logs(el) {
        const { data: logs } = await supabase
            .from('activity_logs')
            .select('id,action,details,created_at,user:user_id(full_name,role,email)')
            .order('created_at',{ascending:false})
            .limit(100);

        const ACTION_LABELS = {
            login:'Logged in', logout:'Logged out', register:'Registered',
            appointment_booked:'Booked appointment', payment_completed:'Payment completed',
            admin_activate_user:'✅ Activated user', admin_disable_user:'⛔ Disabled user',
            admin_delete_user:'🗑️ Deleted user', admin_cancel_appointment:'❌ Cancelled appointment',
            WRITE_PRESCRIPTION:'💊 Wrote prescription', SCHEDULE_FOLLOW_UP:'📅 Scheduled follow-up',
            SAVE_CONSULTATION:'📋 Saved consultation', UPDATE_PROFILE:'📝 Updated profile'
        };

        el.innerHTML = `
            <div class="page-header">
                <h2>Activity Logs</h2>
                <p class="text-muted">Last 100 events</p>
            </div>
            <div class="card">
                <div class="table-wrap" style="overflow-x:auto;">
                    <table class="dt" style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <thead>
                            <tr style="background:var(--primary);color:white;">
                                <th style="padding:12px 16px;text-align:left;">User</th>
                                <th style="padding:12px 16px;text-align:left;">Role</th>
                                <th style="padding:12px 16px;text-align:left;">Action</th>
                                <th style="padding:12px 16px;text-align:left;">Date &amp; Time</th>
                            </tr>
                        </thead>
                        <tbody>
                        ${(logs||[]).map(l => `
                            <tr style="border-bottom:1px solid var(--border);">
                                <td style="padding:12px 16px;font-weight:600;">${l.user?.full_name||'Unknown'}</td>
                                <td style="padding:12px 16px;text-transform:capitalize;">${l.user?.role||'—'}</td>
                                <td style="padding:12px 16px;">${ACTION_LABELS[l.action]||l.action}</td>
                                <td style="padding:12px 16px;">${new Date(l.created_at).toLocaleString()}</td>
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