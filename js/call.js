document.addEventListener('DOMContentLoaded', () => {
    // Initialize timer
    let timeLeft = 30 * 60; // 30 minutes in seconds
    const timeElement = document.querySelector('.time');

    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        timeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft > 0) {
            timeLeft--;
        } else {
            clearInterval(timerInterval);
            // Handle end of call
            handleEndCall();
        }
    }

    const timerInterval = setInterval(updateTimer, 1000);
    updateTimer();

    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    let activeTab = null;

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            const content = document.getElementById(`${tabId}Content`);

            // If clicking the active tab, close it
            if (button.classList.contains('active')) {
                button.classList.remove('active');
                content.style.display = 'none';
                activeTab = null;
            } else {
                // Close any open tab
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.style.display = 'none');

                // Open the clicked tab
                button.classList.add('active');
                content.style.display = 'block';
                activeTab = tabId;
            }
        });
    });

    // Close tab content when clicking outside
    document.addEventListener('click', (event) => {
        const isTabButton = event.target.closest('.tab-button');
        const isTabContent = event.target.closest('.tab-content');
        
        if (!isTabButton && !isTabContent && activeTab) {
            const activeButton = document.querySelector(`.tab-button[data-tab="${activeTab}"]`);
            const activeContent = document.getElementById(`${activeTab}Content`);
            
            activeButton.classList.remove('active');
            activeContent.style.display = 'none';
            activeTab = null;
        }
    });

    // Control button functionality
    const controlButtons = document.querySelectorAll('.control-button');
    controlButtons.forEach(button => {
        if (button.classList.contains('end-call')) {
            button.addEventListener('click', handleEndCall);
        } else {
            button.addEventListener('click', () => {
                button.classList.toggle('disabled');
                handleControlToggle(button);
            });
        }
    });

    function handleControlToggle(button) {
        const control = button.getAttribute('data-tooltip').toLowerCase();
        
        // Handle different controls
        switch(control) {
            case 'translation':
                // Toggle translation
                break;
            case 'video':
                // Toggle video
                break;
            case 'microphone':
                // Toggle microphone
                break;
            case 'share screen':
                // Toggle screen sharing
                break;
        }
    }

    // Single implementation for end call functionality
    const endCallButton = document.querySelector('.end-call');
    
    function handleEndCall() {
        window.location.href = 'call-summary.html';
    }

    // Single event listener attachment for end call
    endCallButton.addEventListener('click', handleEndCall);

    // File preview functionality
    const fileItems = document.querySelectorAll('.file-item');
    const filePreviewModal = document.querySelector('.file-preview-modal');
    const closeModalButton = document.querySelector('.close-modal');
    const previewFrame = document.getElementById('file-preview-frame');

    fileItems.forEach(item => {
        item.addEventListener('click', () => {
            const fileName = item.querySelector('span:not(.file-extension, .file-time)').textContent;
            const modalTitle = document.querySelector('.modal-header h3');
            modalTitle.textContent = fileName;
            
            filePreviewModal.style.display = 'flex';
            setTimeout(() => {
                filePreviewModal.classList.add('active');
            }, 10);
        });
    });

    closeModalButton.addEventListener('click', () => {
        filePreviewModal.classList.remove('active');
        setTimeout(() => {
            filePreviewModal.style.display = 'none';
            previewFrame.src = '';
        }, 300);
    });

    // Close modal when clicking outside
    filePreviewModal.addEventListener('click', (e) => {
        if (e.target === filePreviewModal) {
            closeModalButton.click();
        }
    });

    // Close modal with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && filePreviewModal.style.display === 'flex') {
            closeModalButton.click();
        }
    });

    // Video streaming functionality
    const selfVideo = document.querySelector('.self-video video');
    
    async function startVideoStream() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true,
                audio: false // Set to true if you want to enable audio as well
            });
            
            selfVideo.srcObject = stream;
            selfVideo.play();
        } catch (err) {
            console.error('Error accessing camera:', err);
            // Fallback to placeholder video if camera access fails
            selfVideo.innerHTML = `
                <source src="https://assets.mixkit.co/videos/preview/mixkit-young-woman-working-from-home-talking-in-a-video-call-13999-large.mp4" type="video/mp4">
            `;
        }
    }

    startVideoStream();

    // Cleanup when leaving page
    window.addEventListener('beforeunload', () => {
        if (selfVideo.srcObject) {
            selfVideo.srcObject.getTracks().forEach(track => track.stop());
        }
    });

    // Subtitle simulation
    const subtitleScript = [
        {
            speaker: "Dr. Johnson",
            text: "Hello! I understand you've been experiencing sinus problems recently?",
            duration: 3000
        },
        {
            speaker: "You",
            text: "Yes, I've had congestion and facial pressure for over three weeks now.",
            duration: 3500
        },
        {
            speaker: "Dr. Johnson",
            text: "Can you describe your symptoms? Any nasal discharge or difficulty breathing?",
            duration: 3000
        },
        {
            speaker: "You",
            text: "My nose is constantly blocked, and I have thick yellow mucus. The pressure around my eyes and cheeks is quite uncomfortable.",
            duration: 3500
        },
        {
            speaker: "Dr. Johnson",
            text: "Have you noticed if anything makes these symptoms better or worse?",
            duration: 3000
        },
        {
            speaker: "You",
            text: "The pressure seems worse in the mornings, and cold air makes the congestion worse.",
            duration: 3000
        }
    ];

    let subtitleIndex = 0;
    let isTranslationActive = false;

    // Create subtitle container
    const subtitleContainer = document.createElement('div');
    subtitleContainer.className = 'subtitle-container';
    document.querySelector('.video-container').appendChild(subtitleContainer);

    function showSubtitleProgressively(subtitle) {
        const words = subtitle.text.split(' ');
        let currentWordIndex = 0;
        subtitleContainer.innerHTML = `
            <div class="subtitle ${subtitle.speaker === 'Dr. Johnson' ? 'doctor' : 'patient'}">
                <span class="speaker">${subtitle.speaker}:</span> 
                <span class="words"></span>
                <span class="typing-indicator">▋</span>
            </div>
        `;
        
        const wordsContainer = subtitleContainer.querySelector('.words');
        subtitleContainer.style.opacity = '1';

        const wordInterval = setInterval(() => {
            if (currentWordIndex < words.length) {
                wordsContainer.textContent += (currentWordIndex > 0 ? ' ' : '') + words[currentWordIndex];
                currentWordIndex++;
            } else {
                clearInterval(wordInterval);
                // Remove typing indicator after last word
                subtitleContainer.querySelector('.typing-indicator').style.opacity = '0';
                
                // Schedule next subtitle
                setTimeout(() => {
                    hideSubtitle();
                    subtitleIndex++;
                    if (isTranslationActive) {
                        setTimeout(startSubtitles, 500);
                    }
                }, 1000); // Keep final subtitle visible for 1 second
            }
        }, 200); // Adjust speed of word reveal here
    }

    function hideSubtitle() {
        subtitleContainer.style.opacity = '0';
    }

    function startSubtitles() {
        if (subtitleIndex >= subtitleScript.length) {
            subtitleIndex = 0;
        }
        showSubtitleProgressively(subtitleScript[subtitleIndex]);
    }

    // Translation button functionality
    const translationButton = document.querySelector('[data-tooltip="Translation"]');
    translationButton.addEventListener('click', () => {
        isTranslationActive = !isTranslationActive;
        translationButton.classList.toggle('active');
        
        if (isTranslationActive) {
            startSubtitles();
        } else {
            hideSubtitle();
            subtitleIndex = 0; // Reset index when turning off
        }
    });

    // Video control functionality
    const videoButton = document.querySelector('[data-tooltip="Video"]');
    const selfVideoContainer = document.querySelector('.self-video');
    let isVideoEnabled = true;

    videoButton.addEventListener('click', () => {
        isVideoEnabled = !isVideoEnabled;
        
        // Toggle disabled class instead of using classList.toggle
        if (!isVideoEnabled) {
            videoButton.classList.add('disabled');
        } else {
            videoButton.classList.remove('disabled');
        }
        
        if (selfVideo.srcObject) {
            const videoTrack = selfVideo.srcObject.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = isVideoEnabled;
            }
        }
        
        selfVideoContainer.style.display = isVideoEnabled ? 'block' : 'none';
    });

    // Remove onclick attribute from HTML
    endCallButton.removeAttribute('onclick');

    // Add screen sharing functionality
    const shareScreenButton = document.querySelector('[data-tooltip="Share Screen"]');
    let screenStream = null;
    let isScreenSharing = false;

    async function toggleScreenShare() {
        const selfVideo = document.querySelector('.self-video video');
        
        try {
            if (!isScreenSharing) {
                // Start screen sharing
                screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });
                
                // Store the original video track to restore later
                if (selfVideo.srcObject) {
                    window.originalStream = selfVideo.srcObject;
                }
                
                // Switch to screen sharing
                selfVideo.srcObject = screenStream;
                isScreenSharing = true;
                
                // Update button state
                shareScreenButton.classList.add('active');
                
                // Listen for when user stops sharing via browser controls
                screenStream.getVideoTracks()[0].addEventListener('ended', () => {
                    stopScreenSharing();
                });
            } else {
                stopScreenSharing();
            }
        } catch (err) {
            console.error("Error sharing screen:", err);
            alert("Unable to share screen. Please make sure you have granted the necessary permissions.");
        }
    }

    function stopScreenSharing() {
        const selfVideo = document.querySelector('.self-video video');
        
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            screenStream = null;
        }
        
        // Restore original video feed if it exists
        if (window.originalStream) {
            selfVideo.srcObject = window.originalStream;
        }
        
        isScreenSharing = false;
        shareScreenButton.classList.remove('active');
    }

    // Add event listener for screen sharing only if the button exists
    if (shareScreenButton) {
        shareScreenButton.addEventListener('click', toggleScreenShare);
    }

    // Create and append notification banner
    const notificationBanner = document.createElement('div');
    notificationBanner.className = 'notification-banner';
    notificationBanner.textContent = 'Your file has been shared with Dialogue';
    notificationBanner.style.opacity = '0';
    notificationBanner.style.display = 'none';
    document.body.appendChild(notificationBanner);

    // Handle file upload button click
    console.log('Looking for upload button...');
    const uploadButton = document.querySelector('.button-upload-file');
    console.log('Upload button found:', uploadButton);
    
    if (uploadButton) {
        uploadButton.addEventListener('click', () => {
            notificationBanner.style.display = 'block';
            // Force a reflow to ensure the transition works
            notificationBanner.offsetHeight;
            notificationBanner.style.opacity = '1';
            
            setTimeout(() => {
                notificationBanner.style.opacity = '0';
                notificationBanner.addEventListener('transitionend', function hideNotification() {
                    notificationBanner.style.display = 'none';
                    notificationBanner.removeEventListener('transitionend', hideNotification);
                });
            }, 3000);
        });
    } else {
        console.warn('Upload button not found with class .button-upload-file');
    }

    // Check if endCallButton exists before trying to use it
    if (endCallButton) {
        endCallButton.removeAttribute('onclick');
    }
}); 