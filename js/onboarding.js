function setupOnboarding() {
    document.body.classList.add('onboarding-page');

    const navbar = document.querySelector('nav');
    if (navbar) {
        navbar.style.display = 'none';
    }

    let currentStep = 1;
    let currentSlide = 0;

    // Initialize progress bar
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.getElementById('progressText');
    if (progressBar && progressText) {
        progressBar.style.width = '25%';
        progressText.textContent = 'Step 1 of 4';
    }

    // Setup carousel
    const slides = document.querySelectorAll('.carousel-item');
    const dots = document.querySelectorAll('.dot');
    let startX = 0;
    let endX = 0;
    let isDragging = false;
    
    function nextSlide() {
        if (slides.length === 0) return; // Guard clause
        
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        
        currentSlide = (currentSlide + 1) % slides.length;
        
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    function prevSlide() {
        if (slides.length === 0) return; // Guard clause
        
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    // Add touch and mouse event listeners for swipe
    const carouselItems = document.querySelector('.carousel-items');
    if (carouselItems) {
        // Touch events
        carouselItems.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        carouselItems.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            if (startX > endX + 50) {
                nextSlide();
            } else if (startX < endX - 50) {
                prevSlide();
            }
        });

        // Mouse events
        carouselItems.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
        });

        carouselItems.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault(); // Prevent text selection while dragging
        });

        carouselItems.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            
            endX = e.clientX;
            isDragging = false;
            
            if (startX > endX + 50) {
                nextSlide();
            } else if (startX < endX - 50) {
                prevSlide();
            }
        });

        carouselItems.addEventListener('mouseleave', () => {
            isDragging = false;
        });
    }

    // Auto advance carousel
    const carouselInterval = setInterval(nextSlide, 5000);

    // Handle dot clicks
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            slides[currentSlide].classList.remove('active');
            dots[currentSlide].classList.remove('active');
            
            currentSlide = index;
            
            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
        });
    });

    // Setup step navigation
    function updateProgress() {
        if (progressBar && progressText) {
            progressBar.style.width = `${(currentStep / 4) * 100}%`;
            progressText.textContent = `Step ${currentStep} of 4`;
        }
    }

    // Make nextStep available globally
    window.nextStep = function(event) {
        const currentStepElement = document.getElementById(`step${currentStep}`);
        
        // Check if coming from step 2 (sign in options)
        if (currentStep === 2) {
            // Handle Google sign-in
            if (event.target.closest('.google')) {
                currentStep = 3;
                const nextStepElement = document.getElementById('step3');
                
                if (currentStepElement && nextStepElement) {
                    currentStepElement.style.display = 'none';
                    nextStepElement.style.display = 'block';
                    updateProgress();
                    
                    // Add click handler for step 3 immediately after showing it
                    nextStepElement.addEventListener('click', () => {
                        currentStep = 4;
                        const step4 = document.getElementById('step4');
                        nextStepElement.style.display = 'none';
                        step4.style.display = 'block';
                        updateProgress();
                    });
                }
                return;
            }
            
            // Handle Email sign-in
            if (event.target.closest('.email')) {
                currentStep = 4;
                const nextStepElement = document.getElementById('step4');
                
                if (currentStepElement && nextStepElement) {
                    currentStepElement.style.display = 'none';
                    nextStepElement.style.display = 'block';
                    updateProgress();
                }
                return;
            }
        }
        
        // Default next step behavior
        currentStep++;
        const nextStepElement = document.getElementById(`step${currentStep}`);
        
        if (currentStepElement && nextStepElement) {
            currentStepElement.style.display = 'none';
            nextStepElement.style.display = 'block';
            updateProgress();
        }
    };

    window.prevStep = function() {
        if (currentStep > 1) {
            const currentStepElement = document.getElementById(`step${currentStep}`);
            currentStep--;
            const prevStepElement = document.getElementById(`step${currentStep}`);
            
            if (currentStepElement && prevStepElement) {
                currentStepElement.style.display = 'none';
                prevStepElement.style.display = 'block';
                
                // Update progress bar
                if (progressBar && progressText) {
                    progressBar.style.width = `${(currentStep / 4) * 100}%`;
                    progressText.textContent = `Step ${currentStep} of 4`;
                }
            }
        }
    };

    // Setup Sunlife import
    const importButton = document.querySelector('.import-button');
    if (importButton) {
        importButton.addEventListener('click', () => {
            importButton.textContent = 'Importing...';
            
            // Simulate API call
            setTimeout(() => {
                const fields = {
                    // Personal Information
                    'fullName': 'Sarah Johnson',
                    'dateOfBirth': '1990-05-15',
                    'phone': '(415) 555-0123',
                    'address': '123 Market Street, San Francisco, CA 94105',
                    
                    // Pharmacy Information
                    'preferredPharmacy': 'Walgreens',
                    'pharmacyAddress': '825 Market St, San Francisco, CA 94103',
                    
                    // Medications & Allergies
                    'medications': 'Lisinopril 10mg daily\nLevothyroxine 50mcg daily\nVitamin D3 2000IU daily',
                    'allergies': 'Penicillin\nSulfa drugs\nLatex',
                    
                    // Emergency Contact
                    'emergencyName': 'Michael Johnson',
                    'emergencyPhone': '(415) 555-0189',
                    'relationship': 'Spouse',
                    
                    // Insurance Information
                    'insuranceProvider': 'Blue Shield of California',
                    'policyNumber': 'BSC129876543',
                    'groupNumber': 'G9876543210'
                };
                
                Object.entries(fields).forEach(([id, value]) => {
                    const input = document.getElementById(id);
                    if (input) input.value = value;
                });
                
                importButton.innerHTML = '✓ Imported from Sunlife';
                importButton.style.backgroundColor = 'var(--success-light)';
                importButton.style.color = 'var(--success)';
                importButton.style.borderColor = 'var(--success)';
            }, 1500);
        });
    }

    // Cleanup function
    return function cleanup() {
        clearInterval(carouselInterval);
        if (navbar) {
            navbar.style.display = '';
        }
        document.body.classList.remove('onboarding-page');
    };
}

// Export for use in main.js
window.setupOnboarding = setupOnboarding;

document.addEventListener('DOMContentLoaded', () => {
    // Add click handler for step 3
    const step3 = document.getElementById('step3');
    if (step3) {
        step3.addEventListener('click', () => {
            currentStep = 4;
            const step4 = document.getElementById('step4');
            step3.style.display = 'none';
            step4.style.display = 'block';
            updateProgress();
        });
    }
});