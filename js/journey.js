document.addEventListener('DOMContentLoaded', () => {
    // Get all navigation items and sections
    const navItems = document.querySelectorAll('.journey-nav-item');
    const sections = document.querySelectorAll('.journey-section');

    // Function to handle navigation
    const navigateToSection = (targetId) => {
        // Remove active class from all nav items and sections
        navItems.forEach(nav => nav.classList.remove('active'));
        sections.forEach(section => section.classList.remove('active'));
        
        // Add active class to target nav item
        const targetNav = document.querySelector(`.journey-nav-item[href="#${targetId}"]`);
        if (targetNav) {
            targetNav.classList.add('active');
        }
        
        // If timeline is clicked, show both overview and timeline sections
        if (targetId === 'timeline') {
            document.getElementById('overview').classList.add('active');
        }
        
        // Show target section
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    };

    // Add click event listener to each nav item
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href').substring(1);
            navigateToSection(targetId);
        });
    });

    // Handle in-chat navigation links
    document.querySelectorAll('.message-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            navigateToSection(targetId);
        });
    });

    // Message handling
    const messageForm = document.getElementById('messageForm');
    const messagesList = document.querySelector('.messages-list');
    const messageInput = messageForm?.querySelector('.message-input');

    const sendMessage = () => {
        const message = messageInput.value.trim();
        
        if (message) {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const messageHTML = `
                <div class="message outgoing">
                    <div class="message-header">
                        <div class="message-info">
                            <h3>You</h3>
                            <span class="message-time">Just now</span>
                        </div>
                    </div>
                    <p class="message-content">${message}</p>
                </div>
            `;
            
            messagesList.insertAdjacentHTML('beforeend', messageHTML);
            messageInput.value = '';
            messagesList.scrollTop = messagesList.scrollHeight;
        }
    };

    if (messageForm && messageInput) {
        // Handle form submission (button click)
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessage();
        });

        // Handle Enter key
        messageInput.addEventListener('keydown', (e) => {
            // Check if Enter was pressed without Shift key
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent default to avoid new line
                sendMessage();
            }
        });

        // Auto-resize textarea as user types
        messageInput.addEventListener('input', () => {
            // Reset height to auto to get correct scrollHeight
            messageInput.style.height = 'auto';
            // Set new height based on content
            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
        });
    }

    // Handle response options
    const responseMessages = {
        better: `Great to hear you're feeling better! I'll mark this case as resolved. You'll still have access to all the information here, but if you experience similar symptoms in the future, please start a new care journey. Take care!
                <div class="message-links">
                    <a href="#" class="message-link pdf-summary">
                        <i class="fas fa-file-pdf"></i>
                        <div class="link-content">
                            <span class="link-title">Case Summary - March 2024</span>
                            <span class="link-size">PDF • 142 KB</span>
                        </div>
                        <i class="fas fa-download"></i>
                    </a>
                </div>`,
        improving: "Good to hear you're improving! Keep following the treatment plan and let us know if anything changes.",
        same: `I'm sorry to hear you haven't noticed any improvement. We should schedule a follow-up with Dr. Roberts to review your treatment plan.
               <div class="message-actions">
                   <button class="action-button">
                       <i class="fas fa-calendar-plus"></i>
                       Schedule Follow-up
                   </button>
               </div>`,
        worse: `I'm concerned to hear your symptoms are getting worse. Let's schedule an urgent follow-up with Dr. Roberts. In the meantime, please review the 'When to Seek Immediate Care' section in your care plan.
                <div class="message-actions">
                    <button class="action-button urgent">
                        <i class="fas fa-calendar-plus"></i>
                        Schedule Urgent Follow-up
                    </button>
                </div>`
    };

    const updateJourneyStatus = (status) => {
        const statusIndicator = document.querySelector('.status-indicator');
        if (status === 'resolved') {
            statusIndicator.textContent = 'Resolved';
            statusIndicator.classList.remove('active');
            statusIndicator.classList.add('resolved');
        }
    };

    const showTypingIndicator = () => {
        const typingIndicator = document.querySelector('.typing-indicator');
        typingIndicator.style.display = 'flex';
        messagesList.scrollTop = messagesList.scrollHeight;
    };

    const hideTypingIndicator = () => {
        const typingIndicator = document.querySelector('.typing-indicator');
        typingIndicator.style.display = 'none';
    };

    const addMessageEventListeners = () => {
        // Find any new action buttons and add click handlers
        document.querySelectorAll('.action-button').forEach(button => {
            if (!button.hasListener) {
                button.addEventListener('click', () => {
                    // Navigate to appointments section
                    navigateToSection('appointments');
                });
                button.hasListener = true;
            }
        });
    };

    const addNurseResponse = (message) => {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const messageHTML = `
            <div class="message">
                <div class="message-header">
                    <img src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop&q=60" alt="Nurse Chen" class="avatar">
                    <div class="message-info">
                        <h3>Nurse Chen</h3>
                        <span class="message-time">Just now</span>
                    </div>
                </div>
                <div class="message-content">${message}</div>
            </div>
        `;
        
        messagesList.insertAdjacentHTML('beforeend', messageHTML);
        messagesList.scrollTop = messagesList.scrollHeight;
        
        // Add event listeners to any new buttons
        addMessageEventListeners();
    };

    document.querySelectorAll('.response-option').forEach(button => {
        button.addEventListener('click', (e) => {
            const response = e.target.closest('.response-option').dataset.response;
            
            // Remove any previous user response and nurse response
            const lastUserMessage = messagesList.querySelector('.message.outgoing:last-of-type');
            if (lastUserMessage) {
                // Remove the nurse's response (next element after user's message)
                const nurseResponse = lastUserMessage.nextElementSibling;
                if (nurseResponse) {
                    nurseResponse.remove();
                }
                lastUserMessage.remove();
            }

            // Re-enable all response options
            document.querySelectorAll('.response-option').forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            });

            // Show user's new selection
            const userResponse = `
                <div class="message outgoing">
                    <div class="message-header">
                        <div class="message-info">
                            <h3>You</h3>
                            <span class="message-time">Just now</span>
                        </div>
                    </div>
                    <div class="message-content">${button.textContent.trim()}</div>
                </div>
            `;
            messagesList.insertAdjacentHTML('beforeend', userResponse);
            
            // Show typing indicator
            showTypingIndicator();
            
            // If the previous status was resolved and new response isn't "better",
            // change status back to active
            if (response !== 'better') {
                const statusIndicator = document.querySelector('.status-indicator');
                if (statusIndicator.classList.contains('resolved')) {
                    statusIndicator.textContent = 'Open';
                    statusIndicator.classList.remove('resolved');
                    statusIndicator.classList.add('active');
                }
            }
            
            // Simulate nurse typing response
            setTimeout(() => {
                hideTypingIndicator();
                addNurseResponse(responseMessages[response]);
                
                // Update status if response was "better"
                if (response === 'better') {
                    setTimeout(() => {
                        updateJourneyStatus('resolved');
                    }, 500);
                }
            }, 2000);
        });
    });

    



    // Get journey type from URL parameter
    const getJourneyType = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('type') || 'sinusitis'; // default to sinusitis if no type specified
    };

    // Load journey content
    const loadJourneyContent = () => {
        const journeyType = getJourneyType();
        // const data = journeyData[journeyType];
        
        // Update page title
        document.querySelector('.journey-header h1').textContent = data.title;
        
        // Update status date
        document.querySelector('.status-date').textContent = `Active since ${data.startDate}`;
        
        // Update summary content
        const summaryContent = document.querySelector('.summary-content');
        summaryContent.innerHTML = `
            <p><strong>What's happening:</strong> ${data.summary.happening}</p>
            <p><strong>Current situation:</strong> ${data.summary.current}</p>
            <p><strong>Treatment plan:</strong>
                <ul>
                    ${data.summary.treatment.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </p>
            <p><strong>Next steps:</strong> ${data.summary.nextSteps}</p>
        `;
        
        // Update care team
        const careTeamContainer = document.querySelector('.care-team-container');
        careTeamContainer.innerHTML = `
            <div class="team-member">
                <img src="${data.provider.image}" alt="${data.provider.name}" class="avatar">
                <div class="team-member-info">
                    <h3>${data.provider.name}</h3>
                    <p class="role">${data.provider.role}</p>
                    <p class="specialty">${data.provider.specialty}</p>
                    <button class="button-secondary">Message</button>
                </div>
            </div>
            <div class="team-member">
                <img src="${data.nurse.image}" alt="${data.nurse.name}" class="avatar">
                <div class="team-member-info">
                    <h3>${data.nurse.name}</h3>
                    <p class="role">${data.nurse.role}</p>
                    <p class="specialty">${data.nurse.specialty}</p>
                    <button class="button-secondary">Message</button>
                </div>
            </div>
        `;
        
        // Update care plan
        // ... similar updates for care plan section
    };

    loadJourneyContent();
}); 

   // Get the care plan type from URL parameters
   function getCareType() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('type');
}

const carePlanContent = {
    sinusitis: {
        title: "Sinusitis",
        startDate: "March 15, 2024",
        status: "Active",
        summary: {
            complaint: "Facial pressure, nasal congestion, and headache lasting over 10 days.",
            findings: "Inflammation of the sinus cavities, possible bacterial infection, moderate congestion in nasal passages.",
            currentStatus: "Responding to antibiotics and nasal steroids. Congestion reduced by approximately 50%.",
            treatmentPlan: "10-day course of antibiotics, nasal steroid spray, saline rinses, and humidity management."
        },
        quickActions: [
            {
                icon: "fas fa-book-medical",
                text: "Read About Sinusitis",
                link: "#"
            },
            {
                icon: "fas fa-calendar-plus",
                text: "Book Follow-up",
                link: "#"
            },
            {
                icon: "fas fa-spray-can",
                text: "Nasal Spray Guide",
                link: "#"
            },
            {
                icon: "fas fa-notes-medical",
                text: "Track Symptoms",
                link: "#"
            }
        ],
        timeline: [
            {
                date: "Mar 15, 2024",
                title: "Journey Started",
                description: "Initial assessment completed with Dr. Roberts"
            },
            {
                date: "Mar 18, 2024",
                title: "Treatment Initiated",
                description: "Started on antibiotics and nasal steroids"
            },
            {
                date: "Mar 22, 2024",
                title: "Progress Check",
                description: "Virtual follow-up - symptoms improving, continue current treatment"
            }
        ],
        carePlan: {
            steps: [
                {
                    number: "1",
                    title: "Medication Schedule",
                    items: [
                        "Antibiotics: Take 1 tablet twice daily for 10 days",
                        "Nasal Steroid Spray: 2 sprays in each nostril every morning",
                        "Important: Complete entire course of antibiotics even if feeling better"
                    ]
                },
                {
                    number: "2",
                    title: "Daily Care Routine",
                    items: [
                        "Morning: Use nasal spray, perform saline rinse",
                        "Throughout Day: Stay hydrated, avoid known allergens",
                        "Evening: Another saline rinse if needed"
                    ]
                },
                {
                    number: "3",
                    title: "Environmental Management",
                    items: [
                        "Use a humidifier in bedroom",
                        "Elevate head while sleeping",
                        "Avoid temperature extremes",
                        "Keep living spaces dust-free"
                    ]
                },
                {
                    number: "4",
                    title: "Monitoring Progress",
                    items: [
                        "Track symptoms daily using the symptom tracker",
                        "Note any changes in nasal discharge color",
                        "Monitor for fever or worsening pain",
                        "Schedule follow-up in 2 weeks"
                    ]
                }
            ],
            warnings: [
                "Severe headache or facial pain",
                "High fever (over 102°F/39°C)",
                "Vision changes or eye swelling",
                "Symptoms worsen after initial improvement"
            ]
        },
        team: [
            {
                name: "Dr. Michael Roberts",
                role: "Primary Care Physician",
                specialty: "Family Medicine",
                image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=60"
            },
            {
                name: "Emily Chen",
                role: "Registered Nurse",
                specialty: "Primary Care",
                image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop&q=60"
            }
        ],
        messages: [
            {
                sender: "Dr. Roberts",
                time: "March 15, 2:30 PM",
                content: "Based on your symptoms and examination today, I'm diagnosing you with acute sinusitis. I'm prescribing antibiotics and a nasal steroid spray. Let's start with these and monitor your progress.",
                avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=60",
                outgoing: false
            },
            {
                sender: "You",
                time: "March 15, 3:45 PM",
                content: "Thank you, Dr. Roberts. Quick question - should I take the antibiotic with food?",
                outgoing: true
            },
            {
                sender: "Dr. Roberts",
                time: "March 15, 4:00 PM",
                content: "Yes, please take the antibiotic with food to minimize stomach upset. Also, make sure to complete the full course even if you start feeling better.",
                avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=60",
                outgoing: false
            },
            {
                sender: "You",
                time: "March 18, 9:15 AM",
                content: "The congestion seems a bit better, but I'm still having some pressure in my face. Is this normal?",
                outgoing: true
            },
            {
                sender: "Dr. Roberts",
                time: "March 18, 10:30 AM",
                content: "Yes, this is normal. The pressure typically takes 5-7 days to fully resolve. Continue with the medications and try using a warm compress on your face for comfort. If the pressure becomes severe, let me know.",
                avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=60",
                outgoing: false
            },
            {
                sender: "Emily Chen (Nurse)",
                time: "March 20, 11:00 AM",
                content: "Hi! Just checking in on your progress. How are you feeling with the medications?",
                avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop&q=60",
                outgoing: false
            }
        ],
        documents: [
            {
                icon: "📄",
                title: "Initial Assessment Report",
                date: "March 15, 2024",
                type: "PDF Document"
            },
            {
                icon: "💊",
                title: "Prescription Details",
                date: "March 15, 2024",
                type: "PDF Document"
            },
            {
                icon: "📋",
                title: "Treatment Instructions",
                date: "March 15, 2024",
                type: "PDF Document"
            }
        ]
    },
    anxiety: {
        title: "Anxiety Management",
        startDate: "March 1, 2024",
        status: "Active",
        summary: {
            complaint: "Persistent worry, difficulty sleeping, and occasional panic attacks.",
            findings: "Generalized anxiety disorder with moderate severity, affecting daily activities and sleep patterns.",
            currentStatus: "Showing improvement with therapy and mindfulness practices. Sleep quality improving.",
            treatmentPlan: "Combination of CBT therapy, mindfulness exercises, and lifestyle modifications."
        },
        quickActions: [
            {
                icon: "fas fa-brain",
                text: "Mindfulness Exercise",
                link: "#"
            },
            {
                icon: "fas fa-calendar-plus",
                text: "Schedule Therapy",
                link: "#"
            },
            {
                icon: "fas fa-book",
                text: "Anxiety Resources",
                link: "#"
            },
            {
                icon: "fas fa-chart-line",
                text: "Mood Tracker",
                link: "#"
            }
        ],
        timeline: [
            {
                date: "Mar 1, 2024",
                title: "Initial Assessment",
                description: "Comprehensive evaluation with Dr. Thompson"
            },
            {
                date: "Mar 5, 2024",
                title: "First Therapy Session",
                description: "Started CBT with therapist Sarah Wilson"
            },
            {
                date: "Mar 12, 2024",
                title: "Progress Review",
                description: "Noted improvement in sleep patterns and daily anxiety levels"
            }
        ],
        carePlan: {
            steps: [
                {
                    number: "1",
                    title: "Therapy Schedule",
                    items: [
                        "Weekly CBT sessions with Sarah Wilson",
                        "Bi-weekly check-ins with Dr. Thompson",
                        "Daily mindfulness practice using provided app"
                    ]
                },
                {
                    number: "2",
                    title: "Daily Management",
                    items: [
                        "Morning meditation (15 minutes)",
                        "Breathing exercises (3 times daily)",
                        "Evening relaxation routine",
                        "Sleep hygiene practices"
                    ]
                },
                {
                    number: "3",
                    title: "Lifestyle Modifications",
                    items: [
                        "Regular exercise (30 minutes, 5 times weekly)",
                        "Limit caffeine intake",
                        "Maintain consistent sleep schedule",
                        "Practice stress-reducing hobbies"
                    ]
                },
                {
                    number: "4",
                    title: "Progress Tracking",
                    items: [
                        "Daily mood journaling",
                        "Weekly anxiety level assessment",
                        "Track sleep quality and duration",
                        "Note trigger situations"
                    ]
                }
            ],
            warnings: [
                "Thoughts of self-harm",
                "Severe panic attacks",
                "Unable to perform daily activities",
                "Significant sleep disturbance"
            ]
        },
        team: [
            {
                name: "Dr. Jennifer Thompson",
                role: "Psychiatrist",
                specialty: "Anxiety Disorders",
                image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop&q=60"
            },
            {
                name: "Sarah Wilson",
                role: "Therapist",
                specialty: "CBT Specialist",
                image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60"
            }
        ],
        messages: [
            {
                sender: "Dr. Thompson",
                time: "March 1, 10:00 AM",
                content: "Thank you for opening up about your anxiety today. I think a combination of therapy and lifestyle changes will be really helpful. I'm referring you to Sarah Wilson, our CBT specialist.",
                avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop&q=60",
                outgoing: false
            },
            {
                sender: "You",
                time: "March 1, 2:15 PM",
                content: "Thank you. I'm nervous about therapy but willing to give it a try. How long before I might notice improvements?",
                outgoing: true
            },
            {
                sender: "Dr. Thompson",
                time: "March 1, 3:00 PM",
                content: "Everyone's journey is different, but many people start noticing small improvements within a few weeks. Remember, it's a gradual process. Sarah will help you develop coping strategies you can start using right away.",
                avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop&q=60",
                outgoing: false
            },
            {
                sender: "Sarah Wilson",
                time: "March 5, 2:00 PM",
                content: "Great first session today! Remember to practice those breathing exercises we discussed whenever you feel anxious. Start with just 5 minutes twice a day.",
                avatar: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60",
                outgoing: false
            },
            {
                sender: "You",
                time: "March 8, 9:30 AM",
                content: "I tried the breathing exercises during a stressful meeting yesterday. It really helped! But I still had trouble sleeping last night.",
                outgoing: true
            },
            {
                sender: "Sarah Wilson",
                time: "March 8, 10:15 AM",
                content: "That's great that you're already applying the techniques! Sleep can take a bit longer to improve. Let's focus on sleep hygiene in our next session. In the meantime, try the progressive muscle relaxation recording I sent you.",
                avatar: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60",
                outgoing: false
            }
        ],
        documents: [
            {
                icon: "📋",
                title: "Anxiety Assessment Report",
                date: "March 1, 2024",
                type: "PDF Document"
            },
            {
                icon: "📘",
                title: "CBT Workbook",
                date: "March 5, 2024",
                type: "PDF Document"
            },
            {
                icon: "📱",
                title: "Mindfulness App Guide",
                date: "March 5, 2024",
                type: "PDF Document"
            }
        ]
    },
    rash: {
        title: "Unexplained Rash",
        startDate: "March 10, 2024",
        status: "Active",
        summary: {
            complaint: "Itchy, red rash on upper back with some raised bumps, noticed 5 days ago.",
            findings: "Contact dermatitis suspected, showing signs of moderate inflammation with scattered papules.",
            currentStatus: "Responding to topical treatment. Itching reduced, redness still present but improving.",
            treatmentPlan: "Combination of topical steroids, antihistamines, and trigger avoidance."
        },
        quickActions: [
            {
                icon: "fas fa-camera",
                text: "Photo Tracking",
                link: "#"
            },
            {
                icon: "fas fa-calendar-plus",
                text: "Book Follow-up",
                link: "#"
            },
            {
                icon: "fas fa-notes-medical",
                text: "Symptom Log",
                link: "#"
            },
            {
                icon: "fas fa-shield-virus",
                text: "Trigger List",
                link: "#"
            }
        ],
        timeline: [
            {
                date: "Mar 10, 2024",
                title: "Initial Visit",
                description: "Examination and photos taken of affected area"
            },
            {
                date: "Mar 12, 2024",
                title: "Treatment Started",
                description: "Began topical steroid and oral antihistamine regimen"
            },
            {
                date: "Mar 15, 2024",
                title: "Progress Check",
                description: "Virtual follow-up - itching improved, continuing treatment"
            }
        ],
        carePlan: {
            steps: [
                {
                    number: "1",
                    title: "Medication Schedule",
                    items: [
                        "Apply prescribed steroid cream twice daily",
                        "Take antihistamine tablet once daily",
                        "Use gentle, fragrance-free moisturizer as needed",
                        "Document any new symptoms or spread"
                    ]
                },
                {
                    number: "2",
                    title: "Skin Care Routine",
                    items: [
                        "Gentle cleaning with prescribed soap",
                        "Pat dry - no rubbing",
                        "Avoid hot showers",
                        "Wear loose, cotton clothing"
                    ]
                },
                {
                    number: "3",
                    title: "Trigger Management",
                    items: [
                        "Keep daily log of activities",
                        "Note any new products used",
                        "Monitor food intake",
                        "Track stress levels"
                    ]
                },
                {
                    number: "4",
                    title: "Progress Monitoring",
                    items: [
                        "Daily photos of affected area",
                        "Track itching intensity",
                        "Monitor spread or reduction",
                        "Note any new areas affected"
                    ]
                }
            ],
            warnings: [
                "Severe increase in itching or pain",
                "Spreading beyond initial area",
                "Development of blisters",
                "Signs of infection (warmth, swelling, discharge)"
            ]
        },
        team: [
            {
                name: "Dr. Sarah Lee",
                role: "Dermatologist",
                specialty: "Contact Dermatitis",
                image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop&q=60"
            },
            {
                name: "Lisa Wong",
                role: "Nurse Practitioner",
                specialty: "Dermatology",
                image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60"
            }
        ],
        messages: [
            {
                sender: "Dr. Lee",
                time: "March 10, 2:00 PM",
                content: "Based on the examination, this appears to be contact dermatitis. I'm prescribing a topical steroid cream and antihistamine to help with the itching. We'll need to identify what might have triggered this.",
                avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop&q=60",
                outgoing: false
            },
            {
                sender: "You",
                time: "March 10, 3:15 PM",
                content: "Should I stop using all my regular lotions and soaps?",
                outgoing: true
            },
            {
                sender: "Dr. Lee",
                time: "March 10, 3:45 PM",
                content: "Yes, please switch to the gentle cleanser I recommended and only use the prescribed medications for now. Once the rash clears, we can slowly reintroduce products to identify any triggers.",
                avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop&q=60",
                outgoing: false
            },
            {
                sender: "Lisa Wong",
                time: "March 12, 10:00 AM",
                content: "How's the itching today? Remember to take photos daily so we can track the progress.",
                avatar: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60",
                outgoing: false
            },
            {
                sender: "You",
                time: "March 12, 11:30 AM",
                content: "The itching is a bit better since starting the antihistamine. I've uploaded new photos to the portal.",
                outgoing: true
            },
            {
                sender: "Dr. Lee",
                time: "March 15, 9:00 AM",
                content: "I've reviewed your latest photos. The redness is starting to improve. Continue with the current treatment plan and keep tracking potential triggers.",
                avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&auto=format&fit=crop&q=60",
                outgoing: false
            }
        ],
        documents: [
            {
                icon: "📋",
                title: "Dermatology Assessment",
                date: "March 10, 2024",
                type: "PDF Document"
            },
            {
                icon: "📸",
                title: "Photo Documentation",
                date: "March 10, 2024",
                type: "Image Gallery"
            },
            {
                icon: "📝",
                title: "Trigger Tracking Guide",
                date: "March 10, 2024",
                type: "PDF Document"
            }
        ]
    }

};

function loadCarePlanContent() {
    const type = getCareType() || 'sinusitis';
    const content = carePlanContent[type];
    
    if (!content) {
        window.location.href = 'index.html';
        return;
    }

    // Update page title and status
    document.querySelector('.journey-header h1').textContent = content.title;
    document.querySelector('.status-date').textContent = `Active since ${content.startDate}`;
    
    // Update Summary/Overview section
    const summaryContent = document.querySelector('.condition-summary .summary-content');
    summaryContent.innerHTML = `
        <p><strong>Initial Complaint:</strong> ${content.summary.complaint}</p>
        <p><strong>Key Findings:</strong> ${content.summary.findings}</p>
        <p><strong>Current Status:</strong> ${content.summary.currentStatus}</p>
        <p><strong>Treatment Plan:</strong> ${content.summary.treatmentPlan}</p>
    `;

    // Update Quick Actions
    const quickActionsGrid = document.querySelector('.quick-actions-grid');
    quickActionsGrid.innerHTML = content.quickActions.map(action => `
        <a href="${action.link}" class="quick-action-card">
            <i class="${action.icon}"></i>
            <span>${action.text}</span>
        </a>
    `).join('');

    // Update Timeline
    const timelineContainer = document.querySelector('.timeline-items');
    timelineContainer.innerHTML = content.timeline.map(event => `
        <div class="timeline-item">
            <div class="timeline-date">${event.date}</div>
            <div class="timeline-content">
                <h3>${event.title}</h3>
                <p>${event.description}</p>
            </div>
        </div>
    `).join('');

    // Update Care Plan
    const carePlanSteps = document.querySelector('.care-plan-steps');
    carePlanSteps.innerHTML = content.carePlan.steps.map(step => `
        <div class="care-plan-step">
            <div class="step-header">
                <span class="step-number">${step.number}</span>
                <h3>${step.title}</h3>
            </div>
            <div class="step-content">
                <ul>
                    ${step.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        </div>
    `).join('');

    // Update Care Plan Warnings
    const warningsList = document.querySelector('.care-plan-warning ul');
    warningsList.innerHTML = content.carePlan.warnings.map(warning => 
        `<li>${warning}</li>`
    ).join('');

    // Update Messages
    const messagesList = document.querySelector('.messages-list');
    messagesList.innerHTML = content.messages.map(message => `
        <div class="message ${message.outgoing ? 'outgoing' : ''}">
            <div class="message-header">
                ${!message.outgoing ? `<img src="${message.avatar}" alt="${message.sender}" class="avatar">` : ''}
                <div class="message-info">
                    <h3>${message.sender}</h3>
                    <span class="message-time">${message.time}</span>
                </div>
            </div>
            <p class="message-content">${message.content}</p>
        </div>
    `).join('');

    // Update Care Team
    const careTeamContainer = document.querySelector('.care-team-container');
    careTeamContainer.innerHTML = content.team.map(member => `
        <div class="team-member">
            <img src="${member.image}" alt="${member.name}" class="avatar">
            <div class="team-member-info">
                <h3>${member.name}</h3>
                <p class="role">${member.role}</p>
                <p class="specialty">${member.specialty}</p>
                <button class="button-secondary">Message</button>
            </div>
        </div>
    `).join('');

    // Update Documents
    const documentsContainer = document.querySelector('.documents-container');
    documentsContainer.innerHTML = content.documents.map(doc => `
        <div class="document-card">
            <div class="document-icon">${doc.icon}</div>
            <div class="document-info">
                <h3>${doc.title}</h3>
                <p class="document-date">${doc.date}</p>
                <p class="document-type">${doc.type}</p>
            </div>
            <button class="button-secondary">View</button>
        </div>
    `).join('');
}

// Load content when page loads
window.addEventListener('load', loadCarePlanContent);

// Update the tab navigation event listener
document.addEventListener('DOMContentLoaded', function() {
    // Add click handler for journey sections
    document.querySelectorAll('.journey-section').forEach(section => {
        section.addEventListener('click', function(e) {
            // Remove active class from all sections
            document.querySelectorAll('.journey-section').forEach(el => {
                el.classList.remove('active');
            });
            
            // Add active class to clicked section
            this.classList.add('active');
            
            // Update corresponding nav item
            const sectionId = this.id;
            document.querySelectorAll('.journey-nav-item').forEach(navItem => {
                navItem.classList.remove('active');
                if (navItem.getAttribute('href') === `#${sectionId}`) {
                    navItem.classList.add('active');
                }
            });
        });
    });

    // Existing tab navigation code
    const journeyNav = document.querySelector('.journey-nav');
    if (journeyNav) {
        journeyNav.addEventListener('click', function(e) {
            const navItem = e.target.closest('.journey-nav-item');
            if (navItem) {
                e.preventDefault();
                
                const targetId = navItem.getAttribute('href').substring(1);
                
                // Remove active class from all sections and nav items
                document.querySelectorAll('.journey-section').forEach(el => {
                    el.classList.remove('active');
                });
                document.querySelectorAll('.journey-nav-item').forEach(el => {
                    el.classList.remove('active');
                });
                
                // Add active class to clicked nav item
                navItem.classList.add('active');
                
                // Add active class to corresponding section
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.add('active');
                    loadTabContent(targetId);
                }
            }
        });
    }

    // Initial load
    const initialTab = document.querySelector('.journey-section.active') || document.getElementById('overview');
    if (initialTab) {
        const initialTabId = initialTab.id;
        const initialNavItem = document.querySelector(`.journey-nav-item[href="#${initialTabId}"]`);
        if (initialNavItem) {
            initialNavItem.classList.add('active');
        }
        initialTab.classList.add('active');
        loadTabContent(initialTabId);
    }
});
