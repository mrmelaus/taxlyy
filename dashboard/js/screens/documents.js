// ============================================
// screens/documents.js
// Document Vault - Read-only archive for ATO compliance
// Uses Taxlyy CSS variables (--surface, --text, --border, etc.)
// ============================================
function buildDocuments() {
  return `
    <div class="screen" id="screen-documents">
      <div id="documents-container"></div>
    </div>
  `;
}

window.buildDocuments = buildDocuments;

const Documents = (function() {
  'use strict';

  // In-memory storage (will be replaced by Supabase)
  let documents = [];
  let currentPath = '/';
  let currentType = null;
  let currentYear = null;
  let currentMonth = null;

  // Folder configuration
  const folders = {
    receipts: { name: 'Receipts', icon: '📁', canRename: true, canDelete: false, canMove: false },
    invoices: { name: 'Invoices', icon: '📑', canRename: false, canDelete: true, canMove: false },
    bas: { name: 'BAS Reports', icon: '📊', canRename: false, canDelete: false, canMove: false },
    annual: { name: 'Annual Reports', icon: '📋', canRename: false, canDelete: false, canMove: false }
  };

  // Initialize
  function init() {
    loadMockData(); // Will be replaced by Supabase
    render();
  }

  // Mock data for testing (remove when Supabase ready)
  function loadMockData() {
    if (documents.length === 0) {
      documents = [
        {
          id: '1',
          type: 'receipts',
          year: '2024',
          month: 'March',
          filename: 'sushi-sushi-2024-03-22.jpg',
          displayName: 'Client lunch - Sushi Sushi',
          amount: 18.58,
          date: '2024-03-22',
          size: 45.2,
          status: 'confirmed',
          createdAt: '2024-03-22'
        },
        {
          id: '2',
          type: 'receipts',
          year: '2024',
          month: 'March',
          filename: 'officeworks-2024-03-15.jpg',
          displayName: 'Office supplies - Officeworks',
          amount: 49.95,
          date: '2024-03-15',
          size: 38.1,
          status: 'confirmed',
          createdAt: '2024-03-15'
        },
        {
          id: '3',
          type: 'receipts',
          year: '2024',
          month: 'April',
          filename: 'uber-business-2024-04-10.jpg',
          displayName: 'Uber to client meeting',
          amount: 23.50,
          date: '2024-04-10',
          size: 28.4,
          status: 'confirmed',
          createdAt: '2024-04-10'
        },
        {
          id: '4',
          type: 'invoices',
          year: '2024',
          month: 'December',
          filename: 'INV-20241215-001.pdf',
          clientName: 'ABC Corp',
          amount: 1250.00,
          status: 'sent',
          createdAt: '2024-12-15'
        },
        {
          id: '5',
          type: 'bas',
          year: '2024',
          quarter: 'Q4',
          filename: 'BAS-Q4-2024.pdf',
          status: 'signed',
          createdAt: '2024-10-28'
        },
        {
          id: '6',
          type: 'annual',
          year: '2024',
          filename: 'TaxReturn-2024.pdf',
          status: 'signed',
          createdAt: '2024-07-15'
        }
      ];
    }
  }

  // Get documents by type/year/month
  function getDocuments(type, year = null, month = null) {
    let filtered = documents.filter(doc => doc.type === type);
    if (year) filtered = filtered.filter(doc => doc.year === year);
    if (month) filtered = filtered.filter(doc => doc.month === month);
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Get available years
  function getYears(type) {
    const years = [...new Set(documents.filter(doc => doc.type === type).map(doc => doc.year))];
    return years.sort().reverse();
  }

  // Get available months for a year
  function getMonths(type, year) {
    const months = [...new Set(documents.filter(doc => doc.type === type && doc.year === year).map(doc => doc.month))];
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
  }

  // Rename receipt
  function renameReceipt(id, newName, callback) {
    const doc = documents.find(d => d.id === id);
    if (!doc || doc.type !== 'receipts') {
      if (callback) callback('error', 'Document not found or cannot be renamed');
      return;
    }

    // Check for duplicate in same folder
    const duplicate = documents.find(d => 
      d.type === 'receipts' && 
      d.year === doc.year && 
      d.month === doc.month && 
      d.displayName === newName &&
      d.id !== id
    );

    if (duplicate) {
      if (callback) callback('duplicate', newName);
      return;
    }

    doc.displayName = newName;
    if (callback) callback('success');
    render();
  }

  // Delete invoice (only if not paid - mock check)
  function deleteInvoice(id, callback) {
    const doc = documents.find(d => d.id === id);
    if (!doc || doc.type !== 'invoices') {
      if (callback) callback(false, 'Cannot delete this document');
      return;
    }

    // Mock check - in production, check if invoice is paid
    const isPaid = false; // Replace with actual check
    
    if (isPaid) {
      if (callback) callback(false, 'Cannot delete paid invoice');
      return;
    }

    documents = documents.filter(d => d.id !== id);
    if (callback) callback(true);
    render();
  }

  // Download document
  function downloadDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    
    // Mock download - in production, get file from Supabase Storage
    alert(`Downloading: ${doc.displayName || doc.filename}\n\n(Production: This will download the actual file from Supabase Storage)`);
  }

  // Batch export all documents
  function exportAll() {
    const exportData = documents.map(doc => ({
      type: doc.type,
      filename: doc.displayName || doc.filename,
      date: doc.createdAt,
      amount: doc.amount || null,
      status: doc.status
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taxlyy_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

    // Navigation - Simple parent/child relationship
    function navigateTo(type = null, year = null, month = null) {
    currentType = type;
    currentYear = year;
    currentMonth = month;
    render();
    }

    // Get parent level for back button
    function getParentLevel() {
    if (currentMonth) {
        // Has month → back to months view
        return { type: currentType, year: currentYear, month: null };
    } else if (currentYear) {
        // Has year → back to years view
        return { type: currentType, year: null, month: null };
    } else {
        // At root → back to main view
        return null;
    }
    }

  // Show rename modal
  function showRenameModal(id, currentName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <div class="modal-title">✏️ Rename Receipt</div>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 12px; font-size: 13px; color: var(--text2);">
            Renaming does not affect BAS calculations. ATO only cares about the receipt content, not the filename.
          </p>
          <div class="form-group">
            <label>File name</label>
            <input type="text" id="rename-input" class="form-input" value="${currentName.replace(/"/g, '&quot;')}" style="width: 100%;">
          </div>
          <div id="rename-error" style="color: var(--coral); font-size: 12px; margin-top: 8px;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="Documents.confirmRename('${id}')">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Confirm rename with duplicate check
  function confirmRename(id) {
    const input = document.getElementById('rename-input');
    const newName = input?.value.trim();
    const errorDiv = document.getElementById('rename-error');
    
    if (!newName) {
      if (errorDiv) errorDiv.textContent = 'Name cannot be empty';
      return;
    }

    renameReceipt(id, newName, (status, duplicateName) => {
      if (status === 'duplicate') {
        const suggestedName = newName.replace(/\.(jpg|jpeg|png)$/i, '');
        const extension = newName.match(/\.(jpg|jpeg|png)$/i)?.[0] || '';
        const newSuggested = `${suggestedName}(2)${extension}`;
        
        if (errorDiv) {
          errorDiv.innerHTML = `⚠️ "${newName}" already exists.<br>Suggested: "${newSuggested}"`;
        }
        
        // Add suggestion button
        const suggestionBtn = document.createElement('button');
        suggestionBtn.textContent = `Use "${newSuggested}"`;
        suggestionBtn.className = 'btn btn-small btn-secondary';
        suggestionBtn.style.marginTop = '8px';
        suggestionBtn.onclick = () => {
          input.value = newSuggested;
          errorDiv.innerHTML = '';
          confirmRename(id);
        };
        errorDiv.appendChild(suggestionBtn);
      } else if (status === 'success') {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
      }
    });
  }

  // Show delete confirmation for invoice
  function showDeleteModal(id, filename) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <div class="modal-title">🗑 Delete Invoice</div>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>${filename}</strong>?</p>
          <p style="font-size: 13px; color: var(--text2); margin-top: 8px;">Only unpaid invoices can be deleted.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn btn-danger" onclick="Documents.deleteInvoice('${id}'); this.closest('.modal-overlay').remove()">Delete</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Render main view
  function render() {
    const container = document.getElementById('documents-container');
    if (!container) return;
    
    if (!currentType) {
      container.innerHTML = renderMainView();
    } else if (currentType && !currentYear) {
      container.innerHTML = renderYearsView();
    } else if (currentType && currentYear && !currentMonth && currentType !== 'bas' && currentType !== 'annual') {
      container.innerHTML = renderMonthsView();
    } else {
      container.innerHTML = renderFilesView();
    }
    
    attachEvents();
  }

  function renderMainView() {
    return `
      <div class="documents-screen">
        <div class="documents-header">
          <div>
            <div class="documents-title">Document Vault</div>
            <div class="documents-subtitle">Archived documents for ATO compliance (7-year retention)</div>
          </div>
          <button class="btn btn-secondary" onclick="Documents.exportAll()">📎 Export All</button>
        </div>
        
        <div class="documents-grid">
          ${Object.entries(folders).map(([key, folder]) => `
            <div class="documents-folder" onclick="Documents.navigateTo('${key}')">
              <div class="documents-folder-icon">${folder.icon}</div>
              <div class="documents-folder-name">${folder.name}</div>
              <div class="documents-folder-count">${getDocuments(key).length} items</div>
              <div class="documents-folder-hint">${folder.canRename ? '✏️ Can rename' : '📄 Read-only'}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

    function renderYearsView() {
    const years = getYears(currentType);
    const folder = folders[currentType];
    
    return `
        <div class="documents-screen">
        <div class="documents-header">
            <button class="btn btn-ghost" onclick="Documents.goBack()">← Back</button>
            <div>
            <div class="documents-title">${folder.icon} ${folder.name}</div>
            <div class="documents-subtitle">${getDocuments(currentType).length} total items</div>
            </div>
        </div>
        
        <div class="documents-grid">
            ${years.map(year => `
            <div class="documents-folder" onclick="Documents.navigateTo('${currentType}', '${year}')">
                <div class="documents-folder-icon">📁</div>
                <div class="documents-folder-name">${year}</div>
                <div class="documents-folder-count">${getDocuments(currentType, year).length} items</div>
            </div>
            `).join('')}
        </div>
        </div>
    `;
}

    function renderMonthsView() {
    const months = getMonths(currentType, currentYear);
    
    return `
        <div class="documents-screen">
        <div class="documents-header">
            <button class="btn btn-ghost" onclick="Documents.goBack()">← Back</button>
            <div class="documents-title">${currentYear}</div>
        </div>
        
        <div class="documents-grid">
            ${months.map(month => `
            <div class="documents-folder" onclick="Documents.navigateTo('${currentType}', '${currentYear}', '${month}')">
                <div class="documents-folder-icon">📁</div>
                <div class="documents-folder-name">${month} ${currentYear}</div>
                <div class="documents-folder-count">${getDocuments(currentType, currentYear, month).length} items</div>
            </div>
            `).join('')}
        </div>
        </div>
    `;
    }
    function renderFilesView() {
    let docs = [];
    if (currentType === 'bas' || currentType === 'annual') {
        docs = getDocuments(currentType, currentYear);
    } else if (currentMonth) {
        docs = getDocuments(currentType, currentYear, currentMonth);
    } else {
        docs = getDocuments(currentType, currentYear);
    }
    
    const folder = folders[currentType];
    let title = currentYear;
    if (currentMonth) title = `${currentMonth} ${currentYear}`;
    
    return `
        <div class="documents-screen">
        <div class="documents-header">
            <button class="btn btn-ghost" onclick="Documents.goBack()">← Back</button>
            <div class="documents-title">${title}</div>
            <div class="documents-subtitle">${docs.length} items</div>
        </div>
        
        <div class="documents-file-list">
            ${docs.map(doc => `
            <div class="documents-file-item">
                <div class="documents-file-icon">${doc.type === 'receipts' ? '📄' : (doc.type === 'invoices' ? '📑' : '📊')}</div>
                <div class="documents-file-info">
                <div class="documents-file-name">${doc.displayName || doc.filename}</div>
                <div class="documents-file-meta">
                    ${doc.date || doc.createdAt} · 
                    ${doc.amount ? `$${doc.amount.toFixed(2)} · ` : ''}
                    ${doc.size ? `${doc.size} KB · ` : ''}
                    ${doc.status || 'archived'}
                </div>
                </div>
                <div class="documents-file-actions">
                <button class="btn-icon" onclick="Documents.downloadDocument('${doc.id}')" title="Download">⬇️</button>
                ${folder.canRename ? `<button class="btn-icon" onclick="Documents.showRenameModal('${doc.id}', '${(doc.displayName || doc.filename).replace(/'/g, "\\'")}')" title="Rename">✏️</button>` : ''}
                ${folder.canDelete ? `<button class="btn-icon" onclick="Documents.showDeleteModal('${doc.id}', '${(doc.displayName || doc.filename).replace(/'/g, "\\'")}')" title="Delete">🗑</button>` : ''}
                <button class="btn-icon" onclick="Documents.viewDocument('${doc.id}')" title="View">👁️</button>
                </div>
            </div>
            `).join('')}
        </div>
        </div>
    `;
    }

  function viewDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    alert(`Viewing: ${doc.displayName || doc.filename}\n\n(Production: This will open the file from Supabase Storage)`);
  }

  function attachEvents() {
    // Events are handled by inline onclick
  }
  // Simple back navigation - goes to parent level
    function goBack() {
    const parent = getParentLevel();
    if (parent === null) {
        // At root, go to main view
        currentType = null;
        currentYear = null;
        currentMonth = null;
    } else {
        currentType = parent.type;
        currentYear = parent.year;
        currentMonth = parent.month;
    }
    render();
    }

  // Public API
  return {
    init,
    navigateTo,
    goBack,
    renameReceipt,
    confirmRename,
    showRenameModal,
    deleteInvoice,
    showDeleteModal,
    downloadDocument,
    exportAll,
    viewDocument
  };

})();

// Auto-initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Documents.init());
} else {
  Documents.init();
}

