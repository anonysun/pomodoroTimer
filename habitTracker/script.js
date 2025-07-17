// Habit Tracker Application
class HabitTracker {
    constructor() {
        // Predefined color palette for habits - pastel colors
        this.colors = [
            '#FF6B6B', // Coral Red
            '#4ECDC4', // Teal
            '#45B7D1', // Sky Blue
            '#FFA726', // Orange
            '#66BB6A', // Green
            '#AB47BC'  // Purple
        ];
        
        this.maxHabits = 6;
        
        this.habits = [];
        this.selectedDate = null;
        this.currentDate = new Date();
        this.completedDates = {};
        this.currentEditingHabit = null;
        
        this.init();
    }
    
    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.setupNavigation();
        this.renderHabits();
        this.renderCalendar();
    }
    
    setupNavigation() {
        // Hamburger menu functionality
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.getElementById('nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
            
            // Close menu when clicking on a link
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            });
        }
    }
    
    setupEventListeners() {
        // Add habit functionality
        const habitInput = document.getElementById('habitInput');
        const addHabitBtn = document.getElementById('addHabitBtn');
        
        addHabitBtn.addEventListener('click', () => this.addHabit());
        habitInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addHabit();
            }
        });
        
        // Calendar navigation
        document.getElementById('prevMonthBtn').addEventListener('click', () => this.previousMonth());
        document.getElementById('nextMonthBtn').addEventListener('click', () => this.nextMonth());
        
        // Modal event listeners
        document.getElementById('modalSave').addEventListener('click', () => this.saveHabitEdit());
        document.getElementById('modalDelete').addEventListener('click', () => this.confirmDeleteHabit());
        document.getElementById('modalCancel').addEventListener('click', () => this.closeModal());
        
        // Close modal when clicking outside
        document.getElementById('habitModal').addEventListener('click', (e) => {
            if (e.target.id === 'habitModal') {
                this.closeModal();
            }
        });
    }
    
    addHabit() {
        const habitInput = document.getElementById('habitInput');
        const habitName = habitInput.value.trim();
        
        if (!habitName) {
            alert('Please enter a habit name');
            return;
        }
        
        // Check if maximum habits reached
        if (this.habits.length >= this.maxHabits) {
            this.showCustomAlert(`Maximum ${this.maxHabits} habits allowed`);
            return;
        }
        
        // Check if habit already exists
        if (this.habits.some(habit => habit.name.toLowerCase() === habitName.toLowerCase())) {
            alert('This habit already exists');
            return;
        }
        
        // Create new habit with unique color
        const newHabit = {
            id: Date.now().toString(),
            name: habitName,
            color: this.colors[this.habits.length],
            created: new Date().toISOString()
        };
        
        this.habits.push(newHabit);
        this.saveToStorage();
        this.renderHabits();
        
        // Clear input
        habitInput.value = '';
        habitInput.focus();
    }
    
    toggleHabitForDate(habitId, dateStr) {
        // Check if the date is in the future
        const selectedDate = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate > today) {
            return; // Don't allow checking future dates
        }
        
        if (!this.completedDates[habitId]) {
            this.completedDates[habitId] = {};
        }
        
        if (this.completedDates[habitId][dateStr]) {
            delete this.completedDates[habitId][dateStr];
        } else {
            this.completedDates[habitId][dateStr] = true;
        }
        
        this.saveToStorage();
        this.renderHabits();
        this.renderCalendar();
    }
    
    selectDate(dateStr) {
        // Check if the date is in the future
        const selectedDate = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate > today) {
            return; // Don't allow selecting future dates
        }
        
        this.selectedDate = dateStr;
        this.renderHabits();
        this.renderCalendar();
    }
    
    startLongPress(habitId) {
        this.longPressTimer = setTimeout(() => {
            this.showHabitMenu(habitId);
        }, 500); // 500ms long press
    }
    
    endLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }
    
    showHabitMenu(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;
        
        this.currentEditingHabit = habit;
        
        // Show modal
        const modal = document.getElementById('habitModal');
        const modalInput = document.getElementById('modalInput');
        const modalTitle = document.getElementById('modalTitle');
        
        modalTitle.textContent = 'Edit Habit';
        modalInput.value = habit.name;
        
        modal.classList.add('show');
        modalInput.focus();
        modalInput.select();
    }
    
    closeModal() {
        const modal = document.getElementById('habitModal');
        modal.classList.remove('show');
        this.currentEditingHabit = null;
    }
    
    saveHabitEdit() {
        if (!this.currentEditingHabit) return;
        
        const modalInput = document.getElementById('modalInput');
        const newName = modalInput.value.trim();
        
        if (newName && newName !== this.currentEditingHabit.name) {
            this.currentEditingHabit.name = newName;
            this.saveToStorage();
            this.renderHabits();
        }
        
        this.closeModal();
    }
    
    confirmDeleteHabit() {
        if (!this.currentEditingHabit) return;
        
        this.deleteHabit(this.currentEditingHabit.id);
        this.closeModal();
    }
    
    deleteHabit(habitId) {
        // Remove habit from array
        this.habits = this.habits.filter(habit => habit.id !== habitId);
        
        // Remove all completion data for this habit
        delete this.completedDates[habitId];
        
        // Reassign colors to maintain consistency
        this.habits.forEach((habit, index) => {
            habit.color = this.colors[index];
        });
        
        this.saveToStorage();
        this.renderHabits();
        this.renderCalendar();
    }
    
    renderHabits() {
        const habitsList = document.getElementById('habitsList');
        
        if (this.habits.length === 0) {
            habitsList.innerHTML = '<div class="empty-state">No habits yet. Add your first habit above!</div>';
            return;
        }
        
        const targetDate = this.selectedDate || new Date().toISOString().split('T')[0];
        
        habitsList.innerHTML = this.habits.map(habit => {
            const isCompleted = this.completedDates[habit.id] && this.completedDates[habit.id][targetDate];
            const progressData = this.calculateMonthlyProgress(habit.id);
            
            return `
                <div class="habit-item" 
                     onclick="habitTracker.toggleHabitForDate('${habit.id}', '${targetDate}')"
                     onmousedown="habitTracker.startLongPress('${habit.id}')"
                     onmouseup="habitTracker.endLongPress()"
                     onmouseleave="habitTracker.endLongPress()"
                     ontouchstart="habitTracker.startLongPress('${habit.id}')"
                     ontouchend="habitTracker.endLongPress()">
                    <div class="habit-info">
                        <div class="habit-color" style="background-color: ${habit.color}"></div>
                        <div class="habit-name">${habit.name}</div>
                        <div class="habit-progress">
                            <div class="progress-circle" style="background: conic-gradient(${habit.color} ${progressData.percentage * 3.6}deg, #e5e7eb 0deg)">
                                <div class="progress-text">${progressData.percentage}%</div>
                            </div>
                        </div>
                    </div>
                    <div class="habit-checkbox ${isCompleted ? 'checked' : ''}" 
                         onclick="event.stopPropagation(); habitTracker.toggleHabitForDate('${habit.id}', '${targetDate}')">
                    </div>
                </div>
            `;
        }).join('');
        
        // Update toggle all button
        this.updateToggleAllButton(targetDate);
    }
    
    showCustomAlert(message) {
        // Create alert overlay
        const alertOverlay = document.createElement('div');
        alertOverlay.className = 'custom-alert-overlay';
        
        // Create alert content
        alertOverlay.innerHTML = `
            <div class="custom-alert">
                <div class="alert-icon">⚠️</div>
                <div class="alert-message">${message}</div>
                <button class="alert-button" onclick="this.parentElement.parentElement.remove()">확인</button>
            </div>
        `;
        
        document.body.appendChild(alertOverlay);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (alertOverlay.parentElement) {
                alertOverlay.remove();
            }
        }, 3000);
    }

    renderCalendar() {
        const monthYear = document.getElementById('monthYear');
        const calendarDays = document.getElementById('calendarDays');
        
        // Update month/year display
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        monthYear.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        
        // Generate calendar days
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const today = new Date();
        const isCurrentMonth = (date) => date.getMonth() === this.currentDate.getMonth();
        const isToday = (date) => date.toDateString() === today.toDateString();
        
        let daysHTML = '';
        const totalDays = 42; // 6 rows × 7 days
        
        for (let i = 0; i < totalDays; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dateStr = date.toISOString().split('T')[0];
            
            let dayClass = 'calendar-day';
            
            if (!isCurrentMonth(date)) {
                dayClass += ' other-month';
            }
            
            if (isToday(date)) {
                dayClass += ' today';
            }
            
            // Check if this date is in the future
            const isFuture = date > today;
            if (isFuture) {
                dayClass += ' future-date';
            }
            
            // Generate habit indicators for all habits (only for non-future dates)
            let habitIndicators = '';
            if (!isFuture) {
                this.habits.forEach((habit, index) => {
                    const isCompleted = this.completedDates[habit.id] && this.completedDates[habit.id][dateStr];
                    if (isCompleted) {
                        habitIndicators += `<div class="habit-indicator position-${index}" style="background-color: ${habit.color}"></div>`;
                    }
                });
            }
            
            // Add selected class if this is the selected date
            if (this.selectedDate === dateStr) {
                dayClass += ' selected';
            }
            
            const clickHandler = isFuture ? '' : `onclick="habitTracker.selectDate('${dateStr}')"`;
            
            daysHTML += `
                <div class="${dayClass}" data-date="${dateStr}" ${clickHandler}>
                    <div class="calendar-date">${date.getDate()}</div>
                    <div class="habit-indicators">
                        ${habitIndicators}
                    </div>
                </div>
            `;
        }
        
        calendarDays.innerHTML = daysHTML;
        
        // Add instructions if no habit is selected
        this.updateInstructions();
    }
    
    updateInstructions() {
        // Remove instructions - no longer needed
    }
    
    calculateMonthlyProgress(habitId) {
        const currentYear = this.currentDate.getFullYear();
        const currentMonth = this.currentDate.getMonth();
        const today = new Date();
        
        // Get the first day of the current month
        const firstDay = new Date(currentYear, currentMonth, 1);
        
        // Get the last day to count (either today or the last day of the month)
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const endDate = today < lastDay ? today : lastDay;
        
        let totalDays = 0;
        let completedDays = 0;
        
        // Count days from the first day of the month to today (or end of month)
        for (let date = new Date(firstDay); date <= endDate; date.setDate(date.getDate() + 1)) {
            totalDays++;
            const dateStr = date.toISOString().split('T')[0];
            
            if (this.completedDates[habitId] && this.completedDates[habitId][dateStr]) {
                completedDays++;
            }
        }
        
        const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
        
        return {
            completed: completedDays,
            total: totalDays,
            percentage: percentage
        };
    }

    updateToggleAllButton(targetDate) {
        const toggleAllCheckbox = document.getElementById('toggleAllCheckbox');
        if (this.habits.length === 0) {
            toggleAllCheckbox.style.display = 'none';
            return;
        }
        
        toggleAllCheckbox.style.display = 'flex';
        
        // Check if all habits are completed for the target date
        const allCompleted = this.habits.every(habit => 
            this.completedDates[habit.id] && this.completedDates[habit.id][targetDate]
        );
        
        if (allCompleted) {
            toggleAllCheckbox.classList.add('all-checked');
            toggleAllCheckbox.querySelector('.toggle-all-text').textContent = 'Uncheck All';
        } else {
            toggleAllCheckbox.classList.remove('all-checked');
            toggleAllCheckbox.querySelector('.toggle-all-text').textContent = 'Check All';
        }
    }
    
    toggleAllHabits() {
        if (this.habits.length === 0) return;
        
        const targetDate = this.selectedDate || new Date().toISOString().split('T')[0];
        
        // Check if all habits are completed
        const allCompleted = this.habits.every(habit => 
            this.completedDates[habit.id] && this.completedDates[habit.id][targetDate]
        );
        
        // Toggle all habits
        this.habits.forEach(habit => {
            if (!this.completedDates[habit.id]) {
                this.completedDates[habit.id] = {};
            }
            
            if (allCompleted) {
                // Uncheck all
                delete this.completedDates[habit.id][targetDate];
            } else {
                // Check all
                this.completedDates[habit.id][targetDate] = true;
            }
        });
        
        this.saveToStorage();
        this.renderHabits();
        this.renderCalendar();
    }
    
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }
    
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }
    
    saveToStorage() {
        const data = {
            habits: this.habits,
            completedDates: this.completedDates
        };
        
        localStorage.setItem('habitTracker', JSON.stringify(data));
    }
    
    loadFromStorage() {
        const data = localStorage.getItem('habitTracker');
        
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.habits = parsed.habits || [];
                this.completedDates = parsed.completedDates || {};
            } catch (error) {
                console.error('Error loading data from localStorage:', error);
                this.habits = [];
                this.completedDates = {};
            }
        }
    }
}

// Initialize the application when the page loads
let habitTracker;

document.addEventListener('DOMContentLoaded', () => {
    habitTracker = new HabitTracker();
});
