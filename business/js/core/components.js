/* ─────────────────────────────────────────
   components.js
   Shared HTML builder functions.
   Each returns an HTML string or DOM node.
───────────────────────────────────────── */

var UI = {

  /* Format currency */
  currency(amount) {
    return '$' + Number(amount).toLocaleString('en-AU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  },

  /* Format currency with cents */
  currencyFull(amount) {
    return '$' + Number(amount).toLocaleString('en-AU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  },

  /* Status badge */
  badge(status) {
    const map = {
      paid:      ['badge-green',  'Paid'],
      pending:   ['badge-gold',   'Pending'],
      overdue:   ['badge-coral',  'Overdue'],
      draft:     ['badge-gray',   'Draft'],
      confirmed: ['badge-green',  'Confirmed'],
      review:    ['badge-gold',   'Needs review'],
    };
    const [cls, label] = map[status] || ['badge-gray', status];
    return `<span class="badge ${cls}">${label}</span>`;
  },

  /* Days-left badge */
  daysLeftBadge(days) {
    if (days <= 14)  return `<span class="badge badge-coral">${days} days</span>`;
    if (days <= 30)  return `<span class="badge badge-gold">${days} days</span>`;
    return `<span class="badge badge-teal">${days} days</span>`;
  },

  /* Amount with colour class */
  amount(value, type = '') {
    return `<span class="amount ${type}">${UI.currency(value)}</span>`;
  },

  /* Stat card */
  statCard({ label, value, change, changeType = '', variant = '' }) {
    return `
      <div class="stat-card ${variant}">
        <div class="stat-label">${label}</div>
        <div class="stat-value">${value}</div>
        ${change ? `<div class="stat-change ${changeType}">${change}</div>` : ''}
      </div>
    `;
  },

  /* Progress bar row */
  progressRow({ label, amount, pct }) {
    return `
      <div class="ring-wrap">
        <span class="ring-label">${label}</span>
        <div class="ring-bar">
          <div class="ring-bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="ring-pct">${UI.currency(amount)}</span>
      </div>
    `;
  },

  /* Chart bars (paired income/expense per month) */
  chartBars(labels, income, expenses) {
    const maxVal = Math.max(...income, ...expenses);
    return labels.map((label, i) => {
      const incH  = Math.round((income[i]   / maxVal) * 90);
      const expH  = Math.round((expenses[i] / maxVal) * 90);
      return `
        <div class="chart-month-group">
          <div class="chart-bar">
            <div class="chart-bar-fill income"  style="height:${incH}%"></div>
          </div>
          <div class="chart-bar">
            <div class="chart-bar-fill expense" style="height:${expH}%"></div>
          </div>
        </div>
      `;
    }).join('') + `
      <div style="position:absolute;bottom:0;left:0;right:0;display:flex;gap:0">
        ${labels.map(l => `<div style="flex:1;font-size:8px;color:var(--text3);text-align:center">${l}</div>`).join('')}
      </div>
    `;
  },

  /* Due date item */
  dueItem({ day, month, title, sub, daysLeft, urgency }) {
    const boxStyle = urgency === 'soon'
      ? 'border-color:var(--gold);background:var(--gold-dim)'
      : '';
    const subClass = urgency === 'soon'   ? 'due-soon'
                   : urgency === 'urgent' ? 'due-urgent'
                   : '';
    return `
      <div class="due-item">
        <div class="due-date-box" style="${boxStyle}">
          <div class="due-day ${subClass}">${day}</div>
          <div class="due-mon">${month}</div>
        </div>
        <div class="due-info">
          <div class="due-title">${title}</div>
          <div class="due-sub ${subClass}">${sub}</div>
        </div>
        ${UI.daysLeftBadge(daysLeft)}
      </div>
    `;
  },

  /* Invoice table row */
  invoiceRow(inv) {
    const amtClass = inv.status === 'paid'    ? 'income'
                   : inv.status === 'overdue' ? 'overdue'
                   : 'pending';
    return `
      <tr>
        <td>${inv.client}</td>
        <td style="color:var(--text3)">${inv.id}</td>
        <td>${inv.issued}</td>
        <td>${inv.due}</td>
        <td><span class="amount ${amtClass}">${UI.currency(inv.amountIncGst)}</span></td>
        <td style="color:var(--text3)">${UI.currency(inv.gst)}</td>
        <td>${UI.badge(inv.status)}</td>
        <td><button class="btn btn-ghost btn-sm">${inv.status === 'draft' ? 'Edit' : 'View'}</button></td>
      </tr>
    `;
  },

  /* Checklist item */
  checkItem(text, state = 'done') {
    const styles = {
      done:    'background:var(--green-dim);border:1.5px solid var(--green);color:var(--green)',
      warn:    'background:var(--gold-dim);border:1.5px solid var(--gold);color:var(--gold)',
      pending: 'background:var(--surface3);border:1.5px solid var(--border);color:var(--text3)',
    };
    const icons = { done: '✓', warn: '!', pending: '–' };
    return `
      <div style="display:flex;align-items:center;gap:10px;font-size:12px">
        <div style="width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;${styles[state]}">${icons[state]}</div>
        <span style="color:${state === 'warn' ? 'var(--gold)' : state === 'pending' ? 'var(--text3)' : 'var(--text2)'}">${text}</span>
      </div>
    `;
  },

  /* Toggle row */
  toggleRow({ title, desc, on, id }) {
    return `
      <div class="toggle-row">
        <div class="toggle-info">
          <div class="toggle-title">${title}</div>
          <div class="toggle-desc">${desc}</div>
        </div>
        <div class="toggle ${on ? 'on' : ''}" id="toggle-${id}" onclick="this.classList.toggle('on')"></div>
      </div>
    `;
  },

};