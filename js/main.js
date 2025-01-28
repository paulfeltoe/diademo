// 1. Core Page Loading
async function loadContent(page) {
    // Don't load content on specific pages
    const currentPath = window.location.pathname;
    if (currentPath.includes('journey.html') || 
        currentPath.includes('call.html') || 
        currentPath.includes('call-summary.html')) {
        return;
    }

    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
        console.error('Main content element not found');
        return;
    }

    try {
        // Fade out current content
        mainContent.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, 150));

        // Load new content
        const response = await fetch(`${page}.html`);
        const content = await response.text();
        mainContent.innerHTML = content;

        // Fade in new content
        setTimeout(() => {
            mainContent.style.opacity = '1';
        }, 50);
        
        if (page === 'explore') {
        } else if (page === 'funnel') {
            window.initializeFunnel();
        } else if (page === 'mycare') {
            updateDisplayState();
            setupBottomSheet();
            updateCarePlanState();
        } else if (page === 'journey') {
            setupJourneyNavigation();
        } else if (page === 'profile') {
            // Check if script is already loaded
            if (!document.querySelector('script[src="js/profile.js"]')) {
                // Load the profile script as a module only if it hasn't been loaded
                const script = document.createElement('script');
                script.type = 'module';
                script.src = 'js/profile.js';
                document.body.appendChild(script);
            }
            
            // Debug logging
            // console.log('Looking for fullscreen button...');
            // console.log('Fullscreen button found:', !!document.getElementById('fullscreenBtn'));
            
            // Only setup fullscreen if button exists
            if (document.getElementById('fullscreenBtn')) {
                // console.log('Setting up fullscreen functionality');
                document.getElementById('fullscreenBtn').addEventListener('click', function() {
                    // console.log('Fullscreen button clicked');
                    const elem = document.documentElement;
                    
                    if (document.fullscreenElement || 
                        document.webkitFullscreenElement || 
                        document.mozFullScreenElement ||
                        document.msFullscreenElement) {
                            
                        if (document.exitFullscreen) {
                            document.exitFullscreen();
                        } else if (document.webkitExitFullscreen) {
                            document.webkitExitFullscreen();
                        } else if (document.mozCancelFullScreen) {
                            document.mozCancelFullScreen();
                        } else if (document.msExitFullscreen) {
                            document.msExitFullscreen();
                        }
                        
                        this.querySelector('.fullscreen-icon').textContent = '⤢';
                        
                    } else {
                        if (elem.requestFullscreen) {
                            elem.requestFullscreen();
                        } else if (elem.webkitRequestFullscreen) {
                            elem.webkitRequestFullscreen();
                        } else if (elem.mozRequestFullScreen) {
                            elem.mozRequestFullScreen();
                        } else if (elem.msRequestFullscreen) {
                            elem.msRequestFullscreen();
                        }
                        
                        this.querySelector('.fullscreen-icon').textContent = '⤡';
                    }
                });
            } else {
                // console.warn('Fullscreen button not found in the DOM');
            }
        } else if (page === 'onboarding') {
            // Load onboarding.js if not already loaded
            if (!window.setupOnboarding) {
                const script = document.createElement('script');
                script.src = 'js/onboarding.js';
                script.onload = () => {
                    window.setupOnboarding();
                };
                document.body.appendChild(script);
            } else {
                window.setupOnboarding();
            }
        }
    } catch (error) {
        console.error('Error loading content:', error);
        mainContent.innerHTML = '<p>Error loading content</p>';
    }
}


// 2. State Management
function getActiveConditions() {
    return JSON.parse(localStorage.getItem('activeConditions') || '[]');
}
function updateDisplayState() {
    const activeConditions = getActiveConditions();
    const emptyState = document.getElementById('emptyState');
    const filledState = document.getElementById('filledState');
    
    if (emptyState && filledState) {
        const hasActiveConditions = activeConditions.length > 0;
        console.log('Updating display state:', { 
            hasActiveConditions, 
            activeConditions 
        });
        
        emptyState.style.display = hasActiveConditions ? 'none' : 'block';
        filledState.style.display = hasActiveConditions ? 'block' : 'none';
        
        // Update care journey cards visibility
        document.querySelectorAll('.care-journey-card').forEach(card => {
            const cardCondition = card.classList.toString().match(/care-card-(\w+)/)?.[1];
            card.style.display = activeConditions.includes(cardCondition) ? 'block' : 'none';
        });
    }
}

// 3. Condition Management
function resetActiveConditions() {
    localStorage.setItem('activeConditions', '[]');
    updateDisplayState();
}
function showAllIssues() {
    // console.log('Debug: showing all conditions');
    const conditions = ['sinusitis', 'anxiety', 'rash', 'migraines'];
    localStorage.setItem('activeConditions', JSON.stringify(conditions));
    updateDisplayState();
}
function completeFunnel(condition) {
    const activeConditions = getActiveConditions();
    if (!activeConditions.includes(condition)) {
        activeConditions.push(condition);
        localStorage.setItem('activeConditions', JSON.stringify(activeConditions));
    }
    updateDisplayState();
}



// 5. Journey Navigation
function setupJourneyNavigation() {
    const navItems = document.querySelectorAll('.journey-nav-item');
    const sections = document.querySelectorAll('.journey-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            item.classList.add('active');
            const sectionId = item.getAttribute('href').substring(1);
            document.getElementById(sectionId).classList.add('active');
        });
    });
}
function initializePage() {
    console.log('initializePage called');
    
    const activeConditions = JSON.parse(localStorage.getItem('activeConditions') || '[]');
    console.log('Active Conditions:', activeConditions);
    
    initializeMyCarePage();
}
function setupFilters() {
    const pills = document.querySelectorAll('.pill');
    const cards = document.querySelectorAll('.content-card');

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            // Remove active class from all pills
            pills.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked pill
            pill.classList.add('active');
            
            const filter = pill.dataset.filter;
            
            // Show/hide cards based on filter
            cards.forEach(card => {
                if (filter === 'all') {
                    card.classList.add('show');
                } else {
                    // Check if card has matching tag
                    const tags = card.querySelectorAll('.tag');
                    const hasMatch = Array.from(tags).some(tag => 
                        tag.textContent.toLowerCase() === filter.toLowerCase()
                    );
                    
                    if (hasMatch) {
                        card.classList.add('show');
                    } else {
                        card.classList.remove('show');
                    }
                }
            });
        });
    });

    // Show all cards initially
    cards.forEach(card => card.classList.add('show'));
}



// 4. Bottom Sheet Management
async function openBottomSheet(contentUrl = 'funnel.html') {
    const bottomSheet = document.getElementById('bottomSheet');
    const bottomSheetOverlay = document.querySelector('.bottom-sheet-overlay');
    const sheetContent = document.querySelector('.bottom-sheet-content .sheet-content');

    try {
        const response = await fetch(contentUrl);
        const content = await response.text();
        sheetContent.innerHTML = content;

        bottomSheet.classList.add('active');
        bottomSheetOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (contentUrl === 'funnel.html') {
            setTimeout(() => {
                window.initializeFunnel();
                // console.log('Funnel initialized');

                // Store original function reference before it gets overwritten
                const originalNextStep = window.nextStep;

                // Override nextStep to handle both funnel and regular bottom sheet behavior
                window.nextStep = function() {
                    // If we're in the funnel context (check for funnel-specific element)
                    if (document.querySelector('.funnel-progress')) {
                        // Call funnel's nextStep
                        if (window.funnelNextStep) {
                            window.funnelNextStep();
                        }
                    } else {
                        // Call original bottom sheet nextStep
                        if (originalNextStep) {
                            originalNextStep();
                        }
                    }
                };
            }, 0);
        }
    } catch (error) {
        console.error('Error loading content:', error);
        sheetContent.innerHTML = '<p>Error loading content</p>';
    }
}
function closeBottomSheet() {
    const bottomSheet = document.getElementById('bottomSheet');
    const bottomSheetOverlay = document.querySelector('.bottom-sheet-overlay');
    
    // Only proceed if elements exist
    if (bottomSheet) {
        bottomSheet.classList.remove('active');
    }
    
    if (bottomSheetOverlay) {
        bottomSheetOverlay.classList.remove('active');
    }
    
    document.body.style.overflow = '';

    // Reset funnel progress
    if (window.currentStep) {
        window.currentStep = 1;
        const sheetContent = document.querySelector('.bottom-sheet-content .sheet-content');
        if (sheetContent) {
            sheetContent.innerHTML = ''; // Clear content
        }
    }
}
function setupBottomSheet() {
    const bottomSheetOverlay = document.querySelector('.bottom-sheet-overlay');
    if (bottomSheetOverlay) {
        bottomSheetOverlay.addEventListener('click', closeBottomSheet);
    }

    // Add click handlers for any bottom sheet triggers
    document.querySelectorAll('[data-bottom-sheet]').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const contentUrl = trigger.dataset.bottomSheet;
            openBottomSheet(contentUrl);
        });
    });
}





// function goToStep(step) {
//     // ... your existing step navigation code ...
    
//     if (step === 6 || isStep6Active()) {
//         // console.log('Reached step 6 - triggering completion');
//         completeFunnel();
//     }
// }


function initializeMyCarePage() {
    console.log('Initializing MyCare page');
    updateDisplayState();
}


function handleReturnButtonClick() {
    console.log('Handling return button click');
    
    // Close the bottom sheet if it's open
    closeBottomSheet();
    
    // Instead of trying to load content, redirect to index.html
    window.location.href = 'index.html';
}

function updateNavIcons() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const icon = item.querySelector('i');
        if (icon) {
            // Add transition class before changing icons
            icon.classList.add('icon-transition');
            
            // Set a tiny timeout to ensure the transition class is applied before changes
            setTimeout(() => {
                if (item.classList.contains('active')) {
                    // For heart icon
                    if (icon.classList.contains('fa-heart')) {
                        icon.classList.remove('fa-regular', 'fa-heart');
                        icon.classList.add('fa-solid', 'fa-heart');
                    }
                    // For user icon
                    if (icon.classList.contains('fa-circle-user')) {
                        icon.classList.remove('fa-regular', 'fa-circle-user');
                        icon.classList.add('fa-solid', 'fa-circle-user');
                    }
                    if (icon.classList.contains('fa-bookmark')) {
                        icon.classList.remove('fa-regular', 'fa-bookmark');
                        icon.classList.add('fa-solid', 'fa-bookmark');
                    }
                } else {
                    // For heart icon
                    if (icon.classList.contains('fa-heart')) {
                        icon.classList.remove('fa-solid', 'fa-heart');
                        icon.classList.add('fa-regular', 'fa-heart');
                    }
                    // For user icon
                    if (icon.classList.contains('fa-circle-user')) {
                        icon.classList.remove('fa-solid', 'fa-circle-user');
                        icon.classList.add('fa-regular', 'fa-circle-user');
                    }
                    if (icon.classList.contains('fa-bookmark')) {
                        icon.classList.remove('fa-solid', 'fa-bookmark');
                        icon.classList.add('fa-regular', 'fa-bookmark');
                    }
                }
            }, 10);
        }
    });
}

// Call when page loads
document.addEventListener('DOMContentLoaded', updateNavIcons);

// Call when navigation changes
document.addEventListener('click', (e) => {
    if (e.target.closest('.nav-item')) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        e.target.closest('.nav-item').classList.add('active');
        updateNavIcons();
    }
});


// 6. Page Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Get the current page path
    const currentPath = window.location.pathname;
    
    // Only load mycare content if we're on the index page
    if (currentPath === '/' || 
        currentPath === '/index.html' || 
        currentPath.endsWith('index.html')) {
        loadContent('mycare');
    }
    
    // Setup navigation only if we're not on journey.html
    if (!currentPath.includes('journey.html')) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                
                // Update active state
                document.querySelectorAll('.nav-item').forEach(navItem => {
                    navItem.classList.remove('active');
                });
                item.classList.add('active');
                
                // Load the new page content
                loadContent(page);
            });
        });
    }
    
    // Setup logo reset handler
    document.addEventListener('click', (e) => {
        if (e.target.closest('.active-logo-reset')) {
            e.preventDefault();
            resetActiveConditions();
        }
    });
});

// document.addEventListener('click', (e) => {
//     if (e.target.matches('.onboarding-link')) {
//         e.preventDefault();
//         loadContent('onboarding');
//     }
// });

// Add this function to main.js
function clearCache() {
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
        // After page loads, ensure we load mycare content
        window.addEventListener('DOMContentLoaded', () => {
            loadContent('mycare');
        });
    }, 500);
}

function isElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

function updateCarePlanState() {
    const carePlanMessage = document.querySelector('.care-plan-ready-message');
    const carePlanButton = document.querySelector('.care-plan-ready');
    
    if (!carePlanMessage || !carePlanButton) return;
    
    // Check if transition has already happened
    const hasTransitioned = localStorage.getItem('carePlanTransitioned') === 'true';
    
    // Set initial states with transitions
    carePlanMessage.style.transition = 'opacity 0.5s ease';
    carePlanButton.style.transition = 'opacity 0.5s ease';
    
    if (hasTransitioned) {
        // Show final state immediately
        carePlanMessage.style.opacity = '0';
        carePlanMessage.style.display = 'none';
        carePlanButton.style.opacity = '1';
        carePlanButton.style.display = 'block';
    } else {
        // Show initial state
        carePlanMessage.style.opacity = '1';
        carePlanMessage.style.display = 'block';
        carePlanButton.style.opacity = '0';
        carePlanButton.style.display = 'none';
        
        // Create an intersection observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Start transition after delay
                    setTimeout(() => {
                        // Fade out message
                        carePlanMessage.style.opacity = '0';
                        
                        // After message fades out, show button
                        setTimeout(() => {
                            carePlanMessage.style.display = 'none';
                            carePlanButton.style.display = 'block';
                            
                            // Trigger reflow
                            carePlanButton.offsetHeight;
                            
                            // Fade in button
                            carePlanButton.style.opacity = '1';
                            
                            // Save state
                            localStorage.setItem('carePlanTransitioned', 'true');
                        }, 500);
                    }, 3000);
                    
                    // Stop observing once triggered
                    observer.disconnect();
                }
            });
        }, {
            threshold: 0.5 // Trigger when at least 50% of the element is visible
        });
        
        // Start observing the message
        observer.observe(carePlanMessage);
    }
}

