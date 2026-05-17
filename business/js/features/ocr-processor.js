/* ─────────────────────────────────────────
   features/ocr-processor.js
   Receipt OCR using OCR.space (free tier)
   Extracts: amount, date, merchant, GST
───────────────────────────────────────── */

const OCRProcessor = (function() {
  'use strict';

  const API_KEY = 'K89285784088957';
  const API_URL = 'https://api.ocr.space/parse/image';

  /* ─────────────────────────────────────────
     Convert file to base64
  ───────────────────────────────────────── */
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* ─────────────────────────────────────────
     Compress image if too large
     OCR.space free tier limit: 1 MB
  ───────────────────────────────────────── */
  function compressImage(file, maxSizeKB = 1000, onStatus) {
    return new Promise((resolve) => {

      // Already small enough — skip compression
      if (file.size <= maxSizeKB * 1024) {
        resolve(file);
        return;
      }

      console.log(`📦 Compressing ${(file.size / 1024).toFixed(1)} KB…`);
      if (onStatus) onStatus('Compressing image…');

      // Safety timeout — if anything hangs, fall back to original
      const timeout = setTimeout(() => {
        console.warn('⚠️ Compression timeout — using original file');
        resolve(file);
      }, 10000);

      const reader = new FileReader();
      reader.onerror = () => { clearTimeout(timeout); resolve(file); };
      reader.onload  = (e) => {
        const img = new Image();
        img.onerror = () => { clearTimeout(timeout); resolve(file); };
        img.onload  = () => {
          try {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            const maxWidth = 1200;

            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width  = maxWidth;
            }

            canvas.width  = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
              clearTimeout(timeout);
              if (!blob) {
                console.warn('⚠️ Canvas toBlob returned null — using original');
                resolve(file);
                return;
              }
              const compressed = new File([blob], file.name, { type: 'image/jpeg' });
              console.log(`✅ Compressed to ${(compressed.size / 1024).toFixed(1)} KB`);
              if (onStatus) onStatus('Compression complete');
              resolve(compressed);
            }, 'image/jpeg', 0.7);

          } catch (err) {
            clearTimeout(timeout);
            console.warn('⚠️ Compression error — using original:', err);
            resolve(file);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ─────────────────────────────────────────
     Extract total amount from text
  ───────────────────────────────────────── */
    function extractAmount(text) {
    // First, clean the text: remove spaces between numbers and dots
    // This fixes "$18 .30" → "$18.30"
    const cleanedText = text.replace(/(\d)\s+\.(\d)/g, '$1.$2');
    
    // Find all dollar amounts in the cleaned text
    const amountPattern = /\$?(\d{1,3}(?:,\d{3})*\.\d{2})/g;
    const matches = [...cleanedText.matchAll(amountPattern)];
    
    if (matches.length === 0) return null;
    
    // Convert all matches to numbers
    const amounts = matches.map(m => parseFloat(m[1].replace(/,/g, '')));
    
    // Return the LARGEST amount (should be the total, not the GST)
    const largestAmount = Math.max(...amounts);
    
    console.log('💰 Found amounts:', amounts, '→ Using largest:', largestAmount);
    
    return largestAmount;
    }
  /* ─────────────────────────────────────────
     Extract date from text
  ───────────────────────────────────────── */
    function extractDate(text) {
    const patterns = [
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g,
        /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/g,
        /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/gi
    ];

    for (const pattern of patterns) {
        const matches = [...text.matchAll(pattern)];
        if (matches.length > 0) {
        const match = matches[0];
        let dateStr = match[0];
        const parts = dateStr.match(/\d+/g);
        if (parts && parts.length === 3) {
            if (parts[0].length <= 2 && parts[1].length <= 2) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }
        return dateStr;
        }
    }
    return null;
    }

  /* ─────────────────────────────────────────
     Extract merchant / business name
  ───────────────────────────────────────── */
function extractMerchant(text) {
    const lines = text.split('\n');
    
    // PATTERN 1: Welcome/Thank you messages (MOST RELIABLE)
    const welcomeMatch = text.match(/Welcome to ([^\n]+)/i);
    if (welcomeMatch) {
        return welcomeMatch[1].replace(/['"]/g, '').trim();
    }
    
    const thankMatch = text.match(/Thank you for (?:shopping at|visiting|choosing) ([^\n]+)/i);
    if (thankMatch) {
        return thankMatch[1].replace(/['"]/g, '').trim();
    }
    
    // PATTERN 2: Business name with ABN/ACN (very reliable)
    const abnMatch = text.match(/(?:ABN|ACN)\s*:?\s*(\d+)\s*\n([^\n]+)/i);
    if (abnMatch && abnMatch[2]) {
        return abnMatch[2].trim();
    }
    
    // PATTERN 3: Lines with food/restaurant keywords
    const foodKeywords = ['sushi', 'restaurant', 'cafe', 'bistro', 'grill', 'pizza', 'burger', 'thai', 'chinese'];
    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        for (const keyword of foodKeywords) {
        if (lowerLine.includes(keyword) && line.length < 60 && line.length > 3) {
            // Clean up the line
            let merchant = line.replace(/^['"]|['"]$/g, '').trim();
            if (merchant && !merchant.toLowerCase().includes('eftpos')) {
            return merchant;
            }
        }
        }
    }
    
    // PATTERN 4: Look for proper capitalized business names (avoiding garbage)
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
        const line = lines[i].trim();
        const lowerLine = line.toLowerCase();
        
        // Skip obvious garbage
        const skipWords = ['eftpos', 'surcharge', 'tax', 'gst', 'subtotal', 'total', 'receipt', 
                        'invoice', 'date', 'time', 'terminal', 'card', 'visa', 'mastercard', 
                        'amount', 'change', 'cash', 'phone', 'email', 'http', 'www'];
        
        const shouldSkip = skipWords.some(word => lowerLine.includes(word));
        
        // Check if it looks like a business name (has spaces, proper case, not too long)
        if (!shouldSkip && line.length > 5 && line.length < 60 && line.includes(' ')) {
        // Has at least one capital letter and not all caps
        if (/[A-Z]/.test(line) && !/^[A-Z\s]+$/.test(line)) {
            return line;
        }
        }
    }
    
    // PATTERN 5: Fallback - first non-empty line without numbers/symbols
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && 
            !trimmed.match(/^\d/) && 
            !trimmed.match(/^[\$\€\£]/) &&
            trimmed.length > 3 && 
            trimmed.length < 50 &&
            !trimmed.toLowerCase().includes('eftpos')) {
        return trimmed;
        }
    }
    
    return null;
    }
  /* ─────────────────────────────────────────
     Extract GST amount
  ───────────────────────────────────────── */
  function extractGST(text) {
    const patterns = [
      /GST\s+AMOUNT\s*:?\s*\$?(\d{1,3}(?:,\d{3})*\.\d{2})/i,
      /GST\s*:?\s*\$?(\d{1,3}(?:,\d{3})*\.\d{2})/i,
      /TAX\s*:?\s*\$?(\d{1,3}(?:,\d{3})*\.\d{2})/i,
      /VAT\s*:?\s*\$?(\d{1,3}(?:,\d{3})*\.\d{2})/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const gst = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(gst) && gst > 0) return gst;
      }
    }
    return null;
  }

  /* ─────────────────────────────────────────
     Extract line items (basic heuristic)
  ───────────────────────────────────────── */
  function extractLineItems(text) {
    const lines = text.split('\n');
    const items = [];
    for (const line of lines) {
      const priceMatch = line.match(/\$?\d+\.\d{2}\s*$/);
      if (priceMatch && line.length > 10) {
        const description = line.replace(priceMatch[0], '').trim();
        const amount      = parseFloat(priceMatch[0].replace('$',''));
        if (description && amount > 0) {
          items.push({ description, amount });
        }
      }
    }
    return items;
  }

  /* ─────────────────────────────────────────
     Core OCR call — single engine attempt
  ───────────────────────────────────────── */
  async function callOCR(file, engine, onStatus) {
    const base64Image = await fileToBase64(file);

    if (onStatus) onStatus(`Scanning with OCR Engine ${engine}…`);
    console.log(`📡 Calling OCR Engine ${engine} for: ${file.name}`);

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 30000);

    const formData = new FormData();
    formData.append('base64Image',       `data:${file.type};base64,${base64Image}`);
    formData.append('apikey',            API_KEY);
    formData.append('language',          'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale',             'true');
    formData.append('OCREngine',         String(engine));

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body:   formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (
        !result.IsErroredOnProcessing &&
        result.ParsedResults &&
        result.ParsedResults.length > 0
      ) {
        const parsed = result.ParsedResults[0];
        return {
          ok:         true,
          text:       parsed.ParsedText || '',
          exitCode:   parsed.FileParseExitCode,
          confidence: parsed.FileParseExitCode === 1 ? 85 : 60,
        };
      }

      return {
        ok:    false,
        error: result.ErrorMessage || result.ErrorDetails || 'No text found',
      };

    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return { ok: false, error: 'Request timed out (30s)' };
      }
      return { ok: false, error: err.message };
    }
  }

  /* ─────────────────────────────────────────
     Main: process a single receipt file
     options: { onStatus, engine }
  ───────────────────────────────────────── */
  async function processReceipt(file, options = {}) {
    const startTime = Date.now();
    const onStatus  = options.onStatus || null;

    // Step 1: compress if needed
    const processedFile = await compressImage(file, 1000, onStatus);

    // Step 2: try Engine 1 first (faster)
    let ocrResult = await callOCR(processedFile, 1, onStatus);

    // Step 3: if Engine 1 fails or low confidence, retry with Engine 2
    if (!ocrResult.ok || ocrResult.confidence < 70) {
      console.log('🔄 Engine 1 low confidence — retrying with Engine 2…');
      if (onStatus) onStatus('Retrying with enhanced OCR engine…');
      const retry = await callOCR(processedFile, 2, onStatus);
      if (retry.ok) ocrResult = retry;
    }

    if (!ocrResult.ok) {
      return {
        success:         false,
        error:           ocrResult.error,
        processingTime:  Date.now() - startTime,
        source:          file.name,
      };
    }

    const text = ocrResult.text;
    console.log(`📝 OCR text (first 300 chars):`, text.substring(0, 300));

    const extractedData = {
      success:        true,
      fullText:       text,
      amount:         extractAmount(text),
      date:           extractDate(text),
      merchant:       extractMerchant(text),
      gst:            extractGST(text),
      lineItems:      extractLineItems(text),
      confidence:     ocrResult.confidence,
      processingTime: Date.now() - startTime,
      source:         file.name,
    };

    console.log(
      `💰 Extracted — Amount: ${extractedData.amount}, ` +
      `Date: ${extractedData.date}, Merchant: ${extractedData.merchant}, ` +
      `GST: ${extractedData.gst}, Confidence: ${extractedData.confidence}%`
    );

    return extractedData;
  }

  /* ─────────────────────────────────────────
     Batch: process multiple files
     onProgress(current, total, filename)
  ───────────────────────────────────────── */
  async function processReceipts(files, onProgress, onStatus) {
    const results = [];
    for (let i = 0; i < files.length; i++) {
      if (onProgress) onProgress(i + 1, files.length, files[i].name);
      const result = await processReceipt(files[i], { onStatus });
      results.push(result);
    }
    return results;
  }

  /* ─────────────────────────────────────────
     Public API
  ───────────────────────────────────────── */
  return {
    processReceipt:  processReceipt,
    processReceipts: processReceipts,
    compressImage:   compressImage,
    extractAmount:   extractAmount,
    extractDate:     extractDate,
    extractMerchant: extractMerchant,
    extractGST:      extractGST,
    extractLineItems:extractLineItems,
  };

})();

window.OCRProcessor = OCRProcessor;