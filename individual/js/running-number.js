// Running Number Counter for Welcome Card
let runningNumberInterval = null;
let currentAmount = 0;
let isWelcomeCardActive = false;
let isModalOpen = false;
const TARGET_AMOUNT = Math.floor(Math.random() * (1000000 - 800000 + 1) + 800000);

// Initialize counter
function initRunningNumber() {
    if (currentAmount === 0) {
        countUpToTarget();
    }
}

// Count up from 0 to target
function countUpToTarget() {
    const duration = 4000; // 4 seconds
    const steps = 60;
    const increment = TARGET_AMOUNT / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
        currentStep++;
        currentAmount = Math.min(Math.floor(increment * currentStep), TARGET_AMOUNT);
        updateDisplay(currentAmount);
        
        if (currentStep >= steps) {
            clearInterval(timer);
            currentAmount = TARGET_AMOUNT;
            updateDisplay(currentAmount);
            startIncrements(); // Start random increments after reaching target
        }
    }, duration / steps);
}

// Start random increments
function startIncrements() {
    if (runningNumberInterval) clearInterval(runningNumberInterval);
    
    scheduleNextIncrement();
}

// Schedule next random increment
function scheduleNextIncrement() {
    if (!isWelcomeCardActive || isModalOpen) {
        // Wait and check again
        setTimeout(scheduleNextIncrement, 5000);
        return;
    }
    
    const delay = getRandomDelay(); // 1-4 minutes in milliseconds
    runningNumberInterval = setTimeout(() => {
        addRandomAmount();
        scheduleNextIncrement(); // Schedule next
    }, delay);
}

// Add random amount between 100-2000
function addRandomAmount() {
    if (!isWelcomeCardActive || isModalOpen) return;
    
    const increment = Math.floor(Math.random() * (2000 - 100 + 1) + 100);
    currentAmount += increment;
    updateDisplay(currentAmount);
    
    // Add visual feedback
    const element = document.getElementById('estimateAmount');
    if (element) {
        element.classList.add('updating');
        setTimeout(() => element.classList.remove('updating'), 300);
    }
}

// Get random delay between 1-4 minutes
function getRandomDelay() {
    const minMs = 60 * 1000;  // 1 minute
    const maxMs = 4 * 60 * 1000; // 4 minutes
    return Math.floor(Math.random() * (maxMs - minMs + 1) + minMs);
}

// Update display with commas
function updateDisplay(amount) {
    const element = document.getElementById('estimateAmount');
    const estimateBar = document.getElementById('estimateBar');
    const welcomeLabel = document.getElementById('welcomeLabel');
    const regularLabel = document.getElementById('estimateLabel');
      
    if (element) {
        element.textContent = formatNumber(amount);
    }
    
    // Switch to welcome mode when counter is active
    if (estimateBar && isWelcomeCardActive) {
        estimateBar.classList.add('welcome-mode');
        // Set the welcome label text using the current language (bilingual)
        if (welcomeLabel && typeof t === 'function') {
            welcomeLabel.innerHTML = t('welcomeLabelText');
        }
        // Remove the "Running total:" prefix – not needed
        // (welcomePrefix can remain empty or be removed from HTML)
    }
}

function refreshRunningNumberDisplay() {
    if (currentAmount > 0) {
        updateDisplay(currentAmount);
        const estimateBar = document.getElementById('estimateBar');
        if (estimateBar && isWelcomeCardActive) {
            estimateBar.classList.add('welcome-mode');
        }
    }
}

// Format number with commas
function formatNumber(amount) {
    return '$' + Math.floor(amount).toLocaleString('en-US');
}

// Stop running number
function stopRunningNumber() {
    if (runningNumberInterval) {
        clearTimeout(runningNumberInterval);
        runningNumberInterval = null;
    }
}

// Start/stop based on welcome card visibility
function setWelcomeCardActive(active) {
    isWelcomeCardActive = active;
    
    if (active && currentAmount >= TARGET_AMOUNT) {
        startIncrements();
    } else if (active && currentAmount === 0) {
        initRunningNumber();
    } else if (!active) {
        stopRunningNumber();
    }
}

// Handle modal state (terms & conditions)
function setModalOpen(open) {
    isModalOpen = open;
    if (!open && isWelcomeCardActive && currentAmount >= TARGET_AMOUNT) {
        startIncrements();
    }
}