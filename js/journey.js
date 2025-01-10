document.addEventListener('DOMContentLoaded', () => {
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
