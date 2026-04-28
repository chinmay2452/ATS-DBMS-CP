// ui/app.js — Live API Integration (Advanced)
const API = 'http://localhost:3000/api';

// DOM Elements
const contentArea = document.getElementById('content-area');
const pageTitle = document.getElementById('page-title');
const navItems = document.querySelectorAll('.nav-item');
const modalOverlay = document.getElementById('modal');
const closeModalBtn = document.getElementById('close-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const addBtn = document.getElementById('add-btn');

// ─── Navigation ──────────────────────────────────────────────────────────────
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        renderPage(item.getAttribute('data-target'));
    });
});

// ─── Initial Render ───────────────────────────────────────────────────────────
renderPage('dashboard');

// ─── Page Router ─────────────────────────────────────────────────────────────
function renderPage(page) {
    contentArea.style.opacity = 0;
    setTimeout(async () => {
        switch (page) {
            case 'dashboard':
                pageTitle.innerText = 'Dashboard Overview';
                addBtn.innerHTML = '<i class="fas fa-plus"></i> New Job';
                addBtn.onclick = () => showAddJobModal();
                await renderDashboard();
                break;
            case 'jobs':
                pageTitle.innerText = 'Job Postings';
                addBtn.innerHTML = '<i class="fas fa-plus"></i> New Job';
                addBtn.onclick = () => showAddJobModal();
                await renderJobs();
                break;
            case 'applicants':
                pageTitle.innerText = 'Applicant Database';
                addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Applicant';
                addBtn.onclick = () => showAddApplicantModal();
                await renderApplicants();
                break;
            case 'applications':
                pageTitle.innerText = 'Application Tracking';
                addBtn.innerHTML = '<i class="fas fa-plus"></i> New Application';
                addBtn.onclick = () => showAddApplicationModal();
                await renderApplications();
                break;
            case 'interviews':
                pageTitle.innerText = 'Interviews Scheduled';
                addBtn.innerHTML = '<i class="fas fa-calendar-plus"></i> Schedule Interview';
                addBtn.onclick = () => showScheduleInterviewModal();
                await renderInterviews();
                break;
            case 'offers':
                pageTitle.innerText = 'Offer Management';
                addBtn.innerHTML = '<i class="fas fa-file-invoice-dollar"></i> New Offer';
                addBtn.onclick = () => showToast('Offer generation usually triggered after selection.', 'info');
                await renderOffers();
                break;
            case 'reports':
                pageTitle.innerText = 'Reports & Analytics';
                addBtn.innerHTML = '<i class="fas fa-download"></i> Export Data';
                addBtn.onclick = () => showToast('Exporting data...', 'info');
                await renderReports();
                break;
        }
        contentArea.style.opacity = 1;
    }, 200);
}

// ─── API Helper ───────────────────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
    try {
        const res = await fetch(`${API}${endpoint}`, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        showToast('❌ API Error: ' + err.message, 'error');
        return null;
    }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
async function renderDashboard() {
    contentArea.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
    const [stats, apps] = await Promise.all([
        apiFetch('/dashboard-stats'),
        apiFetch('/applications')
    ]);
    if (!stats) return;

    contentArea.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon primary"><i class="fas fa-users"></i></div>
                <div class="stat-info"><h3>Total Applicants</h3><p>${stats.totalApplicants}</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon warning"><i class="fas fa-briefcase"></i></div>
                <div class="stat-info"><h3>Active Jobs</h3><p>${stats.openJobs}</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon success" style="background:#fef3c7;color:#d97706;"><i class="fas fa-calendar-check"></i></div>
                <div class="stat-info"><h3>Interviews</h3><p>${stats.totalInterviews}</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:#dbeafe;color:#3b82f6;"><i class="fas fa-check-circle"></i></div>
                <div class="stat-info"><h3>Offers</h3><p>${stats.totalOffers}</p></div>
            </div>
        </div>
        <div class="table-container">
            <div class="table-header">
                <h3>Recent Activity</h3>
                <button class="btn-primary" style="padding:.4rem .8rem;font-size:.8rem" onclick="document.querySelector('[data-target=applications]').click()">View All</button>
            </div>
            <table>
                <thead><tr><th>Applicant</th><th>Job</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                    ${(apps || []).slice(0, 5).map(a => `
                        <tr>
                            <td><strong>${a.applicantName}</strong></td>
                            <td>${a.jobTitle}</td>
                            <td>${a.date ? a.date.split('T')[0] : ''}</td>
                            <td><span class="badge ${badgeClass(a.status)}">${a.status}</span></td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────
async function renderJobs() {
    contentArea.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
    const jobs = await apiFetch('/jobs');
    if (!jobs) return;

    contentArea.innerHTML = `
        <div class="table-container">
            <div class="table-header"><h3>All Job Postings</h3></div>
            <table>
                <thead><tr><th>Title</th><th>Department</th><th>Criteria</th><th>Status</th><th>Posted Date</th></tr></thead>
                <tbody>
                    ${jobs.map(j => `
                        <tr>
                            <td><strong>${j.title}</strong></td>
                            <td>${j.department}</td>
                            <td><span style="font-size:.8rem;color:var(--text-muted)">${j.required_skills || 'N/A'}<br>${j.qualification || ''}</span></td>
                            <td><span class="badge ${j.status === 'Open' ? 'open' : 'rejected'}">${j.status}</span></td>
                            <td>${j.date ? j.date.split('T')[0] : ''}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

// ─── Applicants ───────────────────────────────────────────────────────────────
async function renderApplicants() {
    contentArea.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
    const applicants = await apiFetch('/applicants');
    if (!applicants) return;

    contentArea.innerHTML = `
        <div class="table-container">
            <div class="table-header">
                <h3>Applicant Directory</h3>
                <div style="display:flex;gap:10px">
                    <select onchange="filterApplicants(this.value)" style="padding:.3rem;border-radius:4px;border:1px solid var(--border)">
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Hired">Hired</option>
                    </select>
                </div>
            </div>
            <table id="applicants-table">
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Exp</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    ${applicants.map(a => `
                        <tr data-status="${a.status}">
                            <td><strong>${a.name}</strong></td>
                            <td>${a.email}</td>
                            <td>${a.phone}</td>
                            <td>${a.exp} Yr</td>
                            <td><span class="badge ${badgeClass(a.status)}">${a.status}</span></td>
                            <td>
                                <button class="btn-primary" style="padding:.2rem .5rem;font-size:.75rem;background:${a.status==='Blocked'?'var(--secondary)':'var(--danger)'}" onclick="toggleBlock(${a.id}, '${a.status}')">
                                    ${a.status === 'Blocked' ? 'Unblock' : 'Block'}
                                </button>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

function filterApplicants(status) {
    const rows = document.querySelectorAll('#applicants-table tbody tr');
    rows.forEach(row => {
        if (status === 'All' || row.getAttribute('data-status') === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

async function toggleBlock(id, currentStatus) {
    const newStatus = currentStatus === 'Blocked' ? 'Active' : 'Blocked';
    const res = await apiFetch(`/applicants/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    if (res) {
        showToast(`✅ Applicant status updated to ${newStatus}`);
        renderApplicants();
    }
}

// ─── Applications ─────────────────────────────────────────────────────────────
async function renderApplications() {
    contentArea.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
    const [apps, stages] = await Promise.all([apiFetch('/applications'), apiFetch('/stages')]);
    if (!apps) return;

    contentArea.innerHTML = `
        <div class="table-container">
            <div class="table-header"><h3>Application Tracking</h3></div>
            <table>
                <thead><tr><th>Applicant</th><th>Job</th><th>Status</th><th>Current Stage</th><th>Update</th></tr></thead>
                <tbody>
                    ${apps.map(a => `
                        <tr>
                            <td><strong>${a.applicantName}</strong></td>
                            <td>${a.jobTitle}</td>
                            <td>
                                <select onchange="updateStatus(${a.id}, this.value)" style="padding:.3rem;border-radius:4px;border:1px solid var(--border)">
                                    <option value="Applied" ${a.status==='Applied'?'selected':''}>Applied</option>
                                    <option value="Shortlisted" ${a.status==='Shortlisted'?'selected':''}>Shortlisted</option>
                                    <option value="Selected" ${a.status==='Selected'?'selected':''}>Selected</option>
                                    <option value="Rejected" ${a.status==='Rejected'?'selected':''}>Rejected</option>
                                </select>
                            </td>
                            <td><span class="badge shortlisted" style="background:#e0e7ff">${a.currentStage || 'Applied'}</span></td>
                            <td>
                                <button class="btn-primary" style="padding:.3rem .6rem;font-size:.8rem" onclick="showUpdateStageModal(${a.id}, '${a.applicantName}')">Move Stage</button>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

async function showUpdateStageModal(appId, name) {
    const stages = await apiFetch('/stages');
    modalTitle.innerText = `Update Stage for ${name}`;
    modalBody.innerHTML = `
        <div class="form-group"><label>Select New Stage</label>
            <select id="newStageId">
                ${stages.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
        </div>
        <button class="btn-primary" style="width:100%;justify-content:center" onclick="submitStageUpdate(${appId})">Update Stage</button>`;
    openModal();
}

async function submitStageUpdate(appId) {
    const stageId = document.getElementById('newStageId').value;
    const res = await apiFetch(`/applications/${appId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId })
    });
    if (res) { closeModal(); showToast('✅ Stage updated!'); renderApplications(); }
}

// ─── Interviews ─────────────────────────────────────────────────────────────
async function renderInterviews() {
    contentArea.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
    const interviews = await apiFetch('/interviews');
    if (!interviews) return;

    contentArea.innerHTML = `
        <div class="table-container">
            <div class="table-header"><h3>Interview Schedule</h3></div>
            <table>
                <thead><tr><th>Applicant</th><th>Date</th><th>Type</th><th>Recruiter</th><th>Result</th></tr></thead>
                <tbody>
                    ${interviews.map(i => `
                        <tr>
                            <td><strong>${i.applicantName}</strong></td>
                            <td>${i.date ? i.date.split('T')[0] : ''}</td>
                            <td>${i.type}</td>
                            <td>${i.recruiterName || 'Unassigned'}</td>
                            <td><span class="badge ${i.result==='Pass'?'selected':i.result==='Fail'?'rejected':'applied'}">${i.result || 'Pending'}</span></td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

async function showScheduleInterviewModal() {
    const [apps, recruiters] = await Promise.all([apiFetch('/applications'), apiFetch('/recruiters')]);
    modalTitle.innerText = 'Schedule Interview';
    modalBody.innerHTML = `
        <div class="form-group"><label>Application</label>
            <select id="iAppId">${apps.map(a => `<option value="${a.id}">${a.applicantName} - ${a.jobTitle}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label>Interview Date</label><input type="date" id="iDate" value="${today()}"></div>
        <div class="form-group"><label>Type</label>
            <select id="iType"><option value="Technical">Technical</option><option value="HR">HR</option></select>
        </div>
        <div class="form-group"><label>Recruiter</label>
            <select id="iRecId">${recruiters.map(r => `<option value="${r.id}">${r.name} (${r.role})</option>`).join('')}</select>
        </div>
        <button class="btn-primary" style="width:100%;justify-content:center" onclick="submitInterview()">Schedule</button>`;
    openModal();
}

async function submitInterview() {
    const body = {
        applicationId: document.getElementById('iAppId').value,
        date: document.getElementById('iDate').value,
        type: document.getElementById('iType').value,
        recruiterId: document.getElementById('iRecId').value
    };
    const res = await apiFetch('/interviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res) { closeModal(); showToast('✅ Interview scheduled!'); renderInterviews(); }
}

// ─── Offers ──────────────────────────────────────────────────────────────────
async function renderOffers() {
    contentArea.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
    const offers = await apiFetch('/offers');
    if (!offers) return;

    contentArea.innerHTML = `
        <div class="table-container">
            <div class="table-header"><h3>Offer Management</h3></div>
            <table>
                <thead><tr><th>Applicant</th><th>Job</th><th>Salary</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    ${offers.map(o => `
                        <tr>
                            <td><strong>${o.applicantName}</strong></td>
                            <td>${o.jobTitle}</td>
                            <td>$${parseFloat(o.salary).toLocaleString()}</td>
                            <td>${o.date ? o.date.split('T')[0] : ''}</td>
                            <td><span class="badge ${badgeClass(o.status)}">${o.status}</span></td>
                            <td>
                                ${o.status === 'Pending' ? `
                                    <button class="btn-primary" style="padding:.2rem .4rem;font-size:.7rem;background:var(--secondary)" onclick="updateOffer(${o.id}, 'Accepted')">Accept</button>
                                    <button class="btn-primary" style="padding:.2rem .4rem;font-size:.7rem;background:var(--danger)" onclick="updateOffer(${o.id}, 'Rejected')">Reject</button>
                                ` : '-'}
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

async function updateOffer(id, status) {
    const res = await apiFetch(`/offers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res) { showToast(`✅ Offer ${status}`); renderOffers(); }
}

// ─── Reports ─────────────────────────────────────────────────────────────────
async function renderReports() {
    contentArea.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-info"><h3>Selection Rate</h3><p id="kpi-rate">0%</p></div></div>
            <div class="stat-card"><div class="stat-info"><h3>Avg Salary</h3><p id="kpi-salary">$0</p></div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
            <div class="table-container" style="padding:20px"><h4 style="margin-bottom:15px">Applications per Job</h4><canvas id="chart-jobs"></canvas></div>
            <div class="table-container" style="padding:20px"><h4 style="margin-bottom:15px">Status Distribution</h4><canvas id="chart-status"></canvas></div>
        </div>`;
    
    const data = await apiFetch('/reports/analytics');
    if (!data) return;

    document.getElementById('kpi-rate').innerText = `${parseFloat(data.selectionRate).toFixed(1)}%`;
    document.getElementById('kpi-salary').innerText = `$${parseFloat(data.avgSalary).toLocaleString()}`;

    new Chart(document.getElementById('chart-jobs'), {
        type: 'bar',
        data: {
            labels: data.appsPerJob.map(d => d.label),
            datasets: [{ label: 'Applications', data: data.appsPerJob.map(d => d.value), backgroundColor: '#4f46e5' }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    new Chart(document.getElementById('chart-status'), {
        type: 'doughnut',
        data: {
            labels: data.statusDist.map(d => d.label),
            datasets: [{ data: data.statusDist.map(d => d.value), backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'] }]
        }
    });
}

// ─── Shared Utilities ────────────────────────────────────────────────────────
async function updateStatus(appId, newStatus) {
    const res = await apiFetch(`/applications/${appId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    if (res) showToast(`✅ Status updated to ${newStatus}`);
}

function badgeClass(status) {
    const map = { 'Applied': 'applied', 'Shortlisted': 'shortlisted', 'Selected': 'selected', 'Hired': 'selected', 'Rejected': 'rejected', 'Pending': 'applied', 'Under Review': 'shortlisted', 'Active': 'open', 'Blocked': 'rejected' };
    return map[status] || 'applied';
}

function today() { return new Date().toISOString().split('T')[0]; }

function openModal() { modalOverlay.classList.add('active'); }
function closeModal() { modalOverlay.classList.remove('active'); }

closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

function showToast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = 'toast' + (type === 'error' ? ' toast-error' : '');
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}
