import { patientFields } from '../config/patientFields.js';

// Function to check if a node contains profile content
function hasProfileContent(node) {
    if (node.classList && node.classList.contains('profile-container')) {
        return true;
    }
    if (node.querySelector) {
        const hasProfile = node.querySelector('.profile-container');
        if (hasProfile) {
            return true;
        }
    }
    // Check if this is a div with class page-content
    if (node.classList && node.classList.contains('page-content')) {
        // Check if this is the profile page content
        if (node.querySelector('.profile-info')) {
            return true;
        }
        // Also check for profile heading
        if (node.querySelector('h1')?.textContent.includes('My Profile')) {
            return true;
        }
    }
    return false;
}

// Function to initialize profile
function initializeProfile(mutations) {
    try {
        // If we have mutations, check each added node
        if (mutations) {
            let foundProfile = false;
            
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (hasProfileContent(node)) {
                        foundProfile = true;
                    }
                });
            });
            
            if (!foundProfile) {
                return;
            }
        }

        // Check if we're on the profile page
        const profileInfo = document.querySelector('.profile-info');

        if (!profileInfo) {
            // Check if we're on the profile page by content
            const isProfilePage = document.querySelector('h1')?.textContent.includes('My Profile');
            
            if (!isProfilePage) {
                return;
            }
            // If we are on the profile page but info isn't found yet, wait and retry
            setTimeout(initializeProfile, 100);
            return;
        }
        
        // Function to format date from YYYY-MM-DD to readable format
        function formatDate(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Helper function to safely update element text content
        function updateElementText(id, value) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }

        // Populate step 7 fields
        const step7Section = document.querySelector('[data-step="7"]');
        if (step7Section) {
            const fields = step7Section.querySelectorAll('[data-field]');
            fields.forEach(field => {
                const fieldName = field.dataset.field;
                let value = patientFields[fieldName];
                
                // Special handling for date formatting
                if (fieldName === 'dateOfBirth') {
                    value = formatDate(value);
                }
                // Special handling for lists (medications and allergies)
                else if (fieldName === 'medications' || fieldName === 'allergies') {
                    value = value.replace(/\n/g, ', ');
                }
                
                field.textContent = value;
            });
        }

        // Update all profile fields
        updateElementText('profile-name', patientFields.fullName);
        updateElementText('profile-dob', formatDate(patientFields.dateOfBirth));
        updateElementText('profile-phone', patientFields.phone);
        updateElementText('profile-address', patientFields.address);

        updateElementText('profile-pharmacy', patientFields.preferredPharmacy);
        updateElementText('profile-pharmacy-address', patientFields.pharmacyAddress);
        updateElementText('profile-medications', patientFields.medications.replace(/\n/g, ', '));
        updateElementText('profile-allergies', patientFields.allergies.replace(/\n/g, ', '));

        updateElementText('profile-emergency-name', patientFields.emergencyName);
        updateElementText('profile-relationship', patientFields.relationship);
        updateElementText('profile-emergency-phone', patientFields.emergencyPhone);

        updateElementText('profile-insurance-provider', patientFields.insuranceProvider);
        updateElementText('profile-policy-number', patientFields.policyNumber);
        updateElementText('profile-group-number', patientFields.groupNumber);

    } catch (error) {
        console.error('Error in profile script:', error);
    }
}

function clearCache() {
    // Clear all localStorage items
    localStorage.clear();
    
    // Reset migraine prompt using the global function
    if (window.resetMigrainePrompt) {
        window.resetMigrainePrompt();
    }
    
    // Show feedback to user
    const clearCacheButton = document.querySelector('.clear-cache-button');
    if (clearCacheButton) {
        const originalText = clearCacheButton.textContent;
        clearCacheButton.textContent = 'Cache Cleared!';
        setTimeout(() => {
            clearCacheButton.textContent = originalText;
        }, 2000);
    }
    
    // Reload the page after a brief delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// Listen for both DOM content loaded and navigation events
document.addEventListener('DOMContentLoaded', () => {
    initializeProfile();
});

// Listen for dynamic content changes
const mainContent = document.getElementById('main-content');
if (mainContent) {
    const observer = new MutationObserver((mutations) => {
        initializeProfile(mutations);
    });
    observer.observe(mainContent, { 
        childList: true, 
        subtree: true,
        characterData: true
    });
}

document.addEventListener('click', (e) => {
    if (e.target.matches('.nav-link')) {
        e.preventDefault();
        const page = e.target.dataset.page;
        
        // Hide bottom nav for specific pages
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            const pagesWithoutNav = ['call-summary', 'call', 'finish', 'onboarding', 'phone-lock', 'waiting-room'];
            if (pagesWithoutNav.includes(page)) {
                bottomNav.style.display = 'none';
            } else {
                bottomNav.style.display = 'flex';
            }
        }
        
        loadContent(page);
    }
}); 