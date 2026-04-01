import { Container, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert, MenuItem, Grid, Tabs, Tab, IconButton, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper, Card, CardContent, CardActions, Chip, Slide, useMediaQuery, useTheme } from '@mui/material';
import LoadingAnimation from '../components/LoadingAnimation';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, searchCustomers } from '../services/customerService';
import { isAbortError } from '../services/supabase';
import { createMeasurement, getMeasurementsByCustomer, updateMeasurement } from '../services/measurementService';
import CustomerCard from '../components/CustomerCard';
import FloatingActionButton from '../components/FloatingActionButton';
import LoadingSpinner from '../components/LoadingSpinner';


const Customers = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [errors, setErrors] = useState({ phone: '', email: '' });
  const [formData, setFormData] = useState({
    customer_number: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    payment_status: 'Not Paid',
    amount_paid: 0,
    remaining_balance: 0,
    // Measurement fields
    measurementType: 'Shirt',
    chest: '',
    waist: '',
    shoulder: '',
    length: '',
    sleeve: '',
    neck: '',
    hip: '',
    inseam: '',
    notes: ''
  });


  const measurementTypes = ['Shirt', 'Pant', 'Kurta', 'Dress', 'Suit', 'Blazer', 'Sherwani'];


  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);


  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data || []);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Error fetching customers:', error);
        setSnackbar({
          open: true,
          message: 'Error loading customers: ' + error.message,
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };


  const handleOpenDialog = async () => {
    setSelectedCustomer(null);
    setFormData({
      customer_number: 'Auto-generated',
      name: '',
      phone: '',
      email: '',
      address: '',
      payment_status: 'Not Paid',
      amount_paid: 0,
      remaining_balance: 0,
      measurementType: 'Shirt',
      chest: '',
      waist: '',
      shoulder: '',
      length: '',
      sleeve: '',
      neck: '',
      hip: '',
      inseam: '',
      notes: ''
    });
    setOpenDialog(true);
  };


  const handleEdit = async (customer) => {
    setSelectedCustomer(customer);
   
    // Fetch measurements for this customer
    try {
      const measurements = await getMeasurementsByCustomer(customer.id);
      const latestMeasurement = measurements && measurements.length > 0 ? measurements[0] : null;
     
      setFormData({
        customer_number: customer.customer_number,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        payment_status: customer.payment_status || 'Not Paid',
        amount_paid: customer.amount_paid || 0,
        remaining_balance: customer.remaining_balance || 0,
        measurementType: latestMeasurement?.type || 'Shirt',
        chest: latestMeasurement?.chest || '',
        waist: latestMeasurement?.waist || '',
        shoulder: latestMeasurement?.shoulder || '',
        length: latestMeasurement?.length || '',
        sleeve: latestMeasurement?.sleeve || '',
        neck: latestMeasurement?.neck || '',
        hip: latestMeasurement?.hip || '',
        inseam: latestMeasurement?.inseam || '',
        notes: latestMeasurement?.notes || '',
        measurementId: latestMeasurement?.id || null
      });
    } catch (error) {
      console.error('Error fetching measurements:', error);
      setFormData({
        customer_number: customer.customer_number,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        payment_status: customer.payment_status || 'Not Paid',
        measurementType: 'Shirt',
        chest: '',
        waist: '',
        shoulder: '',
        length: '',
        sleeve: '',
        neck: '',
        hip: '',
        inseam: '',
        notes: '',
        measurementId: null
      });
    }
   
    setTabValue(0);
    setOpenDialog(true);
  };


  const handleDeleteClick = (customer) => {
    setSelectedCustomer(customer);
    setOpenDeleteDialog(true);
  };


  const handleDeleteConfirm = async () => {
    try {
      await deleteCustomer(selectedCustomer.id);
      setCustomers(customers.filter(c => c.id !== selectedCustomer.id));
      setSnackbar({
        open: true,
        message: 'Customer deleted successfully!',
        severity: 'success'
      });
      setOpenDeleteDialog(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting customer: ' + error.message,
        severity: 'error'
      });
    }
  };


  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
   
    if (!value.trim()) {
      fetchCustomers();
      return;
    }
   
    const filtered = customers.filter(customer => {
      const searchLower = value.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower) ||
        customer.customer_number?.toLowerCase().includes(searchLower)
      );
    });
    setCustomers(filtered);
  };


  const handleClearSearch = () => {
    setSearchTerm('');
    fetchCustomers();
  };


  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCustomer(null);
    setTabValue(0);
    setFormData({
      customer_number: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      payment_status: 'Not Paid',
      measurementType: 'Shirt',
      chest: '',
      waist: '',
      shoulder: '',
      length: '',
      sleeve: '',
      neck: '',
      hip: '',
      inseam: '',
      notes: ''
    });
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
   
    // Real-time validation for phone and email
    if (name === 'phone') {
      const phoneError = validatePhone(value);
      setErrors({ ...errors, phone: phoneError });
    } else if (name === 'email') {
      const emailError = validateEmail(value);
      setErrors({ ...errors, email: emailError });
    }
  };


  const validatePhone = (phone) => {
    if (!phone) return 'Phone number is required';
   
    // Count only digits
    const digitsOnly = phone.replace(/\D/g, '');
   
    // Check if more than 10 digits
    if (digitsOnly.length > 10) {
      return 'Phone number cannot exceed 10 digits';
    }
   
    // Check if less than 10 digits
    if (digitsOnly.length > 0 && digitsOnly.length < 10) {
      return 'Phone number must be exactly 10 digits';
    }
   
    return '';
  };


  const validateEmail = (email) => {
    if (!email) return ''; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };


  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
   
    // Validate phone and email
    const phoneError = validatePhone(formData.phone);
    const emailError = validateEmail(formData.email);
   
    if (phoneError || emailError) {
      setErrors({ phone: phoneError, email: emailError });
      setSnackbar({
        open: true,
        message: 'Please fix the validation errors',
        severity: 'error'
      });
      return;
    }
   
    try {
      let savedCustomer;
     
      if (selectedCustomer) {
        // Update existing customer (don't update customer_number)
        const updateData = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          payment_status: formData.payment_status,
          amount_paid: parseFloat(formData.amount_paid) || 0,
          remaining_balance: parseFloat(formData.remaining_balance) || 0
        };
        savedCustomer = await updateCustomer(selectedCustomer.id, updateData);
       
        // Update or create measurements
        const hasMeasurements = formData.chest || formData.waist || formData.shoulder ||
                               formData.length || formData.sleeve || formData.neck ||
                               formData.hip || formData.inseam;
       
        if (hasMeasurements) {
          const measurementData = {
            customer_id: selectedCustomer.id,
            type: formData.measurementType,
            chest: formData.chest || null,
            waist: formData.waist || null,
            shoulder: formData.shoulder || null,
            length: formData.length || null,
            sleeve: formData.sleeve || null,
            neck: formData.neck || null,
            hip: formData.hip || null,
            inseam: formData.inseam || null,
            notes: formData.notes || null
          };
         
          if (formData.measurementId) {
            // Update existing measurement
            await updateMeasurement(formData.measurementId, measurementData);
          } else {
            // Create new measurement
            await createMeasurement(measurementData);
          }
        }
       
        setCustomers(customers.map(c => c.id === savedCustomer.id ? savedCustomer : c));
        setSnackbar({
          open: true,
          message: 'Customer and measurements updated successfully!',
          severity: 'success'
        });
      } else {
        // Create new customer (customer_number will be auto-generated by database)
        const newCustomerData = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          payment_status: formData.payment_status,
          amount_paid: parseFloat(formData.amount_paid) || 0,
          remaining_balance: parseFloat(formData.remaining_balance) || 0
        };
        savedCustomer = await createCustomer(newCustomerData);
       
        // Create measurement if any measurement fields are filled
        const hasMeasurements = formData.chest || formData.waist || formData.shoulder ||
                               formData.length || formData.sleeve || formData.neck ||
                               formData.hip || formData.inseam;
       
        if (hasMeasurements) {
          const measurementData = {
            customer_id: savedCustomer.id,
            type: formData.measurementType,
            chest: formData.chest || null,
            waist: formData.waist || null,
            shoulder: formData.shoulder || null,
            length: formData.length || null,
            sleeve: formData.sleeve || null,
            neck: formData.neck || null,
            hip: formData.hip || null,
            inseam: formData.inseam || null,
            notes: formData.notes || null
          };
         
          await createMeasurement(measurementData);
          setSnackbar({
            open: true,
            message: 'Customer and measurements added successfully!',
            severity: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Customer added successfully!',
            severity: 'success'
          });
        }
       
        setCustomers([savedCustomer, ...customers]);
      }
     
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving customer:', error);
      setSnackbar({
        open: true,
        message: 'Error saving customer: ' + error.message,
        severity: 'error'
      });
    }
  };


  useEffect(() => {
    fetchCustomers();
  }, []);


  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };


  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };


  return (
    <Box sx={{
      minHeight: '100vh',
      background: '#F8F9FA',
      position: 'relative',
      overflow: 'hidden'
    }}>
     
      {/* Enhanced Floating Scissors */}
      {/* <motion.div
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
      </motion.div> */}
     
      {/* Enhanced Floating Thread */}
      {/* <motion.div
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
      </motion.div> */}
     
      {/* Enhanced Floating Needle */}
      {/* <motion.div
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
      </motion.div> */}


    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2.5, sm: 3, md: 4 }, position: 'relative', zIndex: 2 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Customers
          </Typography>
          {!isMobile && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                sx={{
                  minHeight: 44,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                  }
                }}
              >
                Add Customer
              </Button>
            </motion.div>
          )}
        </Box>
      </motion.div>


      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search by name, phone, or customer number..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#667eea' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                minHeight: { xs: 52, sm: 48 },
                borderRadius: 2,
                background: 'white',
                '& fieldset': {
                  borderColor: '#e2e8f0',
                  borderWidth: 2,
                },
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                },
              }
            }}
          />
        </Box>
      </motion.div>


      {/* Loading State */}
      {loading && <LoadingSpinner message="Loading customers..." />}


      {/* Mobile Card View */}
      {!loading && (
        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          <AnimatePresence>
            {customers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((customer, index) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  index={index}
                />
              ))}
          </AnimatePresence>
         
          {customers.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 3,
                border: '2px dashed #e2e8f0',
                background: '#ffff'
              }}>
                <Typography sx={{ fontSize: '4rem', mb: 2 }}>👥</Typography>
                <Typography variant="h6" color="text.primary" gutterBottom sx={{ fontWeight: 600 }}>
                  No customers found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'Try adjusting your search' : "Add your first customer to get started"}
                </Typography>
              </Card>
            </motion.div>
          )}
         
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={customers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              mt: 2,
              borderTop: '1px solid #e2e8f0',
              backgroundColor: 'white',
              borderRadius: 2,
              '.MuiTablePagination-toolbar': {
                minHeight: '52px',
              },
            }}
          />
        </Box>
      )}


      {/* Desktop Table View */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <TableContainer
            component={Paper}
            sx={{
              display: { xs: 'none', sm: 'block' },
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{
                    backgroundColor: '#ffff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#1e293b'
                  }}>
                    ID
                  </TableCell>
                  <TableCell sx={{
                    backgroundColor: '#ffff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#1e293b'
                  }}>
                    Name
                  </TableCell>
                  <TableCell sx={{
                    backgroundColor: '#ffff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#1e293b'
                  }}>
                    Phone
                  </TableCell>
                  <TableCell sx={{
                    backgroundColor: '#ffff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#1e293b'
                  }}>
                    Email
                  </TableCell>
                  <TableCell sx={{
                    backgroundColor: '#ffff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#1e293b'
                  }}>
                    Address
                  </TableCell>
                  <TableCell sx={{
                    backgroundColor: '#ffff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#1e293b'
                  }}>
                    Payment
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: '#ffff',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: '#1e293b'
                    }}
                    align="center"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((customer) => (
                  <TableRow
                    key={customer.id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: '#ffff',
                        transition: 'background-color 0.2s ease'
                      }
                    }}
                  >
                    <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {customer.customer_number}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                      {customer.name}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.875rem', color: '#475569' }}>
                      {customer.phone}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.875rem', color: '#475569' }}>
                      {customer.email || '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.875rem', color: '#475569', maxWidth: 200 }}>
                      {customer.address || '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>
                      <Box>
                        <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>
                          Paid: <strong style={{ color: '#10b981' }}>₹{customer.amount_paid || 0}</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>
                          Balance: <strong style={{ color: customer.remaining_balance > 0 ? '#f59e0b' : '#10b981' }}>₹{customer.remaining_balance || 0}</strong>
                        </Typography>
                        <Chip
                          label={customer.payment_status || 'Not Paid'}
                          size="small"
                          sx={{
                            mt: 0.5,
                            bgcolor: customer.payment_status === 'Paid' ? '#dcfce7' : customer.payment_status === 'Partial' ? '#fef3c7' : '#fee2e2',
                            color: customer.payment_status === 'Paid' ? '#166534' : customer.payment_status === 'Partial' ? '#92400e' : '#991b1b',
                            border: customer.payment_status === 'Paid' ? '1px solid #86efac' : customer.payment_status === 'Partial' ? '1px solid #fcd34d' : '1px solid #fca5a5',
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(customer)}
                            sx={{
                              color: '#667eea',
                              '&:hover': {
                                background: 'rgba(102, 126, 234, 0.1)'
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(customer)}
                            sx={{
                              color: '#dc2626',
                              '&:hover': {
                                background: 'rgba(220, 38, 38, 0.1)'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </motion.div>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {customers.length === 0 && (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '4rem', mb: 2 }}>👥</Typography>
                <Typography variant="h6" color="text.primary" gutterBottom sx={{ fontWeight: 600 }}>
                  No customers found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'Try adjusting your search' : "Add your first customer to get started"}
                </Typography>
              </Box>
            )}
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={customers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{}}  
            />
          </TableContainer>
        </motion.div>
      )}


      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <FloatingActionButton
          onClick={handleOpenDialog}
          icon={<AddIcon />}
          label="Add Customer"
        />
      )}


      {/* Add/Edit Customer Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 3 },
            maxHeight: '90vh',
            m: { xs: 0, sm: 2 },
          }
        }}
      >
        <DialogTitle sx={{
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          pb: 1,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
          <IconButton
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: '#64748b',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                variant="fullWidth"
              >
                <Tab label="Basic Info" />
                {!selectedCustomer && <Tab label="Measurements" />}
              </Tabs>
            </Box>


            {/* Tab 1: Basic Info */}
            {tabValue === 0 && (
              <Box>
                <TextField
                  fullWidth
                  label="Customer Number"
                  name="customer_number"
                  value={formData.customer_number}
                  margin="normal"
                  disabled
                  helperText="Auto-generated unique identifier"
                />
                <TextField
                  fullWidth
                  label="Customer Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  autoFocus
                />
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  error={!!errors.phone}
                  helperText={errors.phone || 'Enter exactly 10 digits'}
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  margin="normal"
                  error={!!errors.email}
                  helperText={errors.email || 'Optional (e.g., user@example.com)'}
                />
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  margin="normal"
                  multiline
                  rows={3}
                />
               
                {/* Payment Section */}
                <Typography
                  variant="subtitle2"
                  sx={{
                    mt: 3,
                    mb: 1,
                    fontWeight: 700,
                    color: '#667eea',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  💰 Payment Details
                </Typography>
               
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Amount Paid"
                      name="amount_paid"
                      type="number"
                      value={formData.amount_paid}
                      onChange={handleInputChange}
                      margin="normal"
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1, color: '#64748b' }}>₹</Typography>,
                      }}
                      helperText="Total amount received"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Remaining Balance"
                      name="remaining_balance"
                      type="number"
                      value={formData.remaining_balance}
                      onChange={handleInputChange}
                      margin="normal"
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1, color: '#64748b' }}>₹</Typography>,
                      }}
                      helperText="Amount yet to be paid"
                    />
                  </Grid>
                </Grid>
               
                <TextField
                  fullWidth
                  select
                  label="Payment Status"
                  name="payment_status"
                  value={formData.payment_status}
                  onChange={handleInputChange}
                  margin="normal"
                >
                  <MenuItem value="Not Paid">Not Paid</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Partial">Partially Paid</MenuItem>
                </TextField>
              </Box>
            )}


            {/* Tab 2: Measurements */}
            {tabValue === 1 && (
              <Box>
                <TextField
                  fullWidth
                  select
                  label="Measurement Type"
                  name="measurementType"
                  value={formData.measurementType}
                  onChange={handleInputChange}
                  margin="normal"
                  helperText="Optional - Add measurements now or later"
                >
                  {measurementTypes.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
               
                {/* Measurement Diagram */}
                <Box sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#f8f9fa',
                  border: '1px solid #e0e0e0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#667eea', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    📏 How to Measure
                  </Typography>
                 
                  {/* Professional Measurement Diagram - Front and Back View */}
                  <svg width="100%" height="auto" viewBox="0 0 600 720" style={{ maxWidth: '550px' }}>
                    <defs>
                      <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                        <polygon points="0 0, 8 4, 0 8" fill="#555" />
                      </marker>
                    </defs>
                   
                    {/* FRONT VIEW */}
                    <g id="front-view">
                      {/* Head - More realistic oval shape */}
                      <ellipse cx="150" cy="55" rx="25" ry="30" fill="#f5f5f5" stroke="#333" strokeWidth="1.5"/>
                      <circle cx="145" cy="52" r="2" fill="#333"/>
                      <circle cx="155" cy="52" r="2" fill="#333"/>
                      <path d="M 140 62 Q 150 65 160 62" stroke="#333" strokeWidth="1" fill="none"/>
                     
                      {/* Neck */}
                      <path d="M 140 82 L 138 105 M 160 82 L 162 105" stroke="#333" strokeWidth="1.5"/>
                     
                      {/* Shoulders and Upper Body */}
                      <path d="M 90 105 Q 95 108 100 112 L 138 105 Q 150 103 162 105 L 200 112 Q 205 108 210 105"
                            stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
                     
                      {/* Torso - Front with realistic curves */}
                      <path d="M 100 112 Q 92 150 88 195 Q 87 230 90 265 Q 93 295 100 325 L 115 330
                               M 200 112 Q 208 150 212 195 Q 213 230 210 265 Q 207 295 200 325 L 185 330"
                            stroke="#333" strokeWidth="1.5" fill="none"/>
                     
                      {/* Chest area shading */}
                      <path d="M 100 112 Q 150 125 200 112 Q 208 150 212 195 Q 150 205 88 195 Q 92 150 100 112"
                            fill="#f9f9f9" stroke="#333" strokeWidth="1.5"/>
                     
                      {/* Waist to Hip */}
                      <path d="M 90 265 Q 150 258 210 265 M 100 325 Q 150 320 200 325"
                            stroke="#333" strokeWidth="1" fill="none" strokeLinecap="round"/>
                     
                      {/* Arms - More natural curves */}
                      <path d="M 90 105 Q 75 120 68 145 Q 63 175 61 210 Q 60 235 59 265"
                            stroke="#333" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                      <path d="M 210 105 Q 225 120 232 145 Q 237 175 239 210 Q 240 235 241 265"
                            stroke="#333" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                     
                      {/* Hands */}
                      <ellipse cx="59" cy="270" rx="6" ry="9" fill="#f5f5f5" stroke="#333" strokeWidth="1.5"/>
                      <ellipse cx="241" cy="270" rx="6" ry="9" fill="#f5f5f5" stroke="#333" strokeWidth="1.5"/>
                     
                      {/* Legs - Realistic proportions */}
                      <path d="M 115 330 Q 118 380 120 435 Q 121 490 120 545 L 118 620"
                            stroke="#333" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                      <path d="M 185 330 Q 182 380 180 435 Q 179 490 180 545 L 182 620"
                            stroke="#333" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                     
                      {/* Feet */}
                      <ellipse cx="118" cy="625" rx="10" ry="5" fill="#f5f5f5" stroke="#333" strokeWidth="1.5"/>
                      <ellipse cx="182" cy="625" rx="10" ry="5" fill="#f5f5f5" stroke="#333" strokeWidth="1.5"/>
                     
                      {/* Measurement Lines - FRONT */}
                     
                      {/* Shoulder Width */}
                      <line x1="88" y1="95" x2="212" y2="95" stroke="#e74c3c" strokeWidth="2" markerStart="url(#arrowhead)" markerEnd="url(#arrowhead)"/>
                      <text x="125" y="87" fill="#e74c3c" fontSize="12" fontWeight="700">Shoulder</text>
                     
                      {/* Chest */}
                      <line x1="80" y1="195" x2="78" y2="195" stroke="#3498db" strokeWidth="2"/>
                      <line x1="220" y1="195" x2="222" y2="195" stroke="#3498db" strokeWidth="2"/>
                      <line x1="78" y1="195" x2="222" y2="195" stroke="#3498db" strokeWidth="2" strokeDasharray="5,3"/>
                      <text x="230" y="200" fill="#3498db" fontSize="12" fontWeight="700">Chest</text>
                     
                      {/* Waist */}
                      <line x1="83" y1="265" x2="80" y2="265" stroke="#9b59b6" strokeWidth="2"/>
                      <line x1="217" y1="265" x2="220" y2="265" stroke="#9b59b6" strokeWidth="2"/>
                      <line x1="80" y1="265" x2="220" y2="265" stroke="#9b59b6" strokeWidth="2" strokeDasharray="5,3"/>
                      <text x="228" y="270" fill="#9b59b6" fontSize="12" fontWeight="700">Waist</text>
                     
                      {/* Sleeve Length */}
                      <path d="M 90 105 Q 75 120 68 145 Q 63 175 61 210 Q 60 235 59 265"
                            stroke="#e67e22" strokeWidth="2.5" strokeDasharray="6,4" fill="none"/>
                      <text x="25" y="190" fill="#e67e22" fontSize="12" fontWeight="700">Sleeve</text>
                     
                      {/* Inseam */}
                      <line x1="135" y1="330" x2="135" y2="620" stroke="#16a085" strokeWidth="2" strokeDasharray="5,3"/>
                      <path d="M 135 330 L 140 337 M 135 330 L 130 337" stroke="#16a085" strokeWidth="2"/>
                      <path d="M 135 620 L 140 613 M 135 620 L 130 613" stroke="#16a085" strokeWidth="2"/>
                      <text x="142" y="485" fill="#16a085" fontSize="12" fontWeight="700">Inseam</text>
                     
                      <text x="115" y="670" fill="#34495e" fontSize="14" fontWeight="700">FRONT</text>
                    </g>
                   
                    {/* BACK VIEW */}
                    <g id="back-view" transform="translate(300, 0)">
                      {/* Head - Back view */}
                      <ellipse cx="150" cy="55" rx="25" ry="30" fill="#f5f5f5" stroke="#333" strokeWidth="1.5"/>
                      <path d="M 135 45 Q 150 40 165 45" stroke="#333" strokeWidth="1" fill="none"/>
                     
                      {/* Neck - Back */}
                      <path d="M 140 82 L 138 105 M 160 82 L 162 105" stroke="#333" strokeWidth="1.5"/>
                     
                      {/* Shoulders - Back */}
                      <path d="M 90 105 Q 95 108 100 112 L 138 105 Q 150 103 162 105 L 200 112 Q 205 108 210 105"
                            stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
                     
                      {/* Back Torso */}
                      <path d="M 100 112 Q 95 150 92 195 Q 91 230 93 265 Q 96 295 102 325 L 115 330
                               M 200 112 Q 205 150 208 195 Q 209 230 207 265 Q 204 295 198 325 L 185 330"
                            stroke="#333" strokeWidth="1.5" fill="none"/>
                     
                      {/* Back area shading */}
                      <path d="M 100 112 Q 150 118 200 112 Q 205 150 208 195 Q 150 200 92 195 Q 95 150 100 112"
                            fill="#f9f9f9" stroke="#333" strokeWidth="1.5"/>
                     
                      {/* Spine line */}
                      <line x1="150" y1="105" x2="150" y2="325" stroke="#333" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3"/>
                     
                      {/* Arms - Back */}
                      <path d="M 90 105 Q 77 120 71 145 Q 67 175 66 210 Q 65 235 64 265"
                            stroke="#333" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                      <path d="M 210 105 Q 223 120 229 145 Q 233 175 234 210 Q 235 235 236 265"
                            stroke="#333" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                     
                      {/* Legs - Back */}
                      <path d="M 115 330 Q 118 380 120 435 Q 121 490 120 545 L 118 620"
                            stroke="#333" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                      <path d="M 185 330 Q 182 380 180 435 Q 179 490 180 545 L 182 620"
                            stroke="#333" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                     
                      {/* Feet */}
                      <ellipse cx="118" cy="625" rx="10" ry="5" fill="#f5f5f5" stroke="#333" strokeWidth="1.5"/>
                      <ellipse cx="182" cy="625" rx="10" ry="5" fill="#f5f5f5" stroke="#333" strokeWidth="1.5"/>
                     
                      {/* Measurement Lines - BACK */}
                     
                      {/* Neck Circumference */}
                      <ellipse cx="150" cy="100" rx="20" ry="10" fill="none" stroke="#e74c3c" strokeWidth="2" strokeDasharray="3,2"/>
                      <text x="175" y="105" fill="#e74c3c" fontSize="12" fontWeight="700">Neck</text>
                     
                      {/* Back Length */}
                      <line x1="75" y1="105" x2="75" y2="325" stroke="#f39c12" strokeWidth="2" strokeDasharray="5,3"/>
                      <path d="M 75 105 L 80 112 M 75 105 L 70 112" stroke="#f39c12" strokeWidth="2"/>
                      <path d="M 75 325 L 80 318 M 75 325 L 70 318" stroke="#f39c12" strokeWidth="2"/>
                      <text x="30" y="220" fill="#f39c12" fontSize="12" fontWeight="700">Length</text>
                     
                      {/* Hip */}
                      <line x1="95" y1="325" x2="92" y2="325" stroke="#8e44ad" strokeWidth="2"/>
                      <line x1="205" y1="325" x2="208" y2="325" stroke="#8e44ad" strokeWidth="2"/>
                      <line x1="92" y1="325" x2="208" y2="325" stroke="#8e44ad" strokeWidth="2" strokeDasharray="5,3"/>
                      <text x="216" y="330" fill="#8e44ad" fontSize="12" fontWeight="700">Hip</text>
                     
                      {/* Outseam */}
                      <line x1="225" y1="330" x2="225" y2="620" stroke="#27ae60" strokeWidth="2" strokeDasharray="5,3"/>
                      <path d="M 225 330 L 230 337 M 225 330 L 220 337" stroke="#27ae60" strokeWidth="2"/>
                      <path d="M 225 620 L 230 613 M 225 620 L 220 613" stroke="#27ae60" strokeWidth="2"/>
                      <text x="233" y="485" fill="#27ae60" fontSize="12" fontWeight="700">Outseam</text>
                     
                      <text x="118" y="670" fill="#34495e" fontSize="14" fontWeight="700">BACK</text>
                    </g>
                  </svg>
                 
                  {/* Measurement Key */}
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', width: '100%', maxWidth: '500px' }}>
                    {[
                      { color: '#e74c3c', label: 'Neck/Shoulder' },
                      { color: '#3498db', label: 'Chest' },
                      { color: '#9b59b6', label: 'Waist' },
                      { color: '#8e44ad', label: 'Hip' },
                      { color: '#e67e22', label: 'Sleeve' },
                      { color: '#f39c12', label: 'Length' },
                      { color: '#16a085', label: 'Inseam' }
                    ].map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.5, bgcolor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                        <Typography sx={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>{item.label}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
               
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                  Measurements (in inches) - Optional
                </Typography>
               
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: { xs: 1, sm: 2 } }}>
                  <TextField
                    fullWidth
                    label="Chest"
                    name="chest"
                    type="number"
                    value={formData.chest}
                    onChange={handleInputChange}
                    InputProps={{ inputProps: { step: '0.5' } }}
                    size="small"
                    sx={{ '& .MuiInputBase-root': { height: { xs: 40, sm: 'auto' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Waist"
                    name="waist"
                    type="number"
                    value={formData.waist}
                    onChange={handleInputChange}
                    InputProps={{ inputProps: { step: '0.5' } }}
                    size="small"
                    sx={{ '& .MuiInputBase-root': { height: { xs: 40, sm: 'auto' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Shoulder"
                    name="shoulder"
                    type="number"
                    value={formData.shoulder}
                    onChange={handleInputChange}
                    InputProps={{ inputProps: { step: '0.5' } }}
                    size="small"
                    sx={{ '& .MuiInputBase-root': { height: { xs: 40, sm: 'auto' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Length"
                    name="length"
                    type="number"
                    value={formData.length}
                    onChange={handleInputChange}
                    InputProps={{ inputProps: { step: '0.5' } }}
                    size="small"
                    sx={{ '& .MuiInputBase-root': { height: { xs: 40, sm: 'auto' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Sleeve"
                    name="sleeve"
                    type="number"
                    value={formData.sleeve}
                    onChange={handleInputChange}
                    InputProps={{ inputProps: { step: '0.5' } }}
                    size="small"
                    sx={{ '& .MuiInputBase-root': { height: { xs: 40, sm: 'auto' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Neck"
                    name="neck"
                    type="number"
                    value={formData.neck}
                    onChange={handleInputChange}
                    InputProps={{ inputProps: { step: '0.5' } }}
                    size="small"
                    sx={{ '& .MuiInputBase-root': { height: { xs: 40, sm: 'auto' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Hip"
                    name="hip"
                    type="number"
                    value={formData.hip}
                    onChange={handleInputChange}
                    InputProps={{ inputProps: { step: '0.5' } }}
                    size="small"
                    sx={{ '& .MuiInputBase-root': { height: { xs: 40, sm: 'auto' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Inseam"
                    name="inseam"
                    type="number"
                    value={formData.inseam}
                    onChange={handleInputChange}
                    InputProps={{ inputProps: { step: '0.5' } }}
                    size="small"
                    sx={{ '& .MuiInputBase-root': { height: { xs: 40, sm: 'auto' } } }}
                  />
                </Box>
               
                <TextField
                  fullWidth
                  label="Measurement Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  margin="normal"
                  multiline
                  rows={2}
                  placeholder="Any special instructions or notes..."
                  sx={{ mt: 2 }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1, justifyContent: 'space-between' }}>
            <Button
              variant='outlined'
              onClick={handleCloseDialog}
              sx={{
                minHeight: { xs: 48, sm: 42 },
                border: '2px solid #667eea',
                color: '#667eea',
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': {
                  border: '2px solid #764ba2',
                  background: 'rgba(102, 126, 234, 0.05)'
                }
              }}
            >
              Cancel
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {tabValue === 1 && (
                <Button
                  variant='outlined'
                  onClick={() => setTabValue(0)}
                  sx={{
                    minHeight: { xs: 48, sm: 42 },
                    border: '2px solid #667eea',
                    color: '#667eea',
                    fontWeight: 600,
                    borderRadius: 2
                  }}
                >
                  Back
                </Button>
              )}
              {tabValue === 0 && (
                <Button
                  onClick={() => setTabValue(1)}
                  variant="contained"
                  sx={{
                    minHeight: { xs: 48, sm: 42 },
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontWeight: 600,
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
                    }
                  }}
                >
                  {selectedCustomer ? 'Edit Measurements' : 'Add Measurements'}
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                sx={{
                  minHeight: { xs: 48, sm: 42 },
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  color: '#0f172a',
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(67, 233, 123, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #38f9d7 0%, #43e97b 100%)',
                    boxShadow: '0 6px 16px rgba(67, 233, 123, 0.4)'
                  }
                }}
              >
                {selectedCustomer ? 'Update' : 'Save'}
              </Button>
            </Box>
          </DialogActions>
        </form>
      </Dialog>


      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{
          fontWeight: 700,
          color: '#dc2626',
          pb: 1
        }}>
          🗑️ Delete Customer
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#475569', fontSize: '0.95rem' }}>
            Are you sure you want to delete <strong style={{ color: '#1e293b' }}>{selectedCustomer?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant='outlined'
            onClick={() => setOpenDeleteDialog(false)}
            sx={{
              minHeight: 44,
              border: '2px solid #cbd5e1',
              color: '#64748b',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': {
                border: '2px solid #94a3b8',
                background: '#ffff'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{
              minHeight: 44,
              background: '#dc2626',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': {
                background: '#b91c1c'
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>


      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Slide}
        sx={{
          bottom: { xs: 80, sm: 24 }
        }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: 2,
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
    </Box>
  );
};


export default Customers;



