/* screens/invoices.js */

function buildInvoices() {
  const sm = AppData.invoiceSummary;
  return `
    <div class="screen" id="screen-invoices">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div>
          <div style="font-weight:600;color:var(--text)">Invoices</div>
          <div style="color:var(--text3);margin-top:2px">${AppData.invoices.length} invoices · ${UI.currencyFull(AppData.summary.grossIncome)} total</div>
        </div>
        <button class="btn btn-primary" onclick="Router.go('new-invoice')">+ New invoice</button>
      </div>

      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
        ${UI.statCard({ label:'Paid',    value: UI.currencyFull(sm.paidTotal),    change:`${sm.paidCount} invoices`,    changeType:'up',   variant:'positive' })}
        ${UI.statCard({ label:'Pending', value: UI.currencyFull(sm.pendingTotal), change:`${sm.pendingCount} invoices`, changeType:'warn', variant:'warning'  })}
        ${UI.statCard({ label:'Overdue', value: UI.currencyFull(sm.overdueTotal), change:`${sm.overdueCount} invoices`, changeType:'down', variant:'alert'    })}
        ${UI.statCard({ label:'Draft',   value: UI.currencyFull(sm.draftTotal),   change:`${sm.draftCount} invoices`  })}
      </div>

      <div class="card">
        <div class="card-header">
          <div class="cat-pills" style="margin:0" id="invoice-filter-pills">
            <div class="cat-pill active" data-filter="all">All</div>
            <div class="cat-pill" data-filter="paid">Paid</div>
            <div class="cat-pill" data-filter="pending">Pending</div>
            <div class="cat-pill" data-filter="overdue">Overdue</div>
            <div class="cat-pill" data-filter="draft">Draft</div>
          </div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Client</th><th>Invoice #</th><th>Date issued</th>
              <th>Due date</th><th>Amount (inc GST)</th><th>GST</th>
              <th>Status</th><th></th>
            </tr>
          </thead>
          <tbody id="invoices-tbody">
            ${AppData.invoices.map(inv => UI.invoiceRow(inv)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}