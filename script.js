/**
 * Smart Study Planner JavaScript
 * 
 * This script handles all functionality for the study planner including:
 * - Task management (create, read, update, delete)
 * - Goal tracking and progress monitoring
 * - Schedule management with calendar view
 * - Local storage for data persistence
 * - Navigation between different sections
 * - Real-time statistics and progress tracking
 */

// ===== GLOBAL VARIABLES AND CONFIGURATION =====

// Application state
let currentTab = 'dashboard';
let currentWeekOffset = 0;
let selectedDate = new Date();

// Data storage keys for localStorage
const STORAGE_KEYS = {
    TASKS: 'studyPlanner_tasks',
    GOALS: 'studyPlanner_goals',
    SETTINGS: 'studyPlanner_settings',
    STATS: 'studyPlanner_stats'
};

// Task and Goal templates
const TASK_TEMPLATE = {
    id: null,
    title: '',
    subject: '',
    description: '',
    dueDate: '',
    dueTime: '',
    priority: 'medium',
    completed: false,
    createdAt: null,
    completedAt: null
};

const GOAL_TEMPLATE = {
    id: null,
    title: '',
    category: '',
    description: '',
    targetDate: '',
    targetValue: 0,
    currentValue: 0,
    unit: 'hours',
    createdAt: null,
    completed: false
};

// ===== DOM ELEMENT REFERENCES =====

const elements = {
    // Navigation
    navTabs: document.querySelectorAll('.nav-tab'),
    contentSections: document.querySelectorAll('.content-section'),
    
    // Dashboard elements
    totalTasks: document.getElementById('total-tasks'),
    completedTasks: document.getElementById('completed-tasks'),
    pendingTasks: document.getElementById('pending-tasks'),
    studyStreak: document.getElementById('study-streak'),
    weeklyProgress: document.getElementById('weekly-progress'),
    weeklyProgressText: document.getElementById('weekly-progress-text'),
    todayTasks: document.getElementById('today-tasks'),
    
    // Task elements
    addTaskBtn: document.getElementById('add-task-btn'),
    quickAddTask: document.getElementById('quick-add-task'),
    addFirstTask: document.getElementById('add-first-task'),
    tasksList: document.getElementById('tasks-list'),
    emptyTasks: document.getElementById('empty-tasks'),
    taskSearch: document.getElementById('task-search'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    
    // Goal elements
    addGoalBtn: document.getElementById('add-goal-btn'),
    quickAddGoal: document.getElementById('quick-add-goal'),
    addFirstGoal: document.getElementById('add-first-goal'),
    goalsContainer: document.getElementById('goals-container'),
    emptyGoals: document.getElementById('empty-goals'),
    
    // Schedule elements
    prevWeek: document.getElementById('prev-week'),
    nextWeek: document.getElementById('next-week'),
    currentWeekDisplay: document.getElementById('current-week-display'),
    weeklyCalendar: document.getElementById('weekly-calendar'),
    timelineDate: document.getElementById('timeline-date'),
    dailyTimeline: document.getElementById('daily-timeline'),
    viewCalendar: document.getElementById('view-calendar'),
    
    // Modal elements
    taskModal: document.getElementById('task-modal'),
    goalModal: document.getElementById('goal-modal'),
    taskForm: document.getElementById('task-form'),
    goalForm: document.getElementById('goal-form'),
    closeTaskModal: document.getElementById('close-task-modal'),
    closeGoalModal: document.getElementById('close-goal-modal'),
    cancelTask: document.getElementById('cancel-task'),
    cancelGoal: document.getElementById('cancel-goal'),
    
    // Toast notification
    toast: document.getElementById('notification-toast'),
    toastIcon: document.querySelector('.toast-icon'),
    toastMessage: document.querySelector('.toast-message')
};

// ===== INITIALIZATION =====

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Smart Study Planner initialized');
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load data from localStorage
    loadDataFromStorage();
    
    // Set up initial UI state
    setupInitialState();
    
    // Update dashboard statistics
    updateDashboardStats();
    
    // Show dashboard by default
    showTab('dashboard');
});

/**
 * Set up all event listeners
 */
function initializeEventListeners() {
    // Navigation event listeners
    elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            showTab(tabName);
        });
    });
    
    // Task-related event listeners
    elements.addTaskBtn?.addEventListener('click', () => openTaskModal());
    elements.quickAddTask?.addEventListener('click', () => openTaskModal());
    elements.addFirstTask?.addEventListener('click', () => openTaskModal());
    elements.closeTaskModal?.addEventListener('click', () => closeTaskModal());
    elements.cancelTask?.addEventListener('click', () => closeTaskModal());
    elements.taskForm?.addEventListener('submit', handleTaskSubmit);
    elements.taskSearch?.addEventListener('input', handleTaskSearch);
    
    // Goal-related event listeners
    elements.addGoalBtn?.addEventListener('click', () => openGoalModal());
    elements.quickAddGoal?.addEventListener('click', () => openGoalModal());
    elements.addFirstGoal?.addEventListener('click', () => openGoalModal());
    elements.closeGoalModal?.addEventListener('click', () => closeGoalModal());
    elements.cancelGoal?.addEventListener('click', () => closeGoalModal());
    elements.goalForm?.addEventListener('submit', handleGoalSubmit);
    
    // Schedule-related event listeners
    elements.prevWeek?.addEventListener('click', () => navigateWeek(-1));
    elements.nextWeek?.addEventListener('click', () => navigateWeek(1));
    elements.timelineDate?.addEventListener('change', handleTimelineDateChange);
    elements.viewCalendar?.addEventListener('click', () => showTab('schedule'));
    
    // Filter buttons
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterTasks(btn.dataset.filter);
        });
    });
    
    // Modal backdrop click to close
    elements.taskModal?.addEventListener('click', (e) => {
        if (e.target === elements.taskModal) closeTaskModal();
    });
    
    elements.goalModal?.addEventListener('click', (e) => {
        if (e.target === elements.goalModal) closeGoalModal();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Set up initial application state
 */
function setupInitialState() {
    // Set today's date for timeline
    if (elements.timelineDate) {
        elements.timelineDate.value = formatDateForInput(new Date());
    }
    
    // Update current week display
    updateWeekDisplay();
    
    // Initialize calendar
    renderWeeklyCalendar();
    
    // Initialize timeline
    renderDailyTimeline(new Date());
}

// ===== DATA MANAGEMENT =====

/**
 * Load data from localStorage
 */
function loadDataFromStorage() {
    try {
        // Load tasks
        const tasksData = localStorage.getItem(STORAGE_KEYS.TASKS);
        window.tasks = tasksData ? JSON.parse(tasksData) : [];
        
        // Load goals
        const goalsData = localStorage.getItem(STORAGE_KEYS.GOALS);
        window.goals = goalsData ? JSON.parse(goalsData) : [];
        
        // Load settings
        const settingsData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        window.settings = settingsData ? JSON.parse(settingsData) : {
            theme: 'light',
            notifications: true,
            weekStartsOn: 1 // Monday
        };
        
        console.log('Data loaded from localStorage');
    } catch (error) {
        console.error('Error loading data from localStorage:', error);
        // Initialize with empty data if loading fails
        window.tasks = [];
        window.goals = [];
        window.settings = { theme: 'light', notifications: true, weekStartsOn: 1 };
    }
}

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {*} data - Data to save
 */
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`Data saved to localStorage: ${key}`);
    } catch (error) {
        console.error(`Error saving to localStorage (${key}):`, error);
        showNotification('Failed to save data', 'error');
    }
}

/**
 * Generate unique ID for tasks and goals
 * @returns {string} Unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== NAVIGATION FUNCTIONS =====

/**
 * Show specific tab and hide others
 * @param {string} tabName - Name of tab to show
 */
function showTab(tabName) {
    // Update navigation state
    elements.navTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Show/hide content sections
    elements.contentSections.forEach(section => {
        section.classList.toggle('active', section.id === tabName);
    });
    
    currentTab = tabName;
    
    // Load tab-specific data
    switch (tabName) {
        case 'dashboard':
            updateDashboardStats();
            renderTodayTasks();
            break;
        case 'tasks':
            renderTasksList();
            break;
        case 'schedule':
            renderWeeklyCalendar();
            renderDailyTimeline(selectedDate);
            break;
        case 'goals':
            renderGoalsList();
            break;
    }
}

// ===== TASK MANAGEMENT FUNCTIONS =====

/**
 * Open task modal for creating new task
 */
function openTaskModal(taskId = null) {
    const modal = elements.taskModal;
    const form = elements.taskForm;
    const title = modal.querySelector('.modal-title');
    
    if (taskId) {
        // Edit existing task
        const task = window.tasks.find(t => t.id === taskId);
        if (task) {
            title.textContent = 'Edit Task';
            populateTaskForm(task);
        }
    } else {
        // Create new task
        title.textContent = 'Add New Task';
        form.reset();
        // Set default due date to today
        const today = formatDateForInput(new Date());
        document.getElementById('task-date').value = today;
    }
    
    modal.classList.add('active');
    document.getElementById('task-title').focus();
}

/**
 * Close task modal
 */
function closeTaskModal() {
    elements.taskModal.classList.remove('active');
    elements.taskForm.reset();
}

/**
 * Populate task form with existing task data
 * @param {Object} task - Task object
 */
function populateTaskForm(task) {
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-subject').value = task.subject;
    document.getElementById('task-date').value = task.dueDate;
    document.getElementById('task-time').value = task.dueTime || '';
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-description').value = task.description || '';
    
    // Store task ID for editing
    elements.taskForm.dataset.editingId = task.id;
}

/**
 * Handle task form submission
 * @param {Event} e - Form submit event
 */
function handleTaskSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const editingId = e.target.dataset.editingId;
    
    const taskData = {
        title: document.getElementById('task-title').value.trim(),
        subject: document.getElementById('task-subject').value,
        dueDate: document.getElementById('task-date').value,
        dueTime: document.getElementById('task-time').value,
        priority: document.getElementById('task-priority').value,
        description: document.getElementById('task-description').value.trim()
    };
    
    // Validate required fields
    if (!taskData.title || !taskData.subject || !taskData.dueDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (editingId) {
        // Update existing task
        updateTask(editingId, taskData);
        showNotification('Task updated successfully', 'success');
    } else {
        // Create new task
        createTask(taskData);
        showNotification('Task created successfully', 'success');
    }
    
    closeTaskModal();
    
    // Refresh current view
    if (currentTab === 'tasks') {
        renderTasksList();
    } else if (currentTab === 'dashboard') {
        updateDashboardStats();
        renderTodayTasks();
    }
    
    // Update calendar if on schedule tab
    if (currentTab === 'schedule') {
        renderWeeklyCalendar();
        renderDailyTimeline(selectedDate);
    }
}

/**
 * Create new task
 * @param {Object} taskData - Task data from form
 */
function createTask(taskData) {
    const task = {
        ...TASK_TEMPLATE,
        ...taskData,
        id: generateId(),
        createdAt: new Date().toISOString(),
        completed: false
    };
    
    window.tasks.push(task);
    saveToStorage(STORAGE_KEYS.TASKS, window.tasks);
    
    console.log('Task created:', task);
}

/**
 * Update existing task
 * @param {string} taskId - Task ID
 * @param {Object} taskData - Updated task data
 */
function updateTask(taskId, taskData) {
    const taskIndex = window.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        window.tasks[taskIndex] = {
            ...window.tasks[taskIndex],
            ...taskData
        };
        saveToStorage(STORAGE_KEYS.TASKS, window.tasks);
        console.log('Task updated:', taskId);
    }
}

/**
 * Delete task
 * @param {string} taskId - Task ID to delete
 */
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        window.tasks = window.tasks.filter(t => t.id !== taskId);
        saveToStorage(STORAGE_KEYS.TASKS, window.tasks);
        
        showNotification('Task deleted successfully', 'success');
        
        // Refresh current view
        if (currentTab === 'tasks') {
            renderTasksList();
        } else if (currentTab === 'dashboard') {
            updateDashboardStats();
            renderTodayTasks();
        }
    }
}

/**
 * Toggle task completion status
 * @param {string} taskId - Task ID
 */
function toggleTaskCompletion(taskId) {
    const task = window.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        
        saveToStorage(STORAGE_KEYS.TASKS, window.tasks);
        
        const status = task.completed ? 'completed' : 'reopened';
        showNotification(`Task ${status}`, 'success');
        
        // Refresh views
        if (currentTab === 'tasks') {
            renderTasksList();
        } else if (currentTab === 'dashboard') {
            updateDashboardStats();
            renderTodayTasks();
        }
    }
}

/**
 * Render tasks list
 */
function renderTasksList() {
    const container = elements.tasksList;
    const emptyState = elements.emptyTasks;
    
    if (!window.tasks || window.tasks.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Sort tasks by due date and priority
    const sortedTasks = [...window.tasks].sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed - b.completed; // Completed tasks last
        }
        
        if (a.dueDate !== b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    container.innerHTML = sortedTasks.map(task => createTaskHTML(task)).join('');
    
    // Add event listeners to task items
    addTaskEventListeners();
}

/**
 * Create HTML for a single task
 * @param {Object} task - Task object
 * @returns {string} HTML string
 */
function createTaskHTML(task) {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const isOverdue = dueDate < today && !task.completed;
    const isToday = dueDate.toDateString() === today.toDateString();
    
    let dueDateText = formatDate(dueDate);
    if (isToday) dueDateText = 'Today';
    if (isOverdue) dueDateText = 'Overdue';
    
    const priorityClass = task.priority;
    const completedClass = task.completed ? 'completed' : '';
    
    return `
        <div class="task-item ${priorityClass}-priority ${completedClass}" data-task-id="${task.id}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <h4 class="task-title ${task.completed ? 'completed' : ''}">${escapeHtml(task.title)}</h4>
                <div class="task-meta">
                    <span class="task-subject">${escapeHtml(task.subject)}</span>
                    <span class="task-due ${isOverdue ? 'overdue' : ''}">
                        <i class="fas fa-calendar"></i>
                        ${dueDateText}
                        ${task.dueTime ? `at ${task.dueTime}` : ''}
                    </span>
                    <span class="task-priority ${task.priority}">${task.priority}</span>
                </div>
                ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
            </div>
            <div class="task-actions">
                <button class="task-action-btn edit" title="Edit Task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-action-btn delete" title="Delete Task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Add event listeners to task items
 */
function addTaskEventListeners() {
    // Checkbox toggle
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const taskId = e.target.closest('.task-item').dataset.taskId;
            toggleTaskCompletion(taskId);
        });
    });
    
    // Edit button
    document.querySelectorAll('.task-action-btn.edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.target.closest('.task-item').dataset.taskId;
            openTaskModal(taskId);
        });
    });
    
    // Delete button
    document.querySelectorAll('.task-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.target.closest('.task-item').dataset.taskId;
            deleteTask(taskId);
        });
    });
}

/**
 * Filter tasks based on status
 * @param {string} filter - Filter type (all, pending, completed, overdue)
 */
function filterTasks(filter) {
    const taskItems = document.querySelectorAll('.task-item');
    const today = new Date();
    
    taskItems.forEach(item => {
        const taskId = item.dataset.taskId;
        const task = window.tasks.find(t => t.id === taskId);
        
        if (!task) return;
        
        let show = false;
        
        switch (filter) {
            case 'all':
                show = true;
                break;
            case 'pending':
                show = !task.completed;
                break;
            case 'completed':
                show = task.completed;
                break;
            case 'overdue':
                show = new Date(task.dueDate) < today && !task.completed;
                break;
        }
        
        item.style.display = show ? 'flex' : 'none';
    });
}

/**
 * Handle task search
 * @param {Event} e - Input event
 */
function handleTaskSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const taskItems = document.querySelectorAll('.task-item');
    
    taskItems.forEach(item => {
        const taskId = item.dataset.taskId;
        const task = window.tasks.find(t => t.id === taskId);
        
        if (!task) return;
        
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
                             task.subject.toLowerCase().includes(searchTerm) ||
                             (task.description && task.description.toLowerCase().includes(searchTerm));
        
        item.style.display = matchesSearch ? 'flex' : 'none';
    });
}

// ===== GOAL MANAGEMENT FUNCTIONS =====

/**
 * Open goal modal for creating new goal
 */
function openGoalModal(goalId = null) {
    const modal = elements.goalModal;
    const form = elements.goalForm;
    const title = modal.querySelector('.modal-title');
    
    if (goalId) {
        // Edit existing goal
        const goal = window.goals.find(g => g.id === goalId);
        if (goal) {
            title.textContent = 'Edit Goal';
            populateGoalForm(goal);
        }
    } else {
        // Create new goal
        title.textContent = 'Add New Goal';
        form.reset();
        // Set default target date to one month from now
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        document.getElementById('goal-target-date').value = formatDateForInput(futureDate);
    }
    
    modal.classList.add('active');
    document.getElementById('goal-title').focus();
}

/**
 * Close goal modal
 */
function closeGoalModal() {
    elements.goalModal.classList.remove('active');
    elements.goalForm.reset();
}

/**
 * Populate goal form with existing goal data
 * @param {Object} goal - Goal object
 */
function populateGoalForm(goal) {
    document.getElementById('goal-title').value = goal.title;
    document.getElementById('goal-category').value = goal.category;
    document.getElementById('goal-target-date').value = goal.targetDate;
    document.getElementById('goal-target-value').value = goal.targetValue;
    document.getElementById('goal-unit').value = goal.unit;
    document.getElementById('goal-description').value = goal.description || '';
    
    // Store goal ID for editing
    elements.goalForm.dataset.editingId = goal.id;
}

/**
 * Handle goal form submission
 * @param {Event} e - Form submit event
 */
function handleGoalSubmit(e) {
    e.preventDefault();
    
    const editingId = e.target.dataset.editingId;
    
    const goalData = {
        title: document.getElementById('goal-title').value.trim(),
        category: document.getElementById('goal-category').value,
        targetDate: document.getElementById('goal-target-date').value,
        targetValue: parseInt(document.getElementById('goal-target-value').value),
        unit: document.getElementById('goal-unit').value,
        description: document.getElementById('goal-description').value.trim()
    };
    
    // Validate required fields
    if (!goalData.title || !goalData.category || !goalData.targetDate || !goalData.targetValue) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (editingId) {
        // Update existing goal
        updateGoal(editingId, goalData);
        showNotification('Goal updated successfully', 'success');
    } else {
        // Create new goal
        createGoal(goalData);
        showNotification('Goal created successfully', 'success');
    }
    
    closeGoalModal();
    
    // Refresh goals view
    if (currentTab === 'goals') {
        renderGoalsList();
    } else if (currentTab === 'dashboard') {
        updateDashboardStats();
    }
}

/**
 * Create new goal
 * @param {Object} goalData - Goal data from form
 */
function createGoal(goalData) {
    const goal = {
        ...GOAL_TEMPLATE,
        ...goalData,
        id: generateId(),
        createdAt: new Date().toISOString(),
        currentValue: 0,
        completed: false
    };
    
    window.goals.push(goal);
    saveToStorage(STORAGE_KEYS.GOALS, window.goals);
    
    console.log('Goal created:', goal);
}

/**
 * Update existing goal
 * @param {string} goalId - Goal ID
 * @param {Object} goalData - Updated goal data
 */
function updateGoal(goalId, goalData) {
    const goalIndex = window.goals.findIndex(g => g.id === goalId);
    if (goalIndex !== -1) {
        window.goals[goalIndex] = {
            ...window.goals[goalIndex],
            ...goalData
        };
        saveToStorage(STORAGE_KEYS.GOALS, window.goals);
        console.log('Goal updated:', goalId);
    }
}

/**
 * Delete goal
 * @param {string} goalId - Goal ID to delete
 */
function deleteGoal(goalId) {
    if (confirm('Are you sure you want to delete this goal?')) {
        window.goals = window.goals.filter(g => g.id !== goalId);
        saveToStorage(STORAGE_KEYS.GOALS, window.goals);
        
        showNotification('Goal deleted successfully', 'success');
        renderGoalsList();
    }
}

/**
 * Update goal progress
 * @param {string} goalId - Goal ID
 * @param {number} newValue - New progress value
 */
function updateGoalProgress(goalId, newValue) {
    const goal = window.goals.find(g => g.id === goalId);
    if (goal) {
        goal.currentValue = Math.max(0, newValue);
        goal.completed = goal.currentValue >= goal.targetValue;
        
        saveToStorage(STORAGE_KEYS.GOALS, window.goals);
        renderGoalsList();
        
        if (goal.completed) {
            showNotification('Congratulations! Goal completed! 🎉', 'success');
        }
    }
}

/**
 * Render goals list
 */
function renderGoalsList() {
    const container = elements.goalsContainer;
    const emptyState = elements.emptyGoals;
    
    if (!window.goals || window.goals.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Sort goals by target date and completion status
    const sortedGoals = [...window.goals].sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed - b.completed; // Completed goals last
        }
        return new Date(a.targetDate) - new Date(b.targetDate);
    });
    
    container.innerHTML = sortedGoals.map(goal => createGoalHTML(goal)).join('');
    
    // Add event listeners to goal items
    addGoalEventListeners();
}

/**
 * Create HTML for a single goal
 * @param {Object} goal - Goal object
 * @returns {string} HTML string
 */
function createGoalHTML(goal) {
    const targetDate = new Date(goal.targetDate);
    const today = new Date();
    const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    const progressPercent = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
    
    let dateStatus = '';
    if (goal.completed) {
        dateStatus = 'Completed';
    } else if (daysRemaining < 0) {
        dateStatus = 'Overdue';
    } else if (daysRemaining === 0) {
        dateStatus = 'Due Today';
    } else {
        dateStatus = `${daysRemaining} days left`;
    }
    
    return `
        <div class="goal-card ${goal.completed ? 'completed' : ''}" data-goal-id="${goal.id}">
            <div class="goal-header">
                <div>
                    <h4 class="goal-title">${escapeHtml(goal.title)}</h4>
                    <span class="goal-category">${escapeHtml(goal.category)}</span>
                </div>
            </div>
            
            <div class="goal-progress">
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="goal-progress-text">
                    <span class="goal-current">${goal.currentValue} / ${goal.targetValue} ${goal.unit}</span>
                    <span class="goal-target">${progressPercent.toFixed(1)}%</span>
                </div>
            </div>
            
            <div class="goal-meta">
                <span class="goal-due">
                    <i class="fas fa-calendar"></i>
                    ${dateStatus}
                </span>
            </div>
            
            ${goal.description ? `<p class="goal-description">${escapeHtml(goal.description)}</p>` : ''}
            
            <div class="goal-actions">
                <button class="goal-action-btn progress" title="Update Progress">
                    <i class="fas fa-plus"></i> Progress
                </button>
                <button class="goal-action-btn edit" title="Edit Goal">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="goal-action-btn delete" title="Delete Goal">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Add event listeners to goal items
 */
function addGoalEventListeners() {
    // Progress button
    document.querySelectorAll('.goal-action-btn.progress').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const goalId = e.target.closest('.goal-card').dataset.goalId;
            const goal = window.goals.find(g => g.id === goalId);
            if (goal) {
                const newValue = prompt(`Update progress for "${goal.title}"\nCurrent: ${goal.currentValue} ${goal.unit}\nEnter new value:`, goal.currentValue);
                if (newValue !== null && !isNaN(newValue)) {
                    updateGoalProgress(goalId, parseInt(newValue));
                }
            }
        });
    });
    
    // Edit button
    document.querySelectorAll('.goal-action-btn.edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const goalId = e.target.closest('.goal-card').dataset.goalId;
            openGoalModal(goalId);
        });
    });
    
    // Delete button
    document.querySelectorAll('.goal-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const goalId = e.target.closest('.goal-card').dataset.goalId;
            deleteGoal(goalId);
        });
    });
}

// ===== SCHEDULE FUNCTIONS =====

/**
 * Navigate to different week
 * @param {number} direction - -1 for previous week, 1 for next week
 */
function navigateWeek(direction) {
    currentWeekOffset += direction;
    updateWeekDisplay();
    renderWeeklyCalendar();
}

/**
 * Update week display text
 */
function updateWeekDisplay() {
    const weekStart = getWeekStart(currentWeekOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    let displayText;
    if (currentWeekOffset === 0) {
        displayText = 'This Week';
    } else if (currentWeekOffset === -1) {
        displayText = 'Last Week';
    } else if (currentWeekOffset === 1) {
        displayText = 'Next Week';
    } else {
        displayText = `${formatDate(weekStart, { month: 'short', day: 'numeric' })} - ${formatDate(weekEnd, { month: 'short', day: 'numeric' })}`;
    }
    
    if (elements.currentWeekDisplay) {
        elements.currentWeekDisplay.textContent = displayText;
    }
}

/**
 * Get start of week for given offset
 * @param {number} offset - Week offset from current week
 * @returns {Date} Start of week date
 */
function getWeekStart(offset = 0) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + (offset * 7));
    monday.setHours(0, 0, 0, 0);
    
    return monday;
}

/**
 * Render weekly calendar
 */
function renderWeeklyCalendar() {
    const container = elements.weeklyCalendar;
    if (!container) return;
    
    const weekStart = getWeekStart(currentWeekOffset);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    
    let html = '';
    
    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(weekStart);
        currentDay.setDate(weekStart.getDate() + i);
        
        const isToday = currentDay.toDateString() === today.toDateString();
        const dayTasks = getTasksForDate(currentDay);
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}">
                <div class="day-header">
                    <div class="day-name">${days[i]}</div>
                    <div class="day-number">${currentDay.getDate()}</div>
                </div>
                <div class="day-tasks">
                    ${dayTasks.map(task => `
                        <div class="calendar-task ${task.completed ? 'completed' : ''}" title="${escapeHtml(task.title)}">
                            ${escapeHtml(task.title)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

/**
 * Handle timeline date change
 * @param {Event} e - Change event
 */
function handleTimelineDateChange(e) {
    const newDate = new Date(e.target.value);
    selectedDate = newDate;
    renderDailyTimeline(newDate);
}

/**
 * Render daily timeline for specific date
 * @param {Date} date - Date to render timeline for
 */
function renderDailyTimeline(date) {
    const container = elements.dailyTimeline;
    if (!container) return;
    
    const dayTasks = getTasksForDate(date);
    
    if (dayTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-timeline">
                <p>No tasks scheduled for ${formatDate(date)}</p>
            </div>
        `;
        return;
    }
    
    // Sort tasks by time
    const sortedTasks = dayTasks.sort((a, b) => {
        const timeA = a.dueTime || '23:59';
        const timeB = b.dueTime || '23:59';
        return timeA.localeCompare(timeB);
    });
    
    const html = sortedTasks.map(task => `
        <div class="timeline-item ${task.completed ? 'completed' : ''}">
            <div class="timeline-time">${task.dueTime || 'All day'}</div>
            <div class="timeline-content">
                <div class="timeline-title">${escapeHtml(task.title)}</div>
                <span class="timeline-subject">${escapeHtml(task.subject)}</span>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

/**
 * Get tasks for specific date
 * @param {Date} date - Date to get tasks for
 * @returns {Array} Array of tasks for the date
 */
function getTasksForDate(date) {
    const dateString = formatDateForInput(date);
    return window.tasks.filter(task => task.dueDate === dateString);
}

// ===== DASHBOARD FUNCTIONS =====

/**
 * Update dashboard statistics
 */
function updateDashboardStats() {
    if (!window.tasks) return;
    
    const totalTasks = window.tasks.length;
    const completedTasks = window.tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const studyStreak = calculateStudyStreak();
    
    // Update stat displays
    if (elements.totalTasks) elements.totalTasks.textContent = totalTasks;
    if (elements.completedTasks) elements.completedTasks.textContent = completedTasks;
    if (elements.pendingTasks) elements.pendingTasks.textContent = pendingTasks;
    if (elements.studyStreak) elements.studyStreak.textContent = studyStreak;
    
    // Update weekly progress
    updateWeeklyProgress();
}

/**
 * Calculate study streak (consecutive days with completed tasks)
 * @returns {number} Number of consecutive days
 */
function calculateStudyStreak() {
    if (!window.tasks || window.tasks.length === 0) return 0;
    
    const completedTasks = window.tasks.filter(task => task.completed && task.completedAt);
    if (completedTasks.length === 0) return 0;
    
    // Group completed tasks by date
    const tasksByDate = {};
    completedTasks.forEach(task => {
        const date = new Date(task.completedAt).toDateString();
        if (!tasksByDate[date]) {
            tasksByDate[date] = [];
        }
        tasksByDate[date].push(task);
    });
    
    const completionDates = Object.keys(tasksByDate).sort((a, b) => new Date(b) - new Date(a));
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const dateStr of completionDates) {
        const taskDate = new Date(dateStr);
        const daysDiff = Math.floor((currentDate - taskDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
            streak++;
        } else if (daysDiff > streak) {
            break;
        }
    }
    
    return streak;
}

/**
 * Update weekly progress calculation
 */
function updateWeeklyProgress() {
    const weekStart = getWeekStart(0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekTasks = window.tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate >= weekStart && taskDate <= weekEnd;
    });
    
    const completedWeekTasks = weekTasks.filter(task => task.completed).length;
    const totalWeekTasks = weekTasks.length;
    
    const progressPercent = totalWeekTasks > 0 ? (completedWeekTasks / totalWeekTasks) * 100 : 0;
    
    if (elements.weeklyProgress) {
        elements.weeklyProgress.style.width = `${progressPercent}%`;
    }
    
    if (elements.weeklyProgressText) {
        elements.weeklyProgressText.textContent = `${progressPercent.toFixed(1)}%`;
    }
}

/**
 * Render today's tasks preview on dashboard
 */
function renderTodayTasks() {
    const container = elements.todayTasks;
    if (!container) return;
    
    const today = new Date();
    const todayTasks = getTasksForDate(today);
    
    if (todayTasks.length === 0) {
        container.innerHTML = '<p class="empty-state">No tasks scheduled for today</p>';
        return;
    }
    
    // Sort by time and priority
    const sortedTasks = todayTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed - b.completed;
        }
        
        const timeA = a.dueTime || '23:59';
        const timeB = b.dueTime || '23:59';
        return timeA.localeCompare(timeB);
    });
    
    const html = sortedTasks.slice(0, 5).map(task => `
        <div class="today-task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-info">
                <h5 class="task-title ${task.completed ? 'completed' : ''}">${escapeHtml(task.title)}</h5>
                <span class="task-subject">${escapeHtml(task.subject)}</span>
                ${task.dueTime ? `<span class="task-time">${task.dueTime}</span>` : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    
    // Add event listeners for today's tasks
    container.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const taskId = e.target.closest('.today-task-item').dataset.taskId;
            toggleTaskCompletion(taskId);
        });
    });
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} unsafe - Unsafe string
 * @returns {string} Safe HTML string
 */
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Show notification toast
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    const toast = elements.toast;
    const icon = elements.toastIcon;
    const messageEl = elements.toastMessage;
    
    if (!toast || !icon || !messageEl) return;
    
    // Set icon based on type
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    icon.className = `toast-icon ${icons[type] || icons.info}`;
    messageEl.textContent = message;
    
    // Remove existing type classes and add new one
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + N for new task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openTaskModal();
    }
    
    // Ctrl/Cmd + G for new goal
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        openGoalModal();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        if (elements.taskModal.classList.contains('active')) {
            closeTaskModal();
        }
        if (elements.goalModal.classList.contains('active')) {
            closeGoalModal();
        }
    }
    
    // Tab navigation (1-4)
    if (e.key >= '1' && e.key <= '4' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const tabs = ['dashboard', 'tasks', 'schedule', 'goals'];
        const tabIndex = parseInt(e.key) - 1;
        if (tabs[tabIndex]) {
            showTab(tabs[tabIndex]);
        }
    }
}

// ===== DATA EXPORT/IMPORT FUNCTIONS =====

/**
 * Export data as JSON file
 */
function exportData() {
    const data = {
        tasks: window.tasks || [],
        goals: window.goals || [],
        settings: window.settings || {},
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `study-planner-backup-${formatDateForInput(new Date())}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Data exported successfully', 'success');
}

/**
 * Import data from JSON file
 * @param {File} file - JSON file to import
 */
function importData(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!data.tasks || !data.goals) {
                throw new Error('Invalid backup file format');
            }
            
            // Confirm import
            if (!confirm('This will replace all your current data. Are you sure?')) {
                return;
            }
            
            // Import data
            window.tasks = data.tasks;
            window.goals = data.goals;
            window.settings = data.settings || {};
            
            // Save to localStorage
            saveToStorage(STORAGE_KEYS.TASKS, window.tasks);
            saveToStorage(STORAGE_KEYS.GOALS, window.goals);
            saveToStorage(STORAGE_KEYS.SETTINGS, window.settings);
            
            // Refresh all views
            updateDashboardStats();
            renderTasksList();
            renderGoalsList();
            renderWeeklyCalendar();
            renderDailyTimeline(selectedDate);
            
            showNotification('Data imported successfully', 'success');
            
        } catch (error) {
            console.error('Import error:', error);
            showNotification('Failed to import data. Please check the file format.', 'error');
        }
    };
    
    reader.readAsText(file);
}

// ===== PERFORMANCE OPTIMIZATION =====

/**
 * Debounce function for search and other frequent operations
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
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

// Add debounced search
if (elements.taskSearch) {
    const debouncedSearch = debounce(handleTaskSearch, 300);
    elements.taskSearch.removeEventListener('input', handleTaskSearch);
    elements.taskSearch.addEventListener('input', debouncedSearch);
}

// ===== BACKGROUND TASKS =====

/**
 * Check for overdue tasks and send notifications
 */
function checkOverdueTasks() {
    if (!window.settings?.notifications) return;
    
    const today = new Date();
    const overdueTasks = window.tasks.filter(task => {
        return !task.completed && new Date(task.dueDate) < today;
    });
    
    if (overdueTasks.length > 0) {
        showNotification(`You have ${overdueTasks.length} overdue task(s)`, 'warning');
    }
}

/**
 * Automatic data backup to prevent data loss
 */
function createAutoBackup() {
    const lastBackup = localStorage.getItem('lastAutoBackup');
    const now = Date.now();
    const backupInterval = 24 * 60 * 60 * 1000; // 24 hours
    
    if (!lastBackup || (now - parseInt(lastBackup)) > backupInterval) {
        const backupData = {
            tasks: window.tasks || [],
            goals: window.goals || [],
            settings: window.settings || {},
            timestamp: now
        };
        
        localStorage.setItem('autoBackup', JSON.stringify(backupData));
        localStorage.setItem('lastAutoBackup', now.toString());
        
        console.log('Auto backup created');
    }
}

// ===== SERVICE WORKER REGISTRATION (for offline support) =====

/**
 * Register service worker if available
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    }
}

// ===== PERIODIC TASKS =====

// Run periodic tasks
setInterval(() => {
    checkOverdueTasks();
    createAutoBackup();
}, 60000); // Every minute

// ===== CLEANUP AND ERROR HANDLING =====

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('An unexpected error occurred', 'error');
});

/**
 * Handle JavaScript errors
 */
window.addEventListener('error', function(event) {
    console.error('JavaScript error:', event.error);
    showNotification('Application error occurred', 'error');
});

/**
 * Clean up before page unload
 */
window.addEventListener('beforeunload', function() {
    // Save any pending changes
    if (window.tasks) saveToStorage(STORAGE_KEYS.TASKS, window.tasks);
    if (window.goals) saveToStorage(STORAGE_KEYS.GOALS, window.goals);
    if (window.settings) saveToStorage(STORAGE_KEYS.SETTINGS, window.settings);
});

// ===== INITIALIZATION COMPLETION =====

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Smart Study Planner fully loaded and initialized');
        
        // Optional: Register service worker for offline support
        registerServiceWorker();
        
        // Show welcome message for new users
        setTimeout(() => {
            if (!window.tasks?.length && !window.goals?.length) {
                showNotification('Welcome to Smart Study Planner! Start by adding your first task or goal.', 'info');
            }
        }, 1000);
    });
} else {
    console.log('Smart Study Planner loaded');
}

// Export functions for potential external use or testing
window.StudyPlanner = {
    createTask,
    updateTask,
    deleteTask,
    createGoal,
    updateGoal,
    deleteGoal,
    exportData,
    importData,
    showNotification
};