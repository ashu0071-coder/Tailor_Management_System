import { supabase } from './supabase';


// Get all orders for the current user
export const getOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(name, phone, email)
    `)
    .order('created_at', { ascending: false });


  if (error) throw error;
  return data;
};


// Get a single order by ID
export const getOrder = async (id) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(name, phone, email),
      order_items(*)
    `)
    .eq('id', id)
    .single();


  if (error) throw error;
  return data;
};


// Create a new order
export const createOrder = async (orderData) => {
  const { data: { user } } = await supabase.auth.getUser();
 
  const { data, error } = await supabase
    .from('orders')
    .insert([{ ...orderData, user_id: user.id }])
    .select()
    .single();


  if (error) throw error;
  return data;
};


// Update an order
export const updateOrder = async (id, orderData) => {
  const { data, error } = await supabase
    .from('orders')
    .update(orderData)
    .eq('id', id)
    .select()
    .single();


  if (error) throw error;
  return data;
};


// Delete an order
export const deleteOrder = async (id) => {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);


  if (error) throw error;
  return true;
};


// Get orders by status
export const getOrdersByStatus = async (status) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(name, phone)
    `)
    .eq('status', status)
    .order('delivery_date', { ascending: true });


  if (error) throw error;
  return data;
};


// Get dashboard statistics
export const getDashboardStats = async () => {
  const { data: { user } } = await supabase.auth.getUser();


  // Get total customers
  const { count: customersCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);


  // Get active orders
  const { count: activeOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['Pending', 'In Progress']);


  // Get completed orders
  const { count: completedOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'Completed');


  // Get total revenue
  const { data: revenueData } = await supabase
    .from('orders')
    .select('paid_amount')
    .eq('user_id', user.id);


  const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.paid_amount || 0), 0) || 0;


  return {
    totalCustomers: customersCount || 0,
    activeOrders: activeOrdersCount || 0,
    completedOrders: completedOrdersCount || 0,
    totalRevenue,
  };
};



