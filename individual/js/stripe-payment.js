// ========================================
// STRIPE PAYMENT INTEGRATION
// Sandbox / Test mode
// ========================================

const stripePublicKey = 'pk_test_51TK9u9Dy5tDIcbsfSwlYNipimjQsJevho3q5xOJdJr3SuVNYJHl8O0JjRpN4yYUNv4qHo2JooOiwzyAai11c5vIa006Tzw26lh';
let stripe = null;
let cardElement = null;
let paymentRequest = null;
let currentTotalAmount = 0;
let applePayElement = null;
let googlePayElement = null;
let mountingWallets = false;
let lastWalletAmount = null;
let currentPaymentMethod = 'card';

// ========================================
// Initialise Stripe (called from card-events initPaymentCard)
// ========================================
function initStripePayment(totalAmount) {
    currentTotalAmount = totalAmount;

    // If already initialized with same amount, reuse
    if (stripe && cardElement && lastWalletAmount === totalAmount) {
        // But ensure it's still mounted
        const mountTarget = document.getElementById('cardElement');
        if (mountTarget && mountTarget.children.length === 0) {
            cardElement.mount('#cardElement');
        }
        return;
    }

    // Clean up existing
    if (cardElement) {
        cardElement.destroy();
        cardElement = null;
    }
    if (applePayElement) { applePayElement.destroy(); applePayElement = null; }
    if (googlePayElement) { googlePayElement.destroy(); googlePayElement = null; }
    if (paymentRequest) paymentRequest = null;

    if (!stripe) {
        if (typeof Stripe === 'undefined') {
            console.warn('Stripe.js not loaded yet');
            return;
        }
        stripe = Stripe(stripePublicKey);
    }

    initCardElement();
    initDigitalWallets(totalAmount);
}
// ========================================
// Card Element
// ========================================
function initCardElement() {
    if (cardElement) return;

    const elements = stripe.elements();

    const style = {
        base: {
            color: '#ffffff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': { color: 'rgba(255,255,255,0.4)' },
        },
        invalid: {
            color: '#ff4d6d',
            iconColor: '#ff4d6d',
        },
    };

    cardElement = elements.create('card', {
        style,
        hidePostalCode: true
    });

    const mountTarget = document.getElementById('cardElement');
    if (mountTarget) {
        cardElement.mount('#cardElement');
    }

    cardElement.on('change', (event) => {
        const displayError = document.getElementById('cardErrors');
        if (!displayError) return;
        if (event.error) {
            displayError.textContent = event.error.message;
            displayError.style.display = 'block';
        } else {
            displayError.textContent = '';
            displayError.style.display = 'none';
        }
    });
}

// ========================================
// Digital Wallets (Apple Pay / Google Pay)
// ========================================
function initDigitalWallets(totalAmount) {
    if (!stripe) return;
    if (lastWalletAmount === totalAmount) return;
    lastWalletAmount = totalAmount;

    if (applePayElement) { applePayElement.unmount(); applePayElement = null; }
    if (googlePayElement) { googlePayElement.unmount(); googlePayElement = null; }
    if (paymentRequest) paymentRequest = null;

    paymentRequest = stripe.paymentRequest({
        country: 'AU',
        currency: 'aud',
        total: {
            label: 'Taxlyy Tax Return',
            amount: Math.round(totalAmount * 100),
        },
        requestPayerName: true,
        requestPayerEmail: true,
    });

    paymentRequest.canMakePayment().then(result => {
        const appleContainer = document.getElementById('applePayButton');
        const googleContainer = document.getElementById('googlePayButton');

        if (result && result.applePay && appleContainer) {
            const elements = stripe.elements();
            applePayElement = elements.create('paymentRequestButton', {
                paymentRequest,
                style: { paymentRequestButton: { type: 'default', theme: 'dark', height: '48px' } }
            });
            appleContainer.innerHTML = '';
            applePayElement.mount('#applePayButton');
            appleContainer.style.display = 'block';
            window.currentWallet = 'apple_pay';
        } else if (appleContainer) {
            appleContainer.style.display = 'none';
        }

        if (result && result.googlePay && googleContainer) {
            const elements = stripe.elements();
            googlePayElement = elements.create('paymentRequestButton', {
                paymentRequest,
                style: { paymentRequestButton: { type: 'default', theme: 'dark', height: '48px' } }
            });
            googleContainer.innerHTML = '';
            googlePayElement.mount('#googlePayButton');
            googleContainer.style.display = 'block';
            window.currentWallet = 'google_pay';
        } else if (googleContainer) {
            googleContainer.style.display = 'none';
        }
    }).catch(err => console.warn('canMakePayment error:', err));

    paymentRequest.on('paymentmethod', async (ev) => {
        try {
            const snapshot = structuredClone ? structuredClone(userData) : JSON.parse(JSON.stringify(userData));
            const clientSecret = await createPaymentIntent(currentTotalAmount, snapshot);
            if (!clientSecret) throw new Error('Could not create payment intent');
            const { error, paymentIntent } = await stripe.confirmCardPayment(
                clientSecret,
                { payment_method: ev.paymentMethod.id },
                { handleActions: false }
            );
            if (error) throw error;
            ev.complete('success');
            if (paymentIntent.status === 'requires_action') {
                const { error: actionError } = await stripe.confirmCardPayment(clientSecret);
                if (actionError) throw actionError;
            }
            window.latestPaymentIntentId = paymentIntent.id;

            const paymentMethod = window.currentWallet || 'wallet';

            const sessionId = sessionStorage.getItem('sessionId');
            if (window.supabase) {
                await window.supabase.from('transactions').insert({
                    email: snapshot.email || '',         // FIX: was snapshot.userEmail
                    amount: currentTotalAmount,
                    original_amount: currentTotalAmount + (snapshot.discountAmount || 0),
                    discount_amount: snapshot.discountAmount || 0,
                    promo_code: snapshot.appliedPromo?.code || null,
                    status: 'succeeded',
                    stripe_payment_intent_id: paymentIntent.id,
                    session_id: sessionId,
                    delivery_method: snapshot.deliveryMethod,
                    payment_method: paymentMethod
                });
            }

            await handleSuccessfulPayment(snapshot, paymentMethod);
        } catch (err) {
            ev.complete('fail');
            showPaymentError(err.message);
        }
    });
}

// ========================================
// Create PaymentIntent via Supabase Edge Function
// ========================================
async function createPaymentIntent(amount, userData) {
    const cents = Math.round(amount * 100);

    // FIX: use getActiveTaxYear() as the single source of truth
    // instead of duplicating date arithmetic inline
    const taxYear = window.activeTaxYearString
        || (window.calculator && window.calculator.getActiveTaxYear
            ? window.calculator.getActiveTaxYear()
            : null)
        || (() => {
            const now = new Date();
            const yearEnd = now.getMonth() + 1 >= 7 ? now.getFullYear() : now.getFullYear() - 1;
            return `${yearEnd - 1}-${String(yearEnd).slice(-2)}`;
        })();

    try {
        const { data, error } = await window.supabase.functions.invoke('create-payment-intent', {
            body: {
                amount: cents,
                currency: 'aud',
                metadata: {
                    userEmail: userData?.email || '',   // FIX: was userData?.userEmail
                    taxYear: taxYear,
                    employers: (userData?.employers || []).length
                }
            }
        });
        if (error) {
            console.error('Invoke error details:', error);
            if (error.context) console.error('Context:', error.context);
            throw error;
        }
        return data.clientSecret;
    } catch (err) {
        console.error('PaymentIntent creation failed:', err);
        showPaymentError('Payment setup failed. Please try again.');
        return null;
    }
}

// ========================================
// Destroy Stripe Elements (for language switch)
// ========================================
function destroyStripePayment() {
    if (cardElement) {
        cardElement.destroy();
        cardElement = null;
    }
    if (applePayElement) {
        applePayElement.destroy();
        applePayElement = null;
    }
    if (googlePayElement) {
        googlePayElement.destroy();
        googlePayElement = null;
    }
    if (paymentRequest) {
        paymentRequest = null;
    }
    stripe = null;
    lastWalletAmount = null;
    currentTotalAmount = 0;
}

// ========================================
// Process Card Payment (called from pay button)
// ========================================
async function processCardPayment() {
    const payBtn = document.getElementById('payBtn');

    if (!stripe || !cardElement) {
        showPaymentError('Payment system not initialised. Please refresh and try again.');
        return;
    }

    // Take a snapshot of userData before any changes
    const reportSnapshot = structuredClone ? structuredClone(userData) : JSON.parse(JSON.stringify(userData));

    const calculationCheck = window.calculator.calculateRefund(reportSnapshot);
    if (!reportSnapshot || calculationCheck.totalIncome === 0) {
        showPaymentError('No income data found. Please complete your tax information before paying.');
        return;
    }

    if (payBtn) {
        payBtn.disabled = true;
        payBtn.innerText = typeof t === 'function'
            ? (stripHtml(t('processing')) || 'Processing...')
            : 'Processing...';
    }

    try {
        const clientSecret = await createPaymentIntent(currentTotalAmount, reportSnapshot);
        if (!clientSecret) {
            throw new Error('Failed to create payment intent');
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: cardElement }
        });

        if (error) throw new Error(error.message);

        if (paymentIntent.status === 'succeeded') {
            window.latestPaymentIntentId = paymentIntent.id;

            try {
                const sessionId = sessionStorage.getItem('sessionId');
                const { error: insertError } = await window.supabase
                    .from('transactions')
                    .insert({
                        email: reportSnapshot.email || '',   // FIX: was reportSnapshot.userEmail
                        amount: currentTotalAmount,
                        original_amount: currentTotalAmount + (reportSnapshot.discountAmount || 0),
                        discount_amount: reportSnapshot.discountAmount || 0,
                        promo_code: reportSnapshot.appliedPromo?.code || null,
                        status: 'succeeded',
                        stripe_payment_intent_id: paymentIntent.id,
                        session_id: sessionId,
                        delivery_method: reportSnapshot.deliveryMethod,
                        payment_method: 'card'
                    });
                if (insertError) console.error('Failed to record transaction:', insertError);
            } catch (txErr) {
                console.error('Transaction insert error:', txErr);
            }

            await handleSuccessfulPayment(reportSnapshot, 'card');
        } else {
            throw new Error(`Unexpected payment status: ${paymentIntent.status}`);
        }

    } catch (error) {
        console.error('Payment error:', error);
        showPaymentError(error.message);

        if (payBtn) {
            payBtn.disabled = false;
            payBtn.innerText = `${stripHtml(t('payButtonLabel'))} — ${formatCurrency(currentTotalAmount)}`;
        }
    }
}

// ========================================
// Handle Successful Payment
// ========================================
async function handleSuccessfulPayment(reportData, paymentMethod = 'card') {
    if (typeof logEvent === 'function') {
        await logEvent('payment_succeeded', {
            amount: currentTotalAmount,
            delivery_method: reportData?.deliveryMethod,
            promo_code: reportData?.promoCode || null,
            payment_method: paymentMethod
        });
    }

    const activeTaxYear = window.activeTaxYearString
        || (window.calculator && window.calculator.getActiveTaxYear
            ? window.calculator.getActiveTaxYear()
            : null);
    if (!activeTaxYear) console.warn('activeTaxYearString not set');

    const transaction = {
        stripe_payment_intent_id: window.latestPaymentIntentId || 'unknown',
        amount: currentTotalAmount,
        original_amount: currentTotalAmount + (reportData?.discountAmount || 0),
        discount_amount: reportData?.discountAmount || 0,
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
        promo_code: reportData?.promoCode || null,
        tax_year: activeTaxYear || (() => {
            const now = new Date();
            const yearEnd = now.getMonth() + 1 >= 7 ? now.getFullYear() : now.getFullYear() - 1;
            return `${yearEnd - 1}-${String(yearEnd).slice(-2)}`;
        })()
    };

    const lang = reportData?.bilingualReport ? 'zh' : 'en';
    let pdfBlob = null;
    try {
        pdfBlob = await generateTaxReport(reportData, lang, { transaction, returnBlob: true });
    } catch (err) {
        console.error('PDF generation failed:', err);
    }

    if (pdfBlob && window.supabase && transaction.stripe_payment_intent_id !== 'unknown') {
        const sessionId = sessionStorage.getItem('sessionId');
        const safeName = (reportData.fullName || 'individual').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const taxYearForFile = transaction.tax_year || activeTaxYear;
        const filename = `taxlyy-return-${safeName}-${taxYearForFile}-${lang === 'zh' ? 'bilingual' : 'en'}.pdf`;
        const filePath = `${sessionId}/${filename}`;

        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
        });
        reader.readAsDataURL(pdfBlob);
        const fileBase64 = await base64Promise;

        const { data: uploadResult, error: uploadError } = await window.supabase.functions.invoke('upload-report', {
            body: {
                fileBase64,
                filePath,
                paymentIntentId: transaction.stripe_payment_intent_id,
                contentType: 'application/pdf',
                transaction
            }
        });

        if (uploadError) {
            console.error('Edge Function upload failed:', uploadError);
        } else {
            console.log('PDF uploaded and transaction updated via Edge Function:', uploadResult);
            window.lastUploadedPdfPath = filePath; 
        }
    } else {
        console.warn('Skipping upload – missing pdfBlob, supabase, or valid paymentIntentId');
    }

    const successModal = document.getElementById('paymentSuccessModal');
    const successMessage = document.getElementById('successMessage');
    const fallbackOptions = document.getElementById('fallbackOptions');
    const leftFallbackBtn = document.getElementById('fallbackLeftBtn');
    const rightFallbackBtn = document.getElementById('fallbackRightBtn');
    const hintEl = document.getElementById('fallbackHint');

    const deliveryMethod = reportData?.deliveryMethod || 'download';
    const userEmail = reportData?.email || '';   // FIX: was reportData?.userEmail

    if (deliveryMethod === 'download') {
        if (successMessage) successMessage.innerHTML = t('paymentSuccessDownload');
        if (fallbackOptions) fallbackOptions.style.display = 'flex';
        if (leftFallbackBtn) leftFallbackBtn.innerText = stripHtml(t('downloadAgain'));
        if (rightFallbackBtn) rightFallbackBtn.innerText = stripHtml(t('sendEmailInstead'));
        if (hintEl) hintEl.style.display = 'none';

        try {
            await generateTaxReport(reportData, lang, { transaction });
        } catch (err) {
            console.error('Local PDF save failed:', err);
        }
        if (typeof logEvent === 'function') {
            await logEvent('report_delivered', { delivery_method: 'download' });
        }

        } else {
        // EMAIL DELIVERY — Send email via Resend
        let emailSent = false;
        let emailErrorMsg = null;
        
        try {
            // filePath should be available from upload step (need to store it)
            const pdfPathForEmail = window.lastUploadedPdfPath || filePath;
            
            const { data: emailResult, error: emailError } = await window.supabase.functions.invoke('send-report-email', {
                body: {
                    to: userEmail,
                    pdfUrl: pdfPathForEmail,
                    customerName: reportData.fullName || 'Valued Customer',
                    declarationId: window.latestPaymentIntentId
                }
            });
            
            if (emailError) {
                console.error('Email send error:', emailError);
                emailErrorMsg = emailError.message;
                emailSent = false;
            } else {
                console.log('Email sent successfully:', emailResult);
                emailSent = true;
            }
        } catch (err) {
            console.error('Email invocation failed:', err);
            emailErrorMsg = err.message;
            emailSent = false;
        }
        
        // Update success message based on email result
        if (successMessage) {
            if (emailSent) {
                successMessage.innerHTML = t('paymentSuccessEmail').replace('{email}', userEmail);
            } else {
                successMessage.innerHTML = `✅ Payment successful! However, email delivery failed (${emailErrorMsg || 'unknown error'}). Please use the download button below.`;
            }
        }
        
        if (fallbackOptions) fallbackOptions.style.display = 'flex';
        if (leftFallbackBtn) leftFallbackBtn.innerText = stripHtml(t('resendReport'));
        if (rightFallbackBtn) rightFallbackBtn.innerText = stripHtml(t('downloadReport'));
        if (hintEl) {
            if (emailSent) {
                hintEl.innerHTML = t('checkSpam');
            } else {
                hintEl.innerHTML = 'Email failed. Please download your report instead.';
            }
            hintEl.style.display = 'block';
        }
        if (typeof logEvent === 'function') {
            await logEvent('report_delivery_attempted', { 
                delivery_method: 'email', 
                email: userEmail,
                email_success: emailSent,
                email_error: emailErrorMsg
            });
        }
    }

    if (successModal) successModal.style.display = 'flex';

    const payBtn = document.getElementById('payBtn');
    if (payBtn) {
        payBtn.disabled = false;
        payBtn.innerText = `${stripHtml(t('payButtonLabel'))} — ${formatCurrency(currentTotalAmount)}`;
    }

    localStorage.removeItem('taxlyy_userData');
}

// ========================================
// Show inline payment error
// ========================================
function showPaymentError(message) {
    const paymentMessage = document.getElementById('paymentMessage');
    if (paymentMessage) {
        paymentMessage.innerText = message;
        paymentMessage.className = 'payment-message error';
        paymentMessage.style.display = 'block';
    }
}

// ========================================
// Expose globals
// ========================================
window.initStripePayment = initStripePayment;
window.processCardPayment = processCardPayment;
window.handleSuccessfulPayment = handleSuccessfulPayment;
window.showPaymentError = showPaymentError;