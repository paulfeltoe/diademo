let currentStep = 1;
const totalSteps = 6;
let recognition = null;
let selectedCondition = null;

function updateProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressBar && progressText) {
        const progress = (currentStep / totalSteps) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `Step ${currentStep} of ${totalSteps}`;
    }
}

function showStep(step) {
    document.querySelectorAll('.step').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelector(`.step[data-step="${step}"]`).style.display = 'block';
}

function nextStep() {
    const currentStepElement = document.querySelector('.step[style*="display: block"]') || 
                              document.querySelector('.step[style*="display: flex"]');
    if (!currentStepElement) return;

    const nextStepNumber = parseInt(currentStepElement.dataset.step) + 1;
    
    // Hide current step
    currentStepElement.style.display = 'none';
    
    // Show next step
    const nextStepElement = document.querySelector(`.step[data-step="${nextStepNumber}"]`);
    if (nextStepElement) {
        nextStepElement.style.display = 'block';
        currentStep = nextStepNumber; // Update current step
        updateProgress();
    }
    
    // Enable/disable back button
    updateBackButton(nextStepNumber);
}

function handleFunnelComplete() {
    // Save state to localStorage first
    localStorage.setItem('hasCarePlan', 'true');
    
    // Close the bottom sheet
    closeBottomSheet();
    
    // Wait for bottom sheet animation to complete, then update states
    setTimeout(() => {
        const emptyState = document.getElementById('emptyState');
        const filledState = document.getElementById('filledState');
        
        if (emptyState && filledState) {
            emptyState.style.display = 'none';
            filledState.style.display = 'block';
        } else {
            // If elements aren't found, trigger a check on the main page
            checkCarePlanState();
        }
    }, 300); // Match this with your bottom sheet close animation duration
}

function previousStep() {
    const currentStepElement = document.querySelector('.step[style*="display: block"]') || 
                              document.querySelector('.step[style*="display: flex"]');
    if (!currentStepElement) return;

    const prevStepNumber = parseInt(currentStepElement.dataset.step) - 1;
    
    // Hide current step
    currentStepElement.style.display = 'none';
    
    // Show previous step
    const prevStepElement = document.querySelector(`.step[data-step="${prevStepNumber}"]`);
    if (prevStepElement) {
        prevStepElement.style.display = 'block';
        currentStep = prevStepNumber; // Update current step
        updateProgress();
    }
    
    // Enable/disable back button
    updateBackButton(prevStepNumber);
}

function togglePill(pillElement) {
    pillElement.classList.toggle('active');
    validateStep1();
}

function validateStep1() {
    const searchInput = document.querySelector('.search-input').value;
    const activePills = document.querySelectorAll('.pill.active');
    const continueButton = document.querySelector('.button-container button');
    
    // Enable button if either search has text or any pill is selected
    continueButton.disabled = !(searchInput.trim().length > 0 || activePills.length > 0);
}

function handleInput(textarea) {
    const maxLength = 500;
    const currentLength = textarea.value.length;
    
    // Update character count
    const charCountDiv = textarea.parentElement.querySelector('.char-count');
    charCountDiv.textContent = `${currentLength}/${maxLength} characters`;
    
    // Truncate if over max length
    if (currentLength > maxLength) {
        textarea.value = textarea.value.substring(0, maxLength);
    }
    
    // Enable/disable continue button based on input
    validateStep1();
}

function toggleEdit(button) {
    const infoItem = button.closest('.info-item');
    const value = infoItem.querySelector('.value');
    const input = infoItem.querySelector('.edit-input');
    const notice = infoItem.querySelector('.edit-notice');
    
    if (input.style.display === 'none') {
        // Switching to edit mode
        value.style.display = 'none';
        input.style.display = 'block';
        notice.style.display = 'block';
        button.textContent = 'Save';
        input.focus();
    } else {
        // Saving changes
        value.textContent = input.value;
        value.style.display = 'block';
        input.style.display = 'none';
        notice.style.display = 'none';
        button.textContent = 'Edit';
    }
}

// Export the function to be called from main.js
window.initializeFunnel = function() {
    currentStep = 1;
    selectedCondition = null; // Reset selected condition
    showStep(currentStep);
    updateProgress();
    initializeConditionButtons();
}

function initializeAppointmentSelector() {
    // Day selection
    const dayItems = document.querySelectorAll('.day-item');
    dayItems.forEach(day => {
        day.addEventListener('click', () => {
            dayItems.forEach(d => d.classList.remove('active'));
            day.classList.add('active');
            loadTimeSlots(day.dataset.date);
        });
    });

    // Week navigation
    const prevWeekBtn = document.querySelector('.week-nav.prev');
    const nextWeekBtn = document.querySelector('.week-nav.next');
    
    prevWeekBtn?.addEventListener('click', () => navigateWeek('prev'));
    nextWeekBtn?.addEventListener('click', () => navigateWeek('next'));

    initializeTimeSlotHandlers();
}

function updateTimeSlots(slots) {
    // Update morning slots
    updateSlotGroup('Morning', slots.morning);
    // Update afternoon slots
    updateSlotGroup('Afternoon', slots.afternoon);
    // Update evening slots
    updateSlotGroup('Evening', slots.evening);
    
    // After updating all slots, initialize the click handlers
    initializeTimeSlotHandlers();
}

function updateSlotGroup(groupName, slots) {
    const group = document.querySelector(`.time-slot-group:has(h3:contains('${groupName}')) .slots-grid`);
    if (!group) return;

    let html = '';
    slots.forEach(slot => {
        html += `
            <button class="time-slot ${slot.available ? '' : 'disabled'}" 
                    ${slot.available ? '' : 'disabled'}>
                ${slot.time}
            </button>
        `;
    });
    
    group.innerHTML = html;
}

function initializeTimeSlotHandlers() {
    const timeSlots = document.querySelectorAll('.time-slot:not([disabled])');
    timeSlots.forEach(slot => {
        slot.onclick = function() {
            document.querySelectorAll('.time-slot').forEach(s => {
                s.classList.remove('selected');
            });
            
            this.classList.add('selected');
            
            const selectedTime = this.textContent.trim();
            const selectedDate = document.querySelector('.day-item.active')?.dataset.date;
            console.log(`Selected appointment: ${selectedDate} at ${selectedTime}`);
            
            nextStep();
        };
    });
}

function navigateWeek(direction) {
    // This would typically update the dates shown in the week selector
    console.log(`Navigating ${direction}`);
    // In a real implementation, you would:
    // 1. Calculate the new dates
    // 2. Update the day-items with new dates
    // 3. Load slots for the first day of the new week
}

function enableContinueButton() {
    const continueButton = document.querySelector('.button-container button');
    if (continueButton) {
        continueButton.disabled = false;
    }
}

function updateBackButton(stepNumber) {
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.disabled = stepNumber <= 1;
    }
}

// Time slot data handling
function loadTimeSlots(date) {
    const mockTimeSlots = {
        morning: [
            { time: '9:00 AM', available: true },
            { time: '9:30 AM', available: true },
            { time: '10:00 AM', available: false },
            { time: '10:30 AM', available: true },
            { time: '11:00 AM', available: true },
            { time: '11:30 AM', available: true }
        ],
        afternoon: [
            { time: '1:00 PM', available: true },
            { time: '1:30 PM', available: false },
            { time: '2:00 PM', available: true },
            { time: '2:30 PM', available: true },
            { time: '3:00 PM', available: true },
            { time: '3:30 PM', available: false }
        ],
        evening: [
            { time: '4:00 PM', available: true },
            { time: '4:30 PM', available: true },
            { time: '5:00 PM', available: true },
            { time: '5:30 PM', available: false }
        ]
    };

    updateTimeSlots(mockTimeSlots);
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeAppointmentSelector();
});

// Helper function to fix :contains selector
Element.prototype.contains = function(text) {
    return this.textContent.includes(text);
};

function initializeConditionButtons() {
    const conditionButtons = document.querySelectorAll('.condition-btn');
    conditionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            conditionButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            // Store selected condition
            selectedCondition = button.dataset.condition;
            // Enable next step
            enableContinueButton();
            nextStep();
        });
    });
}