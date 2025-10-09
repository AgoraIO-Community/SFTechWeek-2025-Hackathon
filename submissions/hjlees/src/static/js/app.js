// Main application JavaScript

// API endpoints
const API = {
    chat: '/api/chat',
    chatReset: '/api/chat/reset',
    todos: '/api/todos',
    reminders: '/api/reminders',
    tts: '/api/tts',
};

// State management
const state = {
    currentTab: 'chat',
    sessionId: generateSessionId(),
    todos: [],
    reminders: []
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeChat();
    initializeTodos();
    initializeReminders();
});

// Tab management
function initializeTabs() {
    const tabButtons = document.querySelectorAll('[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Update active button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}Tab`).classList.add('active');
            
            state.currentTab = tabName;
            
            // Load data for the tab
            if (tabName === 'todos') loadTodos();
            if (tabName === 'reminders') loadReminders();
        });
    });
}

// Chat functionality
function initializeChat() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    resetBtn.addEventListener('click', resetChat);
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat('user', message);
    input.value = '';
    
    // Show loading
    showLoading(true);
    
    try {
        const response = await fetch(API.chat, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                session_id: state.sessionId
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            addMessageToChat('assistant', `Error: ${data.error}`);
        } else {
            addMessageToChat('assistant', data.response);
            
            // Optionally play TTS
            if (shouldPlayTTS()) {
                playTTS(data.response);
            }
        }
    } catch (error) {
        console.error('Error sending message:', error);
        addMessageToChat('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
        showLoading(false);
    }
}

function addMessageToChat(role, content) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (role === 'user') {
        contentDiv.innerHTML = `<strong>You:</strong> ${content}`;
    } else {
        contentDiv.innerHTML = `<strong>Luna:</strong> ${content}`;
    }
    
    messageDiv.appendChild(contentDiv);
    messagesDiv.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function resetChat() {
    if (!confirm('Are you sure you want to reset the conversation?')) return;
    
    showLoading(true);
    
    try {
        await fetch(API.chatReset, { method: 'POST' });
        
        // Clear chat UI
        const messagesDiv = document.getElementById('chatMessages');
        messagesDiv.innerHTML = `
            <div class="message assistant">
                <div class="message-content">
                    <strong>Luna:</strong> Hello! I'm Luna, your personal productivity assistant. 
                    I can help you manage todos, set reminders, and stay organized. How can I help you today?
                </div>
            </div>
        `;
        
        // Generate new session ID
        state.sessionId = generateSessionId();
    } catch (error) {
        console.error('Error resetting chat:', error);
        alert('Failed to reset chat');
    } finally {
        showLoading(false);
    }
}

// Todos functionality
function initializeTodos() {
    const filterButtons = document.querySelectorAll('[data-filter]');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filter = button.dataset.filter;
            filterTodos(filter);
        });
    });
}

async function loadTodos() {
    showLoading(true);
    
    try {
        const response = await fetch(API.todos);
        const data = await response.json();
        
        if (data.error) {
            console.error('Error loading todos:', data.error);
        } else {
            state.todos = data.todos;
            renderTodos(state.todos);
        }
    } catch (error) {
        console.error('Error loading todos:', error);
    } finally {
        showLoading(false);
    }
}

function renderTodos(todos) {
    const todosList = document.getElementById('todosList');
    
    if (!todos || todos.length === 0) {
        todosList.innerHTML = `
            <div class="text-center text-muted p-5">
                <i class="fas fa-inbox fa-3x mb-3"></i>
                <p>No todos yet. Ask Luna to create one for you!</p>
            </div>
        `;
        return;
    }
    
    todosList.innerHTML = todos.map(todo => {
        const priorityClass = `priority-${todo.priority}`;
        const completedClass = todo.completed ? 'text-decoration-line-through text-muted' : '';
        const dueDate = todo.due_date ? new Date(todo.due_date).toLocaleDateString() : 'No due date';
        
        return `
            <div class="list-group-item">
                <div class="todo-item">
                    <div class="${completedClass}">
                        <h5>${todo.completed ? '✓' : '○'} ${todo.title}</h5>
                        ${todo.description ? `<p class="mb-1">${todo.description}</p>` : ''}
                        <small class="text-muted">Due: ${dueDate}</small>
                    </div>
                    <span class="todo-priority ${priorityClass}">${todo.priority}</span>
                </div>
            </div>
        `;
    }).join('');
}

function filterTodos(filter) {
    let filteredTodos = state.todos;
    
    if (filter === 'active') {
        filteredTodos = state.todos.filter(todo => !todo.completed);
    } else if (filter === 'completed') {
        filteredTodos = state.todos.filter(todo => todo.completed);
    }
    
    renderTodos(filteredTodos);
}

// Reminders functionality
function initializeReminders() {
    // Reminders will be loaded when the tab is opened
}

async function loadReminders() {
    showLoading(true);
    
    try {
        const response = await fetch(API.reminders);
        const data = await response.json();
        
        if (data.error) {
            console.error('Error loading reminders:', data.error);
        } else {
            state.reminders = data.reminders;
            renderReminders(state.reminders);
        }
    } catch (error) {
        console.error('Error loading reminders:', error);
    } finally {
        showLoading(false);
    }
}

function renderReminders(reminders) {
    const remindersList = document.getElementById('remindersList');
    
    if (!reminders || reminders.length === 0) {
        remindersList.innerHTML = `
            <div class="text-center text-muted p-5">
                <i class="fas fa-bell-slash fa-3x mb-3"></i>
                <p>No reminders yet. Ask Luna to create one for you!</p>
            </div>
        `;
        return;
    }
    
    remindersList.innerHTML = reminders.map(reminder => {
        const importanceClass = `priority-${reminder.importance}`;
        const reminderDate = reminder.reminder_date 
            ? new Date(reminder.reminder_date).toLocaleString() 
            : 'No date set';
        
        return `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5><i class="fas fa-bell me-2"></i>${reminder.reminder_text}</h5>
                        <small class="text-muted">${reminderDate}</small>
                    </div>
                    <span class="todo-priority ${importanceClass}">${reminder.importance}</span>
                </div>
            </div>
        `;
    }).join('');
}

// TTS functionality
async function playTTS(text) {
    try {
        const response = await fetch(API.tts, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });
        
        if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
        }
    } catch (error) {
        console.error('Error playing TTS:', error);
    }
}

function shouldPlayTTS() {
    // Check if TTS is enabled (could be a user preference)
    return true; // Enable TTS so Luna can speak
}

// Utility functions
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.remove('d-none');
    } else {
        spinner.classList.add('d-none');
    }
}

function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

