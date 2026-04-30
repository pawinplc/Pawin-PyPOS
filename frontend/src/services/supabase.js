import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
        .select('*, items(name, cost_price, is_service, categories(name))')
        .eq('sale_id', sale.id);
      sale.sale_items = (saleItems || []).map(si => ({ 
        ...si, 
        item_name: si.items?.name,
        cost_price: si.items?.cost_price || 0,
        is_service: si.items?.is_service || false,
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
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const [itemsResult, salesResult, usersResult] = await Promise.all([
      supabase.from('items').select('id, quantity, min_stock_level, is_service'),
      supabase.from('sales').select('id, final_amount, created_at'),
      supabase.from('users').select('id')
    ]);
    
    const items = itemsResult.data || [];
    const allSales = salesResult.data || [];
    const users = usersResult.data || [];
    
    const todayKey = today + 'T';
    const todaySales = allSales.filter(s => s.created_at?.startsWith(todayKey));
    
    return {
      total_items: items.length,
      low_stock_items: items.filter(i => i.is_service !== true && i.quantity <= (i.min_stock_level || 0)).length,
      out_of_stock: items.filter(i => i.is_service !== true && i.quantity <= 0).length,
      active_users: users.length,
      today_sales: todaySales.reduce((sum, s) => sum + parseFloat(s.final_amount || 0), 0),
      today_transactions: todaySales.length
    };
  },

  async getAdminStats() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);
    
    const [itemsResult, salesResult, usersResult] = await Promise.all([
      supabase.from('items').select('id, quantity, min_stock_level, is_service'),
      supabase.from('sales').select('id, final_amount, created_at'),
      supabase.from('users').select('id')
    ]);
    
    const items = itemsResult.data || [];
    const allSales = salesResult.data || [];
    const users = usersResult.data || [];
    
    if (itemsResult.error) console.error('Dashboard Items Error:', itemsResult.error);
    if (salesResult.error) console.error('Dashboard Sales Error:', salesResult.error);
    if (usersResult.error) console.error('Dashboard Users Error:', usersResult.error);
    
    const todayKey = today + 'T';
    const todaySales = allSales.filter(s => s.created_at?.startsWith(todayKey));
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    const weekSales = allSales.filter(s => s.created_at >= weekKey);
    
    const monthKey = thisMonth + '-';
    const monthSales = allSales.filter(s => s.created_at?.startsWith(monthKey));
    
    return {
      total_items: items.length,
      low_stock_items: items.filter(i => i.is_service !== true && i.quantity <= (i.min_stock_level || 0)).length,
      out_of_stock: items.filter(i => i.is_service !== true && i.quantity <= 0).length,
      today_sales: todaySales.reduce((sum, s) => sum + parseFloat(s.final_amount || 0), 0),
      today_transactions: todaySales.length,
      week_sales: weekSales.reduce((sum, s) => sum + parseFloat(s.final_amount || 0), 0),
      week_transactions: weekSales.length,
      month_sales: monthSales.reduce((sum, s) => sum + parseFloat(s.final_amount || 0), 0),
      month_transactions: monthSales.length,
      total_sales: allSales.reduce((sum, s) => sum + parseFloat(s.final_amount || 0), 0),
      total_transactions: allSales.length,
      total_users: users.length,
      active_users: users.length
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
    const { data: items } = await supabase
      .from('items')
      .select('*, categories(name)')
      .eq('is_service', false)
      .order('quantity', { ascending: true });
    
    return (items || [])
      .filter(i => i.quantity <= (i.min_stock_level || 0))
      .slice(0, limit);
  },

  async getUsersStats() {
    try {
      const { data: users, error } = await supabase.from('users').select('id, full_name, role');
      if (error) throw error;
      return {
        total_users: users?.length || 0,
        active_users: users?.length || 0,
        top_items: []
      };
    } catch (error) {
      console.error('getUsersStats error:', error);
      return { total_users: 0, active_users: 0, top_items: [] };
    }
  }
};

export const usersAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('full_name', { ascending: true });
    
    if (error) {
      console.error('usersAPI.getAll error:', error);
      throw error;
    }
    return data || [];
  },

  async create(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, userData) {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
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

export const subscribeToTable = (table, callback) => {
  try {
    const subscription = supabase
      .channel('public:' + table)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        callback(payload);
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  } catch (error) {
    console.warn('Realtime subscription failed:', error);
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