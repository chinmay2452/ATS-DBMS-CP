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
            case 'queries':
                pageTitle.innerText = 'SQL Queries';
                addBtn.innerHTML = '<i class="fas fa-play"></i> Run All';
                addBtn.onclick = () => showToast('Click individual queries to run them.', 'info');
                await renderQueries();
                break;
            case 'views':
                pageTitle.innerText = 'Database Views';
                addBtn.innerHTML = '<i class="fas fa-eye"></i> Refresh';
                addBtn.onclick = () => renderPage('views');
                await renderViews();
                break;
            case 'triggers':
                pageTitle.innerText = 'Triggers & Procedures';
                addBtn.innerHTML = '<i class="fas fa-bolt"></i> Trigger Demos';
                addBtn.onclick = () => showToast('Click Demo buttons to test triggers.', 'info');
                await renderTriggers();
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
                                    <option value="Active" ${a.status==='Active'?'selected':''}>Active</option>
                                    <option value="Rejected" ${a.status==='Rejected'?'selected':''}>Rejected</option>
                                    <option value="Hired" ${a.status==='Hired'?'selected':''}>Hired</option>
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

// ─── Add Job Modal ───────────────────────────────────────────────────────────
function showAddJobModal() {
    modalTitle.innerText = 'Create New Job';
    modalBody.innerHTML = `
        <div class="form-group"><label>Job Title</label><input type="text" id="jTitle" placeholder="e.g. Software Engineer"></div>
        <div class="form-group"><label>Department</label><input type="text" id="jDept" placeholder="e.g. IT"></div>
        <div class="form-group"><label>Required Experience (years)</label><input type="number" id="jExp" min="0" value="0"></div>
        <div class="form-group"><label>Posted Date</label><input type="date" id="jDate" value="${today()}"></div>
        <button class="btn-primary" style="width:100%;justify-content:center" onclick="submitNewJob()">Create Job</button>`;
    openModal();
}

async function submitNewJob() {
    const body = {
        title: document.getElementById('jTitle').value,
        department: document.getElementById('jDept').value,
        exp: parseInt(document.getElementById('jExp').value) || 0,
        date: document.getElementById('jDate').value
    };
    if (!body.title || !body.department) { showToast('Please fill in all required fields.', 'error'); return; }
    const res = await apiFetch('/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res) { closeModal(); showToast('✅ Job created!'); renderJobs(); }
}

// ─── Add Applicant Modal ─────────────────────────────────────────────────────
function showAddApplicantModal() {
    modalTitle.innerText = 'Add New Applicant';
    modalBody.innerHTML = `
        <div class="form-group"><label>Full Name</label><input type="text" id="aName" placeholder="e.g. John Doe"></div>
        <div class="form-group"><label>Email</label><input type="email" id="aEmail" placeholder="e.g. john@example.com"></div>
        <div class="form-group"><label>Phone</label><input type="text" id="aPhone" placeholder="e.g. 9876543210"></div>
        <div class="form-group"><label>Highest Qualification</label>
            <select id="aQual">
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="MCA">MCA</option>
                <option value="BCA">BCA</option>
                <option value="MBA">MBA</option>
                <option value="B.Sc">B.Sc</option>
                <option value="M.Sc">M.Sc</option>
            </select>
        </div>
        <div class="form-group"><label>Total Experience (years)</label><input type="number" id="aExp" min="0" value="0"></div>
        <div class="form-group"><label>Resume Link</label><input type="text" id="aResume" placeholder="https://..."></div>
        <button class="btn-primary" style="width:100%;justify-content:center" onclick="submitNewApplicant()">Add Applicant</button>`;
    openModal();
}

async function submitNewApplicant() {
    const body = {
        name: document.getElementById('aName').value,
        email: document.getElementById('aEmail').value,
        phone: document.getElementById('aPhone').value,
        qual: document.getElementById('aQual').value,
        exp: parseInt(document.getElementById('aExp').value) || 0,
        resume: document.getElementById('aResume').value
    };
    if (!body.name || !body.email) { showToast('Name and Email are required.', 'error'); return; }
    const res = await apiFetch('/applicants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res) { closeModal(); showToast('✅ Applicant added!'); renderApplicants(); }
}

// ─── Add Application Modal ───────────────────────────────────────────────────
async function showAddApplicationModal() {
    const [applicants, jobs] = await Promise.all([apiFetch('/applicants'), apiFetch('/jobs')]);
    modalTitle.innerText = 'Submit New Application';
    modalBody.innerHTML = `
        <div class="form-group"><label>Applicant</label>
            <select id="appApplicantId">${(applicants || []).map(a => `<option value="${a.id}">${a.name} (${a.email})</option>`).join('')}</select>
        </div>
        <div class="form-group"><label>Job</label>
            <select id="appJobId">${(jobs || []).map(j => `<option value="${j.id}">${j.title} — ${j.department}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label>Application Date</label><input type="date" id="appDate" value="${today()}"></div>
        <button class="btn-primary" style="width:100%;justify-content:center" onclick="submitNewApplication()">Submit Application</button>`;
    openModal();
}

async function submitNewApplication() {
    const body = {
        applicantId: document.getElementById('appApplicantId').value,
        jobId: document.getElementById('appJobId').value,
        date: document.getElementById('appDate').value
    };
    const res = await apiFetch('/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res) { closeModal(); showToast('✅ Application submitted!'); renderApplications(); }
}

// ─── SQL Syntax Highlighter ──────────────────────────────────────────────────
function highlightSQL(sql) {
    const keywords = ['SELECT','FROM','WHERE','JOIN','LEFT','RIGHT','INNER','OUTER','ON','AND','OR','NOT','IN','AS','GROUP','BY','ORDER','DESC','ASC','LIMIT','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','VIEW','TRIGGER','PROCEDURE','FUNCTION','BEGIN','END','IF','THEN','ELSE','DECLARE','SIGNAL','SQLSTATE','FOR','EACH','ROW','NEW','OLD','BEFORE','AFTER','CALL','CURDATE','CONCAT','COUNT','AVG','MAX','MIN','SUM','CASE','WHEN','NULL','IS','LIKE','BETWEEN','EXISTS','HAVING','UNION','ALL','DISTINCT','DATEDIFF','CHECK','CONSTRAINT','FOREIGN','KEY','PRIMARY','REFERENCES','AUTO_INCREMENT','ENUM','DEFAULT','UNIQUE','INDEX','CASCADE'];
    let result = sql
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/(--.*)/g, '<span class="sql-comment">$1</span>')
        .replace(/'([^']*)'/g, "<span class='sql-string'>'$1'</span>")
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="sql-number">$1</span>');
    keywords.forEach(kw => {
        result = result.replace(new RegExp(`\\b(${kw})\\b`, 'gi'), '<span class="sql-keyword">$1</span>');
    });
    result = result.replace(/\b(COUNT|AVG|MAX|MIN|SUM|CONCAT|CURDATE|DATEDIFF|COALESCE)\b/gi, '<span class="sql-function">$1</span>');
    return result;
}

function renderResultTable(columns, rows) {
    if (!rows || rows.length === 0) return `<div class="terminal-output terminal-info">Empty set (0 rows)</div>`;
    const vals = rows.map(r => columns.map(c => {
        let v = r[c];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}T/)) return v.split('T')[0];
        return String(v);
    }));
    return `<div class="sql-result-container">
        <table class="sql-result"><thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${vals.map(row => `<tr>${row.map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>
        <div class="sql-result-meta">${rows.length} row${rows.length !== 1 ? 's' : ''} in set</div>
    </div>`;
}

function toggleCard(id) {
    const body = document.getElementById(id);
    if (body) body.classList.toggle('open');
}

// ─── Queries Page ────────────────────────────────────────────────────────────
async function renderQueries() {
    contentArea.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading queries...</div>`;
    const queries = await apiFetch('/queries');
    if (!queries) return;

    const operational = queries.filter(q => q.category === 'Operational');
    const analytics = queries.filter(q => q.category === 'Analytics');

    contentArea.innerHTML = `
        <div class="section-title"><i class="fas fa-cogs"></i> Part A: Core Operational Queries <span class="section-count">${operational.length}</span></div>
        ${operational.map(q => renderQueryCard(q)).join('')}
        <div class="section-title" style="margin-top:2rem"><i class="fas fa-chart-bar"></i> Part B: Reports & Analytics Queries <span class="section-count">${analytics.length}</span></div>
        ${analytics.map(q => renderQueryCard(q)).join('')}
    `;
}

function renderQueryCard(q) {
    return `<div class="demo-card">
        <div class="demo-card-header" onclick="toggleCard('qbody-${q.id}')">
            <h4><span style="color:var(--primary);margin-right:0.5rem">#${q.id}</span>${q.title}</h4>
            <div class="card-meta">
                <span class="card-badge ${q.category === 'Analytics' ? 'analytics' : ''}">${q.category}</span>
                <button class="run-btn" onclick="event.stopPropagation();runQuery(${q.id})" id="run-q-${q.id}"><i class="fas fa-play"></i> Run</button>
            </div>
        </div>
        <div class="demo-card-body" id="qbody-${q.id}">
            <div class="sql-terminal">${highlightSQL(q.sql)}</div>
            <div id="qresult-${q.id}"></div>
        </div>
    </div>`;
}

async function runQuery(id) {
    const btn = document.getElementById(`run-q-${id}`);
    const resultDiv = document.getElementById(`qresult-${id}`);
    const body = document.getElementById(`qbody-${id}`);
    if (!body.classList.contains('open')) body.classList.add('open');
    btn.classList.add('loading');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
    resultDiv.innerHTML = `<div class="result-loading"><i class="fas fa-spinner fa-spin"></i> Executing query...</div>`;

    const data = await apiFetch(`/queries/${id}/run`);
    btn.classList.remove('loading');
    btn.innerHTML = '<i class="fas fa-play"></i> Run';

    if (!data) { resultDiv.innerHTML = `<div class="terminal-output terminal-error">Failed to execute query.</div>`; return; }
    if (data.error) { resultDiv.innerHTML = `<div class="terminal-output terminal-error">ERROR: ${data.error}</div>`; return; }
    resultDiv.innerHTML = renderResultTable(data.columns, data.rows);
}

// ─── Views Page ──────────────────────────────────────────────────────────────
async function renderViews() {
    contentArea.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading views...</div>`;
    const views = await apiFetch('/views');
    if (!views) return;

    contentArea.innerHTML = `
        <div class="section-title"><i class="fas fa-eye"></i> Database Views <span class="section-count">${views.length}</span></div>
        <p style="color:var(--text-muted);margin-bottom:1.5rem;font-size:0.9rem">Views are virtual tables created from SQL queries. Click <strong>Run</strong> to query each view and see live results.</p>
        ${views.map(v => `<div class="demo-card">
            <div class="demo-card-header" onclick="toggleCard('vbody-${v.id}')">
                <div>
                    <h4><i class="fas fa-eye" style="color:var(--primary);margin-right:0.5rem"></i>${v.title}</h4>
                    <span style="font-size:0.78rem;color:var(--text-muted)">${v.name} — ${v.description}</span>
                </div>
                <button class="run-btn" onclick="event.stopPropagation();runView('${v.id}')" id="run-v-${v.id}"><i class="fas fa-play"></i> Run</button>
            </div>
            <div class="demo-card-body" id="vbody-${v.id}">
                <span class="terminal-label">VIEW DEFINITION</span>
                <div class="sql-terminal">${highlightSQL(v.sql)}</div>
                <div id="vresult-${v.id}"></div>
            </div>
        </div>`).join('')}
    `;
}

async function runView(id) {
    const btn = document.getElementById(`run-v-${id}`);
    const resultDiv = document.getElementById(`vresult-${id}`);
    const body = document.getElementById(`vbody-${id}`);
    if (!body.classList.contains('open')) body.classList.add('open');
    btn.classList.add('loading');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
    resultDiv.innerHTML = `<div class="result-loading"><i class="fas fa-spinner fa-spin"></i> Querying view...</div>`;

    const data = await apiFetch(`/views/${id}/run`);
    btn.classList.remove('loading');
    btn.innerHTML = '<i class="fas fa-play"></i> Run';

    if (!data) { resultDiv.innerHTML = `<div class="terminal-output terminal-error">Failed to query view.</div>`; return; }
    if (data.error) { resultDiv.innerHTML = `<div class="terminal-output terminal-error">ERROR: ${data.error}</div>`; return; }
    resultDiv.innerHTML = `
        <span class="terminal-label" style="margin-top:1rem;display:inline-block">QUERY OUTPUT</span>
        <div class="sql-terminal" style="margin-bottom:0.5rem">${highlightSQL(data.sql)}</div>
        ${renderResultTable(data.columns, data.rows)}
    `;
}

// ─── Triggers & Procedures Page ──────────────────────────────────────────────
async function renderTriggers() {
    contentArea.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
    const [triggers, procedures] = await Promise.all([apiFetch('/triggers'), apiFetch('/procedures')]);
    if (!triggers) return;

    contentArea.innerHTML = `
        <div class="section-title"><i class="fas fa-bolt"></i> Triggers <span class="section-count">${triggers.length}</span></div>
        <p style="color:var(--text-muted);margin-bottom:1.5rem;font-size:0.9rem">Triggers automatically execute SQL logic on INSERT, UPDATE, or DELETE events. Click <strong>Demo</strong> to see each trigger in action.</p>
        ${triggers.map(t => `<div class="demo-card">
            <div class="demo-card-header" onclick="toggleCard('tbody-${t.id}')">
                <div>
                    <h4><i class="fas fa-bolt" style="color:#f59e0b;margin-right:0.5rem"></i>${t.title}</h4>
                    <span style="font-size:0.78rem;color:var(--text-muted)">${t.event}</span>
                </div>
                <div class="card-meta">
                    <span class="card-badge trigger">${t.name}</span>
                    <button class="run-btn demo-btn" onclick="event.stopPropagation();runTriggerDemo('${t.id}')" id="run-t-${t.id}"><i class="fas fa-play"></i> Demo</button>
                </div>
            </div>
            <div class="demo-card-body" id="tbody-${t.id}">
                <p class="demo-card-description">${t.description}</p>
                <span class="terminal-label">TRIGGER DEFINITION</span>
                <div class="sql-terminal">${highlightSQL(t.sql)}</div>
                <div id="tresult-${t.id}"></div>
            </div>
        </div>`).join('')}

        <div class="section-title" style="margin-top:2.5rem"><i class="fas fa-terminal"></i> Stored Procedures <span class="section-count">${(procedures||[]).length}</span></div>
        <p style="color:var(--text-muted);margin-bottom:1.5rem;font-size:0.9rem">Stored procedures encapsulate reusable SQL logic. Use the forms below to call each procedure with parameters.</p>
        ${(procedures||[]).map(p => renderProcedureCard(p)).join('')}
    `;
}

function renderProcedureCard(p) {
    let formHTML = '';
    if (p.id === 'apply') {
        formHTML = `<div class="proc-form">
            <div class="form-group"><label>application_id</label><input type="number" id="proc-apply-appid" placeholder="e.g. 5001" value="5001"></div>
            <div class="form-group"><label>applicant_id</label><input type="number" id="proc-apply-applicant" placeholder="e.g. 1" value="1"></div>
            <div class="form-group"><label>job_id</label><input type="number" id="proc-apply-job" placeholder="e.g. 101" value="104"></div>
        </div>`;
    } else if (p.id === 'schedule-interview') {
        formHTML = `<div class="proc-form">
            <div class="form-group"><label>interview_id</label><input type="number" id="proc-si-iid" placeholder="e.g. 900" value="900"></div>
            <div class="form-group"><label>date</label><input type="date" id="proc-si-date" value="${today()}"></div>
            <div class="form-group"><label>type</label><select id="proc-si-type"><option value="Technical">Technical</option><option value="HR">HR</option></select></div>
            <div class="form-group"><label>application_id</label><input type="number" id="proc-si-appid" placeholder="e.g. 1001" value="1001"></div>
            <div class="form-group"><label>recruiter_id</label><input type="number" id="proc-si-rid" placeholder="e.g. 201" value="201"></div>
        </div>`;
    } else if (p.id === 'generate-offer') {
        formHTML = `<div class="proc-form">
            <div class="form-group"><label>offer_id</label><input type="number" id="proc-go-oid" placeholder="e.g. 700" value="700"></div>
            <div class="form-group"><label>application_id</label><input type="number" id="proc-go-appid" placeholder="e.g. 1006" value="1006"></div>
            <div class="form-group"><label>salary</label><input type="number" id="proc-go-salary" placeholder="e.g. 900000" value="900000"></div>
        </div>`;
    }

    return `<div class="demo-card">
        <div class="demo-card-header" onclick="toggleCard('pbody-${p.id}')">
            <div>
                <h4><i class="fas fa-terminal" style="color:#10b981;margin-right:0.5rem"></i>${p.title}</h4>
                <span style="font-size:0.78rem;color:var(--text-muted)">CALL ${p.name}(...)</span>
            </div>
            <span class="card-badge procedure">${p.name}</span>
        </div>
        <div class="demo-card-body" id="pbody-${p.id}">
            <p class="demo-card-description">${p.description}</p>
            <span class="terminal-label">PROCEDURE DEFINITION</span>
            <div class="sql-terminal">${highlightSQL(p.sql)}</div>
            <span class="terminal-label" style="margin-top:1rem;display:inline-block">CALL WITH PARAMETERS</span>
            ${formHTML}
            <button class="run-btn" onclick="callProcedure('${p.id}')" id="run-p-${p.id}"><i class="fas fa-play"></i> Execute</button>
            <div id="presult-${p.id}"></div>
        </div>
    </div>`;
}

async function runTriggerDemo(id) {
    const btn = document.getElementById(`run-t-${id}`);
    const resultDiv = document.getElementById(`tresult-${id}`);
    const body = document.getElementById(`tbody-${id}`);
    if (!body.classList.contains('open')) body.classList.add('open');
    btn.classList.add('loading');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
    resultDiv.innerHTML = `<div class="result-loading"><i class="fas fa-spinner fa-spin"></i> Executing trigger demo...</div>`;

    const data = await apiFetch(`/triggers/${id}/demo`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    btn.classList.remove('loading');
    btn.innerHTML = '<i class="fas fa-play"></i> Demo';

    if (!data) { resultDiv.innerHTML = `<div class="terminal-output terminal-error">Failed to run demo.</div>`; return; }

    let html = '';
    if (data.expected || !data.success) {
        html += `<div class="terminal-output terminal-error"><strong>⚠ TRIGGER FIRED — Error caught:</strong><br>${data.message}</div>`;
        html += `<div class="terminal-output terminal-info" style="margin-top:0.5rem"><strong>SQL Attempted:</strong><br>${data.sql}</div>`;
    } else {
        html += `<div class="terminal-output terminal-success"><strong>✓ ${data.message}</strong></div>`;
        html += `<div class="terminal-output terminal-info" style="margin-top:0.5rem"><strong>SQL Executed:</strong><br>${data.sql}</div>`;
    }

    if (data.before && data.after) {
        html += `<div class="comparison-grid">
            <div><div class="comparison-label">Before</div>${renderResultTable(Object.keys(data.before[0] || {}), data.before)}</div>
            <div><div class="comparison-label">After</div>${renderResultTable(Object.keys(data.after[0] || {}), data.after)}</div>
        </div>`;
    }
    if (data.rows) {
        html += renderResultTable(data.columns || Object.keys(data.rows[0] || {}), data.rows);
    }
    resultDiv.innerHTML = html;
}

async function callProcedure(id) {
    const btn = document.getElementById(`run-p-${id}`);
    const resultDiv = document.getElementById(`presult-${id}`);
    btn.classList.add('loading');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Executing...';
    resultDiv.innerHTML = `<div class="result-loading"><i class="fas fa-spinner fa-spin"></i> Calling procedure...</div>`;

    let body = {};
    if (id === 'apply') {
        body = { application_id: document.getElementById('proc-apply-appid').value, applicant_id: document.getElementById('proc-apply-applicant').value, job_id: document.getElementById('proc-apply-job').value };
    } else if (id === 'schedule-interview') {
        body = { interview_id: document.getElementById('proc-si-iid').value, date: document.getElementById('proc-si-date').value, type: document.getElementById('proc-si-type').value, application_id: document.getElementById('proc-si-appid').value, recruiter_id: document.getElementById('proc-si-rid').value };
    } else if (id === 'generate-offer') {
        body = { offer_id: document.getElementById('proc-go-oid').value, application_id: document.getElementById('proc-go-appid').value, salary: document.getElementById('proc-go-salary').value };
    }

    const data = await apiFetch(`/procedures/${id}/call`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    btn.classList.remove('loading');
    btn.innerHTML = '<i class="fas fa-play"></i> Execute';

    if (!data) { resultDiv.innerHTML = `<div class="terminal-output terminal-error">Failed to call procedure.</div>`; return; }

    let html = '';
    if (data.success) {
        html += `<div class="terminal-output terminal-success"><strong>✓ ${data.message}</strong></div>`;
        html += `<div class="terminal-output terminal-info" style="margin-top:0.5rem"><strong>SQL:</strong> ${data.sql}</div>`;
        if (data.rows) html += renderResultTable(data.columns || Object.keys(data.rows[0] || {}), data.rows);
    } else {
        html += `<div class="terminal-output terminal-error"><strong>✗ ERROR:</strong> ${data.message}</div>`;
        html += `<div class="terminal-output terminal-info" style="margin-top:0.5rem"><strong>SQL:</strong> ${data.sql}</div>`;
    }
    resultDiv.innerHTML = html;
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
