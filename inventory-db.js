// Inventory Database Operations for MedAI Platform
// Full CRUD operations for medical inventory management

// ==================== GET ALL INVENTORY ITEMS ====================
async function getInventory(searchTerm = '', category = '') {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        let query = supabase
            .from('inventory')
            .select('*')
            .order('name', { ascending: true });

        if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
        }

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get inventory error:', error);
        return { data: null, error };
    }
}

// ==================== GET SINGLE INVENTORY ITEM ====================
async function getInventoryItem(id) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get inventory item error:', error);
        return { data: null, error };
    }
}

// ==================== ADD INVENTORY ITEM ====================
async function addInventoryItem(item) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const user = await window.MedAIAuth.getCurrentUser();
        
        // Calculate status based on quantity and min_stock
        const status = calculateStockStatus(item.quantity, item.min_stock || 10);

        const { data, error } = await supabase
            .from('inventory')
            .insert({
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                unit: item.unit,
                min_stock: item.min_stock || 10,
                status: status,
                updated_by: user?.id || null
            })
            .select()
            .single();

        if (error) throw error;
        console.log('✅ Inventory item added:', data.id);
        return { data, error: null };
    } catch (error) {
        console.error('Add inventory item error:', error);
        return { data: null, error };
    }
}

// ==================== UPDATE INVENTORY ITEM ====================
async function updateInventoryItem(id, updates) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const user = await window.MedAIAuth.getCurrentUser();
        
        // Recalculate status if quantity is being updated
        if (updates.quantity !== undefined) {
            const { data: currentItem } = await getInventoryItem(id);
            const minStock = updates.min_stock || currentItem?.min_stock || 10;
            updates.status = calculateStockStatus(updates.quantity, minStock);
        }

        const { data, error } = await supabase
            .from('inventory')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
                updated_by: user?.id || null
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        console.log('✅ Inventory item updated:', id);
        return { data, error: null };
    } catch (error) {
        console.error('Update inventory item error:', error);
        return { data: null, error };
    }
}

// ==================== DELETE INVENTORY ITEM ====================
async function deleteInventoryItem(id) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const { error } = await supabase
            .from('inventory')
            .delete()
            .eq('id', id);

        if (error) throw error;
        console.log('✅ Inventory item deleted:', id);
        return { error: null };
    } catch (error) {
        console.error('Delete inventory item error:', error);
        return { error };
    }
}

// ==================== GET INVENTORY STATISTICS ====================
async function getInventoryStats() {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const { data, error } = await supabase
            .from('inventory')
            .select('quantity, status, category');

        if (error) throw error;

        const stats = {
            totalItems: data.length,
            lowStock: data.filter(i => i.status === 'low').length,
            mediumStock: data.filter(i => i.status === 'medium').length,
            highStock: data.filter(i => i.status === 'high').length,
            categories: [...new Set(data.map(i => i.category))],
            totalValue: 0 // Would need price field to calculate
        };

        return { data: stats, error: null };
    } catch (error) {
        console.error('Get inventory stats error:', error);
        return { data: null, error };
    }
}

// ==================== GET LOW STOCK ALERTS ====================
async function getLowStockAlerts() {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('status', 'low')
            .order('quantity', { ascending: true });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get low stock alerts error:', error);
        return { data: null, error };
    }
}

// ==================== UPDATE STOCK QUANTITY ====================
async function updateStockQuantity(id, change) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        // Get current item
        const { data: currentItem, error: getError } = await getInventoryItem(id);
        if (getError) throw getError;

        const newQuantity = Math.max(0, currentItem.quantity + change);
        const newStatus = calculateStockStatus(newQuantity, currentItem.min_stock);

        const { data, error } = await supabase
            .from('inventory')
            .update({
                quantity: newQuantity,
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Update stock quantity error:', error);
        return { data: null, error };
    }
}

// ==================== GET CATEGORIES ====================
async function getCategories() {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const { data, error } = await supabase
            .from('inventory')
            .select('category')
            .order('category');

        if (error) throw error;
        
        // Get unique categories
        const categories = [...new Set(data.map(i => i.category))];
        return { data: categories, error: null };
    } catch (error) {
        console.error('Get categories error:', error);
        return { data: null, error };
    }
}

// ==================== HELPER: Calculate Stock Status ====================
function calculateStockStatus(quantity, minStock) {
    if (quantity <= minStock) {
        return 'low';
    } else if (quantity <= minStock * 2) {
        return 'medium';
    }
    return 'high';
}

// ==================== BULK IMPORT INVENTORY ====================
async function bulkImportInventory(items) {
    const supabase = window.MedAISupabase.getSupabase();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    try {
        const user = await window.MedAIAuth.getCurrentUser();
        
        const itemsWithStatus = items.map(item => ({
            ...item,
            status: calculateStockStatus(item.quantity, item.min_stock || 10),
            updated_by: user?.id || null
        }));

        const { data, error } = await supabase
            .from('inventory')
            .insert(itemsWithStatus)
            .select();

        if (error) throw error;
        console.log(`✅ ${data.length} inventory items imported`);
        return { data, error: null };
    } catch (error) {
        console.error('Bulk import error:', error);
        return { data: null, error };
    }
}

// Export functions
window.MedAIInventory = {
    getInventory,
    getInventoryItem,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getInventoryStats,
    getLowStockAlerts,
    updateStockQuantity,
    getCategories,
    bulkImportInventory,
    calculateStockStatus
};
