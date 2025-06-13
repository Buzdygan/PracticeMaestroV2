// Storage management for Practice Maestro using localStorage

class PracticeStorage {
    constructor() {
        this.STORAGE_KEYS = {
            ITEMS: 'practice_items',
            CATEGORIES: 'practice_categories',
            COMPLETIONS: 'practice_completions'
        };
        this.initializeStorage();
    }

    /**
     * Initialize storage with empty arrays if not exists
     */
    initializeStorage() {
        if (!localStorage.getItem(this.STORAGE_KEYS.ITEMS)) {
            localStorage.setItem(this.STORAGE_KEYS.ITEMS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.CATEGORIES)) {
            localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.COMPLETIONS)) {
            localStorage.setItem(this.STORAGE_KEYS.COMPLETIONS, JSON.stringify({}));
        }
    }

    // ============ ITEMS MANAGEMENT ============

    /**
     * Get all practice items
     */
    getItems() {
        const items = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ITEMS) || '[]');
        return items;
    }

    /**
     * Add a new practice item
     */
    addItem(item) {
        const items = this.getItems();
        const newItem = {
            id: generateId(),
            name: item.name,
            category: item.category,
            description: item.description || '',
            recurDays: item.recurDays || 7,
            parentId: item.parentId || null,
            status: 'active', // active, paused
            createdAt: getTodayString(),
            ...item
        };
        
        items.push(newItem);
        localStorage.setItem(this.STORAGE_KEYS.ITEMS, JSON.stringify(items));
        return newItem;
    }

    /**
     * Update a practice item
     */
    updateItem(itemId, updates) {
        const items = this.getItems();
        const index = items.findIndex(item => item.id === itemId);
        
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            localStorage.setItem(this.STORAGE_KEYS.ITEMS, JSON.stringify(items));
            return items[index];
        }
        return null;
    }

    /**
     * Delete a practice item and its sub-items
     */
    deleteItem(itemId) {
        const items = this.getItems();
        const itemsToDelete = [itemId];
        
        // Find all sub-items recursively
        const findSubItems = (parentId) => {
            const subItems = items.filter(item => item.parentId === parentId);
            subItems.forEach(subItem => {
                itemsToDelete.push(subItem.id);
                findSubItems(subItem.id);
            });
        };
        
        findSubItems(itemId);
        
        // Remove all items
        const filteredItems = items.filter(item => !itemsToDelete.includes(item.id));
        localStorage.setItem(this.STORAGE_KEYS.ITEMS, JSON.stringify(filteredItems));
        
        // Also remove completions for deleted items
        const completions = this.getCompletions();
        itemsToDelete.forEach(id => {
            delete completions[id];
        });
        localStorage.setItem(this.STORAGE_KEYS.COMPLETIONS, JSON.stringify(completions));
        
        return itemsToDelete.length;
    }

    /**
     * Get item by ID
     */
    getItem(itemId) {
        const items = this.getItems();
        return items.find(item => item.id === itemId);
    }

    /**
     * Get top-level items (no parent)
     */
    getTopLevelItems() {
        const items = this.getItems();
        return items.filter(item => !item.parentId);
    }

    /**
     * Get sub-items of a parent item
     */
    getSubItems(parentId) {
        const items = this.getItems();
        return items.filter(item => item.parentId === parentId);
    }

    /**
     * Toggle item status (active/paused)
     */
    toggleItemStatus(itemId) {
        const item = this.getItem(itemId);
        if (item) {
            const newStatus = item.status === 'active' ? 'paused' : 'active';
            return this.updateItem(itemId, { status: newStatus });
        }
        return null;
    }

    // ============ CATEGORIES MANAGEMENT ============

    /**
     * Get all categories
     */
    getCategories() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CATEGORIES) || '[]');
    }

    /**
     * Add a new category
     */
    addCategory(name) {
        const categories = this.getCategories();
        const newCategory = {
            id: generateId(),
            name: name.trim(),
            createdAt: getTodayString()
        };
        
        // Check if category already exists
        if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
            return null; // Category already exists
        }
        
        categories.push(newCategory);
        localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
        return newCategory;
    }

    /**
     * Delete a category
     */
    deleteCategory(categoryId) {
        const categories = this.getCategories();
        const category = categories.find(cat => cat.id === categoryId);
        
        if (!category) return false;
        
        // Check if category is in use
        const items = this.getItems();
        const isInUse = items.some(item => item.category === category.name);
        
        if (isInUse) {
            return false; // Cannot delete category in use
        }
        
        const filteredCategories = categories.filter(cat => cat.id !== categoryId);
        localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(filteredCategories));
        return true;
    }

    // ============ COMPLETIONS MANAGEMENT ============

    /**
     * Get all completions
     */
    getCompletions() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.COMPLETIONS) || '{}');
    }

    /**
     * Mark item as completed for a specific date
     */
    markItemCompleted(itemId, date = getTodayString()) {
        const completions = this.getCompletions();
        
        if (!completions[itemId]) {
            completions[itemId] = [];
        }
        
        // Check if already completed today
        if (!completions[itemId].includes(date)) {
            completions[itemId].push(date);
            localStorage.setItem(this.STORAGE_KEYS.COMPLETIONS, JSON.stringify(completions));
            return true;
        }
        return false; // Already completed
    }

    /**
     * Unmark item completion for a specific date
     */
    unmarkItemCompleted(itemId, date = getTodayString()) {
        const completions = this.getCompletions();
        
        if (completions[itemId]) {
            completions[itemId] = completions[itemId].filter(d => d !== date);
            if (completions[itemId].length === 0) {
                delete completions[itemId];
            }
            localStorage.setItem(this.STORAGE_KEYS.COMPLETIONS, JSON.stringify(completions));
            return true;
        }
        return false;
    }

    /**
     * Check if item is completed on a specific date
     */
    isItemCompleted(itemId, date = getTodayString()) {
        const completions = this.getCompletions();
        return completions[itemId] && completions[itemId].includes(date);
    }

    /**
     * Get last completion date for an item
     */
    getLastCompletionDate(itemId) {
        const completions = this.getCompletions();
        if (completions[itemId] && completions[itemId].length > 0) {
            return completions[itemId].sort().pop(); // Get most recent date
        }
        return null;
    }

    /**
     * Get items that should appear today based on their recurrence
     */
    getTodaysItems() {
        const items = this.getItems();
        const today = getTodayString();
        const todaysItems = [];

        items.forEach(item => {
            // Skip paused items
            if (item.status === 'paused') return;

            const lastCompletion = this.getLastCompletionDate(item.id);
            
            if (!lastCompletion) {
                // Never completed, should appear today
                todaysItems.push({
                    ...item,
                    isCompleted: false,
                    daysSinceLastCompletion: null
                });
            } else {
                const daysSince = daysBetween(today, lastCompletion);
                const shouldAppear = daysSince >= item.recurDays;
                
                if (shouldAppear) {
                    todaysItems.push({
                        ...item,
                        isCompleted: this.isItemCompleted(item.id, today),
                        daysSinceLastCompletion: daysSince
                    });
                }
            }
        });

        return todaysItems;
    }

    /**
     * Get completion statistics
     */
    getCompletionStats(date = getTodayString()) {
        const todaysItems = this.getTodaysItems();
        const completedCount = todaysItems.filter(item => item.isCompleted).length;
        
        return {
            total: todaysItems.length,
            completed: completedCount,
            remaining: todaysItems.length - completedCount,
            percentage: todaysItems.length > 0 ? Math.round((completedCount / todaysItems.length) * 100) : 0
        };
    }

    // ============ DATA MANAGEMENT ============

    /**
     * Export all data
     */
    exportData() {
        return {
            items: this.getItems(),
            categories: this.getCategories(),
            completions: this.getCompletions(),
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import data (replaces existing data)
     */
    importData(data) {
        try {
            if (data.items) {
                localStorage.setItem(this.STORAGE_KEYS.ITEMS, JSON.stringify(data.items));
            }
            if (data.categories) {
                localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
            }
            if (data.completions) {
                localStorage.setItem(this.STORAGE_KEYS.COMPLETIONS, JSON.stringify(data.completions));
            }
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }

    /**
     * Clear all data
     */
    clearAllData() {
        localStorage.removeItem(this.STORAGE_KEYS.ITEMS);
        localStorage.removeItem(this.STORAGE_KEYS.CATEGORIES);
        localStorage.removeItem(this.STORAGE_KEYS.COMPLETIONS);
        this.initializeStorage();
    }
} 