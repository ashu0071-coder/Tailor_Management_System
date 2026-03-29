import { supabase } from './supabase';


// Get all measurements for the current user
export const getMeasurements = async () => {
  const { data, error } = await supabase
    .from('measurements')
    .select(`
      *,
      customer:customers(name, phone)
    `)
    .order('created_at', { ascending: false });


  if (error) throw error;
  return data;
};


// Get measurements by customer ID
export const getMeasurementsByCustomer = async (customerId) => {
  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });


  if (error) throw error;
  return data;
};


// Get a single measurement by ID
export const getMeasurement = async (id) => {
  const { data, error } = await supabase
    .from('measurements')
    .select(`
      *,
      customer:customers(name, phone, email)
    `)
    .eq('id', id)
    .single();


  if (error) throw error;
  return data;
};


// Create a new measurement
export const createMeasurement = async (measurementData) => {
  const { data: { user } } = await supabase.auth.getUser();
 
  const { data, error } = await supabase
    .from('measurements')
    .insert([{ ...measurementData, user_id: user.id }])
    .select()
    .single();


  if (error) throw error;
  return data;
};


// Update a measurement
export const updateMeasurement = async (id, measurementData) => {
  const { data, error } = await supabase
    .from('measurements')
    .update(measurementData)
    .eq('id', id)
    .select()
    .single();


  if (error) throw error;
  return data;
};


// Delete a measurement
export const deleteMeasurement = async (id) => {
  const { error } = await supabase
    .from('measurements')
    .delete()
    .eq('id', id);


  if (error) throw error;
  return true;
};



