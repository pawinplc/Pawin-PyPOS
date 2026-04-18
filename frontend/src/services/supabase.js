import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dbocluzncuhhlrkeggez.supabase.co';
const supabaseKey = 'sb_publishable_8tb4LzD6ZvfIUa04TSQSDA_FsSe7vF5';

const supabase = createClient(supabaseUrl, supabaseKey);

export const authAPI = {
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { 
      access_token: data.session.access_token, 
      user: data.user 
    };
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  },

  async logout() {
    await supabase.auth.signOut();
  }
};

export const categoriesAPI = {
  async getAll() {
    const { data: categories, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;
    return categories;
  },

  async create(category) {
    const { data, error } = await supabase.from('categories').insert(category).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, category) {
    const { data, error } = await supabase.from('categories').update(category).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  }
};

export const itemsAPI = {
  async getAll() {
    let query = supabase.from('items').select('*, categories(name)');
    const { data: items, error } = await query;
    if (error) throw error;
    return items;
  },

  async getByCategory(categoryId) {
    const { data: items, error } = await supabase.from('items').select('*, categories(name)').eq('category_id', categoryId);
    if (error) throw error;
    return items;
  },

  async create(item) {
    const { data, error } = await supabase.from('items').insert(item).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, item) {
    const { data, error } = await supabase.from('items').update(item).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;
  },

  async uploadImage(filePath, file) {
    const { data, error } = await supabase.storage
      .from('items')
      .upload(filePath, file);
    if (error) throw error;
    return data;
  },

  async getImageUrl(filePath) {
    const { data: urlData } = supabase.storage
      .from('items')
      .getPublicUrl(filePath);
    return urlData.publicURL;
  }
};

export const stockAPI = {
  async getMovements(filters = {}) {
    let query = supabase.from('stock_movements').select('*, items(name), users(full_name)');
    if (filters.type) {
      query = query.eq('movement_type', filters.type);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async addStock(data) {
    const { data: item } = await supabase.from('items').select('quantity').eq('id', data.item_id).single();
    await supabase.from('items').update({ quantity: (item?.quantity || 0) + data.quantity }).eq('id', data.item_id);
    const { data: movement, error } = await supabase.from('stock_movements').insert({
      ...data,
      movement_type: 'in'
    });
    if (error) throw error;
    return movement;
  },

  async removeStock(data) {
    const { data: item } = await supabase.from('items').select('quantity').eq('id', data.item_id).single();
    if (item && item.quantity < data.quantity) {
      throw new Error('Insufficient stock');
    }
    await supabase.from('items').update({ quantity: item.quantity - data.quantity }).eq('id', data.item_id);
    const { data: movement, error } = await supabase.from('stock_movements').insert({
      ...data,
      movement_type: 'out'
    });
    if (error) throw error;
    return movement;
  },

  async adjustStock(data) {
    await supabase.from('items').update({ quantity: data.quantity }).eq('id', data.item_id);
    const { data: movement, error } = await supabase.from('stock_movements').insert(data);
    if (error) throw error;
    return movement;
  }
};

export const salesAPI = {
  async getAll() {
    let { data, error } = await supabase
      .from('sales')
      .select('*, users(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    
    data = data || [];
    for (const sale of data) {
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('*, items(name, categories(name))')
        .eq('sale_id', sale.id);
      sale.sale_items = (saleItems || []).map(si => ({ 
        ...si, 
        item_name: si.items?.name,
        category_name: si.items?.categories?.name
      }));
    }
    
    return data.map(sale => ({
      ...sale,
      cashier_name: sale.users?.full_name,
      categories_involved: [...new Set((sale.sale_items || []).map(i => i.category_name).filter(Boolean))]
    }));
  },

  async create(saleData, cashierId) {
    const total = saleData.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const now = new Date().toISOString();
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        total_amount: total,
        final_amount: total - (saleData.discount_amount || 0),
        discount_amount: saleData.discount_amount || 0,
        payment_method: saleData.payment_method || 'cash',
        customer_name: saleData.customer_name,
        created_at: now
      })
      .select()
      .single();
    
    if (saleError) throw saleError;
    
    for (const item of saleData.items) {
      const { data: currentItem } = await supabase.from('items').select('quantity, unit_price').eq('id', item.item_id).single();
      if (currentItem) {
        await supabase.from('sale_items').insert({
          sale_id: sale.id,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: currentItem.unit_price,
          subtotal: item.quantity * currentItem.unit_price
        });
        await supabase.from('items').update({ quantity: currentItem.quantity - item.quantity }).eq('id', item.item_id);
      }
    }
    
    return sale;
  }
};

export const dashboardAPI = {
  async getStats() {
    console.log('Fetching dashboard stats...');
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    const { data: items, error: itemsError } = await supabase.from('items').select('id, quantity, min_stock_level, is_service');
    console.log('Items fetched:', items?.length, itemsError);
    
    if (itemsError) {
      console.error('items error:', itemsError);
    }
    
    const totalItems = items?.length || 0;
    const lowStock = items?.filter(i => i.is_service !== true && i.quantity <= (i.min_stock_level || 0)).length || 0;
    const outOfStock = items?.filter(i => i.is_service !== true && i.quantity <= 0).length || 0;
    
    const { data: allSales, error: salesError } = await supabase.from('sales').select('id, final_amount, created_at');
    console.log('Sales fetched:', allSales?.length, salesError);
    
    const todayKey = today + 'T';
    const todaySales = (allSales || []).filter(s => s.created_at && s.created_at.startsWith(todayKey));
    const todayCount = todaySales.length;
    
    const { data: users, error: usersError } = await supabase.from('users').select('id');
    const activeUsers = users?.length || 0;
    console.log('Users fetched:', activeUsers, usersError);
    
    return {
      total_items: totalItems,
      low_stock_items: lowStock,
      out_of_stock: outOfStock,
      active_users: activeUsers,
      today_sales: todaySales.reduce((sum, s) => sum + parseFloat(s.final_amount || 0), 0),
      today_transactions: todayCount
    };
  },

  async getRecentSales(limit = 5) {
    const { data, error } = await supabase
      .from('sales')
      .select('id, final_amount, created_at, users(full_name)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data?.map(sale => ({
      ...sale,
      cashier_name: sale.users?.full_name
    })) || [];
  },

  async getLowStock(limit = 5) {
    const { data: items, error } = await supabase
      .from('items')
      .select('*, categories(name)')
      .eq('is_service', false)
      .order('quantity', { ascending: true })
      .limit(limit);
    if (error) {
      console.error('getLowStock error:', error);
      return [];
    }
    return (items || []).filter(i => i.quantity <= (i.min_stock_level || 0));
  }
};

export const usersAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*, roles(name)')
      .order('full_name');
    if (error) throw error;
return data;
  },

  async getAdminStats() {
    console.log('Fetching admin dashboard stats...');
    
    const { data: items, error: itemsError } = await supabase.from('items').select('id, quantity, min_stock_level, is_service');
    console.log('Items:', items?.length, itemsError);
    
    const totalItems = items?.length || 0;
    const lowStock = items?.filter(i => i.is_service !== true && i.quantity <= (i.min_stock_level || 0)).length || 0;
    const outOfStock = items?.filter(i => i.is_service !== true && i.quantity <= 0).length || 0;
    
    const { data: allSales, error: salesError } = await supabase.from('sales').select('id, final_amount, created_at');
    console.log('Sales:', allSales?.length, salesError);
    
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayKey = today + 'T';
    const todaySales = (allSales || []).filter(s => s.created_at && s.created_at.startsWith(todayKey));
    const todayTotal = todaySales.reduce((sum, s) => sum + parseFloat(s.final_amount || 0), 0);
    
    // Calculate week start (Monday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekSales = (allSales || []).filter(s => {
      if (!s.created_at) return false;
      const saleDate = new Date(s.created_at);
      return saleDate >= weekStart;
    });
    const weekTotal = weekSales.reduce((sum, s) => sum + parseFloat(s.final_amount || 0), 0);
    
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthSales = (allSales || []).filter(s => s.created_at && s.created_at.startsWith(thisMonth));
    const monthTotal = monthSales.reduce((sum, s) => sum + parseFloat(s.final_amount || 0), 0);
    
    const thisYear = String(now.getFullYear());
    const yearSales = (allSales || []).filter(s => s.created_at && s.created_at.startsWith(thisYear));
    const yearTotal = yearSales.reduce((sum, s) => sum + parseFloat(s.final_amount || 0), 0);
    
    const { data: users } = await supabase.from('users').select('id');
    const totalUsers = users?.length || 0;
    
    return {
      total_items: totalItems,
      low_stock_items: lowStock,
      out_of_stock: outOfStock,
      today_sales: todayTotal,
      today_transactions: todaySales.length,
      week_sales: weekTotal,
      week_transactions: weekSales.length,
      month_sales: monthTotal,
      month_transactions: monthSales.length,
      total_sales: yearTotal,
      total_transactions: yearSales.length,
      total_users: totalUsers,
      active_users: totalUsers
    };
}
};

export const analyticsAPI = {
  async getSalesByCategory() {
    const { data: saleItems } = await supabase
      .from('sale_items')
      .select('quantity, subtotal, items(categories(name))');
    
    const categoryData = {};
    (saleItems || []).forEach(si => {
      const category = si.items?.categories?.name || 'Uncategorized';
      if (!categoryData[category]) {
        categoryData[category] = { count: 0, total: 0 };
      }
      categoryData[category].count += si.quantity || 0;
      categoryData[category].total += si.subtotal || 0;
    });
    
    return Object.entries(categoryData).map(([name, data]) => ({
      name,
      ...data
    })).sort((a, b) => b.total - a.total);
  }
};

// Real-time subscription helper
export const subscribeToTable = (table, callback) => {
  try {
    const subscription = supabase
      .channel('public:' + table)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        callback(payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime subscribed to:', table);
        }
      });

    return () => supabase.removeChannel(subscription);
  } catch (error) {
    console.warn('Realtime not available for:', table, error.message);
    return () => {};
  }
};

export const subscribeToSales = (callback) => {
  return subscribeToTable('sales', callback);
};

export const subscribeToItems = (callback) => {
  return subscribeToTable('items', callback);
};

export const subscribeToCategories = (callback) => {
  return subscribeToTable('categories', callback);
};

export { supabase as default };