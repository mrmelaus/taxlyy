/* ─────────────────────────────────────────
   data.js  —  Taxlyy app data store
   Sole trader (ABN) + optional PAYG income
   No employees / no company structure
   Replace arrays with Supabase calls in Phase 3
───────────────────────────────────────── */

var AppData = {

  /* ════════════════════════════════════════
     USER / BUSINESS PROFILE
  ════════════════════════════════════════ */
  user: {
    name:           'Jane Davidson',
    businessName:   'Jane Davidson Consulting',
    abn:            '12 345 678 901',
    email:          'jane@jdconsulting.com.au',
    phone:          '0412 345 678',
    address:        '42 Collins Street, Melbourne VIC 3000',
    entityType:     'Sole trader',
    gstRegistered:  true,
    plan:           'pro',        /* 'free' | 'starter' | 'pro' | 'annual' */
    avatarInitials: 'JD',
    fontSize:       'medium',     /* 'small' | 'medium' | 'large' */

    invoiceNumbering: {
      format:     'INV',
      nextNumber: 43,
      separator:  '-',
      padLength:  4,
    },

    branding: {
      logo:        null,
      accentColor: '#008b8b',
      headerText:  '',
      footerText:  '',
    },

    /* Home office — used by annual report */
    homeOffice: {
      method:    'fixed_rate',  /* 'fixed_rate' (67c/hr) | 'actual' */
      hoursPerFY: 0,            /* user enters FY total hours */
    },
  },

  /* ════════════════════════════════════════
     PAYMENT ACCOUNTS
     Appear on invoice payment details section
  ════════════════════════════════════════ */
  paymentAccounts: [
    {
      id:          'acc-default',
      nickname:    'Main business account',
      isDefault:   true,
      bsb:         '063-000',
      accountNo:   '1234 5678',
      accountName: 'Jane Davidson',
      payId:       '0412 345 678',
    },
    {
      id:          'acc-02',
      nickname:    'USD account',
      isDefault:   false,
      bsb:         '',
      accountNo:   '',
      accountName: 'Jane Davidson',
      payId:       'jane@jdconsulting.com.au',
    },
  ],

  /* ════════════════════════════════════════
     CONTACTS (saved to user profile in settings)
  ════════════════════════════════════════ */
  contacts: [
    {
      id:        'con-01',
      name:      'Jane Davidson',
      email:     'jane@jdconsulting.com.au',
      phone:     '0412 345 678',
      role:      'Owner',
      isDefault: true,
    },
  ],

  /* ════════════════════════════════════════
     SERVICE LIBRARY
     Categories + items used in invoice line items
  ════════════════════════════════════════ */
  serviceCategories: [
    {
      id:    'cat-01',
      name:  'Consulting',
      color: '#008b8b',
      items: [
        { id:'si-01', description:'Consulting service', refCode:'CON-001', price:150, unit:'hr' },
        { id:'si-02', description:'Project management', refCode:'CON-002', price:130, unit:'hr' },
      ],
    },
    {
      id:    'cat-02',
      name:  'Web & Design',
      color: '#1e40af',
      items: [
        { id:'si-03', description:'Web development',  refCode:'WEB-001', price:120, unit:'hr' },
        { id:'si-04', description:'Design services',  refCode:'DES-001', price:110, unit:'hr' },
      ],
    },
  ],

  /* ════════════════════════════════════════
     SAVED ITEMS — legacy flat list
     (service categories above takes priority)
  ════════════════════════════════════════ */
  savedItems: [
    { id:'si-01', description:'Consulting service',  unitPrice:150,  unit:'hr'   },
    { id:'si-02', description:'Web development',     unitPrice:120,  unit:'hr'   },
    { id:'si-03', description:'Project management',  unitPrice:130,  unit:'hr'   },
    { id:'si-04', description:'Garden maintenance',  unitPrice:85,   unit:'hr'   },
    { id:'si-05', description:'Lawn mowing',         unitPrice:60,   unit:'job'  },
    { id:'si-06', description:'Delivery service',    unitPrice:45,   unit:'unit' },
    { id:'si-07', description:'Design services',     unitPrice:110,  unit:'hr'   },
    { id:'si-08', description:'Photography session', unitPrice:400,  unit:'job'  },
    { id:'si-09', description:'Copywriting',         unitPrice:0.18, unit:'word' },
    { id:'si-10', description:'Training / coaching', unitPrice:200,  unit:'hr'   },
  ],

  /* ════════════════════════════════════════
     UNITS LIBRARY
  ════════════════════════════════════════ */
  units: [
    { id:'u-01', label:'unit'  },
    { id:'u-02', label:'hr'    },
    { id:'u-03', label:'day'   },
    { id:'u-04', label:'kg'    },
    { id:'u-05', label:'m²'    },
    { id:'u-06', label:'km'    },
    { id:'u-07', label:'job'   },
    { id:'u-08', label:'word'  },
    { id:'u-09', label:'page'  },
    { id:'u-10', label:'month' },
  ],

  /* ════════════════════════════════════════
     CURRENCIES
  ════════════════════════════════════════ */
  currencies: [
    { code:'AUD', symbol:'$', name:'Australian Dollar'  },
    { code:'USD', symbol:'$', name:'US Dollar'          },
    { code:'EUR', symbol:'€', name:'Euro'               },
    { code:'GBP', symbol:'£', name:'British Pound'      },
    { code:'NZD', symbol:'$', name:'New Zealand Dollar' },
    { code:'SGD', symbol:'$', name:'Singapore Dollar'   },
    { code:'JPY', symbol:'¥', name:'Japanese Yen'       },
    { code:'CAD', symbol:'$', name:'Canadian Dollar'    },
  ],

  /* ════════════════════════════════════════
     CLIENTS
  ════════════════════════════════════════ */
  clients: [
    { id:'cl-01', name:'Acme Corp Pty Ltd',  abn:'51 824 753 556', email:'accounts@acme.com.au',    phone:'03 9000 1234', address:'100 Collins St, Melbourne VIC 3000',      defaultTermsDays:14, defaultAccountId:'acc-default', invoicePrefix:'ACM', notes:'',                      totalInvoiced:28400, lastInvoice:'12 Mar 2025' },
    { id:'cl-02', name:'Blue Sky Digital',   abn:'32 901 234 567', email:'finance@bluesky.com.au',  phone:'02 8000 5678', address:'55 Market St, Sydney NSW 2000',            defaultTermsDays:30, defaultAccountId:'acc-default', invoicePrefix:'BSD', notes:'',                      totalInvoiced:15750, lastInvoice:'8 Mar 2025'  },
    { id:'cl-03', name:'Peak Solutions',     abn:'74 512 963 801', email:'ap@peaksolutions.com',    phone:'07 3000 9999', address:'88 Creek St, Brisbane QLD 4000',           defaultTermsDays:7,  defaultAccountId:'acc-default', invoicePrefix:'PKS', notes:'PO number required.',  totalInvoiced:6050,  lastInvoice:'14 Feb 2025' },
    { id:'cl-04', name:'Nova Creative',      abn:'88 234 567 890', email:'billing@novacreative.au', phone:'03 9500 2200', address:'12 Flinders Lane, Melbourne VIC 3000',     defaultTermsDays:14, defaultAccountId:'acc-default', invoicePrefix:'NOV', notes:'',                      totalInvoiced:8800,  lastInvoice:'10 Feb 2025' },
    { id:'cl-05', name:'TechBridge Aus',     abn:'61 345 678 901', email:'ap@techbridge.com.au',    phone:'02 9100 3300', address:'1 Martin Place, Sydney NSW 2000',          defaultTermsDays:30, defaultAccountId:'acc-default', invoicePrefix:'TBA', notes:'',                      totalInvoiced:4400,  lastInvoice:'3 Feb 2025'  },
  ],

  /* ════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════ */
  getNextInvoiceNumber: function() {
    var n = this.user.invoiceNumbering;
    return n.format + n.separator + String(n.nextNumber).padStart(n.padLength, '0');
  },

  derivePrefix: function(clientName) {
    if (!clientName) return 'INV';
    var words = clientName.toUpperCase().replace(/[^A-Z\s]/g, '').split(/\s+/).filter(Boolean);
    if (words.length >= 3) return words.map(function(w){ return w[0]; }).join('').slice(0, 3);
    if (words.length === 2) return (words[0].slice(0, 2) + words[1][0]).slice(0, 3);
    return words[0].slice(0, 3);
  },

  getCurrency: function(code) {
    return this.currencies.find(function(c){ return c.code === code; }) || this.currencies[0];
  },

  getAccount: function(id) {
    var self = this;
    return this.paymentAccounts.find(function(a){ return a.id === id; })
        || this.paymentAccounts.find(function(a){ return a.isDefault; });
  },

  /* ════════════════════════════════════════
     INVOICES
     status: 'draft' | 'pending' | 'paid' | 'overdue'
     paid status should only be set via bank reconciliation
  ════════════════════════════════════════ */
  invoices: [
    { id:'INV-0042', clientId:'cl-01', client:'Acme Corp Pty Ltd', issued:'12 Mar 2025', due:'26 Mar 2025', amountIncGst:4620, gst:420, currency:'AUD', status:'paid',    datePaid:'24 Mar 2025', amountPaid:4620, activityLog:[{event:'Created',date:'12 Mar 2025'},{event:'Sent',date:'12 Mar 2025'},{event:'Paid',date:'24 Mar 2025'}] },
    { id:'INV-0041', clientId:'cl-02', client:'Blue Sky Digital',  issued:'8 Mar 2025',  due:'22 Mar 2025', amountIncGst:3025, gst:275, currency:'AUD', status:'pending', datePaid:null,          amountPaid:0,    activityLog:[{event:'Created',date:'8 Mar 2025'},{event:'Sent',date:'8 Mar 2025'}] },
    { id:'INV-0040', clientId:'cl-04', client:'Green Leaf Co',     issued:'1 Mar 2025',  due:'15 Mar 2025', amountIncGst:2178, gst:198, currency:'AUD', status:'paid',    datePaid:'14 Mar 2025', amountPaid:2178, activityLog:[{event:'Created',date:'1 Mar 2025'},{event:'Sent',date:'1 Mar 2025'},{event:'Paid',date:'14 Mar 2025'}] },
    { id:'INV-0039', clientId:'cl-03', client:'Peak Solutions',    issued:'14 Feb 2025', due:'28 Feb 2025', amountIncGst:6050, gst:550, currency:'AUD', status:'overdue', datePaid:null,          amountPaid:0,    activityLog:[{event:'Created',date:'14 Feb 2025'},{event:'Sent',date:'14 Feb 2025'}] },
    { id:'INV-0038', clientId:'cl-04', client:'Nova Creative',     issued:'10 Feb 2025', due:'24 Feb 2025', amountIncGst:8800, gst:800, currency:'AUD', status:'paid',    datePaid:'22 Feb 2025', amountPaid:8800, activityLog:[{event:'Created',date:'10 Feb 2025'},{event:'Sent',date:'10 Feb 2025'},{event:'Paid',date:'22 Feb 2025'}] },
    { id:'INV-0037', clientId:'cl-05', client:'TechBridge Aus',    issued:'3 Feb 2025',  due:'17 Feb 2025', amountIncGst:4400, gst:400, currency:'AUD', status:'draft',   datePaid:null,          amountPaid:0,    activityLog:[{event:'Created',date:'3 Feb 2025'}] },
  ],

  get invoiceSummary() {
    var self = this;
    var f    = function(s){ return self.invoices.filter(function(i){ return i.status === s; }); };
    var sum  = function(arr){ return arr.reduce(function(s,i){ return s + i.amountIncGst; }, 0); };
    return {
      paidTotal:    sum(f('paid')),    paidCount:    f('paid').length,
      pendingTotal: sum(f('pending')), pendingCount: f('pending').length,
      overdueTotal: sum(f('overdue')), overdueCount: f('overdue').length,
      draftTotal:   sum(f('draft')),   draftCount:   f('draft').length,
    };
  },

  /* ════════════════════════════════════════
     EXPENSES & BANK DATA
  ════════════════════════════════════════ */

  /* OCR receipts waiting for user review */
  expensesReview: [],

  /* Confirmed business expenses — feed BAS G10/G11 and annual deductions */
  expensesConfirmed: [],

  /* Personal / non-deductible expenses — excluded from BAS and annual */
  expensesPersonal: [],

  /* Raw bank CSV debit transactions — user reviews and classifies */
  bankTransactions: [],

  /* Bank CSV credit transactions — primary source of business income */
  incomeTransactions: [],

  /*
   * incomeTransactions record shape:
   * {
   *   id:                string,
   *   date:              string,           // yyyy-mm-dd from bank CSV
   *   description:       string,           // bank narrative
   *   amount:            number,           // gross amount (inc GST if applicable)
   *   type:              'income',
   *   matchedToInvoiceId: string | null,   // set when reconciled to an invoice
   *   category:          'business' | 'interest' | 'other' | null,
   *   reviewed:          boolean,          // user has confirmed this transaction
   * }
   */

  /* Business use % for mixed-use recurring expenses */
  percentageUse: {
    car:        100,
    homeOffice: 100,
    phone:      100,
  },

  /* Manual income not captured in bank CSV */
  additionalIncome: {
    cash:      0,
    interest:  0,
    other:     0,
    otherDesc: '',
  },

  /* Depreciable assets detected by OCR/expense screen, pending promotion to register */
  depreciableAssets: [],

  /* ════════════════════════════════════════
     ASSET REGISTER (Div 40 depreciation)
     Populated via depreciation screen
     Calculations in depreciation.js — calcDepreciation()

     Each record shape:
     {
       id:              string,
       name:            string,
       assetType:       string,        // key from ATO_ASSET_TYPES
       purchaseDate:    string,        // yyyy-mm-dd
       purchaseCost:    number,        // inc GST
       costExGst:       number,        // depreciable base — exc GST
       method:          'pc' | 'dv',  // Prime Cost or Diminishing Value
       effectiveLife:   number,        // years per ATO TR 2023/1
       businessUsePct:  number,        // 0-100
       sourceExpenseId: string | null,
     }

     openingValue / depreciation / closingValue are CALCULATED LIVE
     by calcDepreciation() — never stored.
  ════════════════════════════════════════ */
  assets: [],

  /* ════════════════════════════════════════
     BAS
  ════════════════════════════════════════ */

  /* Which quarter is active in the BAS screen */
  selectedBasPeriod: 'jan_mar',  /* 'jul_sep' | 'oct_dec' | 'jan_mar' | 'apr_jun' */

  /* Confirmed and saved BAS reports */
  basReports: [],

  /* ════════════════════════════════════════
     ANNUAL REPORT — user-entered inputs
     Everything else is calculated live
     from invoices / expensesConfirmed / assets
  ════════════════════════════════════════ */
  annualUserInputs: {
    /* Optional PAYG employment income (Item 1) */
    showPayg:        false,
    paygSalary:      0,     /* gross salary from employer — copied from myGov income statement */
    paygWithheld:    0,     /* tax withheld by employer — credit against tax bill */

    /* PAYG instalments the ATO auto-debited quarterly (business) */
    paygInstalments: 0,     /* check ATO online account / BAS history */

    /* Home office hours this FY (for 67c/hr fixed rate method) */
    homeOfficeHours: 0,     /* leave 0 if claiming via actual expenses instead */

    /* Other income not from ABN business */
    otherIncome:     0,     /* interest, dividends, rental — if not in bank CSV */

    /* Offsets and levies */
    hasHECS:         false, /* HECS/HELP debt — triggers compulsory repayment calc */
    hasPrivateHealth:false, /* private hospital cover — avoids Medicare Levy Surcharge */
  },

  /* Finalised annual reports (saved after declaration) */
  annualReports: [],

  /* ════════════════════════════════════════
     DASHBOARD — computed live where possible
     Static fields kept only for chart demo
     Replace with live computed values once
     bank CSV + invoices have real data
  ════════════════════════════════════════ */
  get summary() {
    var self = this;

    /* Income: paid invoices ex-GST */
    var paidInvoiceIncome = self.invoices
      .filter(function(i){ return i.status === 'paid'; })
      .reduce(function(s, i){ return s + (i.amountIncGst - i.gst); }, 0);

    /* Income: bank credits (primary source when uploaded) */
    var bankIncome = self.incomeTransactions
      .filter(function(t){ return t.reviewed !== false; })
      .reduce(function(s, t){ return s + (t.amount || 0); }, 0);

    var grossIncome = bankIncome > 0
      ? (self.user.gstRegistered ? bankIncome / 1.1 : bankIncome)
      : paidInvoiceIncome;

    /* Expenses: confirmed, ex-GST */
    var totalExpenses = self.expensesConfirmed
      .reduce(function(s, e){ return s + ((e.amount || 0) - (e.gst || 0)); }, 0);

    /* Depreciation */
    var totalDepn = (self.assets || []).reduce(function(s, a) {
      if (typeof calcDepreciation === 'function') {
        return s + (calcDepreciation(a).depreciation || 0);
      }
      return s;
    }, 0);

    var netProfit = Math.max(grossIncome - totalExpenses - totalDepn, 0);

    /* GST: calculated from BAS data */
    var gstOnSales     = grossIncome * 0.1;
    var gstOnPurchases = self.expensesConfirmed
      .reduce(function(s, e){ return s + (e.gst || 0); }, 0);
    var gstOwing       = Math.max(gstOnSales - gstOnPurchases, 0);

    return {
      fy:              '2024\u201325',
      grossIncome:     Math.round(grossIncome),
      totalExpenses:   Math.round(totalExpenses + totalDepn),
      netProfit:       Math.round(netProfit),
      gstOwing:        Math.round(gstOwing),
      gstOwingPeriod:  'Q3 Jan\u2013Mar 2025',
      gstDueDate:      '28 April 2025',
      gstDaysLeft:     18,
    };
  },

  /* Monthly chart — demo data, replace with live aggregation */
  monthlyChart: {
    labels:   ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],
    income:   [6200, 5800, 7100, 6900, 8200, 7400, 6600, 7800, 8100],
    expenses: [2800, 3100, 2600, 3400, 2900, 3800, 2700, 3100, 3500],
  },

  /* Top expense categories for dashboard — computed live */
  get expenseCategories() {
    var cats = {};
    (this.expensesConfirmed || []).forEach(function(e) {
      var cat = e.category || e.aiCategory || 'Other';
      cats[cat] = (cats[cat] || 0) + ((e.amount || 0) - (e.gst || 0));
    });
    var entries = Object.keys(cats).map(function(k){ return { label:k, amount:cats[k] }; });
    entries.sort(function(a,b){ return b.amount - a.amount; });
    var top     = entries.slice(0, 4);
    var maxAmt  = top.length > 0 ? top[0].amount : 1;
    return top.map(function(e){
      return { label:e.label, amount:e.amount, pct: Math.round((e.amount / maxAmt) * 100) };
    });
  },

  /* ATO due dates */
  dueDates: [
    { day:'28', month:'Apr', title:'BAS Q3 lodgement',  sub:'Jan\u2013Mar 2025 \u00b7 GST owing', daysLeft:18,  urgency:'soon'   },
    { day:'28', month:'Jul', title:'BAS Q4 lodgement',  sub:'Apr\u2013Jun 2025',                  daysLeft:109, urgency:'normal' },
    { day:'31', month:'Oct', title:'Annual tax return',  sub:'FY 2024\u201325 self-lodgement',     daysLeft:185, urgency:'normal' },
  ],

  /* ════════════════════════════════════════
     NOTIFICATIONS
  ════════════════════════════════════════ */
  notifications: {
    basReminders:  true,
    annualReminder:true,
    overdueAlerts: true,
    aiComplete:    false,
  },
};