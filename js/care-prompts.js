// console.log('care-prompts.js loaded');

// Use a more specific localStorage key
let hasShownPrompt = localStorage.getItem('migraineCarePromptShown') === 'true';

// Function to reset the prompt state
window.resetMigrainePrompt = function() {
    hasShownPrompt = false;
    localStorage.removeItem('migraineCarePromptShown');
    console.log('Migraine prompt reset');
};

// Function to check if migraine card is visible and set up the prompt
function setupMigrainePrompt() {
    const migraineCard = document.querySelector('a.care-journey-card.care-card-migraines');
    
    if (migraineCard && window.getComputedStyle(migraineCard).display === 'block' && !hasShownPrompt) {
        console.log('Setting up 5 second timeout for bottom sheet');
        
        // Set both the variable and localStorage
        hasShownPrompt = true;
        localStorage.setItem('migraineCarePromptShown', 'true');
        
        // Clear the interval since we found the card
        if (window.migraineCheckInterval) {
            clearInterval(window.migraineCheckInterval);
        }
        
        setTimeout(() => {
            // Final check to ensure the card is still visible
            if (migraineCard && window.getComputedStyle(migraineCard).display === 'block') {
                openBottomSheet();
                
                setTimeout(() => {
                    const sheetContent = document.querySelector('.bottom-sheet-content .sheet-content');
                    if (sheetContent) {
                        sheetContent.innerHTML = `
                        <div class="care-plan-ready-migraine">
                            <h1>Care Plan Sharing Available</h1>
                            <p>Dr. Marie-Claude Bouchard has made sharing available. Do you give permission to import into Dialogue? We can help you further now that we have diagnosis.</p>
                            <div class="button-group">
                                <button class="primary-button" onclick="handleImportChoice(true)">Yes, import my care plan</button>
                                <button class="secondary-button" onclick="handleImportChoice(false)">No thanks</button>
                            </div>
                        </div>
                        `;
                    }
                }, 100);
            }
        }, 2000);
    }
}

function setupCarePlanReadyTransition() {
    const message = document.querySelector('.care-plan-ready-message');
    const button = document.querySelector('button.care-plan-ready');
    
    // Check if transition has already happened
    const hasTransitioned = localStorage.getItem('carePlanTransitionComplete') === 'true';
    
    if (message && button) {
        // Clear the interval since we found our elements
        if (window.carePlanCheckInterval) {
            clearInterval(window.carePlanCheckInterval);
            window.carePlanCheckInterval = null;
        }

        if (hasTransitioned) {
            // If already transitioned, immediately set final state
            message.classList.add('hidden');
            button.classList.add('visible');
        } else {
            // Set initial state
            message.classList.remove('hidden');
            button.classList.add('hidden');
            
            setTimeout(() => {
                message.classList.add('hidden');
                button.classList.remove('hidden');
                button.classList.add('visible');
                localStorage.setItem('carePlanTransitionComplete', 'true');
            }, 3000); // Changed to 3 seconds
        }
    }
}

// Make handleImportChoice globally available
window.handleImportChoice = function(accepted) {
    // console.log('Import choice made:', accepted);
    
    closeBottomSheet();
    
    if (accepted) {
        // Add a small delay to allow the bottom sheet animation to complete
        setTimeout(() => {
            window.location.href = 'journey.html?type=migraine';
        }, 300); // 300ms matches typical CSS transition duration
    }
};

// Initial check when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Run setup immediately
    setupCarePlanReadyTransition();
    
    // Only set interval if elements weren't found on first try
    const message = document.querySelector('.care-plan-ready-message');
    const button = document.querySelector('button.care-plan-ready');
    
    if (!message || !button) {
        window.carePlanCheckInterval = setInterval(setupCarePlanReadyTransition, 500);
    }
    
    // Existing migraine check
    window.migraineCheckInterval = setInterval(setupMigrainePrompt, 2000);
});

// Add required CSS
const style = document.createElement('style');
style.textContent = `
    .hidden {
        display: none !important;
    }
    .visible {
        display: block !important;
    }
`;
document.head.appendChild(style); 