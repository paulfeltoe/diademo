document.addEventListener('DOMContentLoaded', () => {
    const confirmationSection = document.querySelector('.confirmation-section');
    const waitingRoomSection = document.querySelector('.waiting-room-section');
    
    // Confirmation Timer
    let confirmationTimeLeft = 3 * 60; // 3 minutes in seconds
    const confirmMinutesElement = document.querySelector('.confirmation-section .minutes');
    const confirmSecondsElement = document.querySelector('.confirmation-section .seconds');
    const timerProgress = document.querySelector('.timer-progress');
    const circumference = 283; // 2 * π * 45 (circle radius)

    function updateConfirmationTimer() {
        const minutes = Math.floor(confirmationTimeLeft / 60);
        const seconds = confirmationTimeLeft % 60;
        
        confirmMinutesElement.textContent = minutes;
        confirmSecondsElement.textContent = seconds.toString().padStart(2, '0');
        
        // Update progress circle
        const progress = (confirmationTimeLeft / (3 * 60)) * circumference;
        timerProgress.style.strokeDashoffset = circumference - progress;
        
        if (confirmationTimeLeft > 0) {
            confirmationTimeLeft--;
        } else {
            clearInterval(confirmationInterval);
            // Redirect or show expired message
            window.location.href = 'expired.html';
        }
    }

    const confirmationInterval = setInterval(updateConfirmationTimer, 1000);
    updateConfirmationTimer();

    // Waiting Room Timer
    let appointmentTimeLeft = 0.1 * 60; // 10 minutes in seconds
    const waitingMinutesElement = document.querySelector('.waiting-room-section .minutes');
    const waitingSecondsElement = document.querySelector('.waiting-room-section .seconds');
    let waitingRoomInterval;

    function updateWaitingRoomTimer() {
        const minutes = Math.floor(appointmentTimeLeft / 60);
        const seconds = appointmentTimeLeft % 60;
        
        waitingMinutesElement.textContent = minutes.toString().padStart(2, '0');
        waitingSecondsElement.textContent = seconds.toString().padStart(2, '0');
        
        // Show notification banner at 30 seconds
        if (appointmentTimeLeft === 30) {
            const banner = document.querySelector('.notification-banner');
            banner.style.display = 'flex';
        }
        
        if (appointmentTimeLeft > 0) {
            appointmentTimeLeft--;
        } else {
            clearInterval(waitingRoomInterval);
            // Show join call button and hide timer elements
            const timeDisplay = document.querySelector('.time-display');
            const joinButton = document.querySelector('.join-call-button');
            const appointmentStartsText = document.querySelector('.appointment-starts-text');
            
            timeDisplay.style.display = 'none';
            joinButton.style.display = 'flex';
            appointmentStartsText.style.display = 'none';
            
            // Update href to call.html
            joinButton.addEventListener('click', () => {
                window.location.href = 'call.html';
            });
        }
    }

    // Button handlers
    window.acceptAppointment = () => {
        clearInterval(confirmationInterval);
        confirmationSection.style.display = 'none';
        waitingRoomSection.style.display = 'block';
        
        // Start waiting room timer
        updateWaitingRoomTimer();
        waitingRoomInterval = setInterval(updateWaitingRoomTimer, 1000);
        
        // Initialize accordion
        initializeAccordion();
    };

    window.declineAppointment = () => {
        clearInterval(confirmationInterval);
        window.history.back();
    };

    // Accordion functionality
    function initializeAccordion() {
        const accordionItems = document.querySelectorAll('.accordion-item');
        
        accordionItems.forEach(item => {
            const header = item.querySelector('.accordion-header');
            
            header.addEventListener('click', () => {
                // Close other open items
                accordionItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle current item
                item.classList.toggle('active');
            });
        });
    }

    // Save button handlers
    const saveButtons = document.querySelectorAll('.save-button');
    saveButtons.forEach(button => {
        button.addEventListener('click', () => {
            const originalText = button.textContent;
            button.textContent = 'Saving...';
            button.disabled = true;
            
            setTimeout(() => {
                button.textContent = 'Saved!';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 1000);
            }, 1000);
        });
    });

    // Test button handlers with success state
    const testButtons = document.querySelectorAll('.test-button');
    testButtons.forEach(button => {
        let isSuccess = false; // Track success state

        button.addEventListener('click', () => {
            if (isSuccess) return; // Don't run test if already successful

            const originalText = button.textContent;
            button.textContent = 'Testing...';
            button.disabled = true;
            
            setTimeout(() => {
                isSuccess = true;
                button.textContent = 'Test Complete ✓';
                button.classList.add('success');
                button.disabled = false;

                // Update button style for success state
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM7 11.4L3.6 8L5 6.6L7 8.6L11 4.6L12.4 6L7 11.4Z" fill="currentColor"/>
                    </svg>
                    Test Successful
                `;
            }, 2000);
        });
    });

    // When showing the join call button
    function showJoinCallButton() {
        const joinCallButton = document.querySelector('.join-call-button');
        const appointmentStartsText = document.querySelector('.appointment-starts-text');
        
        if (joinCallButton && appointmentStartsText) {
            joinCallButton.style.display = 'flex';  // or 'block' depending on your styling
            appointmentStartsText.style.display = 'none';
        }
    }
}); 