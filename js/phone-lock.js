// Update time every minute
function updateTime() {
    const now = new Date();
    const timeElement = document.querySelector('.time');
    const dateElement = document.querySelector('.date');
    
    timeElement.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace(' ', '');
    
    dateElement.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
}

function setNotificationContent(type) {
    const notificationTitle = document.querySelector('.notification-title');
    const notificationMessage = document.querySelector('.notification-message');
    const notification = document.querySelector('.notification');

    console.log('Setting notification content for type:', type);

    if (type === 'migraine') {
        notificationTitle.textContent = 'Hey Cam!';
        notificationMessage.textContent = 'Make sure you take your migraine pills today.';
        notification.onclick = () => window.location.href = 'finish.html';
    } else {
        // Default funnel notification content
        notificationTitle.textContent = 'Your appointment is starting soon!';
        notificationMessage.textContent = 'Click here to make sure you\'re ready for the call.';
        notification.onclick = () => window.location.href = 'waiting-room.html';
    }
}

// Get the notification type from URL parameters
function getNotificationType() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('type') || 'funnel'; // Default to 'funnel' if no type specified
}

// Initialize time and start update interval
updateTime();
setInterval(updateTime, 60000);

// Set the notification content immediately
const notificationType = getNotificationType();
console.log('Initializing notification content for type:', notificationType);
setNotificationContent(notificationType);

// Show the notification after 2 seconds
setTimeout(() => {
    const notification = document.querySelector('.notification');
    console.log('Showing notification');
    notification.style.display = 'block';
}, 2000); 