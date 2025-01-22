console.log('care-prompts.js loaded');

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
            // console.log('5 second timeout triggered');
            openBottomSheet();
            
            // Add a small delay to ensure bottom sheet is open before updating content
            setTimeout(() => {
                const sheetContent = document.querySelector('.bottom-sheet-content .sheet-content');
                if (sheetContent) {
                    sheetContent.innerHTML = `
                        <h2>Care Plan Sharing Available</h2>
                        <p>Dr. X has made sharing available. Do you give permission to import into Dialogue? We can help you further now that we have diagnosis.</p>
                        <div class="button-group">
                            <button class="primary-button" onclick="handleImportChoice(true)">Yes, import my care plan</button>
                            <button class="secondary-button" onclick="handleImportChoice(false)">No thanks</button>
                        </div>
                    `;
                    // console.log('Bottom sheet content updated');
                }
            }, 100); // Small delay to ensure bottom sheet is open
            
            // console.log('Bottom sheet opened');
        }, 5000);
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
    window.migraineCheckInterval = setInterval(setupMigrainePrompt, 2000);
}); 