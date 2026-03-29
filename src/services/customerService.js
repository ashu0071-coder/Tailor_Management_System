import { supabase } from './supabase';


// Get all customers for the current user
export const getCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });


  if (error) throw error;
  return data;
};


// Get a single customer by ID
export const getCustomer = async (id) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();


  if (error) throw error;
  return data;
};


// Create a new customer
export const createCustomer = async (customerData) => {
  const { data: { user } } = await supabase.auth.getUser();
 
  const { data, error } = await supabase
    .from('customers')
    .insert([{ ...customerData, user_id: user.id }])
    .select()
    .single();


  if (error) throw error;
  return data;
};


// Update a customer
export const updateCustomer = async (id, customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .update(customerData)
    .eq('id', id)
    .select()
    .single();


  if (error) throw error;
  return data;
};


// Delete a customer
export const deleteCustomer = async (id) => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);


  if (error) throw error;
  return true;
};


// Search customers
export const searchCustomers = async (searchTerm) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,customer_number.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });


  if (error) throw error;
  return data;
};



