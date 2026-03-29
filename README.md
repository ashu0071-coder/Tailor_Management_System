# Tailor Management System


A comprehensive React-based application for managing tailor shop operations, including customer management, order tracking, and measurements.


## Features


- **Dashboard**: Overview of business metrics
- **Customer Management**: Add, edit, and track customer information
- **Order Management**: Create and manage tailoring orders
- **Measurements**: Store and manage customer measurements
- **Authentication**: Secure login with Supabase


## Tech Stack


- **Frontend**: React 18 with Vite
- **UI Framework**: Material-UI (MUI)
- **Routing**: React Router v6
- **Styling**: SCSS + MUI theming
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: React Context API


## Prerequisites


- Node.js (v16 or higher)
- npm or yarn
- Supabase account


## Installation


1. Clone the repository or navigate to the project directory:
```bash
cd tailor-management
```


2. Install dependencies (already done):
```bash
npm install
```


3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```


## Supabase Setup


### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key to `.env`


### 2. Database Schema


Run these SQL commands in your Supabase SQL Editor:


```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);


-- Measurements table
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- shirt, pant, kurta, etc.
  chest DECIMAL(5,2),
  waist DECIMAL(5,2),
  shoulder DECIMAL(5,2),
  length DECIMAL(5,2),
  sleeve DECIMAL(5,2),
  neck DECIMAL(5,2),
  hip DECIMAL(5,2),
  inseam DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);


-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, In Progress, Completed, Delivered
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);


-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  item_type VARCHAR(100) NOT NULL, -- shirt, pant, dress, etc.
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10,2),
  measurement_id UUID REFERENCES measurements(id),
  fabric_details TEXT,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Create indexes for better performance
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_measurements_customer_id ON measurements(customer_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);


-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;


-- Create policies for customers
CREATE POLICY "Users can view their own customers"
  ON customers FOR SELECT
  USING (auth.uid() = user_id);


CREATE POLICY "Users can insert their own customers"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);


CREATE POLICY "Users can update their own customers"
  ON customers FOR UPDATE
  USING (auth.uid() = user_id);


CREATE POLICY "Users can delete their own customers"
  ON customers FOR DELETE
  USING (auth.uid() = user_id);


-- Create policies for measurements
CREATE POLICY "Users can view their own measurements"
  ON measurements FOR SELECT
  USING (auth.uid() = user_id);


CREATE POLICY "Users can insert their own measurements"
  ON measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);


CREATE POLICY "Users can update their own measurements"
  ON measurements FOR UPDATE
  USING (auth.uid() = user_id);


CREATE POLICY "Users can delete their own measurements"
  ON measurements FOR DELETE
  USING (auth.uid() = user_id);


-- Create policies for orders
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);


CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);


CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);


CREATE POLICY "Users can delete their own orders"
  ON orders FOR DELETE
  USING (auth.uid() = user_id);


-- Create policies for order_items
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));


CREATE POLICY "Users can insert their own order items"
  ON order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));


CREATE POLICY "Users can update their own order items"
  ON order_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));


CREATE POLICY "Users can delete their own order items"
  ON order_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));


-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_measurements_updated_at
    BEFORE UPDATE ON measurements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```


### 3. Enable Authentication
1. In Supabase Dashboard, go to Authentication > Providers
2. Enable Email provider
3. Configure email templates (optional)


## Running the Application


1. Start the development server:
```bash
npm run dev
```


2. Open your browser and navigate to `http://localhost:5173`


3. Create an account or login to access the application


## Project Structure


```
tailor-management/
├── src/
│   ├── components/       # Reusable components
│   │   └── ProtectedRoute.jsx
│   ├── contexts/         # React Context providers
│   │   └── AuthContext.jsx
│   ├── layouts/          # Layout components
│   │   └── MainLayout.jsx
│   ├── pages/            # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Customers.jsx
│   │   ├── Orders.jsx
│   │   ├── Measurements.jsx
│   │   └── Login.jsx
│   ├── services/         # API services
│   │   └── supabase.js
│   ├── styles/           # Global styles
│   │   └── global.scss
│   ├── utils/            # Utility functions
│   │   └── theme.js
│   ├── App.jsx           # Main App component
│   └── main.jsx          # Entry point
├── .env.example          # Environment variables template
├── package.json
└── vite.config.js
```


## Available Scripts


- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint


## Next Steps


1. **Add CRUD Operations**: Implement create, read, update, delete functionality for customers, orders, and measurements
2. **Add Form Validation**: Use libraries like Formik or React Hook Form
3. **Add Search & Filters**: Implement search and filtering in data tables
4. **Add Reports**: Generate reports for orders, revenue, etc.
5. **Add Print Templates**: Create printable templates for orders and invoices
6. **Add Image Upload**: Allow uploading customer photos or design references
7. **Add Notifications**: Implement reminders for delivery dates


## Contributing


Feel free to submit issues and enhancement requests!


## License


MIT





