class HabitTracker {
    constructor() {
        // console.log('HabitTracker initialized');
        this.initializeTracker();
    }

    initializeTracker() {
        // console.log('Initializing tracker...');
        const buttons = document.querySelectorAll('.check-button');
        // console.log('Found check buttons:', buttons.length);
        
        buttons.forEach(button => {
            button.addEventListener('click', () => this.toggleHabit(button));
        });
    }

    toggleHabit(button) {
        const checkItem = button.closest('.check-item');
        button.classList.toggle('checked');
        
        if (button.classList.contains('checked')) {
            // Add completion animation then hide
            setTimeout(() => {
                this.markAsComplete(button);
                this.checkAllComplete();
            }, 300);
        }
    }

    markAsComplete(button) {
        const checkItem = button.closest('.check-item');
        checkItem.classList.add('completed');
        
        // Check if this habit category is now empty
        const habitChecks = checkItem.closest('.habit-checks');
        const remainingVisible = habitChecks.querySelectorAll('.check-item:not(.completed)').length;
        
        if (remainingVisible === 0) {
            const habitItem = habitChecks.closest('.habit-item');
            habitItem.classList.add('empty');
        }
    }

    checkAllComplete() {
        const remainingTasks = document.querySelectorAll('.check-item:not(.completed)').length;
        const completionMessage = document.querySelector('.completion-message');
        const habitGrid = document.querySelector('.habit-grid');
        
        // console.log('Remaining tasks:', remainingTasks); // Add debug log
        
        if (remainingTasks === 0) {
            completionMessage.style.display = 'flex';
            habitGrid.style.display = 'none';
        } else {
            completionMessage.style.display = 'none';
            habitGrid.style.display = 'grid';
        }
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // console.log('DOM Content Loaded for habit tracker');
    const tracker = new HabitTracker();
});

// Make sure the class is available globally
window.HabitTracker = HabitTracker; 