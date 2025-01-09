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

// Initialize time and start update interval
updateTime();
setInterval(updateTime, 60000);

// Add notification after 2 seconds
setTimeout(() => {
    const notification = document.querySelector('.notification');
    notification.style.display = 'block';
}, 2000); 