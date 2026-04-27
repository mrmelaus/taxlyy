// ============================================
// features/category-guide.js
// ATO Category Rules, Validation, and UI Components
// ============================================

const CategoryGuide = (function() {
  'use strict';

  // Category rules based on ATO legislation
  const categoryRules = {
    'Meals & entertainment': {
      canChangeTo: ['Travel', 'Not deductible'],
      tooltip: '🍽️ 50% deductible for business meals with clients or while traveling overnight',
      explanation: 'Food/meals can only be claimed as business meals (50%) or travel meals (100%)',
      icon: '🍽️',
      atoLink: 'https://www.ato.gov.au/individuals/income-deductions-offsets/income-other/meals-and-entertainment/'
    },
    'Travel': {
      canChangeTo: ['Meals & entertainment', 'Not deductible'],
      tooltip: '✈️ Flights, accommodation, taxis, ubers - 100% deductible for business travel',
      explanation: 'Travel expenses have their own category and cannot be claimed elsewhere',
      icon: '✈️',
      atoLink: 'https://www.ato.gov.au/individuals/income-deductions-offsets/deductions/vehicle-and-travel-expenses/travel-expenses/'
    },
    'Office supplies': {
      canChangeTo: ['D5 — Other deductions', 'Not deductible'],
      tooltip: '📄 Stationery, paper, printer ink - 100% deductible',
      explanation: 'Small office items can go to D5 if needed',
      icon: '📄',
      atoLink: 'https://www.ato.gov.au/individuals/income-deductions-offsets/deductions/office-and-stationery-expenses/'
    },
    'Equipment': {
      canChangeTo: ['D5 — Other deductions', 'Not deductible'],
      tooltip: '🖥️ Computers, laptops, monitors over $300 - depreciate over time',
      explanation: 'Equipment over $300 must be depreciated, not claimed as office supplies',
      icon: '🖥️',
      atoLink: 'https://www.ato.gov.au/individuals/income-deductions-offsets/deductions/depreciating-assets/'
    },
    'Software & subscriptions': {
      canChangeTo: ['D5 — Other deductions', 'Not deductible'],
      tooltip: '💻 Adobe, Microsoft 365, Zoom - 100% deductible',
      explanation: 'Software subscriptions can go to D5 if not claimed elsewhere',
      icon: '💻',
      atoLink: 'https://www.ato.gov.au/individuals/income-deductions-offsets/deductions/other-work-related-expenses/software-subscriptions/'
    },
    'D5 — Other deductions': {
      canChangeTo: ['Office supplies', 'Software & subscriptions', 'Not deductible'],
      tooltip: '📝 Union fees, tools under $300, protective gear, phone/internet',
      explanation: 'D5 has specific rules - entertainment and travel cannot go here',
      icon: '📝',
      atoLink: 'https://www.ato.gov.au/individuals/income-deductions-offsets/deductions/other-work-related-expenses/'
    },
    'Not deductible': {
      canChangeTo: ['Meals & entertainment', 'Travel', 'Office supplies', 'Equipment', 'Software & subscriptions', 'D5 — Other deductions'],
      tooltip: '🚫 Personal expense - will be DELETED from Taxlyy',
      explanation: 'Change category if this is actually for business',
      icon: '🚫',
      atoLink: null
    }
  };

  // Common mistakes that cannot be claimed
  const commonMistakes = [
    '☕ Coffee and lunch (unless business meeting with client)',
    '🏋️ Gym memberships and fitness classes',
    '👕 Regular clothing (even if worn to work - needs logo/uniform)',
    '👶 Childcare and education expenses',
    '💰 Fines and penalties',
    '📱 Private portion of phone/internet (estimate 20-30% personal)',
    '🚗 Regular commute to/from work (home to office)'
  ];

  // Helpful tips for empty state
  const deductionTips = [
    '💡 You can claim up to $300 for tools and equipment immediately without depreciation',
    '💡 Keep receipts for all expenses over $10 - ATO may request evidence',
    '💡 Home office running costs: 67c per hour for 2024-25 financial year',
    '💡 Meals with clients are 50% deductible - keep diary notes of who and why',
    '💡 Phone and internet: claim work percentage (e.g., 70% business use)',
    '💡 Depreciate assets over $300 over effective life (e.g., laptop 2-3 years)',
    '💡 Protective gear (hard hats, safety glasses) is 100% deductible',
    '💡 Union and professional fees are fully deductible under D5'
  ];

  // Validation function
  function isValidCategoryChange(fromCategory, toCategory) {
    if (fromCategory === toCategory) return true;
    if (toCategory === 'Not deductible') return true;
    return categoryRules[fromCategory]?.canChangeTo.includes(toCategory) || false;
  }

  // Show warning for invalid category change
  function showInvalidCategoryWarning(fromCategory, toCategory, onEditCategory) {
    const rule = categoryRules[fromCategory];
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width: 450px;">
        <div class="modal-header">
          <div class="modal-title">⚠️ Invalid Category Change</div>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div style="background: var(--alert-bg); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
            <strong>"${fromCategory}" cannot be changed to "${toCategory}"</strong>
          </div>
          <div style="margin-bottom: 16px;">
            ${rule?.explanation || 'Please select a valid category for this expense type.'}
          </div>
          <div style="font-size: 13px; color: var(--text2);">
            <strong>Valid options for ${fromCategory}:</strong><br>
            ${rule?.canChangeTo.map(cat => `• ${cat}`).join('<br>') || '• Not deductible'}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="onEditCategory(); this.closest('.modal-overlay').remove()">✏️ Edit Category</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Show ATO Guide Modal
  function showATOGuide() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
        <div class="modal-header">
          <div class="modal-title">📚 ATO Deduction Guide</div>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 12px;">📋 Category Quick Guide</h3>
            ${Object.entries(categoryRules).map(([cat, rule]) => `
              <div style="margin-bottom: 16px; padding: 12px; background: var(--surface2); border-radius: 8px;">
                <div style="font-weight: 600; margin-bottom: 4px;">${rule.icon} ${cat}</div>
                <div style="font-size: 12px; color: var(--text2);">${rule.tooltip}</div>
                ${rule.atoLink ? `<a href="${rule.atoLink}" target="_blank" style="font-size: 11px; color: var(--brand); margin-top: 4px; display: inline-block;">🔗 ATO official guide →</a>` : ''}
              </div>
            `).join('')}
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 12px;">⚠️ Common Mistakes (Not Deductible)</h3>
            <div style="background: var(--coral-dim); padding: 12px; border-radius: 8px;">
              ${commonMistakes.map(mistake => `<div style="margin-bottom: 6px; font-size: 13px;">${mistake}</div>`).join('')}
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 12px;">🔗 Official ATO Resources</h3>
            <div style="background: var(--surface2); padding: 12px; border-radius: 8px;">
              <div><a href="https://www.ato.gov.au/individuals/income-deductions-offsets/deductions/" target="_blank" style="color: var(--brand);">• Work-related expenses overview</a></div>
              <div><a href="https://www.ato.gov.au/individuals/income-deductions-offsets/deductions/other-work-related-expenses/" target="_blank" style="color: var(--brand);">• D5 Other deductions</a></div>
              <div><a href="https://www.ato.gov.au/individuals/income-deductions-offsets/deductions/depreciating-assets/" target="_blank" style="color: var(--brand);">• Depreciation of assets</a></div>
              <div><a href="https://www.ato.gov.au/individuals/income-deductions-offsets/deductions/home-office-expenses/" target="_blank" style="color: var(--brand);">• Home office expenses</a></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Got it</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function getAllTips() {
  return deductionTips;  // Returns the full array of all tips
    }

    // Public API
    return {
    categoryRules,
    commonMistakes,
    deductionTips,
    isValidCategoryChange,
    showInvalidCategoryWarning,
    showATOGuide,
    getAllTips  // NEW: returns all tips
    };

    })();

// Make available globally
window.CategoryGuide = CategoryGuide;