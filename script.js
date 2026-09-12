const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz-x3_Eyp3vCcntNm11kWATjTSslEzdffIViYaO5a1KLt17JwO40XAypT8FycdXsLGINQ/exec';

let allJobs = [];
let editingJobId = null;
const filterState = {
  searchQuery: '',
  sector: '',
  minPay: null,
  maxExp: null,
  sortBy: ''
};

document.addEventListener('DOMContentLoaded', () => {
  fetchJobs();
  setupEventListeners();
  setupModalBackdropListeners();
});

async function fetchJobs() {
  const grid = document.getElementById('jobsGrid');
  showSkeletonLoader(grid);

  try {
    const response = await fetch(WEB_APP_URL);
    allJobs = await response.json();
    applyCombinedFilters();
  } catch (error) {
    console.error('Error fetching jobs:', error);
    grid.innerHTML = `
      <div class="loading-container">
        <p>⚠️ Failed to load jobs. Please verify network connection or API URL.</p>
        <button class="btn btn-secondary" onclick="fetchJobs()">Try Again</button>
      </div>`;
  }
}

function showSkeletonLoader(container) {
  container.innerHTML = Array(6).fill(0).map(() => `
    <div class="skeleton-card">
      <div style="display: flex; gap: 0.85rem; align-items: center;">
        <div class="skeleton-box" style="width: 46px; height: 46px; border-radius: 12px;"></div>
        <div style="flex:1;">
          <div class="skeleton-box" style="height: 16px; width: 60%; margin-bottom: 6px;"></div>
          <div class="skeleton-box" style="height: 12px; width: 40%;"></div>
        </div>
      </div>
      <div class="skeleton-box" style="height: 24px; width: 80%;"></div>
      <div class="skeleton-box" style="height: 48px; width: 100%;"></div>
    </div>
  `).join('');
}

function renderJobs(jobs) {
  const grid = document.getElementById('jobsGrid');
  grid.innerHTML = '';

  if (jobs.length === 0) {
    const hasActiveFilters = filterState.searchQuery || filterState.sector || filterState.minPay || filterState.maxExp;
    grid.innerHTML = `
      <div class="loading-container">
        <p>No job opportunities found matching your criteria.</p>
        ${hasActiveFilters ? `<button class="btn btn-secondary" onclick="resetFilters()">Reset Filters & Search</button>` : ''}
      </div>`;
    return;
  }
const isHome = window.location.pathname.includes('home.html');
  jobs.forEach(job => {
    const card = document.createElement('div');
    card.className = 'job-card';

    const maxLen = 110;
    const isLong = job.description && job.description.length > maxLen;
    const shortDesc = isLong
      ? job.description.substring(0, maxLen).trim() + '...' 
      : (job.description || '');

    const initial = job.company ? job.company.charAt(0).toUpperCase() : 'K';

    card.innerHTML = `
      <div>
        <div class="job-card-top">
          <div class="company-avatar">${escapeHtml(initial)}</div>
          <div class="job-meta-header">
            <h3 class="job-title">${escapeHtml(job.role)}</h3>
            <div class="job-company">${escapeHtml(job.company)}</div>
          </div>
        </div>
        <div class="badge-container">
          <span class="badge">💼 ${escapeHtml(job.sector)}</span>
          <span class="badge">⏳ ${escapeHtml(job.experience)}</span>
          <span class="badge badge-pay">💰 ${escapeHtml(job.pay)}</span>
        </div>
        <div class="job-desc-preview">
          ${escapeHtml(shortDesc)}
          ${isLong ? `<button type="button" class="read-more-btn" onclick="openDetailModal('${job.id}')">Read More &rarr;</button>` : ''}
        </div>
      </div>
      <div class="card-footer">
        <span class="job-date">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 16 14"/></svg>
          ${job.date ? new Date(job.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
        </span>
        ${isHome 
          ? `<a href="${escapeHtml(job.link)}" target="_blank" rel="noopener" class="btn btn-primary">Apply</a>` 
          : `<button type="button" class="btn btn-secondary" onclick="openEditModal('${job.id}')">✏️</button>`
        }
      </div>
    `;
    grid.appendChild(card);
  });
}

function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterState.searchQuery = e.target.value.toLowerCase().trim();
      applyCombinedFilters();
    });
  }

  const jobForm = document.getElementById('jobForm');
  if (jobForm) {
    jobForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = {
        id: editingJobId,
        role: document.getElementById('role').value,
        company: document.getElementById('company').value,
        sector: document.getElementById('sector').value,
        experience: document.getElementById('experience').value,
        pay: document.getElementById('pay').value,
        description: document.getElementById('description').value,
        link: document.getElementById('link').value
      };

      closeModal();
      showSkeletonLoader(document.getElementById('jobsGrid'));

      try {
        await fetch(WEB_APP_URL, {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        fetchJobs();
      } catch (err) {
        console.error('Error saving job:', err);
        alert('Failed to save job listing.');
        fetchJobs();
      }
    });
  }
}
function setupModalBackdropListeners() {
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAllModals();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

function closeAllModals() {
  closeModal();
  closeDetailModal();
  closeFilterModal();
}

function openAddModal() {
  editingJobId = null;
  const titleEl = document.getElementById('modalTitle');
  const formEl = document.getElementById('jobForm');
  if (titleEl) titleEl.innerText = 'Post New Job';
  if (formEl) formEl.reset();
  
  const modal = document.getElementById('jobModal');
  if (modal) modal.classList.add('active');
}

function openEditModal(id) {
  editingJobId = id;
  const job = allJobs.find(j => j.id === id);
  if (!job) return;

  const titleEl = document.getElementById('modalTitle');
  if (titleEl) titleEl.innerText = 'Edit Job Listing';

  document.getElementById('role').value = job.role || '';
  document.getElementById('company').value = job.company || '';
  document.getElementById('sector').value = job.sector || '';
  document.getElementById('experience').value = job.experience || '';
  document.getElementById('pay').value = job.pay || '';
  document.getElementById('description').value = job.description || '';
  document.getElementById('link').value = job.link || '';

  const modal = document.getElementById('jobModal');
  if (modal) modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('jobModal');
  if (modal) modal.classList.remove('active');
}

function openFilterModal() {
  const modal = document.getElementById('filterModal');
  if (modal) modal.classList.add('active');
}

function closeFilterModal() {
  const modal = document.getElementById('filterModal');
  if (modal) modal.classList.remove('active');
}
function openDetailModal(id) {
  const job = allJobs.find(j => j.id === id);
  if (!job) return;

  const initial = job.company ? job.company.charAt(0).toUpperCase() : 'K';
  document.getElementById('detailAvatar').innerText = initial;
  document.getElementById('detailRole').innerText = job.role || 'Job Details';
  document.getElementById('detailCompany').innerText = job.company || '';
  
  document.getElementById('detailMetrics').innerHTML = `
    <div class="metric-box">
      <div class="metric-icon">💰</div>
      <div>
        <div class="metric-label">Salary / Pay</div>
        <div class="metric-value">${escapeHtml(job.pay)}</div>
      </div>
    </div>
    <div class="metric-box">
      <div class="metric-icon">⌛</div>
      <div>
        <div class="metric-label">Experience</div>
        <div class="metric-value">${escapeHtml(job.experience)}</div>
      </div>
    </div>
    <div class="metric-box">
      <div class="metric-icon">🏢</div>
      <div>
        <div class="metric-label">Sector</div>
        <div class="metric-value">${escapeHtml(job.sector)}</div>
      </div>
    </div>
    <div class="metric-box">
      <div class="metric-icon">📅</div>
      <div>
        <div class="metric-label">Posted Date</div>
        <div class="metric-value">${job.date ? new Date(job.date).toLocaleDateString() : 'N/A'}</div>
      </div>
    </div>
  `;

  document.getElementById('detailDescription').innerText = job.description || 'No detailed description provided.';
const isHome = window.location.pathname.includes('home.html');
  document.getElementById('detailFooter').innerHTML = isHome 
    ? `<button type="button" class="btn btn-secondary" onclick="closeDetailModal()">Close</button>
       <a href="${escapeHtml(job.link)}" target="_blank" rel="noopener" class="btn btn-primary btn-lg">Apply ↗</a>`
    : `<button type="button" class="btn btn-secondary" onclick="closeDetailModal()">Close</button>
       <button type="button" class="btn btn-primary" onclick="closeDetailModal(); openEditModal('${job.id}');">✏️</button>`;

  const modal = document.getElementById('detailModal');
  if (modal) modal.classList.add('active');
}

function closeDetailModal() {
  const modal = document.getElementById('detailModal');
  if (modal) modal.classList.remove('active');
}
function applyFilters() {
  closeFilterModal();
  
  const sectorInput = document.getElementById('filterSector');
  const minPayInput = document.getElementById('filterMinPay');
  const maxExpInput = document.getElementById('filterMaxExp');
  const sortSelect = document.getElementById('sortBy');

  filterState.sector = sectorInput ? sectorInput.value.toLowerCase().trim() : '';
  filterState.minPay = minPayInput && minPayInput.value !== '' ? parseFloat(minPayInput.value) : null;
  filterState.maxExp = maxExpInput && maxExpInput.value !== '' ? parseFloat(maxExpInput.value) : null;
  filterState.sortBy = sortSelect ? sortSelect.value : '';

  updateFilterBadge();
  applyCombinedFilters();
}

function resetFilters() {
  const sectorInput = document.getElementById('filterSector');
  const minPayInput = document.getElementById('filterMinPay');
  const maxExpInput = document.getElementById('filterMaxExp');
  const sortSelect = document.getElementById('sortBy');
  const searchInput = document.getElementById('searchInput');

  if (sectorInput) sectorInput.value = '';
  if (minPayInput) minPayInput.value = '';
  if (maxExpInput) maxExpInput.value = '';
  if (sortSelect) sortSelect.value = '';
  if (searchInput) searchInput.value = '';

  filterState.searchQuery = '';
  filterState.sector = '';
  filterState.minPay = null;
  filterState.maxExp = null;
  filterState.sortBy = '';

  updateFilterBadge();
  closeFilterModal();
  applyCombinedFilters();
}

function updateFilterBadge() {
  const badge = document.getElementById('activeFilterBadge');
  if (!badge) return;
  const hasFilters = filterState.sector || filterState.minPay !== null || filterState.maxExp !== null || filterState.sortBy;
  if (hasFilters) {
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function applyCombinedFilters() {
  let filtered = allJobs.filter(j => {
    if (filterState.searchQuery) {
      const q = filterState.searchQuery;
      const matchRole = j.role && j.role.toLowerCase().includes(q);
      const matchCompany = j.company && j.company.toLowerCase().includes(q);
      const matchSector = j.sector && j.sector.toLowerCase().includes(q);
      const matchDesc = j.description && j.description.toLowerCase().includes(q);
      if (!matchRole && !matchCompany && !matchSector && !matchDesc) return false;
    }

    if (filterState.sector) {
      if (!j.sector || !j.sector.toLowerCase().includes(filterState.sector)) return false;
    }

    if (filterState.minPay !== null && !isNaN(filterState.minPay)) {
      const maxPayOfJob = parseMaxPay(j.pay);
      if (maxPayOfJob < filterState.minPay) return false;
    }

    if (filterState.maxExp !== null && !isNaN(filterState.maxExp)) {
      const minExpOfJob = parseMinExp(j.experience);
      if (minExpOfJob > filterState.maxExp) return false;
    }

    return true;
  });

  if (filterState.sortBy === 'date-desc') {
    filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  } else if (filterState.sortBy === 'date-asc') {
    filtered.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  } else if (filterState.sortBy === 'pay-high') {
    filtered.sort((a, b) => parseMaxPay(b.pay) - parseMaxPay(a.pay));
  } else if (filterState.sortBy === 'pay-low') {
    filtered.sort((a, b) => parseMaxPay(a.pay) - parseMaxPay(b.pay));
  }

  renderJobs(filtered);
}
function parseMaxPay(payStr) {
  if (!payStr) return 0;
  const matches = payStr.match(/\d+(\.\d+)?/g);
  if (!matches) return 0;
  return Math.max(...matches.map(Number));
}

function parseMinExp(expStr) {
  if (!expStr) return 0;
  const matches = expStr.match(/\d+(\.\d+)?/g);
  if (!matches) return 0;
  return Math.min(...matches.map(Number));
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
