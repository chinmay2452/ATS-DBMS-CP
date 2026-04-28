// ui/app.js — Live API Integration
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
                <div class="stat-info"><h3>Open Jobs</h3><p>${stats.openJobs}</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon success"><i class="fas fa-file-signature"></i></div>
                <div class="stat-info"><h3>Applications</h3><p>${stats.totalApplications}</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:#dbeafe;color:#3b82f6;"><i class="fas fa-check-circle"></i></div>
                <div class="stat-info"><h3>Hired</h3><p>${stats.hired}</p></div>
            </div>
        </div>
        <div class="table-container">
            <div class="table-header">
                <h3>Recent Applications</h3>
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
            <div class="table-header"><h3>All Job Postings</h3><span style="color:var(--text-muted);font-size:.85rem">${jobs.length} jobs found</span></div>
            <table>
                <thead><tr><th>ID</th><th>Title</th><th>Department</th><th>Exp. Required</th><th>Status</th><th>Posted Date</th></tr></thead>
                <tbody>
                    ${jobs.map(j => `
                        <tr>
                            <td>#${j.id}</td>
                            <td><strong>${j.title}</strong></td>
                            <td>${j.department}</td>
                            <td>${j.exp} Yr${j.exp !== 1 ? 's' : ''}</td>
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
            <div class="table-header"><h3>Applicant Directory</h3><span style="color:var(--text-muted);font-size:.85rem">${applicants.length} applicants</span></div>
            <table>
                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Qualification</th><th>Experience</th><th>Status</th></tr></thead>
                <tbody>
                    ${applicants.map(a => `
                        <tr>
                            <td>#${a.id}</td>
                            <td><strong>${a.name}</strong></td>
                            <td>${a.email}</td>
                            <td>${a.phone}</td>
                            <td>${a.qual}</td>
                            <td>${a.exp} Yr${a.exp !== 1 ? 's' : ''}</td>
                            <td><span class="badge ${a.status === 'Active' ? 'open' : 'rejected'}">${a.status}</span></td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

// ─── Applications ─────────────────────────────────────────────────────────────
async function renderApplications() {
    contentArea.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
    const apps = await apiFetch('/applications');
    if (!apps) return;

    contentArea.innerHTML = `
        <div class="table-container">
            <div class="table-header"><h3>Application Tracking</h3><span style="color:var(--text-muted);font-size:.85rem">${apps.length} applications</span></div>
            <table>
                <thead><tr><th>App ID</th><th>Applicant</th><th>Job</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                    ${apps.map(a => `
                        <tr>
                            <td>#${a.id}</td>
                            <td><strong>${a.applicantName}</strong></td>
                            <td>${a.jobTitle}</td>
                            <td>${a.date ? a.date.split('T')[0] : ''}</td>
                            <td>
                                <select onchange="updateStatus(${a.id}, this.value)" style="padding:.35rem .5rem;border-radius:6px;border:1px solid var(--border);font-size:.85rem;cursor:pointer">
                                    <option value="Pending" ${a.status==='Pending'?'selected':''}>Pending</option>
                                    <option value="Under Review" ${a.status==='Under Review'?'selected':''}>Under Review</option>
                                    <option value="Rejected" ${a.status==='Rejected'?'selected':''}>Rejected</option>
                                    <option value="Hired" ${a.status==='Hired'?'selected':''}>Hired</option>
                                </select>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

// ─── Status Update ────────────────────────────────────────────────────────────
async function updateStatus(appId, newStatus) {
    const res = await apiFetch(`/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    if (res) showToast(`✅ Status updated to "${newStatus}"`);
}

// ─── Add Job Modal ────────────────────────────────────────────────────────────
function showAddJobModal() {
    modalTitle.innerText = 'Post a New Job';
    modalBody.innerHTML = `
        <div class="form-group"><label>Job Title</label><input id="jTitle" placeholder="e.g. Software Engineer"></div>
        <div class="form-group"><label>Department</label><input id="jDept" placeholder="e.g. IT"></div>
        <div class="form-group"><label>Required Experience (Years)</label><input id="jExp" type="number" min="0" value="0"></div>
        <div class="form-group"><label>Posted Date</label><input id="jDate" type="date" value="${today()}"></div>
        <div class="form-group"><label>Status</label>
            <select id="jStatus"><option value="Open">Open</option><option value="Closed">Closed</option></select>
        </div>
        <button class="btn-primary" style="width:100%;justify-content:center;margin-top:.5rem" onclick="submitJob()">Post Job</button>`;
    openModal();
}

async function submitJob() {
    const body = {
        title: document.getElementById('jTitle').value,
        department: document.getElementById('jDept').value,
        exp: document.getElementById('jExp').value,
        date: document.getElementById('jDate').value,
        status: document.getElementById('jStatus').value
    };
    if (!body.title || !body.department) return showToast('⚠️ Title and Department are required', 'error');
    const res = await apiFetch('/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res) { closeModal(); showToast('✅ Job posted!'); renderPage('jobs'); }
}

// ─── Add Applicant Modal ──────────────────────────────────────────────────────
function showAddApplicantModal() {
    modalTitle.innerText = 'Add New Applicant';
    modalBody.innerHTML = `
        <div class="form-group"><label>Full Name</label><input id="aName" placeholder="e.g. John Doe"></div>
        <div class="form-group"><label>Email</label><input id="aEmail" type="email" placeholder="john@email.com"></div>
        <div class="form-group"><label>Phone</label><input id="aPhone" placeholder="10-digit number"></div>
        <div class="form-group"><label>Highest Qualification</label><input id="aQual" placeholder="e.g. B.Tech"></div>
        <div class="form-group"><label>Total Experience (Years)</label><input id="aExp" type="number" min="0" value="0"></div>
        <button class="btn-primary" style="width:100%;justify-content:center;margin-top:.5rem" onclick="submitApplicant()">Add Applicant</button>`;
    openModal();
}

async function submitApplicant() {
    const body = {
        name: document.getElementById('aName').value,
        email: document.getElementById('aEmail').value,
        phone: document.getElementById('aPhone').value,
        qual: document.getElementById('aQual').value,
        exp: document.getElementById('aExp').value
    };
    if (!body.name || !body.email) return showToast('⚠️ Name and Email are required', 'error');
    const res = await apiFetch('/applicants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res) { closeModal(); showToast('✅ Applicant added!'); renderPage('applicants'); }
}

// ─── Add Application Modal ────────────────────────────────────────────────────
async function showAddApplicationModal() {
    const [applicants, jobs] = await Promise.all([apiFetch('/applicants'), apiFetch('/jobs')]);
    modalTitle.innerText = 'Submit New Application';
    modalBody.innerHTML = `
        <div class="form-group"><label>Applicant</label>
            <select id="apApplicant">
                ${(applicants || []).map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
            </select>
        </div>
        <div class="form-group"><label>Job</label>
            <select id="apJob">
                ${(jobs || []).map(j => `<option value="${j.id}">${j.title} (${j.department})</option>`).join('')}
            </select>
        </div>
        <div class="form-group"><label>Application Date</label><input id="apDate" type="date" value="${today()}"></div>
        <button class="btn-primary" style="width:100%;justify-content:center;margin-top:.5rem" onclick="submitApplication()">Submit Application</button>`;
    openModal();
}

async function submitApplication() {
    const body = {
        applicantId: document.getElementById('apApplicant').value,
        jobId: document.getElementById('apJob').value,
        date: document.getElementById('apDate').value
    };
    const res = await apiFetch('/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res) { closeModal(); showToast('✅ Application submitted!'); renderPage('applications'); }
}

// ─── Modal Helpers ────────────────────────────────────────────────────────────
function openModal() { modalOverlay.classList.add('active'); }
function closeModal() { modalOverlay.classList.remove('active'); }

closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = 'toast' + (type === 'error' ? ' toast-error' : '');
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function badgeClass(status) {
    const map = { 'Applied': 'applied', 'Shortlisted': 'shortlisted', 'Selected': 'selected', 'Hired': 'selected', 'Rejected': 'rejected', 'Pending': 'applied', 'Under Review': 'shortlisted' };
    return map[status] || 'applied';
}

function today() {
    return new Date().toISOString().split('T')[0];
}
