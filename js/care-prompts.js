// console.log('care-prompts.js loaded');

let hasShownPrompt = false; // Flag to ensure we only show the prompt once

// Function to check if migraine card is visible and set up the prompt
function setupMigrainePrompt() {
    // console.log('setupMigrainePrompt running');
    const migraineCard = document.querySelector('a.care-journey-card.care-card-migraines');
    // console.log('migraineCard:', migraineCard);
    // console.log('migraineCard display:', migraineCard && window.getComputedStyle(migraineCard).display);
    
    if (migraineCard && window.getComputedStyle(migraineCard).display === 'block' && !hasShownPrompt) {
        console.log('Setting up 5 second timeout for bottom sheet');
        hasShownPrompt = true; // Set flag to prevent multiple prompts
        
        // Clear the interval since we found the card
        if (window.migraineCheckInterval) {
            // console.log('Clearing check interval');
            clearInterval(window.migraineCheckInterval);
        }
        
        setTimeout(() => {
            // Final check to ensure the card is still visible
            if (migraineCard && window.getComputedStyle(migraineCard).display === 'block') {
                openBottomSheet();
                
                // Add a small delay to ensure bottom sheet is open before updating content
                setTimeout(() => {
                    const sheetContent = document.querySelector('.bottom-sheet-content .sheet-content');
                    if (sheetContent) {
                        sheetContent.innerHTML = `
                        <div class="care-plan-ready-message">
                            <h1>Care Plan Sharing Available</h1>
                            <p>Dr. X has made sharing available. Do you give permission to import into Dialogue? We can help you further now that we have diagnosis.</p>
                            <div class="button-group">
                                <button class="primary-button" onclick="handleImportChoice(true)">Yes, import my care plan</button>
                                <button class="secondary-button" onclick="handleImportChoice(false)">No thanks</button>
                            </div>
                        </div>
                        `;
                        // console.log('Bottom sheet content updated');
                    }
                }, 100); // Small delay to ensure bottom sheet is open
            } else {
                hasShownPrompt = false; // Reset the flag since we didn't show the prompt
            }
        }, 5000);
    }
}

function setupCarePlanReadyTransition() {
    const message = document.querySelector('.care-plan-ready-message');
    const button = document.querySelector('button.care-plan-ready');
    
    console.log('Found message:', message);
    console.log('Found button:', button);
    
    if (message && button) {
        // Initially hide the button
        button.style.display = 'none';
        console.log('Initially set button display to none');
        
        setTimeout(() => {
            // Fade out message and show button
            message.style.display = 'none';
            button.style.display = 'block';
            console.log('After 5s - Message display:', message.style.display);
            console.log('After 5s - Button display:', button.style.display);
        }, 5000);

        // Clear the interval once we've found and set up the elements
        if (window.carePlanCheckInterval) {
            clearInterval(window.carePlanCheckInterval);
        }
    } else {
        console.log('Elements not found - message or button missing');
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

    // console.log('DOM Content Loaded - starting periodic checks');
    // Store interval ID so we can clear it later
    window.carePlanCheckInterval = setInterval(setupCarePlanReadyTransition, 500);
    window.migraineCheckInterval = setInterval(setupMigrainePrompt, 2000);
}); 