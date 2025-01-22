async function loadContent(page) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
        console.error('Main content element not found');
        return;
    }

    try {
        const response = await fetch(`${page}.html`);
        const content = await response.text();
        mainContent.innerHTML = content;
        
        if (page === 'explore') {
            setupFilters();
            setupBottomSheet();
            setupExploreCards();
        } else if (page === 'funnel') {
            window.initializeFunnel();
        } else if (page === 'mycare') {
            setupBottomSheet();
            // Check if we should show filled state and which conditions
            const showFilledState = localStorage.getItem('hasCarePlan') === 'true';
            const activeConditions = JSON.parse(sessionStorage.getItem('shownConditions') || '[]');
            
            // Update the UI after content is loaded
            setTimeout(() => {
                updateMyCareState(showFilledState, activeConditions);
            }, 0);
        } else if (page === 'journey') {
            setupJourneyNavigation();
        } else if (page === 'profile') {
            // Load the profile script as a module
            const script = document.createElement('script');
            script.type = 'module';
            script.src = 'js/profile.js';
            document.body.appendChild(script);
            
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
        if (mainContent) {
            mainContent.innerHTML = '<p>Error loading content</p>';
        }
    }
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

function navigateToGetCare() {
    // Store a flag in localStorage to indicate the bottom sheet should be opened
    localStorage.setItem('openCareSheet', 'true');
    // Navigate to mycare.html
    window.location.href = 'mycare.html';
}

function closeBottomSheet() {
    const bottomSheet = document.getElementById('bottomSheet');
    const bottomSheetOverlay = document.querySelector('.bottom-sheet-overlay');
    
    bottomSheet.classList.remove('active');
    bottomSheetOverlay.classList.remove('active');
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

function setupExploreCards() {
    // Add click handlers to all content cards
    document.querySelectorAll('.content-card').forEach(card => {
        card.addEventListener('click', () => {
            const title = card.dataset.title;
            const description = card.dataset.description;
            const image = card.dataset.image;
            
            // Update bottom sheet content
            const sheetContent = document.querySelector('.bottom-sheet-content .sheet-content');
            sheetContent.innerHTML = `
                <img class="sheet-image" src="${image}" alt="${title}">
                <h2 class="sheet-title">${title}</h2>
                <p class="sheet-description">${description}</p>
            `;
            
            // Open bottom sheet
            const bottomSheet = document.getElementById('bottomSheet');
            const bottomSheetOverlay = document.querySelector('.bottom-sheet-overlay');
            bottomSheet.classList.add('active');
            bottomSheetOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });
}

function checkFunnelCompletion() {
    const hasFunnelCompleted = localStorage.getItem('funnelCompleted') === 'true';
    
    const emptyState = document.getElementById('emptyState');
    const filledState = document.getElementById('filledState');
    
    if (emptyState && filledState) {
        // console.log('Updating funnel state:', hasFunnelCompleted);
        emptyState.style.display = hasFunnelCompleted ? 'none' : 'block';
        filledState.style.display = hasFunnelCompleted ? 'block' : 'none';
    }
}

function completeFunnel() {
    // console.log('Completing funnel for condition:', selectedCondition);
    
    // Force display changes
    const emptyState = document.getElementById('emptyState');
    const filledState = document.getElementById('filledState');
    
    if (emptyState && filledState) {
        // console.log('Updating state displays');
        emptyState.style.display = 'none';
        filledState.style.display = 'block';
        
        // Show the corresponding care journey card
        const newCard = document.querySelector(`.care-journey-card[href*="type=${selectedCondition}"]`);
        if (newCard) {
            newCard.style.display = 'block';
            
            // Store shown conditions in sessionStorage
            const shownConditions = JSON.parse(sessionStorage.getItem('shownConditions') || '[]');
            if (!shownConditions.includes(selectedCondition)) {
                shownConditions.push(selectedCondition);
                sessionStorage.setItem('shownConditions', JSON.stringify(shownConditions));
            }
        }
    }
    
    // Update storage
    localStorage.setItem('funnelCompleted', 'true');
    localStorage.setItem('hasCarePlan', 'true');
    sessionStorage.setItem('funnelCompleted', 'true');
    sessionStorage.setItem('hasCarePlan', 'true');
    
    // Force another state check
    checkFunnelCompletion();
    checkCarePlanState();
}

// Update the restore function to handle session state
function restoreCarePlanState() {
    const activeConditions = JSON.parse(sessionStorage.getItem('shownConditions') || '[]');
    const resolvedConditions = JSON.parse(sessionStorage.getItem('resolvedConditions') || '[]');
    
    if (activeConditions.length > 0 || resolvedConditions.length > 0) {
        // Show active cards in main section
        activeConditions.forEach(condition => {
            const card = document.querySelector(`.care-journey-card[href*="type=${condition}"]`);
            if (card) {
                card.style.display = 'block';
                // Ensure it's in the active section
                const activeSection = document.querySelector('.care-section:not(:last-child) .care-cards');
                if (activeSection && !activeSection.contains(card)) {
                    activeSection.appendChild(card.cloneNode(true));
                    card.remove();
                }
            }
        });
        
        // Show resolved cards in past section
        resolvedConditions.forEach(condition => {
            const card = document.querySelector(`.care-journey-card[href*="type=${condition}"]`);
            if (card) {
                card.style.display = 'block';
                // Update card status
                const statusBadge = card.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.textContent = 'Resolved';
                    statusBadge.classList.remove('active');
                }
                // Move to past section
                const pastSection = document.querySelector('.care-section:last-child .care-cards');
                if (pastSection && !pastSection.contains(card)) {
                    pastSection.appendChild(card.cloneNode(true));
                    card.remove();
                }
            }
        });
    }
}
// Add this function to handle page refresh
function handlePageRefresh() {
    if (window.performance && window.performance.navigation.type === 1) {
        // console.log('Page was hard refreshed - resetting session state');
        sessionStorage.clear();
        // On hard refresh, we'll start fresh with localStorage values
        const persistentConditions = JSON.parse(localStorage.getItem('shownConditions') || '[]');
        if (persistentConditions.length > 0) {
            sessionStorage.setItem('shownConditions', JSON.stringify(persistentConditions));
        }
    }
}

function checkCarePlanState() {
    const hasCarePlan = localStorage.getItem('hasCarePlan') === 'true';
    const emptyState = document.getElementById('emptyState');
    const filledState = document.getElementById('filledState');
    
    if (emptyState && filledState) {
        // console.log('Updating care plan state:', hasCarePlan);
        emptyState.style.display = hasCarePlan ? 'none' : 'block';
        filledState.style.display = hasCarePlan ? 'block' : 'none';
    }
}

function navigateToProfile() {
    loadContent('profile');
    
    // Remove active class from all nav items since this is a special navigation
    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.classList.remove('active');
    });
}

function toggleFilledState() {
    const emptyState = document.getElementById('emptyState');
    const filledState = document.getElementById('filledState');
    
    if (emptyState && filledState) {
        // Check current state
        const isFilledStateVisible = filledState.style.display === 'block';
        
        // Toggle states
        emptyState.style.display = isFilledStateVisible ? 'block' : 'none';
        filledState.style.display = isFilledStateVisible ? 'none' : 'block';
        
        // Update localStorage
        localStorage.setItem('hasCarePlan', (!isFilledStateVisible).toString());
        
        // console.log('Toggled state:', isFilledStateVisible ? 'empty' : 'filled'); // Debug log
    }
}

function setupCareCards() {
    // Add click handlers to all care cards
    document.querySelectorAll('.care-card').forEach(card => {
        card.addEventListener('click', () => {
            // Load journey.html content
            loadContent('journey');
        });
    });
}

function setupJourneyNavigation() {
    const navItems = document.querySelectorAll('.journey-nav-item');
    const sections = document.querySelectorAll('.journey-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor behavior
            
            // Remove active class from all nav items and sections
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked nav item
            item.classList.add('active');
            
            // Show the corresponding section
            const sectionId = item.getAttribute('href').substring(1);
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

function toggleState() {
    const currentState = localStorage.getItem('funnelCompleted') === 'true';
    localStorage.setItem('funnelCompleted', (!currentState).toString());
    localStorage.setItem('hasCarePlan', (!currentState).toString());
    checkFunnelCompletion();
    checkCarePlanState();
}

// Add this function to check if we're on step 6
function isStep6Active() {
    return !!document.querySelector('[data-step="6"].active');
}

// Modify your existing step navigation function to include this check
function goToStep(step) {
    // ... your existing step navigation code ...
    
    if (step === 6 || isStep6Active()) {
        // console.log('Reached step 6 - triggering completion');
        completeFunnel();
    }
}

function hardReset() {
    // console.log('Performing hard reset...');
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Hide all care journey cards
    document.querySelectorAll('.care-journey-card').forEach(card => {
        card.style.display = 'none';
    });
    
    // Reset states
    const emptyState = document.getElementById('emptyState');
    const filledState = document.getElementById('filledState');
    
    if (emptyState && filledState) {
        emptyState.style.display = 'block';
        filledState.style.display = 'none';
    }
    
    // Force state checks
    checkFunnelCompletion();
    checkCarePlanState();
}

function showAllIssues() {
    // Show filled state
    const emptyState = document.getElementById('emptyState');
    const filledState = document.getElementById('filledState');
    
    if (emptyState && filledState) {
        emptyState.style.display = 'none';
        filledState.style.display = 'block';
    }
    
    // Show all care journey cards
    document.querySelectorAll('.care-journey-card').forEach(card => {
        card.style.display = 'block';
    });
    
    // Update storage
    localStorage.setItem('hasCarePlan', 'true');
    localStorage.setItem('funnelCompleted', 'true');
    
    // Store all conditions in session
    const conditions = ['sinusitis', 'anxiety', 'rash', 'migraines'];
    sessionStorage.setItem('shownConditions', JSON.stringify(conditions));
}

// Navigation helper function for MyCare page states
function navigateToMyCare({ showFilledState = false, activeConditions = [] } = {}) {
    // console.log('navigateToMyCare called with:', { showFilledState, activeConditions });

    // Close the bottom sheet first
    closeBottomSheet();

    // Set state in storage
    if (showFilledState) {
        // console.log('Setting filled state in storage');
        localStorage.setItem('hasCarePlan', 'true');
        localStorage.setItem('funnelCompleted', 'true');
        sessionStorage.setItem('shownConditions', JSON.stringify(activeConditions));
    } else {
        // console.log('Clearing state in storage');
        localStorage.removeItem('hasCarePlan');
        localStorage.removeItem('funnelCompleted');
        sessionStorage.removeItem('shownConditions');
    }

    // If we're already on the mycare page, update the UI directly
    const currentPage = document.querySelector('.nav-item.active')?.dataset.page;
    // console.log('Current page:', currentPage);

    if (currentPage === 'mycare') {
        // console.log('Already on mycare page, updating UI directly');
        updateMyCareState(showFilledState, activeConditions);
    } else {
        // console.log('Navigating to mycare page');
        // Navigate to index.html and load mycare content
        if (window.location.pathname.includes('index.html')) {
            // console.log('On index.html, loading mycare content');
            loadContent('mycare');
            // Update nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.page === 'mycare');
            });
        } else {
            // console.log('Redirecting to index.html#mycare');
            window.location.href = 'index.html#mycare';
        }
    }
}

// Helper function to update MyCare page UI
function updateMyCareState(showFilledState, activeConditions = []) {
    // console.log('updateMyCareState called with:', { showFilledState, activeConditions });
    
    const emptyState = document.getElementById('emptyState');
    const filledState = document.getElementById('filledState');
    
    // console.log('Found elements:', { 
    //     emptyState: !!emptyState, 
    //     filledState: !!filledState 
    // });
    
    if (emptyState && filledState) {
        // Update visibility
        emptyState.style.display = showFilledState ? 'none' : 'block';
        filledState.style.display = showFilledState ? 'block' : 'none';
        
        // console.log('Updated state visibility:', {
        //     emptyState: emptyState.style.display,
        //     filledState: filledState.style.display
        // });
        
        // Update journey cards visibility
        const journeyCards = document.querySelectorAll('.care-journey-card');
        // console.log('Found journey cards:', journeyCards.length);
        
        journeyCards.forEach(card => {
            // Extract condition from the card's class or href
            const cardCondition = card.classList.contains('care-card-anxiety') ? 'anxiety' :
                                card.classList.contains('care-card-sinusitis') ? 'sinusitis' :
                                card.classList.contains('care-card-rash') ? 'rash' :
                                card.classList.contains('care-card-migraines') ? 'migraines' : null;
            
            // console.log('Card condition:', cardCondition);
            // Show/hide based on activeConditions
            card.style.display = activeConditions.includes(cardCondition) ? 'block' : 'none';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    // Reset localStorage on hard refresh
    if (window.performance && window.performance.navigation.type === 1) {
        // console.log('Page was hard refreshed - resetting state');
        localStorage.removeItem('hasCarePlan');
        localStorage.removeItem('funnelCompleted');
        localStorage.removeItem('shownConditions');
        localStorage.removeItem('activeCondition');
        localStorage.removeItem('chatHistory');
        sessionStorage.clear();
        
        // Clear chat messages if we're on the journey page
        const messagesList = document.querySelector('.messages-list');
        if (messagesList) {
            // Keep only the initial messages (before any user interaction)
            const messages = messagesList.querySelectorAll('.message');
            messages.forEach((message, index) => {
                // Keep only the first few messages (adjust number as needed)
                if (index > 4) {
                    message.remove();
                }
            });
            
            // Show response options again
            const responseOptions = document.querySelector('.response-options');
            if (responseOptions) {
                responseOptions.style.display = 'block';
            }
            
            // Hide typing indicator
            const typingIndicator = document.querySelector('.typing-indicator');
            if (typingIndicator) {
                typingIndicator.style.display = 'none';
            }
        }
    }
    
    // Add global click handler for logo
    document.addEventListener('click', (e) => {
        if (e.target.closest('.logo')) {
            // console.log('Logo clicked - forcing refresh');
            window.location.reload(true);
        }
    });

    // Load initial content (mycare.html by default)
    loadContent('mycare');

    // Add click handlers to nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all nav items
            document.querySelectorAll('.nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            
            // Add active class to clicked item
            e.target.closest('.nav-item').classList.add('active');
            
            // Load the corresponding content
            const page = e.target.closest('.nav-item').dataset.page;
            loadContent(page);
        });
    });

    // Setup bottom sheet
    setupBottomSheet();

    restoreCarePlanState();

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

        // Listen for fullscreen change to update button icon
        document.addEventListener('fullscreenchange', updateFullscreenIcon);
        document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
        document.addEventListener('mozfullscreenchange', updateFullscreenIcon);
        document.addEventListener('MSFullscreenChange', updateFullscreenIcon);
    } else {
        // console.warn('Fullscreen button not found in the DOM');
    }
});

// Check state on page load
document.addEventListener('DOMContentLoaded', checkFunnelCompletion);

document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('openCareSheet') === 'true') {
        // Clear the flag
        localStorage.removeItem('openCareSheet');
        // Open the bottom sheet
        openBottomSheet(); // Assuming you have this function in mycare.html
    }
});

// Add this to your DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
    // Reset sessionStorage on hard refresh
    if (window.performance && window.performance.navigation.type === 1) {
        // console.log('Page was hard refreshed - resetting state');
        sessionStorage.clear();
    }
    
    // Hide all cards initially
    document.querySelectorAll('.care-journey-card').forEach(card => {
        card.style.display = 'none';
    });
    
    // Restore any previously shown cards
    restoreCarePlanState();
    
    // Check states
    checkFunnelCompletion();
    checkCarePlanState();
});

// Update the DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    handlePageRefresh();
    restoreCarePlanState();
});

// Update the link to use this function
document.addEventListener('click', (e) => {
    if (e.target.matches('.onboarding-link')) {
        e.preventDefault();
        loadContent('onboarding');
    }
});

// Move updateFullscreenIcon function outside DOMContentLoaded
function updateFullscreenIcon() {
    const button = document.getElementById('fullscreenBtn');
    if (button) {
        const icon = button.querySelector('.fullscreen-icon');
        if (icon) {
            if (document.fullscreenElement || 
                document.webkitFullscreenElement || 
                document.mozFullScreenElement ||
                document.msFullscreenElement) {
                icon.textContent = '⤡';
            } else {
                icon.textContent = '⤢';
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const hasCarePlan = localStorage.getItem('hasCarePlan') === 'true';
    const selectedCondition = localStorage.getItem('selectedCondition');
    
    const emptyState = document.getElementById('emptyState');
    const filledState = document.getElementById('filledState');
    
    if (hasCarePlan && filledState && emptyState) {
        emptyState.style.display = 'none';
        filledState.style.display = 'block';
        
        // Show relevant journey card based on condition
        const journeyCards = document.querySelectorAll('.journey-card');
        journeyCards.forEach(card => {
            if (card.dataset.condition === selectedCondition) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
});

// Add this to handle the hash navigation when loading index.html
document.addEventListener('DOMContentLoaded', () => {
    // ... existing DOMContentLoaded code ...

    // Check for hash navigation
    if (window.location.hash === '#mycare') {
        loadContent('mycare');
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === 'mycare');
        });
    }
});

// Add this function to handle dynamic page loading
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

// Update the navigation click handlers to use this function
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        loadPage(page);
        // Update active state
        document.querySelectorAll('.nav-item').forEach(navItem => {
            navItem.classList.remove('active');
        });
        item.classList.add('active');
    });
});

// Initial page load
document.addEventListener('DOMContentLoaded', () => {
    loadPage('mycare');
});

