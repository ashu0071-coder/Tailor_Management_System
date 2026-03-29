import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Slide,
  useMediaQuery,
  useTheme,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Store as StoreIcon, Phone as PhoneIcon, Email as EmailIcon, Close as CloseIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon, VpnKey as VpnKeyIcon } from '@mui/icons-material';
import { supabase } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';


const AdminShops = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    store_name: '',
    store_phone: '',
    subscription_plan_id: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showPasswords, setShowPasswords] = useState({});
  const [shopPasswords, setShopPasswords] = useState({});


  useEffect(() => {
    fetchShops();
    fetchSubscriptionPlans();
  }, []);


  const fetchSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('plan_type', { ascending: false }); // one_time first, then monthly


      if (error) throw error;
      setSubscriptionPlans(data || []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  };


  const fetchShops = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'user')
        .order('created_at', { ascending: false });


      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
      setSnackbar({ open: true, message: 'Error loading shops', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };


  const togglePasswordVisibility = (shopId) => {
    setShowPasswords(prev => ({
      ...prev,
      [shopId]: !prev[shopId]
    }));
  };


  const fetchShopPassword = async (shopEmail) => {
    try {
      // Note: Supabase doesn't allow retrieving plain text passwords for security
      // This is intentional - passwords are hashed and cannot be retrieved
      return 'Cannot view (hashed)';
    } catch (error) {
      console.error('Error:', error);
      return 'Error loading';
    }
  };


  const handleOpenDialog = (shop = null) => {
    if (shop) {
      setEditingShop(shop);
      setFormData({
        email: shop.email || '',
        password: '',
        store_name: shop.store_name || '',
        store_phone: shop.store_phone || '',
        subscription_plan_id: shop.subscription_plan_id || ''
      });
    } else {
      setEditingShop(null);
      setFormData({
        email: '',
        password: '',
        store_name: '',
        store_phone: '',
        subscription_plan_id: ''
      });
    }
    setOpenDialog(true);
  };


  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingShop(null);
    setFormData({
      email: '',
      password: '',
      store_name: '',
      store_phone: '',
      subscription_plan_id: ''
    });
  };


  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!editingShop) {
        if (!formData.email || !formData.email.trim()) {
          setSnackbar({ open: true, message: 'Email is required', severity: 'error' });
          return;
        }
        if (!formData.password || formData.password.length < 6) {
          setSnackbar({ open: true, message: 'Password must be at least 6 characters', severity: 'error' });
          return;
        }
      }
     
      if (!formData.store_name || !formData.store_name.trim()) {
        setSnackbar({ open: true, message: 'Shop name is required', severity: 'error' });
        return;
      }


      // For new shops, subscription plan is required
      if (!editingShop && (!formData.subscription_plan_id || !formData.subscription_plan_id.trim())) {
        setSnackbar({ open: true, message: 'Subscription plan is required', severity: 'error' });
        return;
      }


      if (editingShop) {
        // Update existing shop
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            store_name: formData.store_name,
            store_phone: formData.store_phone,
            email: formData.email
          })
          .eq('id', editingShop.id);


        if (profileError) throw profileError;


        // Update password if provided
        if (formData.password && formData.password.trim() !== '') {
          try {
            // Get current session
            const { data: { session } } = await supabase.auth.getSession();
           
            if (!session) {
              throw new Error('No active session. Please log in again.');
            }


            const { data: passwordData, error: passwordError } = await supabase.functions.invoke('update-shop-password', {
              body: {
                userId: editingShop.id,
                email: formData.email,
                newPassword: formData.password
              },
              headers: {
                Authorization: `Bearer ${session.access_token}`
              }
            });


            if (passwordError) {
              console.error('Password update error:', passwordError);
              throw new Error(passwordError.message || 'Password update failed');
            }


            if (passwordData?.error) {
              console.error('Password update error from function:', passwordData.error);
              throw new Error(passwordData.error);
            }


            setSnackbar({ open: true, message: 'Shop and password updated successfully!', severity: 'success' });
          } catch (pwdError) {
            console.error('Password update exception:', pwdError);
            setSnackbar({
              open: true,
              message: `Shop updated but password change failed: ${pwdError.message}. Make sure edge functions are deployed.`,
              severity: 'warning'
            });
          }
        } else {
          setSnackbar({ open: true, message: 'Shop updated successfully', severity: 'success' });
        }
       
        handleCloseDialog();
        await fetchShops();
      } else {
        // Create new shop user using edge function
        const { data: { session } } = await supabase.auth.getSession();
       
        if (!session) {
          throw new Error('Admin session not found. Please log in again.');
        }


        // Use edge function to create shop user
        const { data: createData, error: createError } = await supabase.functions.invoke('create-shop-user', {
          body: {
            email: formData.email,
            password: formData.password,
            store_name: formData.store_name,
            store_phone: formData.store_phone,
            subscription_plan_id: formData.subscription_plan_id
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });


        if (createError) {
          throw new Error(createError.message || 'Failed to create shop user');
        }


        if (createData?.error) {
          throw new Error(createData.error);
        }


        setSnackbar({ open: true, message: 'Shop created successfully!', severity: 'success' });
       
        handleCloseDialog();
        await fetchShops();
      }
    } catch (error) {
      console.error('Error saving shop:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error saving shop',
        severity: 'error'
      });
    }
  };


  const handleDelete = async (shopId) => {
    if (!window.confirm('Are you sure you want to delete this shop?')) return;


    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', shopId);


      if (error) throw error;
      setSnackbar({ open: true, message: 'Shop deleted successfully', severity: 'success' });
      fetchShops();
    } catch (error) {
      console.error('Error deleting shop:', error);
      setSnackbar({ open: true, message: 'Error deleting shop', severity: 'error' });
    }
  };


  return (
    <Box sx={{
      minHeight: '100vh',
      background: '#ffffff',
      position: 'relative',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }}>
     
      {/* Top Right Scissors */}
      <motion.div
        style={{
          position: 'fixed',
          top: '10%',
          right: '10%',
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
     
      {/* Bottom Left Thread */}
      <motion.div
        style={{
          position: 'fixed',
          bottom: '15%',
          left: '8%',
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
     
      {/* Middle Left Needle */}
      <motion.div
        style={{
          position: 'fixed',
          top: '50%',
          left: '5%',
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


      {/* Bottom Right Scissors */}
      <motion.div
        style={{
          position: 'fixed',
          bottom: '20%',
          right: '15%',
          fontSize: '90px',
          opacity: 0.35,
          pointerEvents: 'none',
          zIndex: 1,
          filter: 'drop-shadow(0 6px 12px rgba(255, 152, 0, 0.4))',
        }}
        animate={{
          y: [0, 12, 0],
          rotate: [0, -10, 0, 10, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 6.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      >
        ✂️
      </motion.div>


      {/* Top Center Button */}
      <motion.div
        style={{
          position: 'fixed',
          top: '25%',
          right: '40%',
          fontSize: '70px',
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 1,
          filter: 'drop-shadow(0 6px 12px rgba(233, 30, 99, 0.4))',
        }}
        animate={{
          y: [0, -15, 0],
          rotate: [0, 360],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5
        }}
      >
        🔘
      </motion.div>


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
          mb: 4,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            🏪 Shop Management
          </Typography>
          {!isMobile && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{
                  minHeight: 44,
                  background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
                    boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                  }
                }}
              >
                Add Shop
              </Button>
            </motion.div>
          )}
        </Box>
      </motion.div>


      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#667eea' }} />
        </Box>
      ) : (
        <>
          {/* Dashboard Stats */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 3,
            mb: 4,
          }}>
            {/* Active Shops Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  boxShadow: 'none',
                  overflow: 'hidden',
                  background: '#ffffff',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#64748b',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          mb: 1,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Active Shops
                      </Typography>
                      <Typography
                        variant="h3"
                        sx={{
                          fontSize: { xs: '2rem', sm: '2.5rem' },
                          fontWeight: 700,
                          color: '#1e293b',
                          lineHeight: 1,
                        }}
                      >
                        {shops.length}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1.5,
                        background: '#ffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <StoreIcon sx={{ fontSize: 24, color: '#475569' }} />
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#10b981',
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#64748b',
                        fontSize: '0.813rem',
                      }}
                    >
                      Currently operational
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>


            {/* Inactive Shops Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  boxShadow: 'none',
                  overflow: 'hidden',
                  background: '#ffffff',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#64748b',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          mb: 1,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Inactive Shops
                      </Typography>
                      <Typography
                        variant="h3"
                        sx={{
                          fontSize: { xs: '2rem', sm: '2.5rem' },
                          fontWeight: 700,
                          color: '#1e293b',
                          lineHeight: 1,
                        }}
                      >
                        0
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1.5,
                        background: '#ffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <StoreIcon sx={{ fontSize: 24, color: '#94a3b8' }} />
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#cbd5e1',
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#64748b',
                        fontSize: '0.813rem',
                      }}
                    >
                      Not operational
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Box>


          {/* Shops List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                fontWeight: 600,
                color: '#1e293b',
                mb: 2,
              }}
            >
              All Shops
            </Typography>
          </motion.div>


          {/* Mobile Card View */}
          <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
            <AnimatePresence>
              {shops.map((shop, index) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    sx={{
                      mb: 2,
                      borderRadius: 3,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                        borderColor: '#2196F3',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <StoreIcon sx={{ fontSize: '1.2rem', color: '#2196F3' }} />
                            <Typography
                              variant="h6"
                              sx={{
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                color: '#1e293b',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {shop.store_name}
                            </Typography>
                          </Box>
                        </Box>
                       
                        <Chip
                          label="Active"
                          size="small"
                          sx={{
                            background: '#dcfce7',
                            color: '#166534',
                            border: '1px solid #86efac',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 26,
                            ml: 1,
                          }}
                        />
                      </Box>


                      <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon sx={{ fontSize: '1.1rem', color: '#2196F3' }} />
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#475569',
                              fontSize: '0.9rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {shop.email}
                          </Typography>
                        </Box>
                       
                        {shop.store_phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon sx={{ fontSize: '1.1rem', color: '#2196F3' }} />
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#475569',
                                fontSize: '0.9rem',
                              }}
                            >
                              {shop.store_phone}
                            </Typography>
                          </Box>
                        )}
                      </Box>


                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <motion.div whileTap={{ scale: 0.9 }}>
                          <IconButton
                            onClick={() => handleOpenDialog(shop)}
                            sx={{
                              background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                              color: 'white',
                              minWidth: 44,
                              minHeight: 44,
                              '&:hover': {
                                background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
                                transform: 'scale(1.05)',
                              },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.9 }}>
                          <IconButton
                            onClick={() => handleDelete(shop.id)}
                            sx={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              minWidth: 44,
                              minHeight: 44,
                              '&:hover': {
                                background: '#fecaca',
                                transform: 'scale(1.05)',
                              },
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </motion.div>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
           
            {shops.length === 0 && (
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
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No shops found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add your first shop to get started
                  </Typography>
                </Card>
              </motion.div>
            )}
          </Box>


          {/* Desktop Table View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ display: isMobile ? 'none' : 'block' }}
          >
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                overflow: 'hidden'
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{
                      backgroundColor: '#ffff',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: '#1e293b'
                    }}>
                      Shop Name
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
                      Phone
                    </TableCell>
                    <TableCell sx={{
                      backgroundColor: '#ffff',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: '#1e293b'
                    }}>
                      Password
                    </TableCell>
                    <TableCell sx={{
                      backgroundColor: '#ffff',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: '#1e293b'
                    }}>
                      Status
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
                  {shops.map((shop) => (
                    <TableRow
                      key={shop.id}
                      hover
                      sx={{
                        '&:hover': {
                          backgroundColor: '#ffff',
                          transition: 'background-color 0.2s ease'
                        }
                      }}
                    >
                      <TableCell sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <StoreIcon sx={{ fontSize: '1.1rem', color: '#2196F3' }} />
                          {shop.store_name}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', color: '#475569' }}>
                        {shop.email}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', color: '#475569' }}>
                        {shop.store_phone || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', color: '#475569' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <VpnKeyIcon sx={{ fontSize: '1rem', color: '#f59e0b' }} />
                          <Typography sx={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#64748b' }}>
                            {showPasswords[shop.id] ? (shopPasswords[shop.id] || 'Loading...') : '••••••••'}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={async () => {
                              if (!showPasswords[shop.id] && !shopPasswords[shop.id]) {
                                // Show message that passwords can't be viewed
                                const message = await fetchShopPassword(shop.email);
                                setShopPasswords(prev => ({ ...prev, [shop.id]: message }));
                              }
                              togglePasswordVisibility(shop.id);
                            }}
                            sx={{
                              color: '#64748b',
                              '&:hover': {
                                background: 'rgba(100, 116, 139, 0.1)'
                              }
                            }}
                          >
                            {showPasswords[shop.id] ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label="Active"
                          size="small"
                          sx={{
                            bgcolor: '#dcfce7',
                            color: '#166534',
                            border: '1px solid #86efac',
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(shop)}
                              sx={{
                                color: '#2196F3',
                                '&:hover': {
                                  background: 'rgba(33, 150, 243, 0.1)'
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(shop.id)}
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
              {shops.length === 0 && (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No shops found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create your first shop to get started
                  </Typography>
                </Box>
              )}
            </TableContainer>
          </motion.div>
        </>
      )}


      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          <motion.div whileTap={{ scale: 0.9 }}>
            <IconButton
              onClick={() => handleOpenDialog()}
              sx={{
                width: 56,
                height: 56,
                background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
                  boxShadow: '0 6px 16px rgba(33, 150, 243, 0.5)',
                },
              }}
            >
              <AddIcon />
            </IconButton>
          </motion.div>
        </motion.div>
      )}


      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
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
          background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {editingShop ? '✏️ Edit Shop' : '➕ Add New Shop'}
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
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {!editingShop && (
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: '#e2e8f0',
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: '#2196F3',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196F3',
                    },
                  },
                }}
              />
            )}
            <TextField
              label={editingShop ? "New Password (Optional)" : "Password"}
              type="password"
              fullWidth
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingShop}
              helperText={editingShop ? "Leave blank to keep current password" : "Minimum 6 characters"}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                    borderWidth: 2,
                  },
                  '&:hover fieldset': {
                    borderColor: '#2196F3',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196F3',
                  },
                },
              }}
            />
            <TextField
              label="Shop Name"
              fullWidth
              value={formData.store_name}
              onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                    borderWidth: 2,
                  },
                  '&:hover fieldset': {
                    borderColor: '#2196F3',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196F3',
                  },
                },
              }}
            />
            <TextField
              label="Phone"
              fullWidth
              value={formData.store_phone}
              onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                    borderWidth: 2,
                  },
                  '&:hover fieldset': {
                    borderColor: '#2196F3',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196F3',
                  },
                },
              }}
            />
            {!editingShop && (
              <TextField
                select
                label="Subscription Plan"
                fullWidth
                value={formData.subscription_plan_id}
                onChange={(e) => setFormData({ ...formData, subscription_plan_id: e.target.value })}
                required
                helperText="Select subscription type for this shop"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: '#e2e8f0',
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: '#2196F3',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196F3',
                    },
                  },
                }}
              >
                {subscriptionPlans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.name} - ₹{plan.price} ({plan.plan_type === 'one_time' ? 'One-time Payment' : 'Monthly Subscription'})
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              minHeight: { xs: 44, sm: 36 },
              borderRadius: 2,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              minHeight: { xs: 44, sm: 36 },
              background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
              borderRadius: 2,
              px: 3,
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
              }
            }}
          >
            {editingShop ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>


      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{
            borderRadius: 2,
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


export default AdminShops;



