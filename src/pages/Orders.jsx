import { Container, Typography, Button, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Snackbar, Alert, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getOrders, createOrder } from '../services/orderService';
import { getCustomers } from '../services/customerService';
import { generateOrderNumber } from '../utils/helpers';


const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    customer_id: '',
    order_number: generateOrderNumber(),
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    status: 'Pending',
    total_amount: '',
    paid_amount: '0',
    notes: ''
  });


  const statusOptions = ['Pending', 'In Progress', 'Completed', 'Delivered'];


  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, []);


  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      const formattedOrders = data.map(order => ({
        id: order.id,
        order_number: order.order_number,
        customerName: order.customer?.name || 'N/A',
        orderDate: order.order_date,
        deliveryDate: order.delivery_date || 'Not set',
        status: order.status,
        totalAmount: `$${order.total_amount || 0}`
      }));
      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setSnackbar({ open: true, message: 'Error loading orders: ' + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };


  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };


  const handleOpenDialog = () => {
    setFormData({
      customer_id: '',
      order_number: generateOrderNumber(),
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      status: 'Pending',
      total_amount: '',
      paid_amount: '0',
      notes: ''
    });
    setOpenDialog(true);
  };


  const handleCloseDialog = () => {
    setOpenDialog(false);
  };


  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
   
    try {
      await createOrder(formData);
      await fetchOrders(); // Refresh the list
      setSnackbar({
        open: true,
        message: 'Order created successfully!',
        severity: 'success'
      });
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating order:', error);
      setSnackbar({
        open: true,
        message: 'Error creating order: ' + error.message,
        severity: 'error'
      });
    }
  };


  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };


  const columns = [
    { field: 'id', headerName: 'Order ID', flex: 1, minWidth: 100 },
    { field: 'customerName', headerName: 'Customer', flex: 1, minWidth: 150 },
    { field: 'orderDate', headerName: 'Order Date', flex: 1, minWidth: 120, hide: true },
    { field: 'deliveryDate', headerName: 'Delivery', flex: 1, minWidth: 120 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        const getStatusColor = (status) => {
          if (status === 'Completed') return 'success';
          if (status === 'In Progress') return 'primary';
          if (status === 'Pending') return 'warning';
          return 'default';
        };
       
        return (
          <Chip
            label={params.value}
            color={getStatusColor(params.value)}
            size="small"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
          />
        );
      }
    },
    { field: 'totalAmount', headerName: 'Amount', flex: 1, minWidth: 100 },
  ];


  return (
    <Box sx={{
      minHeight: '100vh',
      background: '#ffffff',
      position: 'relative',
      overflow: 'hidden'
    }}>
     
      {/* Enhanced Floating Scissors */}
      <motion.div
        style={{
          position: 'fixed',
          top: '10%',
          right: '5%',
          fontSize: '120px',
          opacity: 0.5,
          pointerEvents: 'none',
          zIndex: 1,
          filter: 'drop-shadow(0 6px 12px rgba(33, 150, 243, 0.4))',
        }}
        animate={{
          y: [0, -20, 0],
          rotate: [0, 15, 0, -15, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        ✂️
      </motion.div>
     
      {/* Enhanced Floating Thread */}
      <motion.div
        style={{
          position: 'fixed',
          bottom: '15%',
          left: '5%',
          fontSize: '100px',
          opacity: 0.45,
          pointerEvents: 'none',
          zIndex: 1,
          filter: 'drop-shadow(0 6px 12px rgba(156, 39, 176, 0.4))',
        }}
        animate={{
          y: [0, 15, 0],
          rotate: [0, -20, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      >
        🧵
      </motion.div>
     
      {/* Enhanced Floating Needle */}
      <motion.div
        style={{
          position: 'fixed',
          top: '50%',
          left: '3%',
          fontSize: '80px',
          opacity: 0.4,
          pointerEvents: 'none',
          zIndex: 1,
          filter: 'drop-shadow(0 6px 12px rgba(76, 175, 80, 0.4))',
        }}
        animate={{
          x: [0, 10, 0],
          rotate: [0, 8, 0, -8, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      >
        🪡
      </motion.div>


    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3, md: 4 }, mb: { xs: 2, sm: 3, md: 4 }, px: { xs: 2.5, sm: 3, md: 4 }, position: 'relative', zIndex: 2 }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        mb: { xs: 2, sm: 3 },
        gap: { xs: 1.5, sm: 0 },
        px: { xs: 2, sm: 0 }
      }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
        >
          Orders
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          fullWidth={{ xs: true, sm: false }}
          onClick={handleOpenDialog}
          sx={{
            minHeight: { xs: 44, sm: 36 },
            fontSize: { xs: '0.95rem', sm: '0.875rem' }
          }}
        >
          New Order
        </Button>
      </Box>


      {/* Add Order Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={{ xs: true, sm: false }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          Create New Order
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              select
              label="Customer"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleInputChange}
              margin="normal"
              required
              autoFocus
            >
              <MenuItem value="">Select a customer</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Order Number"
              name="order_number"
              value={formData.order_number}
              onChange={handleInputChange}
              margin="normal"
              required
              disabled
              helperText="Auto-generated order number"
            />
            <TextField
              fullWidth
              label="Order Date"
              name="order_date"
              type="date"
              value={formData.order_date}
              onChange={handleInputChange}
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Delivery Date"
              name="delivery_date"
              type="date"
              value={formData.delivery_date}
              onChange={handleInputChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              margin="normal"
            >
              {statusOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Total Amount"
              name="total_amount"
              type="number"
              value={formData.total_amount}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{
                startAdornment: '$'
              }}
            />
            <TextField
              fullWidth
              label="Paid Amount"
              name="paid_amount"
              type="number"
              value={formData.paid_amount}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{
                startAdornment: '$'
              }}
            />
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={handleCloseDialog}
              sx={{ minHeight: { xs: 44, sm: 36 } }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ minHeight: { xs: 44, sm: 36 } }}
            >
              Create Order
            </Button>
          </DialogActions>
        </form>
      </Dialog>


      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>


      <Box sx={{
        height: { xs: 400, sm: 500, md: 600 },
        width: '100%',
        '& .MuiDataGrid-root': {
          border: 'none',
          fontSize: { xs: '0.875rem', sm: '1rem' },
        },
        '& .MuiDataGrid-cell': {
          padding: { xs: '8px 4px', sm: '8px 16px' },
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#f5f5f5',
          fontSize: { xs: '0.875rem', sm: '1rem' },
        },
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 400 }}>
            <CircularProgress sx={{ color: '#667eea' }} />
          </Box>
        ) : (
          <DataGrid
            rows={orders}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            checkboxSelection
            disableSelectionOnClick
            sx={{
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
              },
            }}
          />
        )}
      </Box>
    </Container>
    </Box>
  );
};


export default Orders;



