document.addEventListener('DOMContentLoaded', () => {
    // Reset localStorage on hard refresh
    if (window.performance && window.performance.navigation.type === 1) {
        console.log('Page was hard refreshed - resetting state');
        localStorage.removeItem('hasCarePlan');
    }

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
});

async function loadContent(page) {
    try {
        const response = await fetch(`${page}.html`);
        const content = await response.text();
        document.getElementById('main-content').innerHTML = content;
        
        if (page === 'explore') {
            setupFilters();
            setupBottomSheet();
            setupExploreCards();
        } else if (page === 'funnel') {
            window.initializeFunnel();
        } else if (page === 'mycare') {
            setupBottomSheet();
            checkCarePlanState();
            setupCareCards();
        } else if (page === 'journey') {
            setupJourneyNavigation();
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
        document.getElementById('main-content').innerHTML = '<p>Error loading content</p>';
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
        // Fetch and insert content
        const response = await fetch(contentUrl);
        const content = await response.text();
        sheetContent.innerHTML = content;

        // Show bottom sheet and overlay
        bottomSheet.classList.add('active');
        bottomSheetOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Initialize funnel if it's funnel content
        if (contentUrl === 'funnel.html') {
            setTimeout(() => {
                window.initializeFunnel();
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

function checkCarePlanState() {
    const hasCarePlan = localStorage.getItem('hasCarePlan') === 'true';
    const emptyState = document.getElementById('emptyState');
    const filledState = document.getElementById('filledState');
    
    if (emptyState && filledState) {
        console.log('Updating care plan state:', hasCarePlan); // Debug log
        emptyState.style.display = hasCarePlan ? 'none' : 'block';
        filledState.style.display = hasCarePlan ? 'block' : 'none';
    } else {
        console.warn('Care plan state elements not found'); // Debug log
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
        
        console.log('Toggled state:', isFilledStateVisible ? 'empty' : 'filled'); // Debug log
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
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('openCareSheet') === 'true') {
        // Clear the flag
        localStorage.removeItem('openCareSheet');
        // Open the bottom sheet
        openBottomSheet(); // Assuming you have this function in mycare.html
    }
});


// Update the link to use this function
document.addEventListener('click', (e) => {
    if (e.target.matches('.onboarding-link')) {
        e.preventDefault();
        loadContent('onboarding');
    }
});


