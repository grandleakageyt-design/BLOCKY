// ============================================
// TODO LIST APPLICATION WITH LOCAL STORAGE
// ============================================

class TodoApp {
    constructor() {
        this.todos = [];
        this.filter = 'all';
        this.editingId = null;
        this.init();
    }

    // Initialize the app
    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.render();
    }

    // Setup all event listeners
    setupEventListeners() {
        // Add todo
        document.getElementById('addBtn').addEventListener('click', () => this.addTodo());
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Character counter
        document.getElementById('todoInput').addEventListener('input', (e) => {
            document.getElementById('charCount').textContent = e.target.value.length;
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filter = e.target.dataset.filter;
                this.render();
            });
        });

        // Action buttons
        document.getElementById('clearCompletedBtn').addEventListener('click', () => this.clearCompleted());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportTodos());
    }

    // Add a new todo
    addTodo() {
        const input = document.getElementById('todoInput');
        const priority = document.getElementById('priority').value;
        const text = input.value.trim();

        if (text === '') {
            alert('Please enter a task!');
            input.focus();
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            priority: priority,
            createdAt: new Date().toISOString(),
            dueDate: null
        };

        this.todos.unshift(todo);
        this.saveToStorage();
        this.render();

        // Reset input
        input.value = '';
        input.focus();
        document.getElementById('charCount').textContent = '0';
        document.getElementById('priority').value = 'medium';
    }

    // Toggle todo completion
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
            this.render();
        }
    }

    // Delete a todo
    deleteTodo(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveToStorage();
            this.render();
        }
    }

    // Edit a todo
    editTodo(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim()) {
            todo.text = newText.trim();
            this.saveToStorage();
            this.render();
        }
    }

    // Clear all completed todos
    clearCompleted() {
        const completedCount = this.todos.filter(t => t.completed).length;
        if (completedCount === 0) {
            alert('No completed tasks to clear!');
            return;
        }
        if (confirm(`Clear ${completedCount} completed task(s)?`)) {
            this.todos = this.todos.filter(t => !t.completed);
            this.saveToStorage();
            this.render();
        }
    }

    // Clear all todos
    clearAll() {
        if (this.todos.length === 0) {
            alert('No tasks to clear!');
            return;
        }
        if (confirm('This will delete ALL tasks. Are you absolutely sure?')) {
            this.todos = [];
            this.saveToStorage();
            this.render();
        }
    }

    // Export todos as JSON
    exportTodos() {
        if (this.todos.length === 0) {
            alert('No tasks to export!');
            return;
        }

        const dataStr = JSON.stringify(this.todos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `blocky-todos-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Get filtered todos
    getFilteredTodos() {
        switch (this.filter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            case 'high':
                return this.todos.filter(t => t.priority === 'high' && !t.completed);
            default:
                return this.todos;
        }
    }

    // Update stats
    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        document.getElementById('totalCount').textContent = total;
        document.getElementById('completedCount').textContent = completed;
    }

    // Render all todos
    render() {
        const todoList = document.getElementById('todoList');
        const filteredTodos = this.getFilteredTodos();
        this.updateStats();

        if (filteredTodos.length === 0) {
            todoList.innerHTML = '<div class="empty-state"><p>🎯 No tasks to show!</p></div>';
            return;
        }

        todoList.innerHTML = filteredTodos
            .map(todo => this.createTodoElement(todo))
            .join('');

        // Add event listeners to todo items
        document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleTodo(parseInt(e.target.dataset.id));
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.deleteTodo(parseInt(e.target.dataset.id));
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.startEdit(parseInt(e.target.dataset.id));
            });
        });

        document.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const todoId = parseInt(e.target.dataset.id);
                const input = e.target.parentElement.querySelector('.edit-input');
                this.editTodo(todoId, input.value);
                this.editingId = null;
            });
        });

        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.editingId = null;
                this.render();
            });
        });

        // Focus on edit input when editing
        const editInputs = document.querySelectorAll('.edit-input');
        if (editInputs.length > 0) {
            editInputs[0].focus();
        }
    }

    // Create a todo element
    createTodoElement(todo) {
        const isEditing = this.editingId === todo.id;
        const completedClass = todo.completed ? 'completed' : '';

        if (isEditing) {
            return `
                <div class="todo-item editing" data-id="${todo.id}">
                    <input 
                        type="text" 
                        class="edit-input" 
                        value="${this.escapeHtml(todo.text)}"
                        placeholder="Edit task..."
                    >
                    <button class="save-btn" data-id="${todo.id}">✓</button>
                    <button class="cancel-btn">✕</button>
                </div>
            `;
        }

        return `
            <div class="todo-item ${completedClass}" data-id="${todo.id}">
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    data-id="${todo.id}"
                    ${todo.completed ? 'checked' : ''}
                >
                <div class="todo-content">
                    <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                    <span class="priority-badge ${todo.priority}">${todo.priority}</span>
                </div>
                <div class="todo-actions">
                    <button class="edit-btn" data-id="${todo.id}" title="Edit">✎</button>
                    <button class="delete-btn" data-id="${todo.id}" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    }

    // Start editing a todo
    startEdit(id) {
        this.editingId = id;
        this.render();
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Save todos to local storage
    saveToStorage() {
        try {
            localStorage.setItem('blocky-todos', JSON.stringify(this.todos));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            alert('Failed to save tasks. Storage may be full.');
        }
    }

    // Load todos from local storage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('blocky-todos');
            this.todos = stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            this.todos = [];
        }
    }
}

// ============================================
// INITIALIZE APP WHEN DOM IS READY
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
