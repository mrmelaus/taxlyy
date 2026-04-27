/* ─────────────────────────────────────────
   data.js  —  Taxlyy mock data store
   Replace each section with Supabase calls
   in Phase 3. Nothing else changes.
───────────────────────────────────────── */

var AppData = {

  /* ── User / business profile ── */
  user: {
    name:           'Jane Davidson',
    businessName:   'Jane Davidson Consulting',
    abn:            '12 345 678 901',
    email:          'jane@jdconsulting.com.au',
    phone:          '0412 345 678',
    address:        '42 Collins Street, Melbourne VIC 3000',
    entityType:     'Sole trader',
    gstRegistered:  true,
    plan:           'pro',      /* 'free' | 'starter' | 'pro' | 'annual' */
    avatarInitials: 'JD',

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
    
    // Business settings for BAS
    businessSettings: {
      hasEmployees: false,
      employeeCount: 0,
      hasExports: false,
      useHomeOffice: false,
      homeOfficeRate: 0.67
    }
  },

  /* ── Payment accounts ── */
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

  contacts: [
    {
      id:        'con-01',
      name:      'Jane Davidson',
      email:     'jane@jdconsulting.com.au',
      phone:     '0412 345 678',
      role:      'Director',
      isDefault: true,
    },
  ],
 
  serviceCategories: [
    {
      id:    'cat-01',
      name:  'Consulting',
      color: '#008b8b',
      items: [
        { id:'si-01', description:'Consulting service',  refCode:'CON-001', price:150, unit:'hr'  },
        { id:'si-02', description:'Project management',  refCode:'CON-002', price:130, unit:'hr'  },
      ]
    },
    {
      id:    'cat-02',
      name:  'Web & Design',
      color: '#1e40af',
      items: [
        { id:'si-03', description:'Web development',     refCode:'WEB-001', price:120, unit:'hr'  },
        { id:'si-04', description:'Design services',     refCode:'DES-001', price:110, unit:'hr'  },
      ]
    },
  ],

  /* ── Saved items / services library ── */
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

  /* ── Units library ── */
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

  /* ── Currencies ── */
  currencies: [
    { code:'AUD', symbol:'$',  name:'Australian Dollar'  },
    { code:'USD', symbol:'$',  name:'US Dollar'          },
    { code:'EUR', symbol:'€',  name:'Euro'               },
    { code:'GBP', symbol:'£',  name:'British Pound'      },
    { code:'NZD', symbol:'$',  name:'New Zealand Dollar' },
    { code:'SGD', symbol:'$',  name:'Singapore Dollar'   },
    { code:'JPY', symbol:'¥',  name:'Japanese Yen'       },
    { code:'CAD', symbol:'$',  name:'Canadian Dollar'    },
  ],

  /* ── Clients ── */
  clients: [
    { id:'cl-01', name:'Acme Corp Pty Ltd',  abn:'51 824 753 556', email:'accounts@acme.com.au',    phone:'03 9000 1234', address:'100 Collins St, Melbourne VIC 3000', defaultTermsDays:14, defaultAccountId:'acc-default', invoicePrefix:'ACM', notes:'',                                   totalInvoiced:28400, lastInvoice:'12 Mar 2025' },
    { id:'cl-02', name:'Blue Sky Digital',   abn:'32 901 234 567', email:'finance@bluesky.com.au',  phone:'02 8000 5678', address:'55 Market St, Sydney NSW 2000',       defaultTermsDays:30, defaultAccountId:'acc-default', invoicePrefix:'BSD', notes:'',                                   totalInvoiced:15750, lastInvoice:'8 Mar 2025'  },
    { id:'cl-03', name:'Peak Solutions',     abn:'74 512 963 801', email:'ap@peaksolutions.com',    phone:'07 3000 9999', address:'88 Creek St, Brisbane QLD 4000',      defaultTermsDays:7,  defaultAccountId:'acc-default', invoicePrefix:'PKS', notes:'PO number required.',              totalInvoiced:6050,  lastInvoice:'14 Feb 2025' },
    { id:'cl-04', name:'Nova Creative',      abn:'88 234 567 890', email:'billing@novacreative.au', phone:'03 9500 2200', address:'12 Flinders Lane, Melbourne VIC 3000', defaultTermsDays:14, defaultAccountId:'acc-default', invoicePrefix:'NOV', notes:'',                                   totalInvoiced:8800,  lastInvoice:'10 Feb 2025' },
    { id:'cl-05', name:'TechBridge Aus',     abn:'61 345 678 901', email:'ap@techbridge.com.au',    phone:'02 9100 3300', address:'1 Martin Place, Sydney NSW 2000',      defaultTermsDays:30, defaultAccountId:'acc-default', invoicePrefix:'TBA', notes:'',                                   totalInvoiced:4400,  lastInvoice:'3 Feb 2025'  },
  ],

  /* ── Helpers ── */
  getNextInvoiceNumber() {
    const { format, nextNumber, separator, padLength } = this.user.invoiceNumbering;
    return `${format}${separator}${String(nextNumber).padStart(padLength, '0')}`;
  },

  derivePrefix(clientName) {
    if (!clientName) return 'INV';
    const words = clientName.toUpperCase().replace(/[^A-Z\s]/g, '').split(/\s+/).filter(Boolean);
    if (words.length >= 3) return words.map(w => w[0]).join('').slice(0, 3);
    if (words.length === 2) return (words[0].slice(0, 2) + words[1][0]).slice(0, 3);
    return words[0].slice(0, 3);
  },

  getCurrency(code) {
    return this.currencies.find(c => c.code === code) || this.currencies[0];
  },

  getAccount(id) {
    return this.paymentAccounts.find(a => a.id === id) || this.paymentAccounts.find(a => a.isDefault);
  },

  /* ── Invoices ── */
  invoices: [
    { id:'INV-0042', clientId:'cl-01', client:'Acme Corp Pty Ltd',  issued:'12 Mar 2025', due:'26 Mar 2025', amountIncGst:4620, gst:420,  currency:'AUD', status:'paid',    datePaid:'24 Mar 2025', amountPaid:4620, activityLog:[{event:'Created',date:'12 Mar 2025'},{event:'Sent',date:'12 Mar 2025'},{event:'Paid',date:'24 Mar 2025'}] },
    { id:'INV-0041', clientId:'cl-02', client:'Blue Sky Digital',   issued:'8 Mar 2025',  due:'22 Mar 2025', amountIncGst:3025, gst:275,  currency:'AUD', status:'pending', datePaid:null,          amountPaid:0,    activityLog:[{event:'Created',date:'8 Mar 2025'},{event:'Sent',date:'8 Mar 2025'}] },
    { id:'INV-0040', clientId:'cl-04', client:'Green Leaf Co',      issued:'1 Mar 2025',  due:'15 Mar 2025', amountIncGst:2178, gst:198,  currency:'AUD', status:'paid',    datePaid:'14 Mar 2025', amountPaid:2178, activityLog:[{event:'Created',date:'1 Mar 2025'},{event:'Sent',date:'1 Mar 2025'},{event:'Paid',date:'14 Mar 2025'}] },
    { id:'INV-0039', clientId:'cl-03', client:'Peak Solutions',     issued:'14 Feb 2025', due:'28 Feb 2025', amountIncGst:6050, gst:550,  currency:'AUD', status:'overdue', datePaid:null,          amountPaid:0,    activityLog:[{event:'Created',date:'14 Feb 2025'},{event:'Sent',date:'14 Feb 2025'}] },
    { id:'INV-0038', clientId:'cl-04', client:'Nova Creative',      issued:'10 Feb 2025', due:'24 Feb 2025', amountIncGst:8800, gst:800,  currency:'AUD', status:'paid',    datePaid:'22 Feb 2025', amountPaid:8800, activityLog:[{event:'Created',date:'10 Feb 2025'},{event:'Sent',date:'10 Feb 2025'},{event:'Paid',date:'22 Feb 2025'}] },
    { id:'INV-0037', clientId:'cl-05', client:'TechBridge Aus',     issued:'3 Feb 2025',  due:'17 Feb 2025', amountIncGst:4400, gst:400,  currency:'AUD', status:'draft',   datePaid:null,          amountPaid:0,    activityLog:[{event:'Created',date:'3 Feb 2025'}] },
  ],

  get invoiceSummary() {
    const f = (status) => this.invoices.filter(i => i.status === status);
    const sum = (arr) => arr.reduce((s,i) => s + i.amountIncGst, 0);
    return {
      paidTotal:    sum(f('paid')),    paidCount:    f('paid').length,
      pendingTotal: sum(f('pending')), pendingCount: f('pending').length,
      overdueTotal: sum(f('overdue')), overdueCount: f('overdue').length,
      draftTotal:   sum(f('draft')),   draftCount:   f('draft').length,
    };
  },

  /* ── EXPENSES & BANK DATA (UPDATED FOR BAS) ── */
  
  // OCR receipts waiting for review
  expensesReview: [],
  
  // Confirmed business expenses (go to BAS G10/G11)
  expensesConfirmed: [],
  
  // Owner drawings / personal expenses (excluded from BAS)
  expensesPersonal: [],
  
  // Raw bank CSV transactions (expenses only, not yet reviewed)
  bankTransactions: [],
  
  // Income from bank CSV (credits)
  incomeTransactions: [],
  
  // Business use percentages for recurring expenses
  percentageUse: {
    car: 100,
    homeOffice: 100,
    phone: 100
  },
  
  // Manual additional income not in bank statement
  additionalIncome: {
    cash: 0,
    interest: 0,
    other: 0,
    otherDesc: ''
  },
  
  // BAS period selection
  selectedBasPeriod: 'jan_mar', // 'jul_sep', 'oct_dec', 'jan_mar', 'apr_jun'
  
  // Saved BAS reports history
  basReports: [],
  
  /* ── SUMMARY & CHARTS ── */
  summary: { fy:'2024–25', grossIncome:84320, totalExpenses:31540, netProfit:52780, gstOwing:4218, gstOwingPeriod:'Q3 Jan–Mar 2025', gstDueDate:'28 April 2025', gstDaysLeft:18 },
  monthlyChart: { labels:['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'], income:[6200,5800,7100,6900,8200,7400,6600,7800,8100], expenses:[2800,3100,2600,3400,2900,3800,2700,3100,3500] },
  expenseCategories: [ { label:'Travel & transport', amount:5820, pct:72 }, { label:'Home office', amount:3620, pct:45 }, { label:'Software & tools', amount:3040, pct:38 }, { label:'Professional dev.', amount:2240, pct:28 } ],
  dueDates: [ { day:'28', month:'Apr', title:'BAS Q3 lodgement', sub:'Jan–Mar 2025 · GST owing $4,218', daysLeft:18, urgency:'soon' }, { day:'28', month:'Jul', title:'BAS Q4 lodgement', sub:'Apr–Jun 2025', daysLeft:109, urgency:'normal' }, { day:'31', month:'Oct', title:'Annual tax return', sub:'FY 2024–25 self-lodgement', daysLeft:223, urgency:'normal' } ],
  
  // BAS data (calculated from expensesConfirmed and incomeTransactions)
  bas: { period:'Q3 Jan–Mar 2025', dueDate:'28 April 2025', daysLeft:18, fields:{ '1A':{ label:'GST collected on sales', amount:7840 }, '1B':{ label:'GST credits on purchases', amount:3622 }, 'G1':{ label:'Total sales (inc GST)', amount:86240 }, 'T1':{ label:'PAYG instalment income', amount:21400 } }, netGst:4218 },
  
  annual: { fy:'2024–25', dueDate:'31 Oct 2025', grossIncome:84320, deductions:[ { label:'D1 Work-related travel', amount:5820 }, { label:'D3 Home office expenses', amount:3620 }, { label:'D5 Software & subscriptions', amount:3040 }, { label:'D5 Professional development', amount:2240 }, { label:'Depreciation (Div 40)', amount:4180 }, { label:'Other business expenses', amount:12640 } ], get totalDeductions() { return this.deductions.reduce((s,d)=>s+d.amount,0); }, get taxableIncome() { return this.grossIncome - this.totalDeductions; }, estTaxPayable:9842 },
  
  /*
   * assets[] — each record shape:
   * {
   *   id:             string,         // unique
   *   name:           string,         // e.g. 'MacBook Pro 16"'
   *   assetType:      string,         // e.g. 'computer' | 'vehicle' | 'furniture' …
   *   purchaseDate:   string,         // ISO yyyy-mm-dd
   *   purchaseCost:   number,         // total cost inc GST
   *   costExGst:      number,         // purchase cost excluding GST (this is the depreciable base)
   *   method:         'pc' | 'dv',    // Prime Cost or Diminishing Value
   *   effectiveLife:  number,         // years (ATO Taxation Ruling TR 2023/1)
   *   businessUsePct: number,         // 0–100
   *   openingValue:   number,         // WDV at 1 Jul of current FY (calculated)
   *   depreciation:   number,         // deduction for current FY (calculated)
   *   closingValue:   number,         // WDV at 30 Jun of current FY (calculated)
   *   sourceExpenseId: string|null,   // link back to confirmed expense if auto-detected
   * }
   *
   * All dollar amounts below $300 are expensed immediately (Low-value pool / Div 40 s40-80).
   * Calculations follow TR 2023/1 and s40-70 (PC) / s40-75 (DV).
   */
  assets: [],
  
  notifications: { basReminders:true, annualReminder:true, overdueAlerts:true, aiComplete:false },
};