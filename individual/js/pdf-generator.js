// ========================================
// PDF GENERATOR - Taxlyy Individual
// Uses jsPDF + autoTable
// lang='en' → English only (helvetica)
// lang='zh' → Bilingual English + Chinese (NotoSansSC)
// ========================================

async function loadCJKFont(doc) {
    if (!window.NotoSansSCBase64) {
        console.warn('NotoSansSC font not loaded');
        return false;
    }
    try {
        doc.addFileToVFS('NotoSansSC.ttf', window.NotoSansSCBase64);
        doc.addFont('NotoSansSC.ttf', 'NotoSansSC', 'normal');
        return true;
    } catch(err) {
        console.warn('CJK font registration failed:', err.message);
        return false;
    }
}

async function generateTaxReport(userData, lang = 'en', options = {}) {
    const { transaction, returnBlob = false } = options;
    const isEn = lang === 'en';
    const isBilingual = lang === 'zh';
    const txt = (en, zh) => isBilingual ? `${en}\n${zh}` : en;

    // --- Dynamic tax year from activeTaxYear (set by Supabase) ---
    let taxYearEnd;
    if (typeof window.activeTaxYear === 'number' && !isNaN(window.activeTaxYear)) {
        taxYearEnd = window.activeTaxYear;
    } else {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        taxYearEnd = currentMonth >= 7 ? currentYear : currentYear - 1;
    }
    const taxYearStart = taxYearEnd - 1;
    const taxYearLabel = `${taxYearStart}-${String(taxYearEnd).slice(-2)}`;
    const dateRangeEn = `1 July ${taxYearStart} - 30 June ${taxYearEnd}`;
    const taxYearLabelZh = `${taxYearStart}-${String(taxYearEnd).slice(-2)}财政年度`;
    const dateRangeZh = `${taxYearStart}年7月1日 - ${taxYearEnd}年6月30日`;

    const hasInvoice = !!transaction;
   
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    let baseFont = 'helvetica';
    if (isBilingual) {
        const fontLoaded = await loadCJKFont(doc);
        if (fontLoaded) baseFont = 'NotoSansSC';
    }
    doc.setFont(baseFont, 'normal');

    const mL = 15;
    const mR = 15;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const contentW = pageW - mL - mR;

    const C = {
        primary:      [67,  97,  238],
        primaryDark:  [58,  12,  163],
        accent:       [76,  201, 240],
        accentDark:   [58,  181, 219],
        navy:         [18,  16,  46],
        cardBg:       [240, 242, 255],
        rowAlt:       [245, 247, 255],
        totalRow:     [230, 235, 255],
        error:        [255, 77,  109],
        warning:      [255, 243, 205],
        warningBorder:[255, 193, 7],
        white:        [255, 255, 255],
        muted:        [120, 125, 150],
        textDark:     [26,  26,  46],
        border:       [210, 215, 240],
        success:      [40,  150, 80]
    };

    const money = (n) => new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(n || 0);

    const moneyAccounting = (n) => {
        if (n < 0) return `(${money(Math.abs(n))})`;
        return money(n);
    };

    const accentRule = (y) => {
        doc.setDrawColor(...C.primary);
        doc.setLineWidth(0.8);
        doc.line(mL, y, pageW - mR, y);
        doc.setDrawColor(...C.accent);
        doc.setLineWidth(0.3);
        doc.line(mL, y + 0.9, pageW - mR, y + 0.9);
    };

    const pageTitleBand = (text) => {
        doc.setDrawColor(...C.primary);
        doc.setLineWidth(1.5);
        doc.line(0, 0, pageW, 0);
        doc.setDrawColor(...C.accent);
        doc.setLineWidth(0.5);
        doc.line(0, 1.5, pageW, 1.5);
        doc.setFillColor(...C.cardBg);
        doc.rect(0, 0, pageW, 13, 'F');
        doc.setFontSize(8.5);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.primary);
        doc.text(text, pageW / 2, 8.5, { align: 'center' });
        doc.setFont(baseFont, 'normal');
    };

    const sectionHeader = (text, y) => {
        doc.setFillColor(...C.accent);
        doc.rect(mL, y - 4.5, 2.5, 7.5, 'F');
        doc.setFontSize(11);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.primary);
        doc.text(text, mL + 5.5, y);
        doc.setFont(baseFont, 'normal');
        return y + 6;
    };

    const infoRow = (label, value, y, shade = false) => {
        const labelLines = (label || '').split('\n');
        const valueLines = (value || '').split('\n');
        const lineCount = Math.max(labelLines.length, valueLines.length);
        const lineHeight = 5.0;
        const padding = 2;
        const rowHeight = lineCount * lineHeight + padding;
        const textBlockHeight = lineCount * lineHeight;
        const baselineOffset = lineHeight * 0.6;
        const startY = y + (rowHeight - textBlockHeight) / 2 + baselineOffset;

        if (shade) {
            doc.setFillColor(...C.rowAlt);
            doc.rect(mL, y, contentW, rowHeight, 'F');
        }

        doc.setFontSize(8.5);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.muted);
        let labelY = startY;
        labelLines.forEach(line => {
            doc.text(line, mL + 3, labelY);
            labelY += lineHeight;
        });

        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.textDark);
        let valueY = startY;
        valueLines.forEach(line => {
            doc.text(line, pageW - mR - 3, valueY, { align: 'right' });
            valueY += lineHeight;
        });

        return y + rowHeight;
    };

    const carryForwardBox = (amount, y) => {
        const boxH = isBilingual ? 42 : 28;
        doc.setFillColor(...C.warning);
        doc.roundedRect(mL, y, contentW, boxH, 2, 2, 'F');
        doc.setDrawColor(...C.warningBorder);
        doc.setLineWidth(0.4);
        doc.roundedRect(mL, y, contentW, boxH, 2, 2, 'S');
        doc.setFontSize(8.5);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.textDark);
        doc.text(
            txt(
                `Capital loss of ${money(amount)} carried forward to next year.`,
                `资本损失 ${money(amount)} 结转至下一年度。`
            ),
            mL + 4, y + 7
        );
        doc.setFont(baseFont, 'normal');
        doc.setFontSize(8);
        const noteLines = isBilingual ? [
            'When you lodge with the ATO, you must manually carry forward that unused capital loss.',
            '向ATO申报时，须手动将未使用的资本损失结转至下一年度的申报表。'
        ] : [
            'When you lodge with the ATO, you (or your tax agent) must manually carry forward',
            'that unused capital loss to next year\'s return. Taxlyy does not automatically',
            'lodge or carry forward data across years.'
        ];
        let ny = y + 16;
        noteLines.forEach(line => { doc.text(line, mL + 4, ny); ny += 5; });
        return y + boxH + 6;
    };

    // ========================================
    // DATA PREP
    // ========================================
    const calc = calculateRefund(userData);
    const isRefund = calc.refund >= 0;
    const bd = calc.breakdown || {};
    const hasCapLoss = (calc.capitalLossCarryForward || 0) > 0;

    const effectiveStatus = getEffectiveTaxStatus(userData);

    // Determine the residency label string to display in the PDF
    const residencyStatusForLabel = (effectiveStatus === 'australian' && userData.isTemporaryVisaHolder === true)
        ? 'temporary'
        : effectiveStatus;

    const residencyLabel = {
        australian: txt('Australian tax resident', '澳大利亚税务居民'),
        temporary:  txt('Temporary resident', '临时居民'),
        whm:        txt('Working Holiday Maker', '打工度假签证'),
        foreign:    txt('Foreign resident', '外国居民')
    }[residencyStatusForLabel] || txt('Australian tax resident', '澳大利亚税务居民');

    const foreignIncomeForPdf = (userData.isAustralianTaxResident && userData.isTemporaryVisaHolder)
        ? 0
        : (userData.targetForeignIncome || 0);

    const coverText = userData.hasPrivateHospitalCover === false
        ? txt('No', '否')
        : (userData.daysWithoutCover === 0
            ? txt('Yes - full year', '是（全年）')
            : txt(`Yes - ${userData.daysWithoutCover} days without cover`, `是（${userData.daysWithoutCover}天无保险）`));

    // ========================================
    // PAGE 1 - COVER
    // ========================================
    doc.setFillColor(...C.navy);
    const headerH = isBilingual ? 72 : 56;
    doc.rect(0, 0, pageW, headerH, 'F');

    doc.setFillColor(...C.primary);
    doc.triangle(pageW - 40, headerH, pageW, headerH, pageW, 12, 'F');
    doc.setFillColor(...C.accent);
    doc.triangle(pageW - 20, headerH, pageW, headerH, pageW, 28, 'F');

    doc.setDrawColor(...C.primary);
    doc.setLineWidth(1.2);
    doc.line(0, headerH, pageW, headerH);
    doc.setDrawColor(...C.accent);
    doc.setLineWidth(0.5);
    doc.line(0, headerH + 1.2, pageW, headerH + 1.2);

    doc.setFontSize(10);
    doc.setFont(baseFont, 'normal');
    doc.setTextColor(...C.accent);
    doc.text('TAXLYY INDIVIDUAL', pageW / 2, 14, { align: 'center' });

    doc.setFontSize(19);
    doc.setFont(baseFont, 'normal');
    doc.setTextColor(...C.white);
        if (isBilingual) {
        doc.text('TAX ESTIMATE REPORT', pageW / 2, 26, { align: 'center' });
        doc.setFontSize(16);
        doc.text('税务估算报告', pageW / 2, 35, { align: 'center' });
        } else {
            doc.text('TAX ESTIMATE REPORT', pageW / 2, 30, { align: 'center' });
        }

    doc.setFontSize(10);
    doc.setFont(baseFont, 'normal');
    doc.setTextColor(...C.accent);
    if (isBilingual) {
        doc.text(`${taxYearLabel}   ${dateRangeEn}`, pageW / 2, 46, { align: 'center' });
        doc.setFontSize(9);
        doc.setTextColor(...C.accent);
        doc.text(`${taxYearLabelZh}   ${dateRangeZh}`, pageW / 2, 54, { align: 'center' });
        doc.setFontSize(10);
    } else {
        doc.text(`${taxYearLabel}  |  ${dateRangeEn}`, pageW / 2, 42, { align: 'center' });
    }

    let y = isBilingual ? headerH + 10 : headerH + 8;
    const userCardH = isBilingual ? 46 : 38;
    doc.setFillColor(...C.cardBg);
    doc.roundedRect(mL, y, contentW, userCardH, 2.5, 2.5, 'F');
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(mL, y, contentW, userCardH, 2.5, 2.5, 'S');
    doc.setFillColor(...C.primary);
    doc.roundedRect(mL, y, 3, userCardH, 1.5, 1.5, 'F');

    doc.setFontSize(7.5);
    doc.setFont(baseFont, 'normal');
    doc.setTextColor(...C.muted);
    if (isBilingual) {
        doc.text('PREPARED FOR', mL + 7, y + 8);
        doc.setFontSize(6.5);
        doc.text('准备给', mL + 7, y + 14);
    } else {
        doc.text('PREPARED FOR', mL + 7, y + 9);
    }

    doc.setFontSize(15);
    doc.setFont(baseFont, 'normal');
    doc.setTextColor(...C.textDark);
    doc.text((userData.fullName || '—').toUpperCase(), mL + 7, y + (isBilingual ? 26 : 20));

    const detailY = y + (isBilingual ? 38 : 30);
    doc.setFontSize(8);
    doc.setFont(baseFont, 'normal');
    doc.setTextColor(...C.muted);
    const tfnMasked = `TFN: *** *** ${userData.tfn ? String(userData.tfn).replace(/\D/g, '').slice(-3) : '***'}`;
    const dateStr = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

    const residencyLabelLines = residencyLabel.split('\n');
    const residencyLabelEn = residencyLabelLines[0] || 'Australian tax resident';
    const residencyLabelZh = residencyLabelLines[1] || '澳大利亚税务居民';

    if (isBilingual) {
        doc.text(tfnMasked, mL + 7, detailY);
        doc.text(`Generated: ${dateStr}`, pageW / 2, detailY - 3, { align: 'center' });
        doc.setFontSize(7);
        doc.text(`生成日期: ${dateStr}`, pageW / 2, detailY + 3, { align: 'center' });
        doc.setFontSize(8);
        // FIX 1: was userData.taxResidencyStatus === 'australian' ? '...' : residencyLabel.split('\n')[0]
        doc.text('Residency: ' + residencyLabelEn, pageW - mR - 3, detailY - 3, { align: 'right' });
        doc.setFontSize(7);
        // FIX 1: was userData.taxResidencyStatus === 'australian' ? '澳大利亚税务居民' : residencyLabel.split('\n')[1] || ''
        doc.text('税务身份: ' + residencyLabelZh, pageW - mR - 3, detailY + 3, { align: 'right' });
    } else {
        doc.text(tfnMasked, mL + 7, detailY);
        doc.text(`Generated: ${dateStr}`, pageW / 2, detailY, { align: 'center' });
        // FIX 1: was userData.taxResidencyStatus === 'australian' ? 'Australian tax resident' : residencyLabel
        doc.text(`Residency: ${residencyLabelEn}`, pageW - mR - 3, detailY, { align: 'right' });
    }

    y += userCardH + 8;
    accentRule(y);
    y += 10;

    const heroH = isBilingual ? 66 : 54;
    doc.setFillColor(...C.cardBg);
    doc.roundedRect(mL, y, contentW, heroH, 3, 3, 'F');
    doc.setDrawColor(...(isRefund ? C.accent : C.error));
    doc.setLineWidth(0.5);
    doc.roundedRect(mL, y, contentW, heroH, 3, 3, 'S');
    doc.setFillColor(...(isRefund ? C.accent : C.error));
    doc.roundedRect(mL, y, 3.5, heroH, 1.5, 1.5, 'F');

    doc.setFontSize(8);
    doc.setFont(baseFont, 'normal');
    doc.setTextColor(...C.muted);
    if (isBilingual) {
        doc.text(`ESTIMATED RESULT FOR ${taxYearLabel}`, pageW / 2, y + 8, { align: 'center' });
        doc.setFontSize(7);
        doc.text(`${taxYearLabelZh}年度预计结果`, pageW / 2, y + 14, { align: 'center' });
    } else {
        doc.text(`ESTIMATED RESULT FOR ${taxYearLabel}`, pageW / 2, y + 11, { align: 'center' });
    }

    doc.setFontSize(34);
    doc.setFont(baseFont, 'normal');
    doc.setTextColor(...(isRefund ? C.accent : C.error));
    doc.text(money(Math.abs(calc.refund)), pageW / 2, y + 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont(baseFont, 'normal');
    doc.setTextColor(...(isRefund ? C.primary : C.error));
    if (isBilingual) {
        doc.text(isRefund ? 'ESTIMATED REFUND' : 'ESTIMATED AMOUNT OWING', pageW / 2, y + 38, { align: 'center' });
        doc.setFontSize(8.5);
        doc.text(isRefund ? '预计退税' : '预计欠税', pageW / 2, y + 44, { align: 'center' });
    } else {
        doc.text(isRefund ? 'ESTIMATED REFUND' : 'ESTIMATED AMOUNT OWING', pageW / 2, y + 38, { align: 'center' });
        doc.setFontSize(7.5);
        doc.setTextColor(...C.muted);
        doc.text('Estimate only. Your actual ATO assessment may differ.', pageW / 2, y + 47, { align: 'center' });
    }

    if (isBilingual) {
        doc.setFontSize(7);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.muted);
        doc.text('Estimate only. Your actual ATO assessment may differ.',
            pageW / 2, y + heroH - 13, { align: 'center' });
        doc.text('仅为估算值，实际ATO评估结果可能有所不同。',
            pageW / 2, y + heroH - 6, { align: 'center' });
    }

    y += heroH + 6;

    const stats = [
        { label: txt('Total Income', '总收入'),       value: money(calc.totalIncome) },
        { label: txt('Total Deductions', '总抵扣'),   value: money(calc.totalDeductions) },
        { label: txt('Tax Withheld', '预扣税款'),     value: money(calc.totalTaxWithheld) },
        { label: txt('Tax Liability', '税务负债'),    value: money(calc.totalTaxLiability) }
    ];

    const statBoxH = isBilingual ? 24 : 20;
    const statW = contentW / 4;
    stats.forEach((s, i) => {
        const sx = mL + i * statW;
        doc.setFillColor(...C.rowAlt);
        doc.roundedRect(sx, y, statW - 2, statBoxH, 2, 2, 'F');
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.2);
        doc.roundedRect(sx, y, statW - 2, statBoxH, 2, 2, 'S');
        doc.setFontSize(7);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.muted);
        doc.text(s.label, sx + (statW - 2) / 2, y + (isBilingual ? 8 : 7), { align: 'center' });
        doc.setFontSize(9.5);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.primary);
        doc.text(s.value, sx + (statW - 2) / 2, y + (isBilingual ? 18 : 15), { align: 'center' });
    });

    
    doc.addPage();

    // ========================================
    // PAGE 2 - INCOME SUMMARY & DEDUCTIONS
    // ========================================
    pageTitleBand(txt('INCOME SUMMARY & DEDUCTIONS', '收入摘要与抵扣项目'));

    y = 22;
    y = sectionHeader(txt('INCOME SUMMARY', '收入摘要'), y);
    y += 3;

  const incomeRows = [
        [txt('PAYG employment income', '就业收入（PAYG）'),                         money(bd.paygIncome || 0)],
        [txt('ABN / business income (gross)', 'ABN/商业收入（总额）'),               money(bd.abnGross || 0)],
        [txt('ABN business expenses', 'ABN业务费用'),                              `- ${money(bd.abnExpenses || 0)}`, true],
        [txt('ABN / business income (net)', 'ABN/商业收入（净额）'),                 money(bd.abnNetAssessable || 0)],
        [txt('Interest income', '利息收入'),                                        money(bd.interestIncome || 0)],
        [txt('Dividends (cash received)', '股息（现金收入）'),                       money(bd.dividendsCash || 0)],
        [txt('Franking credits attached', 'Franking抵免额'),                        money(bd.frankingCredits || 0)],
        [txt('Dividends (grossed-up total)', '股息（总额）'),                        money(bd.grossedUpDividends || 0)],
        [txt('Rental income (net)', '租金收入（净额）'),                            moneyAccounting(bd.rentalNet || 0)],
        [txt('Capital gains (after discount)', '资本利得（折扣后）'),               money(bd.assessableCapitalGains || 0)],
        [txt('Government payments', '政府补贴'),                                    money(bd.governmentPayments || 0)],
        [txt('Government tax withheld', '政府预扣税款'),                            `- ${money(bd.govTaxWithheld || 0)}`, true],
        [txt('Foreign income', '境外收入'),                                         money(bd.foreignIncome || 0)],
        [txt('Other income', '其他收入'),                                           money(bd.otherIncome || 0)]
    ].filter(r => {
        const amount = r[1];
        if (amount === money(0) || amount === moneyAccounting(0)) return false;
        if (r[2] === true && amount === `- ${money(0)}`) return false;
        return true;
    });
    const incomeBody = incomeRows.map(r => {
        const isExpense = r[2] === true;
        const isNeg = r[1] && (r[1].startsWith('(') || r[1].startsWith('-'));
        return [
            {
                content: r[0] + (isExpense ? '' : (isNeg ? ('\n' + txt('* loss — reduces taxable income', '* 损失 - 减少应纳税收入')) : '')),
                styles: { fontSize: isExpense ? 8 : 9, textColor: isExpense ? C.muted : (isNeg ? C.error : C.textDark), font: baseFont }
            },
            {
                content: r[1],
                styles: { halign: 'right', textColor: isExpense ? C.muted : (isNeg ? C.error : C.textDark), font: baseFont }
            }
        ];
    });

    doc.autoTable({
        startY: y,
        head: [[
            { content: txt('Income Source', '收入来源'), styles: { halign: 'left', font: baseFont } },
            { content: txt('Amount', '金额'), styles: { halign: 'right', font: baseFont } }
        ]],
        body: [
            ...incomeBody,
            [
                { content: txt('TOTAL ASSESSABLE INCOME', '应纳税总收入'), styles: { fontStyle: 'bold', fillColor: C.totalRow, textColor: C.textDark, font: baseFont } },
                { content: money(calc.totalIncome), styles: { fontStyle: 'bold', halign: 'right', fillColor: C.totalRow, textColor: C.primary, font: baseFont } }
            ]
        ],
        margin: { left: mL, right: mR },
        theme: 'plain',
        headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9, cellPadding: 3, font: baseFont },
        bodyStyles: { fontSize: 9, textColor: C.textDark, cellPadding: 2.8, font: baseFont },
        alternateRowStyles: { fillColor: C.rowAlt },
        columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 42, halign: 'right' } }
    });

    y = doc.lastAutoTable.finalY + 6;
       // ABN loss note — insert HERE before deductions header
    if (bd.abnIsLoss) {
        doc.setFillColor(...C.warning);
        doc.roundedRect(mL, y, contentW, isBilingual ? 22 : 14, 1.5, 1.5, 'F');
        doc.setDrawColor(...C.warningBorder);
        doc.setLineWidth(0.3);
        doc.roundedRect(mL, y, contentW, isBilingual ? 22 : 14, 1.5, 1.5, 'S');
        doc.setFontSize(8);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.textDark);
        doc.text(
            txt(
                `ABN loss of ${money(Math.abs(bd.abnNet))} noted. Under ATO non-commercial loss rules this has not been applied against your PAYG income.`,
                `ABN亏损${money(Math.abs(bd.abnNet))}已记录。根据ATO非商业损失规则，此亏损未抵扣您的PAYG收入。`
            ),
            mL + 4, y + 6, { maxWidth: contentW - 8 }
        );
        y += isBilingual ? 26 : 18;
    }

    // Rental loss carry-forward note
    if (calc.rentalLossCarryForward > 0) {
        doc.setFillColor(...C.warning);
        doc.roundedRect(mL, y, contentW, isBilingual ? 20 : 14, 1.5, 1.5, 'F');
        doc.setDrawColor(...C.warningBorder);
        doc.setLineWidth(0.3);
        doc.roundedRect(mL, y, contentW, isBilingual ? 20 : 14, 1.5, 1.5, 'S');
        doc.setFontSize(8);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.textDark);
        doc.text(
            txt(
                `Rental loss of ${money(calc.rentalLossCarryForward)} carried forward to next year.`,
                `租金损失 ${money(calc.rentalLossCarryForward)} 结转至下一年度。`
            ),
            mL + 4, y + 6, { maxWidth: contentW - 8 }
        );
        y += isBilingual ? 24 : 18;
    }

    y = sectionHeader(txt('DEDUCTIONS SUMMARY', '抵扣摘要'), y + 4);
    y += 3;
    

    const deductionRows = [
        [txt('Working from home expenses', '居家工作费用'),  money(userData.homeOffice || 0)],
        [txt('Car & travel expenses', '汽车与差旅费用'),     money(userData.travelExpenses || 0)],
        [txt('Equipment & tools', '设备与工具'),             money(userData.equipment || 0)],
        [txt('Self-education expenses', '自学费用'),         money(userData.selfEducation || 0)],
        [txt('Other work-related expenses', '其他工作费用'), money(userData.otherDeductions || 0)]
    ].filter(r => r[1] !== money(0));

    doc.autoTable({
        startY: y,
        head: [[
            { content: txt('Deduction Type', '抵扣类型'), styles: { halign: 'left', font: baseFont } },
            { content: txt('Amount', '金额'), styles: { halign: 'right', font: baseFont } }
        ]],
        body: [
            ...deductionRows.map(r => [
                { content: r[0], styles: { font: baseFont } },
                { content: r[1], styles: { halign: 'right', font: baseFont } }
            ]),
            [
                { content: txt('TOTAL DEDUCTIONS', '总抵扣额'), styles: { fontStyle: 'bold', fillColor: C.totalRow, textColor: C.textDark, font: baseFont } },
                { content: money(calc.totalDeductions), styles: { fontStyle: 'bold', halign: 'right', fillColor: C.totalRow, textColor: C.primary, font: baseFont } }
            ]
        ],
        margin: { left: mL, right: mR },
        theme: 'plain',
        headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9, cellPadding: 3, font: baseFont },
        bodyStyles: { fontSize: 9, textColor: C.textDark, cellPadding: 2.8, font: baseFont },
        alternateRowStyles: { fillColor: C.rowAlt },
        columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 42, halign: 'right' } }
    });

    y = doc.lastAutoTable.finalY + 10;
    
    if (userData.equipmentAssets && userData.equipmentAssets.length > 0) {
        doc.setFontSize(10);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.primary);
        doc.text(txt('Equipment assets detail:', '设备资产明细：'), mL, y);
        y += 5;

        const assetRows = [];

        userData.equipmentAssets.forEach((asset, idx) => {
            const assetTypeName = ASSET_TYPES[asset.type]?.label || asset.type;
            const originalCost  = asset.originalCost || asset.cost || 0;
            const depreciation  = asset.depreciation || 0;
            const workPercent   = asset.workPercentage || 100;

            const enLabel = `${idx + 1}. ${assetTypeName}: $${originalCost.toLocaleString()} cost, ${workPercent}% work use, $${depreciation.toLocaleString()} depreciation`;
            const zhLabel = `${idx + 1}. ${assetTypeName}：成本 $${originalCost.toLocaleString()}，工作使用 ${workPercent}%，折旧 $${depreciation.toLocaleString()}`;

            // Same background for both EN and ZH rows of the same asset
            const rowBg = idx % 2 === 0 ? C.rowAlt : [255, 255, 255];

            assetRows.push([{
                content: enLabel,
                styles: { font: baseFont, fontSize: 9, textColor: [0, 0, 0], cellPadding: [2.8, 2.8, 0.5, 2.8], fillColor: rowBg }
                //                                                              top, right, bottom, left
            }]);

            if (isBilingual) {
                assetRows.push([{
                    content: zhLabel,
                    styles: { font: baseFont, fontSize: 8.5, textColor: C.muted, cellPadding: [0.5, 2.8, 2.8, 2.8], fillColor: rowBg }
                    //                                                              top=0.5 so EN+ZH feel like one cell
                }]);
            }
        });

        // Prime jsPDF font state BEFORE calling autoTable
        doc.setFont(baseFont, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

        doc.autoTable({
            startY: y,
            body: assetRows,
            margin: { left: mL, right: mR },
            theme: 'plain',
            bodyStyles: {
                font: baseFont,
                fontStyle: 'normal',
                fontSize: 9,
                textColor: [0, 0, 0],
                cellPadding: 2.8,
                overflow: 'linebreak',
                minCellHeight: 0,
            },
            // ✅ removed alternateRowStyles — background now controlled manually per row
            columnStyles: {
                0: { cellWidth: 'auto', overflow: 'linebreak' }
            },
            didParseCell: (data) => {
                data.cell.styles.font = baseFont;
                data.cell.styles.fontStyle = 'normal';
                data.cell.styles.overflow = 'linebreak';
            },
        });

        y = doc.lastAutoTable.finalY + 10;
    }
    
    doc.addPage();

     // ========================================
    // PAGE 3 - LODGEMENT GUIDE
    // ========================================
    pageTitleBand(txt('LODGEMENT GUIDE', '申报指南'));
    y = 22;
    y = sectionHeader(txt('HOW TO LODGE YOUR RETURN WITH THE ATO', '如何向ATO提交税务申报'), y);
    y += 5;
    const steps = isBilingual ? [
        ['1', `Log into myGov at my.gov.au using your myGov credentials.\n访问 my.gov.au 并使用您的 myGov 凭据登录。`],
        ['2', `Link the ATO — search "Australian Taxation Office" and connect.\n关联ATO — 搜索并连接到您的账户。`],
        ['3', `Select Tax, Lodge return, choose financial year ${taxYearLabel}.\n选择 Tax，Lodge return，选择${taxYearLabelZh}。`],
        ['4', `Enter your income using the Income Summary above.\n使用上方收入摘要输入您的收入。`],
        ['5', `Enter your deductions using the Deductions Summary above. Keep all receipts.\n使用上方抵扣摘要输入您的抵扣项目，并保存所有收据。`],
        ['6', `Complete the Medicare levy and private health insurance sections.\n完成医疗保险税和私人医疗保险相关问题。`],
        ['7', `Review all information, declare it is true and correct, then submit.\n检查所有信息，声明真实准确后提交申报。`],
        ['8', `Save your ATO lodgement confirmation and this report for 5 years.\n保存ATO申报确认函和本报告，保留5年。`]
    ] : [
        ['1', `Log into myGov at my.gov.au using your myGov credentials.`],
        ['2', `Link the ATO — search "Australian Taxation Office" and connect it to your account.`],
        ['3', `Select Tax > Lodge return > choose financial year ${taxYearLabel}.`],
        ['4', `Enter your income using the Income Summary above.`],
        ['5', `Enter your deductions using the Deductions Summary above. Keep all receipts.`],
        ['6', `Complete the Medicare levy and private health insurance sections.`],
        ['7', `Review all information, declare it is true and correct, then submit.`],
        ['8', `Save your ATO lodgement confirmation and this report for 5 years.`]
    ];

    steps.forEach(([num, text], i) => {
        const lines = text.split('\n');
        const lineCount = lines.length;
        const lineHeight = 5.0;
        const padding = 4;
        const rowH = lineCount * lineHeight + padding;
        const textBlockHeight = lineCount * lineHeight;
        const baselineOffset = lineHeight * 0.6;
        const startY = y + (rowH - textBlockHeight) / 2 + baselineOffset;

        if (y > pageH - rowH - 10) {
            doc.addPage();
            pageTitleBand(txt('LODGEMENT GUIDE (CONTINUED)', '申报指南（续）'));
            y = 22;
            const newStartY = y + (rowH - textBlockHeight) / 2 + baselineOffset;
            if (i % 2 === 0) {
                doc.setFillColor(...C.rowAlt);
                doc.rect(mL, y, contentW, rowH, 'F');
            }
            doc.setFillColor(...C.primary);
            doc.circle(mL + 4, startY - baselineOffset + 1, 3.2, 'F');
            doc.setFontSize(7.5);
            doc.setFont(baseFont, 'normal');
            doc.setTextColor(...C.white);
            doc.text(num, mL + 4, startY - baselineOffset + 2.5, { align: 'center' });
            doc.setFont(baseFont, 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(...C.textDark);
            let textY = newStartY;
            lines.forEach(line => {
                doc.text(line, mL + 10, textY, { maxWidth: contentW - 12 });
                textY += lineHeight;
            });
            y += rowH + 2;
            return;
        }

        if (i % 2 === 0) {
            doc.setFillColor(...C.rowAlt);
            doc.rect(mL, y, contentW, rowH, 'F');
        }

        const circleCenterY = startY - (lineHeight * 0.2);
        doc.setFillColor(...C.primary);
        doc.circle(mL + 4, circleCenterY, 3.2, 'F');
        doc.setFontSize(7.5);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.white);
        doc.text(num, mL + 4, circleCenterY + 1.2, { align: 'center' });

        doc.setFont(baseFont, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...C.textDark);
        let textY = startY;
        lines.forEach(line => {
            doc.text(line, mL + 10, textY, { maxWidth: contentW - 12 });
            textY += lineHeight;
        });

        y += rowH + 2;
    });

    
    doc.addPage();

    // ========================================
    // PAGE 4 - EMPLOYMENT DETAILS & TAX CALCULATION
    // ========================================
    pageTitleBand(txt('EMPLOYMENT DETAILS & TAX BREAKDOWN', '就业详情与税务计算'));

    y = 22;
    y = sectionHeader(txt('EMPLOYMENT DETAILS', '就业详情'), y);
    y += 3;

    const empRows = (userData.employers || []).map(emp => [
        { content: (emp.employerName || '—').replace(/'/g, '’'), styles: { font: baseFont } },
        emp.employerAbn ? String(emp.employerAbn).replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4') : '—',
        { content: money(emp.grossIncome || 0), styles: { halign: 'right', font: baseFont } },
        { content: money(emp.taxWithheld || 0), styles: { halign: 'right', font: baseFont } }
    ]);

    if (empRows.length === 0) {
        empRows.push([
            txt('No employers recorded', '未记录雇主'),
            '—',
            { content: '—', styles: { halign: 'right' } },
            { content: '—', styles: { halign: 'right' } }
        ]);
    }

    doc.autoTable({
        startY: y,
        head: [[
            { content: txt('Employer Name', '雇主名称'), styles: { font: baseFont } },
            'ABN',
            { content: txt('Gross Income', '总收入'), styles: { halign: 'right', font: baseFont } },
            { content: txt('Tax Withheld', '预扣税款'), styles: { halign: 'right', font: baseFont } }
        ]],
        body: empRows,
        margin: { left: mL, right: mR },
        theme: 'plain',
        headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9, cellPadding: 3, font: baseFont },
        bodyStyles: { fontSize: 9, textColor: C.textDark, cellPadding: 2.8, font: baseFont },
        alternateRowStyles: { fillColor: C.rowAlt },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 35 },
            2: { cellWidth: 28, halign: 'right' },
            3: { cellWidth: 28, halign: 'right' }
        }
    });

        y = doc.lastAutoTable.finalY + 10;

    // ========================================
    // NEW: STUDENT LOAN OBLIGATIONS SECTION
    // ========================================
    if (userData.hasHecsLoan !== undefined) {
        y = sectionHeader(txt('STUDENT LOAN OBLIGATIONS', '学生贷款义务'), y);
        y += isBilingual ? 10 : 6;

        // HECS loan status
        doc.setFontSize(8.5);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.muted);
        doc.text(txt('HELP / HECS student loan:', 'HELP / HECS 学生贷款：'), mL + 3, y);
        doc.setTextColor(...C.textDark);
        doc.text(userData.hasHecsLoan ? txt('Yes', '是') : txt('No', '否'), pageW - mR - 3, y, { align: 'right' });
        y += isBilingual ? 10 : 6;

        // Manual repayment income (if entered)
        if (userData.hasHecsLoan && userData.hecsManualRepaymentIncome > 0) {
            doc.setFontSize(8.5);
            doc.setFont(baseFont, 'normal');
            doc.setTextColor(...C.muted);
            doc.text(txt('Manual repayment income:', '手动输入还款收入：'), mL + 3, y);
            doc.setTextColor(...C.textDark);
            doc.text(money(userData.hecsManualRepaymentIncome), pageW - mR - 3, y, { align: 'right' });
            y += isBilingual ? 10 : 6;
        }

        // Compulsory repayment amount (if > 0)
        if (calc.hecsRepayment > 0) {
            doc.setFontSize(8.5);
            doc.setFont(baseFont, 'normal');
            doc.setTextColor(...C.muted);
            doc.text(txt('Compulsory repayment (added to tax liability):', '强制还款额（计入税务负债）：'), mL + 3, y);
            doc.setTextColor(...C.primary);
            doc.text(money(calc.hecsRepayment), pageW - mR - 3, y, { align: 'right' });
            y += isBilingual ? 10 : 6;
        }

        y += 4;
        accentRule(y);
        y += 8;
    }

    y = sectionHeader(txt('TAX CALCULATION BREAKDOWN', '税务计算明细'), y);
    y += 3;

    doc.autoTable({
        startY: y,
        body: [
            [{ content: txt('Taxable income', '应纳税收入'), styles: { font: baseFont } }, { content: money(calc.taxableIncome), styles: { halign: 'right', font: baseFont } }],
            [{ content: txt('Adjusted Taxable Income (ATI) — used for MLS check', '调整后应纳税收入（ATI）— 用于MLS计算'), styles: { font: baseFont } }, { content: money(calc.ati), styles: { halign: 'right', textColor: C.muted, font: baseFont } }],
            ['', ''],
            [{ content: txt('Income tax on taxable income', '应纳税收入的所得税'), styles: { font: baseFont } }, { content: money(calc.incomeTax), styles: { halign: 'right', font: baseFont } }],
            [{ content: txt('Medicare levy (2%)', '医疗保险税（2%）'), styles: { font: baseFont } }, { content: money(calc.medicareLevy), styles: { halign: 'right', font: baseFont } }],
            [{ content: txt('Medicare levy surcharge', '医疗保险附加税'), styles: { font: baseFont } }, { content: money(calc.medicareSurcharge), styles: { halign: 'right', font: baseFont } }],
            [{ content: txt('Low Income Tax Offset (LITO)', '低收入税收抵免（LITO）'), styles: { font: baseFont } }, { content: `- ${money(calc.lito)}`, styles: { halign: 'right', textColor: [40, 150, 80], font: baseFont } }],
            [
                { content: txt('Less: PHI rebate (claimed at tax time)', '减：私人医保退税（报税时申报）'), styles: { font: baseFont } },
                { content: `- ${money(calc.phiRebate)}`, styles: { halign: 'right', textColor: [40, 150, 80], font: baseFont } }
            ],
            [
                { content: txt('Add: HELP / HECS compulsory repayment', '加：HELP / HECS 强制还款'), styles: { font: baseFont } },
                { content: money(calc.hecsRepayment), styles: { halign: 'right', font: baseFont } }
            ],
            [
                { content: txt('TOTAL TAX LIABILITY', '总税务负债'), styles: { fontStyle: 'bold', fillColor: C.totalRow, font: baseFont } },
                { content: money(calc.totalTaxLiability), styles: { fontStyle: 'bold', halign: 'right', fillColor: C.totalRow, textColor: C.primary, font: baseFont } }
            ],
            [{ content: txt('Less: PAYG tax withheld', '减：PAYG预扣税款'), styles: { font: baseFont } }, { content: `- ${money(calc.totalTaxWithheld)}`, styles: { halign: 'right', textColor: [40, 150, 80], font: baseFont } }],
            [{ content: txt('Less: Franking credit offset (refundable)', '减：股息抵免额（可退款）'), styles: { font: baseFont } }, { content: `- ${money(calc.frankingCreditOffset || 0)}`, styles: { halign: 'right', textColor: [40, 150, 80], font: baseFont } }],
            [
                { content: isRefund ? txt('ESTIMATED REFUND', '预计退税') : txt('ESTIMATED AMOUNT OWING', '预计欠税'), styles: { fontStyle: 'bold', fillColor: isRefund ? [220, 240, 255] : [255, 235, 238], font: baseFont } },
                { content: money(Math.abs(calc.refund)), styles: { fontStyle: 'bold', halign: 'right', fillColor: isRefund ? [220, 240, 255] : [255, 235, 238], textColor: isRefund ? C.primary : C.error, font: baseFont } }
            ]
        ],
        margin: { left: mL, right: mR },
        theme: 'plain',
        bodyStyles: { fontSize: 9, textColor: C.textDark, cellPadding: 2.8, font: baseFont },
        columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 42, halign: 'right' } }
    });
    y = doc.lastAutoTable.finalY + 10;

    if (hasCapLoss) {
        y = carryForwardBox(calc.capitalLossCarryForward, y);
    }

    const hasAdj = [
        userData.fringeBenefits, userData.reportableSuper, userData.taxFreeGovPayments,
        foreignIncomeForPdf,                                    // FIX 2: use exemption-aware value
        userData.financialInvestmentLoss,
        Math.max(0, (userData.rentalExpenses || 0) - (userData.rentalIncome || 0)),
        userData.childSupportPaid, userData.dependentChildren
    ].some(v => v && Number(v) > 0);

    if (hasAdj) {
        if (y > pageH - 60) { doc.addPage(); pageTitleBand(txt('INCOME TEST ADJUSTMENTS', '收入测试调整')); y = 22; }
        y = sectionHeader(txt('INCOME TEST ADJUSTMENTS (IT1-IT8)', '收入测试调整（IT1-IT8）'), y);
        y += 3;

        const adjRows = [
            ['IT1', txt('Reportable fringe benefits', '可报告附加福利'),       money(userData.fringeBenefits || 0)],
            ['IT2', txt('Reportable employer super', '可报告雇主养老金'),       money(userData.reportableSuper || 0)],
            ['IT3', txt('Tax-free government payments', '免税政府付款'),        money(userData.taxFreeGovPayments || 0)],
            ['IT4', txt('Target foreign income', '目标境外收入'),               money(foreignIncomeForPdf)],
            ['IT5', txt('Net financial investment loss', '净金融投资损失'),      money(userData.financialInvestmentLoss || 0)],
            ['IT6', txt('Net rental property loss', '净租金损失'),           money(Math.max(0, (userData.rentalExpenses || 0) - (userData.rentalIncome || 0)))],
            ['IT7', txt('Child support paid', '支付的子女抚养费'),              money(userData.childSupportPaid || 0)],
            ['IT8', txt('Dependent children', '受抚养子女数量'),                String(userData.dependentChildren || 0)]
        ].filter(r => r[2] !== money(0) && r[2] !== '0');

        doc.autoTable({
            startY: y,
            head: [[
                { content: txt('Code', '编码'), styles: { cellWidth: 12, font: baseFont } },
                { content: txt('Adjustment Item', '调整项目'), styles: { font: baseFont } },
                { content: txt('Amount', '金额'), styles: { halign: 'right', font: baseFont } }
            ]],
            body: [
                ...adjRows.map(r => [
                    { content: r[0], styles: { fontStyle: 'bold', textColor: C.primary, cellWidth: 12, font: baseFont } },
                    { content: r[1], styles: { font: baseFont } },
                    { content: r[2], styles: { halign: 'right', font: baseFont } }
                ]),
                [
                    { content: '', styles: { fillColor: C.totalRow } },
                    { content: txt('ADJUSTED TAXABLE INCOME (ATI)', '调整后应纳税收入（ATI）'), styles: { fontStyle: 'bold', fillColor: C.totalRow, font: baseFont } },
                    { content: money(calc.ati), styles: { fontStyle: 'bold', halign: 'right', fillColor: C.totalRow, textColor: C.primary, font: baseFont } }
                ]
            ],
            margin: { left: mL, right: mR },
            theme: 'plain',
            headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9, cellPadding: 3, font: baseFont },
            bodyStyles: { fontSize: 9, textColor: C.textDark, cellPadding: 2.8, font: baseFont },
            alternateRowStyles: { fillColor: C.rowAlt },
            columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 42, halign: 'right' } }
        });
    }

    
    doc.addPage();

    // ========================================
    // PAGE 5 - HEALTH & IMPORTANT NOTES
    // ========================================
    pageTitleBand(txt('PRIVATE HEALTH INSURANCE & IMPORTANT NOTES', '私人医疗保险与重要说明'));

    y = 22;
    y = sectionHeader(txt('PRIVATE HEALTH INSURANCE', '私人医疗保险'), y);
    y += 6;

    y = infoRow(txt('Hospital cover', '医院保险'), coverText, y, false);
    y = infoRow(
        txt('Family situation', '家庭情况'),
        userData.isSingle ? txt('Single', '单身') : txt('Couple / Family', '夫妻/家庭'),
        y, true
    );
    y = infoRow(txt('Dependent children (IT8)', '受抚养子女（IT8）'), String(userData.dependentChildren || 0), y, false);
    y = infoRow(
        txt('PHI rebate method', '私人医保退税方式'),
        userData.phiRebateMethod === 'upfront'
            ? txt('Claimed as premium reduction', '以保费减免方式申报')
            : userData.phiRebateMethod === 'taxtime'
                ? txt('Claimed at tax time', '在报税时申报')
                : txt('Not claimed', '未申报'),
                y, true
            );

    y += 12;
    accentRule(y);
    y += 10;

    y = sectionHeader(txt('IMPORTANT NOTES', '重要说明'), y);
    y += 6;

    const disclaimerItems = isBilingual ? [
        'This report is an estimate only based on the information you provided.\n本报告仅为基于您所提供信息的估算结果。',
        'Your actual ATO assessment may differ based on your individual circumstances.\n您实际的ATO评估结果可能因个人情况而有所不同。',
        'Taxlyy is a technology tool and is not a registered tax agent under the Tax Agent Services Act 2009.\nTaxlyy是一个技术工具，不是《税务代理服务法2009》下的注册税务代理人。',
        'You are solely responsible for the accuracy and completeness of your tax return.\n您对税务申报的准确性和完整性负全部责任。',
        'All deductions must be supported by receipts and records kept for a minimum of 5 years.\n所有抵扣项目必须有收据支持，且相关记录须至少保存5年。',
        'The ATO individual tax return lodgement deadline is 31 October each year.\nATO个人税务申报截止日期为每年10月31日。',
        'Capital losses cannot offset other income — they must be manually carried forward to future returns.\n资本损失不可抵扣其他收入 — 向ATO申报时须手动结转至未来年度的申报表。',
        'For complex tax situations, consult a registered tax agent.\n如税务情况复杂，请咨询注册税务代理人。'
    ] : [
        'This report is an estimate only based on the information you provided.',
        'Your actual ATO assessment may differ based on your individual circumstances.',
        'Taxlyy is a technology tool and is not a registered tax agent under the Tax Agent Services Act 2009.',
        'You are solely responsible for the accuracy and completeness of your tax return.',
        'All deductions must be supported by receipts and records kept for a minimum of 5 years.',
        'The ATO individual tax return lodgement deadline is 31 October each year.',
        'Capital losses cannot offset other income — they must be manually carried forward to future returns when lodging with the ATO. Taxlyy does not automatically lodge or carry forward data across years.',
        'For complex tax situations, consult a registered tax agent.'
    ];

    disclaimerItems.forEach((item, i) => {
        const wrappedLines = doc.splitTextToSize(item, contentW - 6);
        const lineCount = wrappedLines.length;
        const lineHeight = 5.0;
        const padding = 3;
        const rowH = lineCount * lineHeight + padding;
        const textBlockHeight = lineCount * lineHeight;
        const baselineOffset = lineHeight * 0.6;
        const startY = y + (rowH - textBlockHeight) / 2 + baselineOffset;

        if (i === 6) {
            doc.setFillColor(...C.warning);
            doc.roundedRect(mL, y, contentW, rowH, 1.5, 1.5, 'F');
            doc.setDrawColor(...C.warningBorder);
            doc.setLineWidth(0.3);
            doc.roundedRect(mL, y, contentW, rowH, 1.5, 1.5, 'S');
        } else if (i % 2 === 0) {
            doc.setFillColor(...C.rowAlt);
            doc.rect(mL, y, contentW, rowH, 'F');
        }

        doc.setFontSize(8.5);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.textDark);
        let textY = startY;
        wrappedLines.forEach((line, idx) => {
            const prefix = idx === 0 ? `${i+1}.  ` : '   ';
            doc.text(prefix + line, mL + 3, textY, { maxWidth: contentW - 6 });
            textY += lineHeight;
        });
        y += rowH + 2;
    });

    y += 6;
    accentRule(y);
    y += 8;
    doc.setFontSize(8);
    doc.setFont(baseFont, 'normal');
    doc.setTextColor(...C.muted);
    doc.text(
        txt(
            'Thank you for using Taxlyy Individual. Keep this report with your tax records.',
            '感谢您使用Taxlyy Individual。请将本报告与您的税务记录一并妥善保存。'
        ),
        pageW / 2, y, { align: 'center' }
    );

    

    // ========================================
    // PAGE  - TAX INVOICE
    // ========================================
    if (hasInvoice) {
        doc.addPage();  // Creates Page 6

        doc.setFillColor(...C.navy);
        doc.rect(0, 0, pageW, 38, 'F');

        doc.setFillColor(...C.primary);
        doc.triangle(pageW - 30, 38, pageW, 38, pageW, 10, 'F');
        doc.setFillColor(...C.accent);
        doc.triangle(pageW - 15, 38, pageW, 38, pageW, 22, 'F');

        doc.setDrawColor(...C.primary);
        doc.setLineWidth(1.2);
        doc.line(0, 38, pageW, 38);
        doc.setDrawColor(...C.accent);
        doc.setLineWidth(0.5);
        doc.line(0, 39.2, pageW, 39.2);

        doc.setFontSize(8);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.accent);
        doc.text('TAXLYY INDIVIDUAL', pageW / 2, 12, { align: 'center' });

        doc.setFontSize(20);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.white);
        doc.text('TAX INVOICE', pageW / 2, 26, { align: 'center' });

        doc.setFontSize(8.5);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.accent);

        let y = 48;

        const colW = (contentW - 8) / 2;

        doc.setFillColor(...C.cardBg);
        doc.roundedRect(mL, y, colW, 36, 2, 2, 'F');
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.3);
        doc.roundedRect(mL, y, colW, 36, 2, 2, 'S');
        doc.setFillColor(...C.accent);
        doc.roundedRect(mL, y, 3, 36, 1.5, 1.5, 'F');

        doc.setFontSize(7);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.muted);
        doc.text('SUPPLIER', mL + 7, y + 8);

        doc.setFontSize(11);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.textDark);
        doc.text('HEPTA CARE PTY LTD', mL + 7, y + 17);

        doc.setFontSize(8);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.muted);
        doc.text('ABN: 73 666 661 338', mL + 7, y + 25);

        const rightX = mL + colW + 8;
        doc.setFillColor(...C.cardBg);
        doc.roundedRect(rightX, y, colW, 36, 2, 2, 'F');
        doc.setDrawColor(...C.border);
        doc.roundedRect(rightX, y, colW, 36, 2, 2, 'S');
        doc.setFillColor(...C.primary);
        doc.roundedRect(rightX, y, 3, 36, 1.5, 1.5, 'F');

        doc.setFontSize(7);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.muted);
        doc.text('INVOICE DETAILS', rightX + 7, y + 8);

        const invNum = `INV-${(transaction.stripe_payment_intent_id || 'xxxx').slice(-8).toUpperCase()}`;
        const invDate = new Date(transaction.created_at || Date.now()).toLocaleDateString('en-AU', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        const taxYearInv = transaction.tax_year || '2025-26';

        doc.setFontSize(8.5);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.textDark);
        doc.text(invNum, rightX + 7, y + 17);
        doc.setFontSize(7.5);
        doc.setTextColor(...C.muted);
        doc.text(`Date: ${invDate}`, rightX + 7, y + 25);
        doc.text(`Tax year: ${taxYearInv}`, rightX + 7, y + 31);

        y += 44;

        doc.setFillColor(...C.accent);
        doc.rect(mL, y, 3, 7, 'F');
        doc.setFontSize(10);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.primary);
        doc.text('LINE ITEMS', mL + 7, y + 5.5);
        y += 14;

        const originalInclusive = transaction.original_amount;
        const discountInclusive = transaction.discount_amount || 0;
        const totalInclusive = transaction.amount;
        const finalGst = Math.round((totalInclusive / 11) * 100) / 100;
        const netExclusive = totalInclusive - finalGst;

        const tableBody = [];

        tableBody.push([
            { content: 'Tax return preparation service', styles: { font: baseFont, textColor: C.textDark, fontSize: 8.5, cellPadding: { top: 5, bottom: 5, left: 4, right: 4 } } },
            { content: money(originalInclusive), styles: { halign: 'right', font: baseFont, textColor: C.textDark, fontSize: 8.5, cellPadding: { top: 5, bottom: 5, left: 4, right: 4 } } }
        ]);

        if (discountInclusive > 0) {
            const promoCodeDisplay = transaction.promo_code ? ` (code: ${transaction.promo_code})` : '';
            tableBody.push([
                { content: `Promotional discount${promoCodeDisplay}`, styles: { font: baseFont, textColor: C.error, fontSize: 8, fontStyle: 'italic', cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } } },
                { content: `- ${money(discountInclusive)}`, styles: { halign: 'right', font: baseFont, textColor: C.error, fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } } }
            ]);
        }

        tableBody.push([
            { content: 'Subtotal (incl. GST)', styles: { font: baseFont, textColor: C.muted, fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } } },
            { content: money(totalInclusive), styles: { halign: 'right', font: baseFont, textColor: C.muted, fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } } }
        ]);

        tableBody.push([
            { content: 'GST (10% of net)', styles: { font: baseFont, textColor: C.muted, fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } } },
            { content: money(finalGst), styles: { halign: 'right', font: baseFont, textColor: C.muted, fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } } }
        ]);

        doc.autoTable({
            startY: y,
            head: [[
                { content: 'Description', styles: { font: baseFont, halign: 'left' } },
                { content: 'Amount (AUD)', styles: { font: baseFont, halign: 'right' } }
            ]],
            body: tableBody,
            margin: { left: mL, right: mR },
            theme: 'plain',
            headStyles: {
                fillColor: C.primary,
                textColor: C.white,
                fontSize: 8.5,
                fontStyle: 'bold',
                cellPadding: 4,
                font: baseFont
            },
            bodyStyles: { fontSize: 8.5, textColor: C.textDark, font: baseFont },
            alternateRowStyles: { fillColor: C.rowAlt },
            columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 42, halign: 'right' } }
        });

        y = doc.lastAutoTable.finalY;

        const totalRowH = 14;
        doc.setFillColor(...C.totalRow);
        doc.roundedRect(mL, y, contentW, totalRowH, 1.5, 1.5, 'F');
        doc.setDrawColor(...C.primary);
        doc.setLineWidth(0.4);
        doc.roundedRect(mL, y, contentW, totalRowH, 1.5, 1.5, 'S');
        doc.setFillColor(...C.primary);
        doc.roundedRect(mL, y, 3, totalRowH, 1.5, 1.5, 'F');

        doc.setFontSize(10);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.primary);
        doc.text('TOTAL (incl. GST)', mL + 7, y + 9);
        doc.setFontSize(12);
        doc.setTextColor(...C.accent);
        doc.text(money(totalInclusive), pageW - mR - 3, y + 9, { align: 'right' });

        y += totalRowH + 10;

        doc.setFillColor(230, 248, 235);
        doc.roundedRect(mL, y, contentW, 20, 2, 2, 'F');
        doc.setDrawColor(100, 180, 120);
        doc.setLineWidth(0.3);
        doc.roundedRect(mL, y, contentW, 20, 2, 2, 'S');
        doc.setFillColor(40, 160, 80);
        doc.roundedRect(mL, y, 3, 20, 1.5, 1.5, 'F');

        doc.setFontSize(9);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(20, 100, 50);
        doc.text('PAYMENT RECEIVED', mL + 7, y + 8);
        doc.setFontSize(7.5);
        doc.setTextColor(60, 130, 80);

        const pmtMethod = (transaction.payment_method || 'card').replace('_', ' ');
        doc.text(`via ${pmtMethod.charAt(0).toUpperCase() + pmtMethod.slice(1)}  |  Transaction: ${transaction.stripe_payment_intent_id || '—'}`, mL + 7, y + 15);

        y += 28;

        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.3);
        doc.line(mL, y, pageW - mR, y);
        y += 6;

        doc.setFontSize(7.5);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.muted);
        doc.text('This is a tax invoice for GST purposes. ABN 73 666 661 338 is registered for GST.', pageW / 2, y, { align: 'center' });
        doc.text(`Total amount includes GST of ${money(finalGst)}. Keep this invoice with your tax records.`, pageW / 2, y + 5, { align: 'center' });

        
    }
    // ========================================
    // FIX FOOTERS WITH CORRECT PAGE NUMBERS
    // ========================================
    const totalPagesFinal = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPagesFinal; i++) {
        doc.setPage(i);
        const fy = pageH - 10;
        doc.setDrawColor(...C.accent);
        doc.setLineWidth(0.3);
        doc.line(mL, fy - 4, pageW - mR, fy - 4);
        doc.setFontSize(7.5);
        doc.setFont(baseFont, 'normal');
        doc.setTextColor(...C.muted);
        doc.text('Taxlyy Individual', mL, fy);
        doc.text(`Page ${i} / ${totalPagesFinal}`, pageW / 2, fy, { align: 'center' });
        doc.text('Confidential', pageW - mR, fy, { align: 'right' });
    }
    // ========================================
    // SAVE OR RETURN BLOB
    // ========================================
    if (returnBlob) {
        return doc.output('blob');
    } else {
        const safeName = (userData.fullName || 'individual')
            .replace(/[^a-zA-Z\s]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .toLowerCase();
        const langSuffix = isBilingual ? 'bilingual' : 'en';
        const filename = `taxlyy-estimate-${safeName}-${taxYearLabel}-${langSuffix}.pdf`;
        doc.save(filename);
        return true;
    }
}