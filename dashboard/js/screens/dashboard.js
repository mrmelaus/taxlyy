/* ─────────────────────────────────────────
   js/screens/dashboard.js
───────────────────────────────────────── */

function buildDashboard() {
  const s     = AppData.summary;
  const chart = AppData.monthlyChart;
  const maxVal = Math.max(...chart.income, ...chart.expenses);

  const bannerState = getBasBannerState();
  const showBanner  = bannerState.show;
  const daysLeft    = s.gstDaysLeft;

  let bannerClass = 'banner-normal';
  let icon        = '🕐';

  if (daysLeft <= 0) {
    bannerClass = 'banner-overdue';  icon = '⚡';
  } else if (daysLeft <= 6) {
    bannerClass = 'banner-critical'; icon = '🔴';
  } else if (daysLeft <= 14) {
    bannerClass = 'banner-urgent';   icon = '⚠️';
  } else if (daysLeft <= 29) {
    bannerClass = 'banner-warning';  icon = '⏰';
  } else {
    bannerClass = 'banner-normal';   icon = '🕐';
  }

  const html = `
    <div class="screen" id="screen-dashboard">

      <!-- ══ BAS BANNER ══ -->
      ${showBanner ? `
        <div id="bas-banner" class="${bannerClass}" role="alert" aria-live="polite">
          <div class="banner-inner">
            <div class="banner-icon" aria-hidden="true">${icon}</div>
            <div class="banner-content">
              <div class="banner-title">
                <span>
                  ${daysLeft <= 0
                    ? 'BAS OVERDUE — ACTION REQUIRED'
                    : `BAS Q3 (Jan–Mar 2025) due in ${daysLeft} days`}
                  &nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;
                  Due ${s.gstDueDate}
                  &nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;
                  GST owing ${UI.currencyFull(s.gstOwing)}
                  &nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;
                  Q3 Jan–Mar 2025
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </span>
              </div>
            </div>
            <div class="banner-actions">
              <button class="banner-btn banner-btn-ghost"
                onclick="basBannerRemindLater()"
                onkeypress="if(event.key==='Enter') basBannerRemindLater()"
                tabindex="0">Remind later</button>
              <button class="banner-btn banner-btn-ghost"
                onclick="basBannerDismiss()"
                onkeypress="if(event.key==='Enter') basBannerDismiss()"
                tabindex="0">✕ Dismiss</button>
              <button class="banner-btn banner-btn-primary"
                onclick="Router.go('bas')"
                onkeypress="if(event.key==='Enter') Router.go('bas')"
                tabindex="0">View BAS →</button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- ══ STAT CARDS ══ -->
      <div class="stats-grid">
        ${UI.statCard({ label:'Total income (FY)', value: UI.currencyFull(s.grossIncome),   change:'↑ 18% vs last year',           changeType:'up',   variant:'positive' })}
        ${UI.statCard({ label:'Total expenses',    value: UI.currencyFull(s.totalExpenses), change:'↓ 4% — good control',          changeType:'up'   })}
        ${UI.statCard({ label:'Net profit',        value: UI.currencyFull(s.netProfit),     change:'↑ 27% vs last year',           changeType:'up',   variant:'positive' })}
        ${UI.statCard({ label:'GST owing (Q3)',    value: UI.currencyFull(s.gstOwing),      change:`⚠ Due in ${s.gstDaysLeft} days`, changeType:'warn', variant:'warning'  })}
      </div>

      <div class="grid-2-1">

        <!-- Income vs expenses chart -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Income vs expenses</div>
              <div class="card-sub">Monthly — FY ${s.fy}</div>
            </div>
            <select class="form-input" style="width:auto;padding:4px 10px" aria-label="Chart period">
              <option>Monthly</option><option>Quarterly</option>
            </select>
          </div>
          <div class="card-body">
            <div style="display:flex;gap:12px;margin-bottom:14px">
              <div style="display:flex;align-items:center;gap:5px;color:var(--text3)">
                <div style="width:8px;height:8px;border-radius:2px;background:var(--green)"></div>Income
              </div>
              <div style="display:flex;align-items:center;gap:5px;color:var(--text3)">
                <div style="width:8px;height:8px;border-radius:2px;background:var(--coral)"></div>Expenses
              </div>
            </div>
            <div style="display:flex;gap:6px;align-items:flex-end;height:120px;position:relative">
              ${chart.labels.map((label, i) => {
                const incH = Math.round((chart.income[i]   / maxVal) * 90);
                const expH = Math.round((chart.expenses[i] / maxVal) * 90);
                return `
                  <div class="chart-month-group">
                    <div class="chart-bar"><div class="chart-bar-fill income"  style="height:${incH}%"></div></div>
                    <div class="chart-bar"><div class="chart-bar-fill expense" style="height:${expH}%"></div></div>
                  </div>
                `;
              }).join('')}
            </div>
            <div style="display:flex;gap:6px;margin-top:6px">
              ${chart.labels.map(l =>
                `<div style="flex:1;color:var(--text3);text-align:center">${l}</div>`
              ).join('')}
            </div>
          </div>
        </div>

        <!-- Right column -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <div class="card">
            <div class="card-header">
              <div class="card-title">Top expense categories</div>
              <button class="btn btn-ghost btn-sm" 
                onclick="Router.go('expenses')"
                onkeypress="if(event.key==='Enter') Router.go('expenses')"
                tabindex="0">View all →</button>
            </div>
            <div class="card-body" style="padding:14px 16px">
              <div style="display:flex;flex-direction:column;gap:10px">
                ${AppData.expenseCategories.map(cat => UI.progressRow(cat)).join('')}
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><div class="card-title">Recent activity</div></div>
            <div class="card-body" style="padding:14px 16px">
              <div style="color:var(--text3);text-align:center;padding:20px">
                Quick actions and recent updates will appear here
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ══ RECENT INVOICES + DUE DATES ══ -->
      <div class="grid-2">

        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Recent invoices</div>
              <div class="card-sub">Last 30 days</div>
            </div>
            <button class="btn btn-ghost btn-sm"
              onclick="Router.go('invoices')"
              onkeypress="if(event.key==='Enter') Router.go('invoices')"
              tabindex="0">View all</button>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Client</th><th>Invoice #</th><th>Amount</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${AppData.invoices.slice(0,4).map(inv => `
                <tr>
                  <td>${inv.client}</td>
                  <td style="color:var(--text3)">${inv.id}</td>
                  <td>${UI.amount(inv.amountIncGst,
                    inv.status === 'paid'    ? 'income'  :
                    inv.status === 'overdue' ? 'overdue' : 'pending')}</td>
                  <td>${UI.badge(inv.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">ATO due dates</div></div>
          <div class="card-body" style="padding:12px 20px">
            ${AppData.dueDates.map(d => UI.dueItem(d)).join('')}
          </div>
        </div>

      </div>
    </div>
  `;

  // Init marquee after render
  setTimeout(function() { initBasBannerMarquee(); }, 100);

  return html;
}

/* ════════════════════════════════════════
   BAS Banner — state + actions
════════════════════════════════════════ */

function getBasBannerState() {
  const defaultState = { show: true, remindLaterUntil: null, dismissedUntilNextBas: false };
  try {
    const saved = localStorage.getItem('bas-banner-state');
    if (!saved) return defaultState;
    const state = JSON.parse(saved);
    if (state.remindLaterUntil && new Date() < new Date(state.remindLaterUntil)) {
      return { ...state, show: false };
    }
    if (state.dismissedUntilNextBas) {
      return { ...state, show: false };
    }
    return { ...state, show: true };
  } catch (e) {
    return defaultState;
  }
}

function basBannerRemindLater() {
  localStorage.setItem('bas-banner-state', JSON.stringify({
    show:                   false,
    remindLaterUntil:       new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    dismissedUntilNextBas:  false,
  }));
  hideBasBanner();
}

function basBannerDismiss() {
  localStorage.setItem('bas-banner-state', JSON.stringify({
    show:                   false,
    remindLaterUntil:       null,
    dismissedUntilNextBas:  true,
  }));
  hideBasBanner();
}

function showBasBanner() {
  const banner = document.getElementById('bas-banner');
  if (banner && banner.style.opacity === '0') {
    banner.style.opacity = '1';
    banner.style.transform = 'translateY(0)';
  }
}

function hideBasBanner() {
  const banner = document.getElementById('bas-banner');
  if (banner) {
    banner.style.transition = 'opacity 0.3s, transform 0.3s';
    banner.style.opacity    = '0';
    banner.style.transform  = 'translateY(-100%)';
    setTimeout(function() { banner.remove(); }, 300);
  }
}

/* ════════════════════════════════════════
   BAS Period Reset — new quarter detection
════════════════════════════════════════ */

function initBasPeriodReset() {
  const currentPeriod = 'Q3 Jan–Mar 2025';
  const savedPeriod = localStorage.getItem('bas-last-period');
  
  if (savedPeriod !== currentPeriod) {
    // New BAS period - reset banner
    localStorage.removeItem('bas-banner-state');
    localStorage.setItem('bas-last-period', currentPeriod);
  }
}

/* ════════════════════════════════════════
   Marquee — plays once, pauses 30s, repeats
════════════════════════════════════════ */

function initBasBannerMarquee() {
  const span = document.querySelector('.banner-title span');
  if (!span) return;

  function replay() {
    span.style.animation = 'none';
    span.offsetHeight;   // force reflow
    span.style.animation = 'marquee 20s linear 1 forwards';
    setTimeout(replay, 50000); // 20s play + 30s pause
  }

  // Schedule first replay after initial play completes
  setTimeout(replay, 50000);
}

/* ════════════════════════════════════════
   Dashboard Init — called when screen loads
════════════════════════════════════════ */

function initDashboard() {
  initBasPeriodReset();
  initBasBannerMarquee();
}