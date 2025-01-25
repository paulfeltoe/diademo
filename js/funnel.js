import { patientFields } from '../config/patientFields.js';
import { OPENAI_API_KEY } from './build.js';

let currentStep = 1;
const totalSteps = 8;
let recognition = null;
let selectedCondition = null;
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Replace with your actual API key
// console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);
let extractedTags = new Map(); // Using Map to store tag data: { text: { source: 'extracted'|'selected' } }
let suggestedTags = new Set();
let selectedAppointmentDateTime = null;

function updateProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressBar && progressText) {
        const progress = (currentStep / totalSteps) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `Step ${currentStep} of ${totalSteps}`;
    }
}

function showStep(stepId) {
    // Hide all steps
    document.querySelectorAll('.step').forEach(step => {
        step.style.display = 'none';
    });
    
    // Show the target step
    const targetStep = document.querySelector(`.step[data-step="${stepId}"]`);
    if (targetStep) {
        targetStep.style.display = 'block';
    }
    
    // Update back button state
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.disabled = stepId === '1';
    }
}

function nextStep() {
    const currentStepElement = document.querySelector('.step[style*="display: block"]') || 
                              document.querySelector('.step[style*="display: flex"]');
    if (!currentStepElement) return;

    // Add special handling for outreferral condition
    if (selectedCondition === "outreferral") {
        // Hide current step
        currentStepElement.style.display = 'none';
        
        // Show outreferral step
        const outreferralStep = document.querySelector('.step-outreferral');
        if (outreferralStep) {
            outreferralStep.style.display = 'block';
            return; // Exit early as this is a terminal state
        }
    }

    const nextStepNumber = parseInt(currentStepElement.dataset.step) + 1;
    
    // Hide current step
    currentStepElement.style.display = 'none';
    
    // Show next step or complete funnel
    if (nextStepNumber > totalSteps) {
        handleFunnelComplete();
    } else {
        const nextStepElement = document.querySelector(`.step[data-step="${nextStepNumber}"]`);
        if (nextStepElement) {
            nextStepElement.style.display = 'block';
            currentStep = nextStepNumber;
            updateProgress();
            
            // Initialize step 6 if we're moving to it
            if (nextStepNumber === 6) {
                // console.log('Moving to step 6, initializing display');
                updateDaysDisplay();
            }
        }
    }
    
    // Enable/disable back button
    updateBackButton(nextStepNumber);
}

function handleFunnelComplete() {
    // Save state and selected condition to localStorage
    localStorage.setItem('hasCarePlan', 'true');
    localStorage.setItem('selectedCondition', selectedCondition);
    
    // Close the bottom sheet
    closeBottomSheet();
    
    // Wait for bottom sheet animation to complete, then redirect
    setTimeout(() => {
        // Redirect to mycare.html
        window.location.href = 'mycare.html';
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
    const currentLength = textarea.value.trim().length; // Add trim() to handle whitespace
    const suggestedTagsContainer = document.getElementById('suggestedTags');
    const extractedTagsContainer = document.getElementById('extractedTags');
    
    // Update character count
    const charCountDiv = textarea.parentElement.querySelector('.char-count');
    charCountDiv.textContent = `${currentLength}/${maxLength} characters`;
    
    // Truncate if over max length
    if (currentLength > maxLength) {
        textarea.value = textarea.value.substring(0, maxLength);
    }
    
    // Clear all tags if input is empty
    if (currentLength === 0) {
        // Clear all tags immediately
        extractedTags.clear();
        suggestedTags.clear();
        updateTags(); // Force UI update
        
        // Hide suggested tags container
        if (suggestedTagsContainer) {
            suggestedTagsContainer.style.display = 'none';
            suggestedTagsContainer.querySelector('.tags-wrapper').innerHTML = '';
        }
        
        // Clear extracted tags container
        if (extractedTagsContainer) {
            extractedTagsContainer.innerHTML = '';
        }
        
        // Reset selected condition and store the update
        selectedCondition = null;
        localStorage.setItem('selectedCondition', null);
        
        // Reset condition buttons if they exist
        const conditionButtons = document.querySelectorAll('.condition-btn');
        conditionButtons.forEach(btn => btn.classList.remove('active'));
        
        // Disable continue button when input is empty
        const continueButton = document.querySelector('.step[data-step="1"] .button-container button');
        if (continueButton) {
            continueButton.disabled = true;
        }

        // console.log('Input cleared - Tags and condition reset');
        return; // Exit early after clearing
    }
    
    // Only continue with analysis if we have enough text
    if (currentLength >= 15) {
        // Show loading state for both containers
        extractedTagsContainer.innerHTML = '<div class="tags-loading"><div class="loading-spinner"></div>Analyzing symptoms...</div>';
        suggestedTagsContainer.style.display = 'block';
        suggestedTagsContainer.querySelector('.tags-wrapper').innerHTML = 
            '<div class="tags-loading"><div class="loading-spinner"></div>Finding related symptoms...</div>';
        
        // Call the debounced symptom analysis
        debouncedAnalyzeSymptoms(textarea);
    }
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

function initializeFunnel() {
    currentStep = 1;
    selectedCondition = null;
    extractedTags.clear();
    suggestedTags.clear();
    
    const symptomsInput = document.getElementById('symptomsInput');
    const suggestedTagsContainer = document.getElementById('suggestedTags');
    
    if (symptomsInput) {
        symptomsInput.value = '';
        symptomsInput.addEventListener('input', (e) => handleInput(e.target));
        if (suggestedTagsContainer) {
            suggestedTagsContainer.style.display = 'none';
        }
    }
    
    showStep(currentStep);
    updateProgress();
    initializeConditionButtons();
    handleCheckboxSelection();
    handleOptionSelection();
    initializeAppointmentSelector();
    
    // Add this line to populate patient info when funnel initializes
    populatePatientInfo();
}

function initializeAppointmentSelector() {
    // console.log('Initializing appointment selector');
    
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
    // console.log('Initializing time slot handlers');
    const timeSlots = document.querySelectorAll('.time-slot:not([disabled])');
    timeSlots.forEach(slot => {
        // console.log('Adding click handler to time slot:', slot.textContent);
        slot.onclick = function() {
            // console.log('Time slot clicked:', this.textContent.trim());
            handleTimeSlotSelection(this.textContent.trim());
        };
    });
}

function navigateWeek(direction) {
    const firstDate = new Date(document.querySelector('.day-item')?.dataset.date || new Date());
    if (direction === 'prev') {
        firstDate.setDate(firstDate.getDate() - 5);
    } else {
        firstDate.setDate(firstDate.getDate() + 5);
    }
    updateDaysDisplay(firstDate);
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

async function analyzeSymptoms(text) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a medical condition analyzer. Analyze the text and determine if it's related to sinus conditions, migraines, anxiety, or rash conditions.
                        Rules:
                        - Return "sinusitis" if the symptoms match sinus-related conditions
                        - Return "outreferral" if the symptoms match migraine-related conditions
                        - Return "anxiety" if the symptoms match anxiety-related conditions (e.g., panic attacks, excessive worry, restlessness)
                        - Return "rash" if the symptoms match skin-related conditions (e.g., itching, skin irritation, hives)
                        - Return "unknown" if none of these conditions match
                        - Only return one of these values, no other text`
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0.3
            })
        });

        const data = await response.json();
        const condition = data.choices[0].message.content.toLowerCase().trim();
        
        // console.log('OpenAI analyzed condition:', condition);
        
        // Update selectedCondition based on the analysis
        if (['sinusitis', 'outreferral', 'anxiety', 'rash', 'migraines'].includes(condition)) {
            selectedCondition = condition;
            // Persist the selected condition
            localStorage.setItem('selectedCondition', condition);
            
            console.log('Selected condition updated and stored:', selectedCondition);
            
            // Update UI to show selected condition
            const conditionButtons = document.querySelectorAll('.condition-btn');
            conditionButtons.forEach(button => {
                if (button.dataset.condition === condition) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
            
            // Enable continue button
            enableContinueButton();
        }

        return condition;
    } catch (error) {
        console.error('Error analyzing symptoms:', error);
        return null;
    }
}

async function extractSymptoms(text) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a medical symptom analyzer. Extract valid medical symptoms from the text and return them as a JSON array.
                        Rules:
                        - Include both physical and mental health symptoms
                        - For mental health, recognize symptoms like anxiety, depression, panic, worry, stress
                        - Where possible, combine related symptoms into a single term
                        - Try to be as close to the user's input as possible
                        - Return maximum 5 most relevant symptoms
                        - Only return the JSON array, no other text
                        Example physical: ["headache", "nausea", "fatigue"]
                        Example mental: ["excessive worry", "panic attacks", "restlessness"]`
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0.3
            })
        });

        const data = await response.json();
        const symptoms = JSON.parse(data.choices[0].message.content);
        return validateSymptoms(symptoms);
    } catch (error) {
        // console.error('Error extracting symptoms:', error);
        return [];
    }
}

async function getRelatedSymptoms(symptoms) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a medical symptom analyzer. Given a list of symptoms, suggest related symptoms that commonly occur together based on medical knowledge.
                        Rules:
                        - Always return exactly 5 related symptoms
                        - Include both physical and mental health symptoms when relevant
                        - For anxiety/mental health symptoms, suggest related psychological and physical manifestations
                        - Only suggest medically recognized symptoms
                        - Use standard medical terminology
                        - Consider common symptom clusters and medical conditions
                        - Ensure suggestions are different from the input symptoms
                        - Return only a JSON array of related symptoms, no other text
                        Example physical input: ["headache", "nausea"]
                        Example physical output: ["sensitivity to light", "dizziness", "vomiting", "neck stiffness", "fatigue"]
                        Example mental input: ["excessive worry", "restlessness"]
                        Example mental output: ["difficulty sleeping", "racing thoughts", "muscle tension", "irritability", "difficulty concentrating"]`
                    },
                    {
                        role: "user",
                        content: JSON.stringify(Array.from(symptoms))
                    }
                ],
                temperature: 0.3
            })
        });

        const data = await response.json();
        const relatedSymptoms = JSON.parse(data.choices[0].message.content);
        const validatedSymptoms = validateSymptoms(relatedSymptoms);
        
        // If we don't have enough validated symptoms, get more
        if (validatedSymptoms.length < 3) {
            const backupSymptoms = [
                "fatigue",
                "headache",
                "dizziness",
                "anxiety",
                "difficulty sleeping",
                "restlessness",
                "muscle tension",
                "racing thoughts"
            ];
            
            // Add backup symptoms until we have at least 3
            let i = 0;
            while (validatedSymptoms.length < 3 && i < backupSymptoms.length) {
                const backupSymptom = backupSymptoms[i];
                if (!symptoms.has(backupSymptom) && !validatedSymptoms.includes(backupSymptom)) {
                    validatedSymptoms.push(backupSymptom);
                }
                i++;
            }
        }
        
        return validatedSymptoms;
    } catch (error) {
        // console.error('Error getting related symptoms:', error);
        return ["anxiety", "restlessness", "fatigue"];
    }
}

// Update validation function to include mental health terms
function validateSymptoms(symptoms) {
    // Common medical symptom keywords including mental health terms
    const commonSymptomPatterns = [
        // Physical symptoms
        'pain', 'ache', 'fever', 'cough', 'fatigue',
        'nausea', 'dizziness', 'weakness', 'swelling',
        'rash', 'numbness', 'stiffness', 'cramping',
        'burning', 'itching', 'pressure', 'congestion',
        'difficulty', 'shortness', 'loss of', 'chest',
        'headache', 'sore', 'runny', 'vomiting',
        // Mental health symptoms
        'anxiety', 'worry', 'panic', 'stress', 'depression',
        'mood', 'thinking', 'thought', 'sleep', 'concentration',
        'restless', 'irritable', 'tension', 'nervous',
        'racing', 'fear', 'phobia', 'social', 'mental'
    ];

    // Filter symptoms that contain at least one common medical term
    return symptoms.filter(symptom => {
        const lowerSymptom = symptom.toLowerCase();
        return commonSymptomPatterns.some(pattern => 
            lowerSymptom.includes(pattern) || 
            lowerSymptom.endsWith('ness') || 
            lowerSymptom.endsWith('ing')
        );
    });
}

// Update the debounce function to prevent too frequent API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Create a debounced version of the symptom analysis
const debouncedAnalyzeSymptoms = debounce(async (textarea) => {
    const text = textarea.value;
    const charCount = text.length;
    
    // Only analyze if we have enough meaningful text (at least 15 characters)
    if (charCount >= 15) {
        try {
            // Analyze condition first
            await analyzeSymptoms(text);
            
            // Extract symptoms from text
            const newSymptoms = await extractSymptoms(text);
            
            // Clear previous extracted tags (but keep selected ones) if text changed significantly
            if (text.length < textarea.lastLength / 2) {
                for (const [tag, data] of extractedTags) {
                    if (data.source === 'extracted') {
                        extractedTags.delete(tag);
                    }
                }
            }
            
            // Add new symptoms as extracted tags
            newSymptoms.forEach(symptom => {
                if (!extractedTags.has(symptom)) {
                    extractedTags.set(symptom, { source: 'extracted' });
                }
            });
            
            // Get related symptoms based on all current tags
            if (extractedTags.size > 0) {
                const allCurrentSymptoms = Array.from(extractedTags.keys());
                const relatedSymptoms = await getRelatedSymptoms(allCurrentSymptoms);
                
                // Filter out existing tags and ensure at least 3 suggestions
                suggestedTags = new Set(relatedSymptoms.filter(symptom => 
                    !extractedTags.has(symptom)
                ));
                
                // If we still don't have enough suggestions, add common backup symptoms
                if (suggestedTags.size < 3) {
                    const backupSymptoms = [
                        "fatigue",
                        "headache",
                        "dizziness",
                        "nausea",
                        "muscle aches",
                        "fever",
                        "cough",
                        "sore throat"
                    ];
                    
                    for (const symptom of backupSymptoms) {
                        if (!extractedTags.has(symptom) && !suggestedTags.has(symptom)) {
                            suggestedTags.add(symptom);
                            if (suggestedTags.size >= 3) break;
                        }
                    }
                }
            }
            
            // Update the UI
            updateTags();
        } catch (error) {
            // console.error('Error analyzing symptoms:', error);
            // Handle error state in UI
            const extractedTagsContainer = document.getElementById('extractedTags');
            const suggestedTagsContainer = document.getElementById('suggestedTags');
            
            extractedTagsContainer.innerHTML = '<div class="tags-loading error">Unable to analyze symptoms</div>';
            suggestedTagsContainer.querySelector('.tags-wrapper').innerHTML = 
                '<div class="tags-loading error">Unable to find related symptoms</div>';
        }
    }
    
    // Store the current length for future comparison
    textarea.lastLength = charCount;
}, 1000);

// Function to create a tag element
function createTag(text, isExtracted = true, source = 'extracted') {
    const tag = document.createElement('div');
    tag.className = `tag ${source}`;
    
    if (isExtracted) {
        tag.innerHTML = `
            ${text}
            <span class="remove" onclick="removeTag('${text}')">&times;</span>
        `;
    } else {
        tag.textContent = text;
        tag.onclick = () => addSuggestedTag(text);
    }
    
    return tag;
}

// Function to remove a tag
function removeTag(text) {
    extractedTags.delete(text);
    updateTags();
    // Reanalyze remaining tags for new suggestions
    debouncedAnalyzeSymptoms(document.getElementById('symptomsInput'));
}

// Add removeTag to window object
window.removeTag = removeTag;

// Function to add a suggested tag
function addSuggestedTag(text) {
    extractedTags.set(text, { source: 'selected' });
    suggestedTags.delete(text);
    updateTags();
    // Reanalyze with the newly selected tag
    debouncedAnalyzeSymptoms(document.getElementById('symptomsInput'));
}

// Function to update both tag containers
function updateTags() {
    const extractedTagsContainer = document.getElementById('extractedTags');
    const suggestedTagsContainer = document.getElementById('suggestedTags');
    const suggestedTagsWrapper = document.querySelector('.tags-wrapper');
    const continueButton = document.querySelector('.step[data-step="1"] .button-container button');
    
    // Update extracted tags
    extractedTagsContainer.innerHTML = '';
    extractedTags.forEach((data, text) => {
        extractedTagsContainer.appendChild(createTag(text, true, data.source));
    });
    
    // Update suggested tags and handle container visibility
    suggestedTagsWrapper.innerHTML = '';
    suggestedTags.forEach(tag => {
        if (!extractedTags.has(tag)) {
            suggestedTagsWrapper.appendChild(createTag(tag, false));
        }
    });

    // Only show the suggested tags container if we have suggestions to show
    if (suggestedTagsWrapper.children.length > 0) {
        suggestedTagsContainer.style.display = 'block';
    } else {
        suggestedTagsContainer.style.display = 'none';
    }

    // Enable/disable continue button based on whether we have any tags
    if (continueButton) {
        continueButton.disabled = extractedTags.size === 0;
    }
}

function initializeConditionButtons() {
    const conditionButtons = document.querySelectorAll('.condition-btn');
    conditionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            conditionButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Store the selected condition
            selectedCondition = button.dataset.condition;
            
            // Enable the continue button
            enableContinueButton();
        });
    });
}

function handleCheckboxSelection() {
    const checkboxes = document.querySelectorAll('.checkbox-option input[type="checkbox"]');
    const continueButton = document.querySelector('.step[data-step="4"] .button-container button');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Enable continue button if at least one checkbox is checked
            const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
            if (continueButton) {
                continueButton.disabled = !anyChecked;
            }
        });
    });
}

function handleOptionSelection() {
    const optionButtons = document.querySelectorAll('.option-btn');
    const continueButtons = document.querySelectorAll('.step .button-container button');
    
    optionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons in the same step
            const currentStep = button.closest('.step');
            currentStep.querySelectorAll('.option-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Enable continue button for this step
            const continueButton = currentStep.querySelector('.button-container button');
            if (continueButton) {
                continueButton.disabled = false;
            }
        });
    });
}

// Add this function to get current active conditions
function getCurrentActiveConditions() {
    // Get existing conditions from sessionStorage or default to empty array
    const existingConditions = JSON.parse(sessionStorage.getItem('shownConditions') || '[]');
    
    // Add the currently selected condition if it exists and isn't already included
    if (selectedCondition && !existingConditions.includes(selectedCondition)) {
        existingConditions.push(selectedCondition);
    }
    
    return existingConditions;
}



// Function to format date as "Mon 25"
function formatDayDisplay(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
        dayName: days[date.getDay()],
        dayNumber: date.getDate()
    };
}

// Function to generate available slots count
function generateSlotsCount() {
    return Math.floor(Math.random() * 6) + 3; // Random number between 3-8
}

// Function to format time for display
function formatTimeDisplay(hours, minutes) {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Function to check if a time slot should be available
function isTimeSlotAvailable(date, hours, minutes) {
    const now = new Date();
    const slotTime = new Date(date);
    slotTime.setHours(hours, minutes, 0, 0);
    
    // Add 30 minutes buffer to current time
    const bufferTime = new Date(now);
    bufferTime.setMinutes(now.getMinutes() + 30);
    
    return slotTime > bufferTime;
}

// Function to count actual available slots for a date
function countAvailableSlots(date) {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    let count = 0;
    
    // Count morning slots (9 AM - 12 PM)
    for (let hour = 9; hour < 12; hour++) {
        for (let minutes of [0, 30]) {
            if (!isToday || isTimeSlotAvailable(date, hour, minutes)) {
                count++;
            }
        }
    }
    
    // Count afternoon slots (12 PM - 4 PM)
    for (let hour = 12; hour < 16; hour++) {
        for (let minutes of [0, 30]) {
            if (!isToday || isTimeSlotAvailable(date, hour, minutes)) {
                count++;
            }
        }
    }
    
    // Count evening slots (4 PM - 6 PM)
    for (let hour = 16; hour < 18; hour++) {
        for (let minutes of [0, 30]) {
            if (!isToday || isTimeSlotAvailable(date, hour, minutes)) {
                count++;
            }
        }
    }
    
    return count;
}

// Function to generate random unavailable slots
function generateUnavailableSlots(date, totalSlots) {
    const unavailableCount = Math.floor(Math.random() * (totalSlots * 0.4)); // Make up to 40% of slots unavailable
    const unavailableSlots = [];  // Changed from Set to Array
    
    while (unavailableSlots.length < unavailableCount) {
        const hour = Math.floor(Math.random() * 9) + 9; // 9 AM to 6 PM
        const minutes = Math.random() < 0.5 ? 0 : 30;
        const timeKey = `${hour}:${minutes}`;
        if (!unavailableSlots.includes(timeKey)) {
            unavailableSlots.push(timeKey);
        }
    }
    
    return unavailableSlots;  // Return array instead of Set
}

function updateDaysDisplay(startDate = new Date()) {
    const daysContainer = document.getElementById('daysContainer');
    
    if (!daysContainer) {
        return;
    }

    // Ensure we start with today's date and reset time part
    const today = new Date();
    startDate = new Date(startDate);
    startDate.setHours(0, 0, 0, 0);
    
    // If startDate is before today, use today instead
    if (startDate < today) {
        startDate = new Date(today);
    }

    let html = '';
    const dateUnavailableSlots = new Map();
    
    for (let i = 0; i < 5; i++) {
        // Create new date object for each iteration to avoid mutation
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        // Count available slots for this day
        let availableSlotCount = 0;
        const isCurrentDay = currentDate.toDateString() === today.toDateString();
        
        // Morning slots (9 AM - 12 PM)
        for (let hour = 9; hour < 12; hour++) {
            for (let minutes of [0, 30]) {
                if (!isCurrentDay || isTimeSlotAvailable(currentDate, hour, minutes)) {
                    availableSlotCount++;
                }
            }
        }
        
        // Afternoon slots (12 PM - 4 PM)
        for (let hour = 12; hour < 16; hour++) {
            for (let minutes of [0, 30]) {
                if (!isCurrentDay || isTimeSlotAvailable(currentDate, hour, minutes)) {
                    availableSlotCount++;
                }
            }
        }
        
        // Evening slots (4 PM - 6 PM)
        for (let hour = 16; hour < 18; hour++) {
            for (let minutes of [0, 30]) {
                if (!isCurrentDay || isTimeSlotAvailable(currentDate, hour, minutes)) {
                    availableSlotCount++;
                }
            }
        }
        
        // Generate some unavailable slots
        const unavailableSlots = generateUnavailableSlots(currentDate, availableSlotCount);
        dateUnavailableSlots.set(currentDate.toISOString().split('T')[0], unavailableSlots);
        
        // Subtract unavailable slots from the count
        availableSlotCount = Math.max(0, availableSlotCount - unavailableSlots.length);
        
        const { dayName, dayNumber } = formatDayDisplay(currentDate);
        const isToday = currentDate.toDateString() === today.toDateString();
        const isActive = isToday || (i === 0 && currentDate >= today);
        
        // Store the full date string to ensure accuracy
        const dateString = currentDate.toISOString();
        
        html += `
            <div class="day-item${isActive ? ' active' : ''}" data-date="${dateString}">
                <span class="day-name">${dayName}</span>
                <span class="day-number">${dayNumber}</span>
                <span class="slots-available">${availableSlotCount} slots</span>
            </div>
        `;
    }
    
    daysContainer.innerHTML = html;
    daysContainer.dataset.unavailableSlots = JSON.stringify(Object.fromEntries(dateUnavailableSlots));
    
    // Add click handlers to day items
    document.querySelectorAll('.day-item').forEach(dayItem => {
        dayItem.addEventListener('click', function() {
            document.querySelectorAll('.day-item').forEach(item => 
                item.classList.remove('active'));
            this.classList.add('active');
            
            // Parse the full ISO date string to maintain accuracy
            const selectedDate = new Date(this.dataset.date);
            generateTimeSlots(selectedDate);
        });
    });
    
    // Generate initial time slots for the active day
    const activeDate = new Date(document.querySelector('.day-item.active').dataset.date);
    generateTimeSlots(activeDate);
}

function generateTimeSlots(selectedDate) {
    // console.log('generateTimeSlots called with date:', selectedDate);
    const timeSlots = document.getElementById('timeSlots');
    if (!timeSlots) {
        // console.error('timeSlots element not found');
        return;
    }
    
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    // Get unavailable slots for this date
    const daysContainer = document.getElementById('daysContainer');
    const dateStr = selectedDate.toISOString().split('T')[0];
    const unavailableSlotsData = JSON.parse(daysContainer.dataset.unavailableSlots || '{}');
    const unavailableSlots = unavailableSlotsData[dateStr] || [];
    
    let html = '';
    let totalAvailableSlots = 0;
    
    // Morning slots (9 AM - 12 PM)
    let morningSlots = '';
    for (let hour = 9; hour < 12; hour++) {
        for (let minutes of [0, 30]) {
            const timeKey = `${hour}:${minutes}`;
            if ((!isToday || isTimeSlotAvailable(selectedDate, hour, minutes)) && 
                !unavailableSlots.includes(timeKey)) {
                morningSlots += `<button class="time-slot" onclick="selectTimeSlot(this)">${formatTimeDisplay(hour, minutes)}</button>`;
                totalAvailableSlots++;
            }
        }
    }
    
    if (morningSlots) {
        html += `
            <div class="time-slot-group">
                <h3>Morning</h3>
                <div class="slots-grid">
                    ${morningSlots}
                </div>
            </div>
        `;
    }
    
    // Afternoon slots (12 PM - 4 PM)
    let afternoonSlots = '';
    for (let hour = 12; hour < 16; hour++) {
        for (let minutes of [0, 30]) {
            const timeKey = `${hour}:${minutes}`;
            if ((!isToday || isTimeSlotAvailable(selectedDate, hour, minutes)) && 
                !unavailableSlots.includes(timeKey)) {
                afternoonSlots += `<button class="time-slot" onclick="selectTimeSlot(this)">${formatTimeDisplay(hour, minutes)}</button>`;
                totalAvailableSlots++;
            }
        }
    }
    
    if (afternoonSlots) {
        html += `
            <div class="time-slot-group">
                <h3>Afternoon</h3>
                <div class="slots-grid">
                    ${afternoonSlots}
                </div>
            </div>
        `;
    }
    
    // Evening slots (4 PM - 6 PM)
    let eveningSlots = '';
    for (let hour = 16; hour < 18; hour++) {
        for (let minutes of [0, 30]) {
            const timeKey = `${hour}:${minutes}`;
            if ((!isToday || isTimeSlotAvailable(selectedDate, hour, minutes)) && 
                !unavailableSlots.includes(timeKey)) {
                eveningSlots += `<button class="time-slot" onclick="selectTimeSlot(this)">${formatTimeDisplay(hour, minutes)}</button>`;
                totalAvailableSlots++;
            }
        }
    }
    
    if (eveningSlots) {
        html += `
            <div class="time-slot-group">
                <h3>Evening</h3>
                <div class="slots-grid">
                    ${eveningSlots}
                </div>
            </div>
        `;
    }
    
    if (html === '') {
        html = `
            <div class="no-slots-message">
                No more appointments available ${isToday ? 'today' : 'on this day'}. Please select another day.
            </div>
        `;
    }
    
    timeSlots.innerHTML = html;
}

// Function to handle time slot selection
function selectTimeSlot(button) {
    // Remove selected class from all time slots
    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
    // Add selected class to clicked time slot
    button.classList.add('selected');
    
    // Get the selected date from the active day
    const activeDay = document.querySelector('.day-item.active');
    const selectedDate = new Date(activeDay.dataset.date);
    
    // Get the time from the clicked button
    const timeStr = button.textContent.trim();
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    
    // Convert to 24-hour format if needed
    let hour = parseInt(hours);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    // Set the time on the selected date
    selectedDate.setHours(hour, parseInt(minutes), 0, 0);
    
    // Store the full datetime
    selectedAppointmentDateTime = selectedDate;
    
    // Update the appointment display
    const appointmentDateTimeElement = document.getElementById('appointmentDateTime');
    if (appointmentDateTimeElement) {
        appointmentDateTimeElement.textContent = selectedAppointmentDateTime.toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }
    
    // Update the waiting room appointment time display
    const appointmentTimeElement = document.getElementById('appointmentTime');
    if (appointmentTimeElement) {
        appointmentTimeElement.textContent = selectedAppointmentDateTime.toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }
    
    // Move to next step
    nextStep();
}

// Add this function to populate patient info
function populatePatientInfo() {
    // Populate basic info
    document.querySelector('[data-field="name"] .value').textContent = patientFields.fullName;
    document.querySelector('[data-field="name"] .edit-input').value = patientFields.fullName;
    
    document.querySelector('[data-field="dob"] .value').textContent = new Date(patientFields.dateOfBirth).toLocaleDateString();
    document.querySelector('[data-field="dob"] .edit-input').value = patientFields.dateOfBirth;
    
    document.querySelector('[data-field="phone"] .value').textContent = patientFields.phone;
    document.querySelector('[data-field="phone"] .edit-input').value = patientFields.phone;
    
    document.querySelector('[data-field="insurance"] .value').textContent = patientFields.insuranceProvider;
    document.querySelector('[data-field="insurance"] .edit-input').value = patientFields.insuranceProvider;

    // Populate medications as tags
    const medicationTags = patientFields.medications.split('\n').map(med => 
        `<span class="tag historical">${med}</span>`
    ).join('');
    document.querySelector('[data-field="medications"] .tags').innerHTML = medicationTags;
    document.querySelector('[data-field="medications"] .edit-input').value = patientFields.medications;

    // Populate allergies as tags
    const allergyTags = patientFields.allergies.split('\n').map(allergy => 
        `<span class="tag historical">${allergy}</span>`
    ).join('');
    document.querySelector('[data-field="allergies"] .tags').innerHTML = allergyTags;
    document.querySelector('[data-field="allergies"] .edit-input').value = patientFields.allergies;
}

function initializeWaitingRoom() {
    const appointmentTimeElement = document.getElementById('appointmentTime');
    if (appointmentTimeElement && selectedAppointmentDateTime) {
        appointmentTimeElement.textContent = selectedAppointmentDateTime.toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }
}

// Expose funnel-specific functions with unique names
window.funnelNextStep = nextStep;
window.funnelPreviousStep = previousStep;
window.initializeFunnel = initializeFunnel;
window.togglePill = togglePill;
window.toggleEdit = toggleEdit;
window.selectTimeSlot = selectTimeSlot;
window.initializeWaitingRoom = initializeWaitingRoom;
window.handleCalendarClick = handleCalendarClick;
// Add these new functions to the window object
window.handleOutreferralNext = handleOutreferralNext;
window.handleClinicSelection = handleClinicSelection;
window.handleTimeSlotSelection = handleTimeSlotSelection;
window.handleOutreferralComplete = handleOutreferralComplete;

function handleCalendarClick() {
    console.log('Handling calendar click');
    
    // Get current active conditions from localStorage
    const activeConditions = JSON.parse(localStorage.getItem('activeConditions') || '[]');
    console.log('Current active conditions:', activeConditions);
    
    // Add selected condition if not present
    if (selectedCondition && !activeConditions.includes(selectedCondition)) {
        activeConditions.push(selectedCondition);
        console.log(`Added "${selectedCondition}" to active conditions`);
    } else if (selectedCondition) {
        console.log(`"${selectedCondition}" was already an active condition`);
    } else {
        console.warn('No condition was selected when handling calendar click');
    }
    
    // Store the updated conditions in localStorage
    localStorage.setItem('activeConditions', JSON.stringify(activeConditions));
    console.log('Updated active conditions:', activeConditions);
    
    // Save additional state
    localStorage.setItem('hasCarePlan', 'true');
    localStorage.setItem('selectedCondition', selectedCondition);
    
    // Redirect to phone-lock.html
    window.location.href = 'phone-lock.html?type=funnel';
}

function handleOutreferralNext() {
    // Hide all steps first
    document.querySelectorAll('.step').forEach(step => {
        step.style.display = 'none';
    });
    // Show the clinics step
    const clinicsStep = document.querySelector('.step[data-step="outreferral-clinics"]');
    if (clinicsStep) {
        clinicsStep.style.display = 'block';
    }
}

function handleClinicSelection(clinicId) {
    // Hide all steps first
    document.querySelectorAll('.step').forEach(step => {
        step.style.display = 'none';
    });
    
    // Show the details step
    const detailsStep = document.querySelector('.step[data-step="outreferral-details"]');
    if (detailsStep) {
        detailsStep.style.display = 'block';
        // Initialize time slot handlers after showing the step
        initializeTimeSlotHandlers();
    }
}

function handleTimeSlotSelection(timeSlot) {
    // Hide all steps first
    document.querySelectorAll('.step').forEach(step => {
        step.style.display = 'none';
    });
    
    // Store selected time slot
    const confirmedDateTimeElement = document.getElementById('confirmedDateTime');
    if (confirmedDateTimeElement) {
        confirmedDateTimeElement.textContent = timeSlot;
    }
    
    // Show the confirmation step
    const confirmationStep = document.querySelector('.step[data-step="outreferral-confirmation"]');
    if (confirmationStep) {
        confirmationStep.style.display = 'block';
    }
}

function handleOutreferralComplete() {
    // Set the condition to migraines
    selectedCondition = 'migraines';
    console.log(`Setting selected condition to: "${selectedCondition}"`);
    
    // Get current active conditions from localStorage
    const activeConditions = JSON.parse(localStorage.getItem('activeConditions') || '[]');
    console.log('Current active conditions:', activeConditions);
    
    // Add migraines if not present
    if (!activeConditions.includes(selectedCondition)) {
        activeConditions.push(selectedCondition);
        console.log(`Added "${selectedCondition}" to active conditions`);
    } else {
        console.log(`"${selectedCondition}" was already an active condition`);
    }
    
    // Store the updated conditions in localStorage
    localStorage.setItem('activeConditions', JSON.stringify(activeConditions));
    console.log('Updated active conditions:', activeConditions);
    
    // Save additional state
    localStorage.setItem('hasCarePlan', 'true');
    localStorage.setItem('selectedCondition', selectedCondition);
    
    // Close the bottom sheet
    closeBottomSheet();
    
    // Redirect to index.html
    window.location.href = 'index.html';
}

// Make showStep available globally
window.showStep = showStep;




