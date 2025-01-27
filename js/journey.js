document.addEventListener('DOMContentLoaded', () => {
    // Get journey type from URL parameter or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const journeyType = urlParams.get('type') || localStorage.getItem('lastJourneyType') || 'sinusitis';
    // console.log('Journey type:', journeyType);

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
                // console.log('Complete button clicked');
                markJourneyAsComplete(journeyType);
            };
            overviewSection.appendChild(completeButton);
        }
    }

    // Try more specific selectors
    const activeJourney = document.querySelector('.journey.active');
    // console.log('Active journey found:', !!activeJourney);
    
    if (activeJourney) {
        const messageForm = activeJourney.querySelector('.message-form');
        const messageInput = activeJourney.querySelector('.message-input');
        const sendButton = activeJourney.querySelector('.send-button');
        const messagesList = activeJourney.querySelector('.messages-list');

        // console.log('Found elements in active journey:', {
        //     messageForm: !!messageForm,
        //     messageInput: !!messageInput,
        //     sendButton: !!sendButton,
        //     messagesList: !!messagesList
        // });

        // Function to send message
        function sendMessage(e) {
            if (e) e.preventDefault();
            
            const message = messageInput.value.trim();
            
            if (message) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message outgoing';
                messageDiv.innerHTML = `
                    <div class="message-header">
                        <div class="message-info">
                            <h3>You</h3>
                            <span class="message-time">Just now</span>
                        </div>
                    </div>
                    <div class="message-content">${message}</div>
                `;
                
                messagesList.appendChild(messageDiv);
                messageInput.value = '';
                messageInput.style.height = 'auto';
                messagesList.scrollTop = messagesList.scrollHeight;
            }
        }

        // Event listeners
        if (messageForm) {
            messageForm.onsubmit = function(e) {
                e.preventDefault();
                sendMessage(e);
                return false;
            };
        }

        if (sendButton) {
            sendButton.onclick = function(e) {
                e.preventDefault();
                sendMessage(e);
            };
        }

        if (messageInput) {
            messageInput.onkeydown = function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                }
            };

            // Auto-resize textarea
            messageInput.oninput = function() {
                messageInput.style.height = 'auto';
                messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
            };
        }
    }

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
        const activeJourney = document.querySelector('.journey.active');
        if (!activeJourney) return;

        const messagesList = activeJourney.querySelector('.messages-list');
        if (!messagesList) return;

        const existingMessages = messagesList.querySelectorAll('.message').length;
        const savedMessages = localStorage.getItem('sinusitis_messages');
        const savedStatus = localStorage.getItem('sinusitis_status');
        
        if (savedMessages && existingMessages === 0) {
            const lastNurseMessage = messagesList.querySelector('.message:last-of-type');
            if (lastNurseMessage) {
                lastNurseMessage.insertAdjacentHTML('afterend', savedMessages);
                messagesList.scrollTop = messagesList.scrollHeight;
            }
        }

        if (savedStatus) {
            updateJourneyStatus(savedStatus, false);
        }
    };

    // Save messages to localStorage
    const saveMessages = () => {
        const activeJourney = document.querySelector('.journey.active');
        if (!activeJourney) return;

        const messagesList = activeJourney.querySelector('.messages-list');
        if (!messagesList) return;

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
            
            messagesList.scrollTop = messagesList.scrollHeight;
        });
    });

    // Load saved state when page loads
    loadSavedState();

    initializeJourneyStatuses();

    // Load habit tracker
    const habitTrackerContainer = document.getElementById('habit-tracker-container');
    if (habitTrackerContainer) {
        fetch('habit.html')
            .then(response => response.text())
            .then(html => {
                habitTrackerContainer.innerHTML = html;
                // Initialize the habit tracker
                const tracker = new HabitTracker();
            })
            .catch(error => {});
    }

    // Add event listeners for response options in sinusitis journey
    document.querySelectorAll('#sinusitis-journey .response-option').forEach(button => {
        button.addEventListener('click', function() {
            const response = this.dataset.response;
            const messagesList = this.closest('.messages-list');
            const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Add user's response first
            const userMessage = `
                <div class="message outgoing">
                    <div class="message-header">
                        <div class="message-info">
                            <h3>You</h3>
                            <span class="message-time">${currentTime}</span>
                        </div>
                    </div>
                    <div class="message-content">${this.textContent.trim()}</div>
                </div>
            `;
            messagesList.insertAdjacentHTML('beforeend', userMessage);
            
            // Disable all response options after selection
            const responseOptions = this.closest('.response-options');
            responseOptions.style.pointerEvents = 'none';
            responseOptions.style.opacity = '0.5';
            responseOptions.classList.add('disabled');
            
            let nurseResponse;
            
            if (response === 'better') {
                // Update journey status to resolved
                document.querySelector('#sinusitis-journey .status-indicator').textContent = 'Resolved';
                document.querySelector('#sinusitis-journey .status-indicator').classList.remove('active');
                document.querySelector('#sinusitis-journey .status-indicator').classList.add('resolved');
                
                nurseResponse = `
                    <div class="message">
                        <div class="message-header">
                            <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=60" alt="Nurse Wilson" class="avatar">
                            <div class="message-info">
                                <h3>Nurse Wilson</h3>
                                <span class="message-time">${currentTime}</span>
                            </div>
                        </div>
                        <div class="message-content">
                            That's great news! I'm so glad you're feeling better. I'll go ahead and close this episode. Remember, if you experience similar symptoms in the future, don't hesitate to reach out to us.
                        </div>
                    </div>`;
                
                // Mark journey as complete
                markJourneyAsComplete('sinusitis');
                
            } else if (response === 'same') {
                nurseResponse = `
                    <div class="message">
                        <div class="message-header">
                            <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=60" alt="Nurse Wilson" class="avatar">
                            <div class="message-info">
                                <h3>Nurse Wilson</h3>
                                <span class="message-time">${currentTime}</span>
                            </div>
                        </div>
                        <div class="message-content">
                            I see you're not experiencing improvement yet. Have you been able to follow the recommended treatment plan, including taking the full course of antibiotics and using the nasal spray as prescribed?
                        </div>
                    </div>`;
            } else if (response === 'worse') {
                nurseResponse = `
                    <div class="message">
                        <div class="message-header">
                            <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=60" alt="Nurse Wilson" class="avatar">
                            <div class="message-info">
                                <h3>Nurse Wilson</h3>
                                <span class="message-time">${currentTime}</span>
                            </div>
                        </div>
                        <div class="message-content">
                            I'm sorry to hear you're feeling worse. Given your symptoms are not improving, I recommend scheduling a follow-up appointment with Dr. Tremblay to reassess your treatment plan.
                            <div class="message-actions">
                                <button onclick="window.location.href='appointments.html'" class="action-button">
                                    <i class="fas fa-calendar-plus"></i>
                                    Book Follow-up Appointment
                                </button>
                            </div>
                        </div>
                    </div>`;
            }

            setTimeout(() => {
                messagesList.insertAdjacentHTML('beforeend', nurseResponse);
                messagesList.scrollTop = messagesList.scrollHeight;
            }, 1000); // Add a small delay to make it feel more natural
        });
    });
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

// Update the back button handler with logging
// function handleBackButton(e) {
//     e.preventDefault();
//     console.log('Back button clicked');
    
//     // Store sinusitis as the journey type to show
//     localStorage.setItem('lastJourneyType', 'sinusitis');
    
//     // Navigate to index.html
//     window.location.href = 'index.html';
// }

// // Add event listener for back buttons
// document.addEventListener('DOMContentLoaded', () => {
//     const backButtons = document.querySelectorAll('.back-button');
//     console.log('Found back buttons:', backButtons.length);
    
//     backButtons.forEach(button => {
//         button.addEventListener('click', handleBackButton);
//     });
// });



// Add these new functions
function markJourneyAsComplete(journeyType) {
    console.log('Marking journey as complete:', journeyType);
    
    // Store the resolved status
    const resolvedConditions = JSON.parse(sessionStorage.getItem('resolvedConditions') || '[]');
    if (!resolvedConditions.includes(journeyType)) {
        resolvedConditions.push(journeyType);
        sessionStorage.setItem('resolvedConditions', JSON.stringify(resolvedConditions));
    }

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

        // Hide message input container
        const messageInputContainer = journeySection.querySelector('.message-input-container');
        if (messageInputContainer) {
            messageInputContainer.style.display = 'none';
        }

        // Disable all interactive elements in messages
        const messagesList = journeySection.querySelector('.messages-list');
        if (messagesList) {
            // Disable response options
            const responseOptions = messagesList.querySelectorAll('.response-options');
            responseOptions.forEach(options => {
                options.style.pointerEvents = 'none';
                options.style.opacity = '0.5';
                options.classList.add('disabled');
            });

            // Disable any other interactive elements
            const interactiveElements = messagesList.querySelectorAll('button, .message-link, .action-button');
            interactiveElements.forEach(element => {
                element.style.pointerEvents = 'none';
                element.style.opacity = '0.5';
                if (element.tagName === 'BUTTON') {
                    element.disabled = true;
                }
            });

            // Add resolved message
            const resolvedMessage = `
                <div class="message system">
                    <div class="message-content">
                        This care journey has been marked as resolved. The chat is now closed.
                    </div>
                </div>
            `;
            messagesList.insertAdjacentHTML('beforeend', resolvedMessage);
            messagesList.scrollTop = messagesList.scrollHeight;
        }

        // Update the complete button to become a reopen button
        const completeButton = journeySection.querySelector('.complete-journey-button');
        if (completeButton) {
            completeButton.innerHTML = '<i class="fas fa-refresh"></i> Reopen Journey';
            completeButton.classList.add('reopen-button');
            completeButton.onclick = () => reopenJourney(journeyType);
        }
    }

    // Move the card to past care plans
    moveCardToPastCarePlans(journeyType);
}

function reopenJourney(journeyType) {
    console.log('Reopening journey:', journeyType);
    
    // Remove from resolved conditions in sessionStorage
    const resolvedConditions = JSON.parse(sessionStorage.getItem('resolvedConditions') || '[]');
    const index = resolvedConditions.indexOf(journeyType);
    if (index > -1) {
        resolvedConditions.splice(index, 1);
        sessionStorage.setItem('resolvedConditions', JSON.stringify(resolvedConditions));
    }

    // Update journey page
    const journeySection = document.getElementById(`${journeyType}-journey`);
    if (journeySection) {
        // Remove resolved status
        journeySection.removeAttribute('data-status');
        
        // Update status indicator
        const statusIndicator = journeySection.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.textContent = 'Active';
            statusIndicator.classList.remove('resolved');
            statusIndicator.classList.add('active');
        }

        // Show and reset message input container
        const messageInputContainer = journeySection.querySelector('.message-input-container');
        if (messageInputContainer) {
            messageInputContainer.style.display = '';
        }

        // Re-enable all interactive elements in messages
        const messagesList = journeySection.querySelector('.messages-list');
        if (messagesList) {
            // Re-enable response options
            const responseOptions = messagesList.querySelectorAll('.response-options');
            responseOptions.forEach(options => {
                options.style = '';
                options.classList.remove('disabled');
            });

            // Re-enable other interactive elements
            const interactiveElements = messagesList.querySelectorAll('button, .message-link, .action-button');
            interactiveElements.forEach(element => {
                element.style = '';
                if (element.tagName === 'BUTTON') {
                    element.disabled = false;
                }
            });

            // Remove the system message about resolution
            const systemMessage = messagesList.querySelector('.message.system');
            if (systemMessage) {
                systemMessage.remove();
            }
        }

        // Update the button back to "Mark as Completed"
        const reopenButton = journeySection.querySelector('.complete-journey-button');
        if (reopenButton) {
            reopenButton.innerHTML = '<i class="fas fa-check"></i> Mark as Completed';
            reopenButton.classList.remove('reopen-button');
            reopenButton.onclick = () => markJourneyAsComplete(journeyType);
        }
    }
}

// Make sure the function is available globally
window.markJourneyAsComplete = markJourneyAsComplete;

function initializeJourneyStatuses() {
    const resolvedConditions = JSON.parse(sessionStorage.getItem('resolvedConditions') || '[]');
    
    // Update journey pages
    ['sinusitis', 'anxiety', 'rash', 'migraines'].forEach(journeyType => {
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
                
                // Update complete button to reopen button
                const completeButton = journeySection.querySelector('.complete-journey-button');
                if (completeButton) {
                    completeButton.innerHTML = '<i class="fas fa-refresh"></i> Reopen Journey';
                    completeButton.classList.add('reopen-button');
                    completeButton.onclick = () => reopenJourney(journeyType);
                }

                // Hide message input and disable interactive elements
                const messageInputContainer = journeySection.querySelector('.message-input-container');
                if (messageInputContainer) {
                    messageInputContainer.style.display = 'none';
                }

                // Disable all interactive elements in messages
                const messagesList = journeySection.querySelector('.messages-list');
                if (messagesList) {
                    const responseOptions = messagesList.querySelectorAll('.response-options');
                    responseOptions.forEach(options => {
                        options.style.pointerEvents = 'none';
                        options.style.opacity = '0.5';
                        options.classList.add('disabled');
                    });

                    const interactiveElements = messagesList.querySelectorAll('button, .message-link, .action-button');
                    interactiveElements.forEach(element => {
                        element.style.pointerEvents = 'none';
                        element.style.opacity = '0.5';
                        if (element.tagName === 'BUTTON') {
                            element.disabled = true;
                        }
                    });
                }
            }
        }
        
        // Add card status update
        const journeyCard = document.querySelector(`.care-journey-card[data-journey-type="${journeyType}"]`);
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

function moveCardToPastCarePlans(journeyType) {
    // Find both sections in the parent mycare page
    const mycareContent = window.parent.document.querySelector('#mycare-content');
    if (!mycareContent) {
        console.log('Mycare content not found');
        return;
    }

    const activeSection = mycareContent.querySelector('.care-section:not(.past-care-plans)');
    const pastSection = mycareContent.querySelector('.care-section.past-care-plans');
    
    if (!activeSection || !pastSection) {
        console.log('Required sections not found');
        return;
    }

    // Find the card in the active section
    const card = activeSection.querySelector(`.care-journey-card[data-journey-type="${journeyType}"]`);
    if (!card) {
        console.log('Card not found');
        return;
    }

    // Update card status
    card.setAttribute('data-status', 'resolved');
    const statusBadge = card.querySelector('.status-badge');
    if (statusBadge) {
        statusBadge.textContent = 'Resolved';
        statusBadge.classList.remove('active');
        statusBadge.classList.add('resolved');
    }

    // Find the cards container in the past section
    const pastCardsContainer = pastSection.querySelector('.care-cards');
    if (pastCardsContainer) {
        // Clone the card and move it to past care plans
        const cardClone = card.cloneNode(true);
        pastCardsContainer.appendChild(cardClone);
        // Remove the original card
        card.remove();
    }
}

function updateJourneyStatus(status, saveToStorage = true) {
    const activeJourney = document.querySelector('.journey.active');
    if (!activeJourney) return;

    const statusIndicator = activeJourney.querySelector('.status-indicator');
    if (statusIndicator) {
        statusIndicator.textContent = status;
        statusIndicator.className = `status-indicator ${status.toLowerCase()}`;
    }

    if (saveToStorage) {
        localStorage.setItem('sinusitis_status', status);
    }
}
