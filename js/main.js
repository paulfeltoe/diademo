// 1. Core Page Loading
async function loadContent(page) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
        console.error('Main content element not found');
        return;
    }

    try {
        // Fade out current content
        mainContent.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, 150)); // Wait for fade out

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
            // console.log('MyCare page loaded, updating display');
            updateDisplayState();  // Use our consolidated state update function
            setupBottomSheet();
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

function loadPage(pageName) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    fetch(`${pageName}.html`)
        .then(response => response.text())
        .then(html => {
            mainContent.innerHTML = html;
            
            // Check for care plan ready button after mycare page loads
            if (pageName === 'mycare') {
                // console.log('MyCare page loaded dynamically');
                
                // Simple 5 second timer to show care plan ready button
                setTimeout(() => {
                    const carePlanReadyButton = document.querySelector('.care-plan-ready');
                    const carePlanReadyMessage = document.querySelector('.care-plan-ready-message');
                    
                    if (carePlanReadyButton) {
                        carePlanReadyButton.style.display = 'block';
                    }
                    if (carePlanReadyMessage) {
                        carePlanReadyMessage.style.display = 'none';
                    }
                    // console.log('Button shown and message hidden');
                }, 5000);
            }
        });
}
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
    // console.log('DOMContentLoaded event fired');
    
    // Load initial content
    loadContent('mycare');  // Always start with mycare
    
    // Setup navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            // console.log('Navigation clicked:', page);
            
            // Update active state
            document.querySelectorAll('.nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            item.classList.add('active');
            
            // Load the new page content
            loadContent(page);
        });
    });
    
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