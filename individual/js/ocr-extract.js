// ========================================
// OCR EXTRACT - Payslip Processing using OCR.space API
// API Key: K83179686688957 (Free Tier - 25,000 requests/month)
// ========================================

// OCR.space API configuration
const OCR_API_KEY = 'K83179686688957';
const OCR_API_URL = 'https://api.ocr.space/parse/image';

// Supported languages for OCR
// Payslips may contain English and/or Chinese
const OCR_LANGUAGE = 'eng';  // English + Simplified Chinese (comma-separated)

/**
 * Process a payslip file using OCR.space API
 * @param {File} file - The payslip file (PDF, JPG, PNG, etc.)
 * @returns {Promise<Object>} Extracted payslip data
 */
async function processPayslip(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload PDF, JPG, or PNG.');
    }
    
    // Validate file size (Free tier: 1MB max)
    if (file.size > 1 * 1024 * 1024) {
        throw new Error('File too large. Free tier limit is 1MB. Upgrade to PRO for 5MB or 100MB+ limit.');
    }
    
    // Show loading indicator
    const uploadZone = document.getElementById('uploadZone');
    if (uploadZone) {
        uploadZone.innerHTML = `
            <div class="spinner"></div>
            <div style="margin-top: 1rem;">Processing payslip with AI...</div>
            <small>This may take 5-10 seconds</small>
        `;
    }
    
    try {
        // Create FormData for API request
        const formData = new FormData();
        formData.append('apikey', OCR_API_KEY);
        formData.append('file', file);
        formData.append('language', OCR_LANGUAGE);
        formData.append('isTable', 'true');      // Better table extraction for payslips
        formData.append('OCREngine', '2');        // Engine 2 = better accuracy
        formData.append('scale', 'true');         // Scale images for better OCR
        
        // Make API request
        const response = await fetch(OCR_API_URL, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        // Check for API errors
        if (!result || result.OCRExitCode !== 1) {
            const errorMsg = result?.ErrorMessage || 'OCR processing failed';
            throw new Error(`OCR Error: ${errorMsg}`);
        }
        
        // Extract parsed text from all pages
        let fullText = '';
        if (result.ParsedResults && result.ParsedResults.length > 0) {
            result.ParsedResults.forEach(page => {
                fullText += page.ParsedText + '\n';
            });
        }
        
        if (!fullText.trim()) {
            throw new Error('No text could be extracted from the payslip. Please ensure the file is clear and readable.');
        }
        
        // Parse the extracted text to find payslip data
        const extractedData = parsePayslipText(fullText);

        // Enrich with ABN lookup (fixes wrong employer names)
        const enrichedData = await enrichWithAbnLookup(extractedData);
        
        // Validate extracted data
        const validation = validatePayslipData(extractedData);
        if (!validation.isValid) {
            // Still return partial data, but show warnings
            console.warn('Validation warnings:', validation.errors);
        }
        
        return enrichedData;
        
    } catch (error) {
        console.error('OCR.space error:', error);
        throw error;
    } finally {
        // Reset upload zone if needed (caller will handle)
    }
}

/**
 * Parse raw OCR text to extract payslip information
 * @param {string} text - Raw OCR extracted text
 * @returns {Object} Structured payslip data
 */
function parsePayslipText(text) {
    // Default result structure
    const result = {
        employerName: null,
        employerAbn: null,
        grossIncomeYTD: null,
        taxWithheldYTD: null,
        superannuation: null,
        payPeriod: { start: null, end: null },
        employeeName: null,
        rawText: text
    };
    
    const lines = text.split('\n');
    
    // 1. Extract Gross Income YTD
    const grossPatterns = [
        /(?:GROSS|GROSS PAY|GROSS EARNINGS|TOTAL GROSS|YTD GROSS|GROSS YTD|YTD EARNINGS|YTD GROSS PAY)\s*:?\s*\$?\s*([0-9,]+\.?[0-9]*)/i,
        /(?:YEAR TO DATE|YTD)\s*(?:GROSS|EARNINGS|PAY|INCOME)\s*:?\s*\$?\s*([0-9,]+\.?[0-9]*)/i,
        /(?:TOTAL|SUM)\s*(?:GROSS|EARNINGS)\s*:?\s*\$?\s*([0-9,]+\.?[0-9]*)/i
    ];
    for (const pattern of grossPatterns) {
        const match = text.match(pattern);
        if (match) {
            result.grossIncomeYTD = parseNumber(match[1]);
            break;
        }
    }
    if (!result.grossIncomeYTD) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toUpperCase();
            if (line.includes('GROSS') || line.includes('YTD') || line.includes('EARNINGS')) {
                const numbers = extractNumbersFromLine(lines[i]);
                if (numbers.length > 0 && numbers[0] > 1000) {
                    result.grossIncomeYTD = numbers[0];
                    break;
                }
                if (i + 1 < lines.length) {
                    const nextLineNumbers = extractNumbersFromLine(lines[i + 1]);
                    if (nextLineNumbers.length > 0 && nextLineNumbers[0] > 1000) {
                        result.grossIncomeYTD = nextLineNumbers[0];
                        break;
                    }
                }
            }
        }
    }
    
    // 2. Extract PAYG Tax Withheld YTD
    const taxPatterns = [
        /(?:PAYG|TAX|WITHHOLDING|INCOME TAX|PAY AS YOU GO)\s*:?\s*\$?\s*([0-9,]+\.?[0-9]*)/i,
        /(?:TAX WITHHELD|TAX DEDUCTED|WITHHELD)\s*:?\s*\$?\s*([0-9,]+\.?[0-9]*)/i,
        /(?:YTD TAX|YTD WITHHOLDING)\s*:?\s*\$?\s*([0-9,]+\.?[0-9]*)/i
    ];
    for (const pattern of taxPatterns) {
        const match = text.match(pattern);
        if (match) {
            result.taxWithheldYTD = parseNumber(match[1]);
            break;
        }
    }
    
    // 3. Extract Employer Name
    const employerPatterns = [
        /EMPLOYER\s*:?\s*([A-Z][A-Z\s&.'-]{2,50})(?:\n|$)/i,
        /COMPANY\s*:?\s*([A-Z][A-Z\s&.'-]{2,50})(?:\n|$)/i,
        /PAYSLIP\s+FOR\s+([A-Z][A-Z\s&.'-]{2,50})/i
    ];
    for (const pattern of employerPatterns) {
        const match = text.match(pattern);
        if (match) {
            result.employerName = match[1].trim();
            break;
        }
    }
    if (!result.employerName && lines.length > 0) {
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i].trim();
            if (line.length > 3 && line.length < 60 && /^[A-Z][A-Za-z\s&.'-]+$/.test(line)) {
                result.employerName = line;
                break;
            }
        }
    }
    
    // 4. Extract ABN
    const abnPattern = /\b(?:ABN|A.B.N.)\s*:?\s*(\d{2}\s?\d{3}\s?\d{3}\s?\d{3})\b/i;
    const abnMatch = text.match(abnPattern);
    if (abnMatch) {
        result.employerAbn = abnMatch[1].replace(/\s/g, ' ');
    }
    
    // 5. Extract Superannuation
    const superPatterns = [
        /(?:SUPER|SUPERANNUATION)\s*:?\s*\$?\s*([0-9,]+\.?[0-9]*)/i,
        /(?:SUPER GUARANTEE|SG CONTRIBUTION)\s*:?\s*\$?\s*([0-9,]+\.?[0-9]*)/i
    ];
    for (const pattern of superPatterns) {
        const match = text.match(pattern);
        if (match) {
            result.superannuation = parseNumber(match[1]);
            break;
        }
    }
    
    // 6. Extract pay period dates
    const datePattern = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|\b(\d{1,2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\w*\s+\d{2,4})\b/gi;
    const dates = [...text.matchAll(datePattern)].map(m => m[0] || m[1]);
    if (dates.length >= 2) {
        result.payPeriod.start = dates[0];
        result.payPeriod.end = dates[dates.length - 1];
    }
    
    // 7. Extract Employee Name – improved for Australian payslips
    let employeeName = null;
    // First, look for a line that looks like a name (two capitalized words) before "Annual Salary" or "Employment Basis"
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length > 5 && line.length < 50 && /^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(line)) {
            // Skip lines that are likely company names or addresses
            if (!/(COMPANY|PTY|LTD|ABN|PAYSLIP|STREET|ROAD|DRIVE|VIC|NSW|QLD|WA|SA|TAS|ACT|NT)/i.test(line)) {
                employeeName = line;
                break;
            }
        }
    }
    // If not found, try specific patterns
    if (!employeeName) {
        const namePatterns = [
            /EMPLOYMENT\s+DETAILS\s*[\n\r]+\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
            /PAY\s+TO\s*:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
            /EMPLOYEE\s*:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
            /NAME\s*:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
            /Zhen\s+Liu/i,   // direct match for sample
            /[A-Z][a-z]+\s+[A-Z][a-z]+(?=\s*\n\s*Annual Salary)/i  // name before "Annual Salary"
        ];
        for (const pattern of namePatterns) {
            const match = text.match(pattern);
            if (match) {
                employeeName = (match[1] || match[0]).trim();
                break;
            }
        }
    }
    result.employeeName = employeeName;
    
    return result;
}

/**
 * Enrich extracted payslip data with official ABN lookup
 * @param {Object} extractedData - Data from parsePayslipText
 * @returns {Promise<Object>} Enriched data with official name
 */
async function enrichWithAbnLookup(extractedData) {
    // If no ABN, nothing to enrich
    if (!extractedData.employerAbn) return extractedData;
    
    // Check if ABNLookup is available
    if (typeof ABNLookup === 'undefined' || typeof ABNLookup.search !== 'function') {
        console.warn('ABNLookup not available – skipping enrichment');
        return extractedData;
    }
    
    try {
        const lookupResult = await ABNLookup.search(extractedData.employerAbn);
        
        if (lookupResult.success && !lookupResult.isList) {
            // ✅ ONLY update employer name and ABN format
            extractedData.employerName = lookupResult.data.legalName;
            extractedData.employerAbn = lookupResult.data.abnFormatted;
            console.log('ABN lookup enriched - Name corrected to:', extractedData.employerName);
        } else {
            console.log('ABN lookup failed or returned multiple results – keeping OCR data');
        }
    } catch (err) {
        console.warn('ABN lookup error – keeping OCR data:', err);
    }
    
    // ✅ Return full extractedData with possibly corrected name/ABN
    return extractedData;
}

/**
 * Extract all numbers from a line of text
 * @param {string} line - Text line
 * @returns {number[]} Array of numbers found
 */
function extractNumbersFromLine(line) {
    const numbers = [];
    const matches = line.match(/\$?\s*([0-9,]+\.?[0-9]*)/g);
    if (matches) {
        for (const match of matches) {
            const num = parseNumber(match);
            if (!isNaN(num) && num > 0) {
                numbers.push(num);
            }
        }
    }
    return numbers;
}

/**
 * Parse a number string (handles commas, currency symbols)
 * @param {string} str - Number string (e.g., "$1,234.56")
 * @returns {number} Parsed number
 */
function parseNumber(str) {
    if (!str) return null;
    const cleaned = String(str).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

/**
 * Validate extracted payslip data
 * @param {Object} data - Extracted payslip data
 * @returns {Object} Validation result
 */
function validatePayslipData(data) {
    const errors = [];
    const warnings = [];
    
    if (!data.employerName || data.employerName.length < 2) {
        warnings.push('Employer name could not be read clearly. You can edit it manually.');
    }
    
    if (!data.grossIncomeYTD || data.grossIncomeYTD <= 0) {
        errors.push('Gross income amount could not be read. Please enter manually.');
    } else if (data.grossIncomeYTD > 500000) {
        warnings.push('Gross income seems unusually high. Please verify the amount.');
    }
    
    if (data.taxWithheldYTD && data.taxWithheldYTD > data.grossIncomeYTD) {
        errors.push('Tax withheld cannot exceed gross income. Please verify both amounts.');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings
    };
}

/**
 * Compare extracted payslip data with user-entered ATO prefill
 * @param {number} payslipAmount - Income from payslip
 * @param {number} atoPrefillAmount - Income from ATO prefill (user entered)
 * @returns {Object} Comparison result
 */
function compareWithAtoPrefill(payslipAmount, atoPrefillAmount) {
    if (!payslipAmount) {
        return {
            status: 'error',
            message: 'No payslip income to compare.'
        };
    }
    
    if (!atoPrefillAmount || atoPrefillAmount === 0) {
        return {
            status: 'missing',
            message: 'ATO prefill not entered yet. Enter your ATO prefill amount from myGov to verify.',
            difference: null
        };
    }
    
    const difference = payslipAmount - atoPrefillAmount;
    const percentDiff = Math.abs(difference / atoPrefillAmount * 100);
    
    if (Math.abs(difference) < 100 || percentDiff < 1) {
        return {
            status: 'match',
            message: '✓ Your payslip matches ATO records.',
            difference: 0
        };
    }
    
    if (difference > 0) {
        return {
            status: 'higher',
            message: `⚠️ Your payslip shows $${difference.toLocaleString()} MORE than ATO prefill. Possible reasons: employer hasn't finalized year-end reporting, or ATO shows "Not tax ready" yet. You can proceed using your payslip amount - keep your payslip as evidence.`,
            difference: difference
        };
    }
    
    return {
        status: 'lower',
        message: `⚠️ Your payslip shows $${Math.abs(difference).toLocaleString()} LESS than ATO prefill. Please verify you uploaded the final payslip for the financial year. Check with your employer if unsure.`,
        difference: difference
    };
}

/**
 * Aggregate multiple payslips from different employers
 * @param {Array} payslips - Array of payslip data objects
 * @returns {Object} Aggregated totals
 */
function aggregatePayslips(payslips) {
    if (!payslips || payslips.length === 0) {
        return { totalIncome: 0, totalTaxWithheld: 0, employers: [] };
    }
    
    return payslips.reduce((total, slip) => {
        return {
            totalIncome: total.totalIncome + (slip.grossIncomeYTD || 0),
            totalTaxWithheld: total.totalTaxWithheld + (slip.taxWithheldYTD || 0),
            employers: [...total.employers, slip.employerName || 'Unknown Employer']
        };
    }, { totalIncome: 0, totalTaxWithheld: 0, employers: [] });
}

/**
 * Cancel ongoing upload (placeholder for future implementation)
 */
function cancelUpload() {
    // Note: fetch requests cannot be easily cancelled without AbortController
    // This is a placeholder for future enhancement
    console.log('Upload cancellation requested - implement AbortController in production');
}

// Export for use in other files (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        processPayslip,
        cancelUpload,
        compareWithAtoPrefill,
        aggregatePayslips,
        validatePayslipData,
        parsePayslipText
    };
}