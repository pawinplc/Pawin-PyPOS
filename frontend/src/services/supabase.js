import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dbocluzncuhhlrkeggez.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRib2NsdXpuY3VoaGxya2VnZ2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNjQ2OTYsImV4cCI6MjA1OTY0MDY5Nn0.GYjZufXuQTKas0Lf715w_9MHrKrHS';

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

  async getMe() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async logout() {
    await supabase.auth.signOut();
  }
};

export const categoriesAPI = {
  getAll: async () => {
    const { data: categories, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;
    
    const { data: items } = await supabase.from('items').select('category_id');
    const itemsCount = {};
    (items || []).forEach(item => {
      if (item.category_id) {
        itemsCount[item.category_id] = (itemsCount[item.category_id] || 0) + 1;
      }
    });
    
    return (categories || []).map(cat => ({
      ...cat,
      items_count: itemsCount[cat.id] || 0
    }));
  },
  create: async (category) => {
    const { data, error } = await supabase.from('categories').insert(category).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id, category) => {
    const { data, error } = await supabase.from('categories').update(category).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  }
};

export const itemsAPI = {
  getAll: async (params = {}) => {
    let query = supabase.from('items').select('*, categories(name)');
    
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`);
    }
    if (params.category_id) {
      query = query.eq('category_id', params.category_id);
    }
    
    const { data, error } = await query.order('name');
    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      category_name: item.categories?.name,
      is_low_stock: item.quantity <= item.min_stock_level
    }));
  },
  create: async (item) => {
    const { data, error } = await supabase.from('items').insert(item).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id, item) => {
    const { data, error } = await supabase.from('items').update(item).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id) => {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;
  }
};

export const stockAPI = {
  getMovements: async (params = {}) => {
    let query = supabase.from('stock_movements').select('*, items(name), users(full_name)');
    if (params.item_id) query = query.eq('item_id', params.item_id);
    if (params.movement_type) query = query.eq('movement_type', params.movement_type);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return (data || []).map(m => ({
      ...m,
      item_name: m.items?.name,
      username: m.users?.full_name
    }));
  },
  stockIn: async (data) => {
    const { data: item } = await supabase.from('items').select('quantity').eq('id', data.item_id).single();
    await supabase.from('items').update({ quantity: (item?.quantity || 0) + data.quantity }).eq('id', data.item_id);
    const { data: movement, error } = await supabase.from('stock_movements').insert({
      item_id: data.item_id,
      movement_type: 'in',
      quantity: data.quantity,
      reference: data.reference,
      notes: data.notes
    }).select().single();
    if (error) throw error;
    return movement;
  },
  stockOut: async (data) => {
    const { data: item } = await supabase.from('items').select('quantity').eq('id', data.item_id).single();
    if ((item?.quantity || 0) < data.quantity) throw new Error('Insufficient stock');
    await supabase.from('items').update({ quantity: item.quantity - data.quantity }).eq('id', data.item_id);
    const { data: movement, error } = await supabase.from('stock_movements').insert({
      item_id: data.item_id,
      movement_type: 'out',
      quantity: data.quantity,
      reference: data.reference,
      notes: data.notes
    }).select().single();
    if (error) throw error;
    return movement;
  },
  adjust: async (data) => {
    await supabase.from('items').update({ quantity: data.quantity }).eq('id', data.item_id);
    const { data: movement, error } = await supabase.from('stock_movements').insert({
      item_id: data.item_id,
      movement_type: 'adjustment',
      quantity: data.quantity,
      reference: data.reference,
      notes: data.notes
    }).select().single();
    if (error) throw error;
    return movement;
  }
};

export const salesAPI = {
  getAll: async () => {
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
  create: async (saleData, cashierId) => {
    const total = saleData.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        total_amount: total,
        final_amount: total - (saleData.discount_amount || 0),
        discount_amount: saleData.discount_amount || 0,
        payment_method: saleData.payment_method || 'cash',
        customer_name: saleData.customer_name
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
  getStats: async () => {
    const today = new Date().toISOString().split('T')[0];
    const { count: totalItems } = await supabase.from('items').select('id', { count: 'exact', head: true });
    const { data: items } = await supabase.from('items').select('quantity, min_stock_level');
    const lowStock = items?.filter(i => i.quantity <= i.min_stock_level).length || 0;
    const { data: todaySales } = await supabase.from('sales').select('final_amount').gte('created_at', today);
    const { count: todayCount } = await supabase.from('sales').select('id', { count: 'exact', head: true }).gte('created_at', today);
    
    return {
      total_items: totalItems || 0,
      low_stock_items: lowStock,
      today_sales: todaySales?.reduce((sum, s) => sum + parseFloat(s.final_amount || 0), 0) || 0,
      today_transactions: todayCount || 0
    };
  },
  getRecentSales: async (limit = 5) => {
    const { data, error } = await supabase
      .from('sales')
      .select('id, final_amount, created_at, users(full_name)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    
    for (const sale of (data || [])) {
      const { count } = await supabase
        .from('sale_items')
        .select('id', { count: 'exact', head: true })
        .eq('sale_id', sale.id);
      sale.items_count = count || 0;
    }
    
    return (data || []).map(s => ({
      id: s.id,
      final_amount: parseFloat(s.final_amount || 0),
      cashier_name: s.users?.full_name,
      items_count: s.items_count || 0,
      created_at: s.created_at
    }));
  },
  getLowStock: async (limit = 5) => {
    const { data, error } = await supabase
      .from('items')
      .select('id, name, sku, quantity, min_stock_level, categories(name)')
      .order('quantity', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data || []).filter(i => i.quantity <= i.min_stock_level);
  }
};

export default supabase;
