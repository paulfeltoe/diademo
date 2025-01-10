document.addEventListener('DOMContentLoaded', () => {
    // Get journey type from URL parameter or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const journeyType = urlParams.get('type') || localStorage.getItem('lastJourneyType') || 'sinusitis';
    console.log('Journey type:', journeyType);

    // Store the last viewed journey type
    localStorage.setItem('lastJourneyType', journeyType);

    // Hide all journeys first
    document.querySelectorAll('.page-content.journey').forEach(journey => {
        journey.classList.remove('active');
    });

    // Show the selected journey
    const selectedJourney = document.getElementById(`${journeyType}-journey`);
    if (selectedJourney) {
        selectedJourney.classList.add('active');
        
        // Add complete button to overview section
        const overviewSection = selectedJourney.querySelector('#overview');
        
        if (overviewSection && !overviewSection.querySelector('.complete-journey-button')) {
            const completeButton = document.createElement('button');
            completeButton.className = 'complete-journey-button button-secondary';
            completeButton.innerHTML = '<i class="fas fa-check"></i> Mark as Completed';
            completeButton.onclick = () => {
                console.log('Complete button clicked');
                markJourneyAsComplete(journeyType);
            };
            overviewSection.appendChild(completeButton);
        }
    }

    // Initialize elements
    const messagesList = document.querySelector('.messages-list');
    const typingIndicator = document.querySelector('.typing-indicator');
    const messageForm = document.getElementById('messageForm');
    const messageInput = messageForm?.querySelector('.message-input');

    // Navigation handling
    const navItems = document.querySelectorAll('.journey-nav-item');
    const sections = document.querySelectorAll('.journey-section');

    const navigateToSection = (targetId) => {
        navItems.forEach(nav => nav.classList.remove('active'));
        sections.forEach(section => section.classList.remove('active'));
        
        const targetNav = document.querySelector(`.journey-nav-item[href="#${targetId}"]`);
        if (targetNav) targetNav.classList.add('active');
        
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.classList.add('active');
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href').substring(1);
            navigateToSection(targetId);
        });
    });

    // Load saved messages and status
    const loadSavedState = () => {
        const savedMessages = localStorage.getItem('sinusitis_messages');
        const savedStatus = localStorage.getItem('sinusitis_status');
        
        if (savedMessages) {
            // Find the last nurse check-in message
            const lastNurseMessage = messagesList.querySelector('.message:last-of-type');
            if (lastNurseMessage) {
                // Insert saved messages before the typing indicator
                lastNurseMessage.insertAdjacentHTML('afterend', savedMessages);
                messagesList.scrollTop = messagesList.scrollHeight;
            }
        }

        if (savedStatus) {
            updateJourneyStatus(savedStatus, false); // false means don't save to localStorage
        }
    };

    // Save messages to localStorage
    const saveMessages = () => {
        // Get all messages after the initial nurse check-in
        const initialMessages = Array.from(messagesList.children);
        const lastNurseCheckInIndex = initialMessages.findIndex(msg => 
            msg.querySelector('.message-content')?.textContent.includes('Just checking in on your progress')
        );
        
        const messagesToSave = initialMessages
            .slice(lastNurseCheckInIndex + 1)
            .filter(msg => !msg.classList.contains('typing-indicator'))
            .map(msg => msg.outerHTML)
            .join('');

        localStorage.setItem('sinusitis_messages', messagesToSave);
    };

    // Modified message sending function
    const sendMessage = () => {
        const message = messageInput.value.trim();
        if (message) {
            const messageHTML = `
                <div class="message outgoing">
                    <div class="message-header">
                        <div class="message-info">
                            <h3>You</h3>
                            <span class="message-time">Just now</span>
                        </div>
                    </div>
                    <div class="message-content">${message}</div>
                </div>
            `;
            
            messagesList.insertAdjacentHTML('beforeend', messageHTML);
            messageInput.value = '';
            messagesList.scrollTop = messagesList.scrollHeight;
            saveMessages();
        }
    };

    // Response option handling
    const getNurseResponse = (response) => {
        switch(response) {
            case 'better':
                return `Great to hear you're feeling better! I'll mark this case as resolved. Don't hesitate to reach out if you need anything else!`;
            case 'improving':
                return `I'm glad there's some improvement. Keep following the treatment plan and let us know if you need anything.`;
            case 'same':
            case 'worse':
                return `I'm sorry you're not feeling ${response === 'same' ? 'better' : 'well'}. Let's get that fixed right away.
                    <div class="message-actions">
                        <button class="action-button" onclick="navigateToSection('appointments')">
                            <i class="fas fa-calendar-plus"></i>
                            Book a Follow-up Appointment
                        </button>
                    </div>`;
        }
    };

    // Modified status update function
    const updateJourneyStatus = (status, shouldSave = true) => {
        const statusIndicator = document.querySelector('.status-indicator');
        statusIndicator.textContent = status === 'resolved' ? 'Resolved' : 'Open';
        statusIndicator.className = `status-indicator ${status}`;
        
        if (shouldSave) {
            localStorage.setItem('sinusitis_status', status);
        }
    };

    // Event listeners
    if (messageForm && messageInput) {
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessage();
        });

        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
        });
    }

    document.querySelectorAll('.response-option').forEach(button => {
        button.addEventListener('click', (e) => {
            const response = e.target.closest('.response-option').dataset.response;
            const responseOptions = e.target.closest('.response-options');
            
            // Disable response options
            responseOptions.style.pointerEvents = 'none';
            responseOptions.style.opacity = '0.5';

            // Add user's response
            const userMessage = `
                <div class="message outgoing">
                    <div class="message-header">
                        <div class="message-info">
                            <h3>You</h3>
                            <span class="message-time">Just now</span>
                        </div>
                    </div>
                    <div class="message-content">${e.target.textContent.trim()}</div>
                </div>
            `;
            messagesList.insertAdjacentHTML('beforeend', userMessage);
            saveMessages();

            // Show typing indicator
            typingIndicator.style.display = 'block';
            messagesList.scrollTop = messagesList.scrollHeight;

            // Simulate nurse response
            setTimeout(() => {
                typingIndicator.style.display = 'none';
                const nurseMessage = `
                    <div class="message">
                        <div class="message-header">
                            <img src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop&q=60" alt="Nurse Chen" class="avatar">
                            <div class="message-info">
                                <h3>Nurse Chen</h3>
                                <span class="message-time">Just now</span>
                            </div>
                        </div>
                        <div class="message-content">${getNurseResponse(response)}</div>
                    </div>
                `;
                messagesList.insertAdjacentHTML('beforeend', nurseMessage);
                saveMessages();
                
                if (response === 'better') {
                    setTimeout(() => updateJourneyStatus('resolved'), 500);
                }
                
                messagesList.scrollTop = messagesList.scrollHeight;
            }, 1500);
        });
    });

    // Load saved state when page loads
    loadSavedState();

    // Add this to handle chat responses
    const responseOptions = document.querySelectorAll('.response-option');
    
    responseOptions.forEach(option => {
        option.addEventListener('click', function() {
            const response = this.dataset.response;
            
            // Hide all response options
            document.querySelector('.response-options').style.display = 'none';
            
            // Show typing indicator
            typingIndicator.style.display = 'block';
            
            // Simulate nurse response after delay
            setTimeout(() => {
                typingIndicator.style.display = 'none';
                
                // Add member's response
                const messagesContainer = document.querySelector('.messages-list');
                const memberMessage = document.createElement('div');
                memberMessage.className = 'message outgoing';
                memberMessage.innerHTML = `
                    <div class="message-header">
                        <div class="message-info">
                            <h3>You</h3>
                            <span class="message-time">${new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                    <div class="message-content">${this.innerHTML}</div>
                `;
                messagesContainer.insertBefore(memberMessage, typingIndicator);
                
                // If response is "better", add nurse's response and resolve episode
                if (response === 'better') {
                    setTimeout(() => {
                        const nurseMessage = document.createElement('div');
                        nurseMessage.className = 'message';
                        nurseMessage.innerHTML = `
                            <div class="message-header">
                                <img src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop&q=60" alt="Nurse Chen" class="avatar">
                                <div class="message-info">
                                    <h3>Nurse Chen</h3>
                                    <span class="message-time">${new Date().toLocaleTimeString()}</span>
                                </div>
                            </div>
                            <div class="message-content">That's great to hear! I'll mark this episode as resolved. Remember to reach out if you need anything else!</div>
                        `;
                        messagesContainer.insertBefore(nurseMessage, typingIndicator);
                        
                        // Resolve the episode after a short delay
                        setTimeout(resolveEpisode, 1500);
                    }, 1000);
                }
            }, 1500);
        });
    });

    initializeJourneyStatuses();
});

function resolveEpisode() {
    // Get the condition from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const condition = urlParams.get('type');
    
    if (condition) {
        // Update the status in the journey page
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.textContent = 'Resolved';
            statusIndicator.classList.remove('active');
            statusIndicator.classList.add('resolved');
        }
        
        // Move the card to past care plans
        moveCardToPastCarePlans(condition);
        
        // Redirect back to mycare page after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Get all journey navigation items
    const journeyNavs = document.querySelectorAll('.journey-nav-item');
    
    journeyNavs.forEach(navItem => {
        navItem.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Find the current journey container
            const currentJourney = this.closest('.journey');
            
            // Remove active class from all nav items in this journey
            currentJourney.querySelectorAll('.journey-nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to clicked nav item
            this.classList.add('active');
            
            // Get the section ID from the href
            const sectionId = this.getAttribute('href').substring(1);
            
            // Hide all sections in this journey
            currentJourney.querySelectorAll('.journey-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show the selected section
            currentJourney.querySelector(`#${sectionId}`).classList.add('active');
        });
    });
});

// Add this function at the end of the file
function handleReturnButtonClick() {
    // Store sinusitis as the journey type to show
    localStorage.setItem('lastJourneyType', 'sinusitis');
    // Navigate to journey.html
    window.location.href = 'journey.html';
}

// Export the function for use in other files
window.handleReturnButtonClick = handleReturnButtonClick;

// Add these new functions
function markJourneyAsComplete(journeyType) {
    console.log('Marking journey as complete:', journeyType);
    
    // Update journey page
    const journeySection = document.getElementById(`${journeyType}-journey`);
    if (journeySection) {
        journeySection.setAttribute('data-status', 'resolved');
        
        const statusIndicator = journeySection.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.textContent = 'Resolved';
            statusIndicator.classList.remove('active');
            statusIndicator.classList.add('resolved');
        }
    }
    
    // Update card on main page if it exists
    const journeyCard = document.querySelector(`.care-journey-card.care-card-${journeyType}`);
    if (journeyCard) {
        journeyCard.setAttribute('data-status', 'resolved');
        const statusBadge = journeyCard.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.textContent = 'Resolved';
            statusBadge.classList.remove('active');
            statusBadge.classList.add('resolved');
        }
    }

    // Store the completion status
    const resolvedConditions = JSON.parse(sessionStorage.getItem('resolvedConditions') || '[]');
    const activeConditions = JSON.parse(sessionStorage.getItem('shownConditions') || '[]');
    
    // Remove from active and add to resolved
    const updatedActive = activeConditions.filter(condition => condition !== journeyType);
    if (!resolvedConditions.includes(journeyType)) {
        resolvedConditions.push(journeyType);
    }

    // Update storage
    sessionStorage.setItem('shownConditions', JSON.stringify(updatedActive));
    sessionStorage.setItem('resolvedConditions', JSON.stringify(resolvedConditions));

    // Update the complete button
    const completeButton = document.querySelector('.complete-journey-button');
    if (completeButton) {
        completeButton.disabled = true;
        completeButton.innerHTML = '<i class="fas fa-check"></i> Completed';
    }
}

// Make sure the function is available globally
window.markJourneyAsComplete = markJourneyAsComplete;

function initializeJourneyStatuses() {
    const resolvedConditions = JSON.parse(sessionStorage.getItem('resolvedConditions') || '[]');
    
    // Update journey pages
    ['sinusitis', 'anxiety', 'rash'].forEach(journeyType => {
        const journeySection = document.getElementById(`${journeyType}-journey`);
        if (journeySection) {
            if (resolvedConditions.includes(journeyType)) {
                journeySection.setAttribute('data-status', 'resolved');
                
                const statusIndicator = journeySection.querySelector('.status-indicator');
                if (statusIndicator) {
                    statusIndicator.textContent = 'Resolved';
                    statusIndicator.classList.remove('active');
                    statusIndicator.classList.add('resolved');
                }
                
                const completeButton = journeySection.querySelector('.complete-journey-button');
                if (completeButton) {
                    completeButton.disabled = true;
                    completeButton.innerHTML = '<i class="fas fa-check"></i> Completed';
                }
            }
        }
        
        // Add card status update
        const journeyCard = document.querySelector(`.care-journey-card.care-card-${journeyType}`);
        if (journeyCard) {
            if (resolvedConditions.includes(journeyType)) {
                journeyCard.setAttribute('data-status', 'resolved');
                const statusBadge = journeyCard.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.textContent = 'Resolved';
                    statusBadge.classList.remove('active');
                    statusBadge.classList.add('resolved');
                }
            }
        }
    });
}
