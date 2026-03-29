import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Warning as WarningIcon,
  Payment as PaymentIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  getAllShopSubscriptions,
  getSubscriptionStats,
  toggleShopActive,
  assignSubscriptionPlan,
  getSubscriptionPlans,
  getAllPaymentHistory,
} from '../services/subscriptionService';


const AdminSubscriptions = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));


  const [shops, setShops] = useState([]);
  const [stats, setStats] = useState(null);
  const [plans, setPlans] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
 
  const [selectedShop, setSelectedShop] = useState(null);
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
 
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });


  const [viewMode, setViewMode] = useState('subscriptions'); // 'subscriptions' or 'payments'


  useEffect(() => {
    loadData();
  }, []);


  const loadData = async () => {
    try {
      setLoading(true);
      const [shopsData, statsData, plansData, paymentsData] = await Promise.all([
        getAllShopSubscriptions(),
        getSubscriptionStats(),
        getSubscriptionPlans(),
        getAllPaymentHistory(),
      ]);
     
      setShops(shopsData);
      setStats(statsData[0] || {});
      setPlans(plansData);
      setPaymentHistory(paymentsData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      showSnackbar('Failed to load subscription data', 'error');
    } finally {
      setLoading(false);
    }
  };


  const handleToggleActive = async (userId, currentStatus) => {
    try {
      setActionLoading(true);
      await toggleShopActive(userId, !currentStatus);
      await loadData();
      showSnackbar(
        `Shop ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error toggling shop status:', error);
      showSnackbar('Failed to update shop status', 'error');
    } finally {
      setActionLoading(false);
    }
  };


  const handleAssignPlan = async () => {
    if (!selectedPlan || !selectedShop) return;


    try {
      setActionLoading(true);
      await assignSubscriptionPlan(selectedShop.user_id, selectedPlan, {
        notes: paymentNotes || 'Admin assigned subscription plan',
      });
     
      setOpenPlanDialog(false);
      setSelectedShop(null);
      setSelectedPlan('');
      setPaymentNotes('');
     
      await loadData();
      showSnackbar('Subscription plan assigned successfully', 'success');
    } catch (error) {
      console.error('Error assigning plan:', error);
      showSnackbar('Failed to assign subscription plan', 'error');
    } finally {
      setActionLoading(false);
    }
  };


  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'trial':
        return 'info';
      case 'inactive':
      case 'expired':
        return 'error';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };


  const getPaymentAlertColor = (status) => {
    switch (status) {
      case 'overdue':
        return 'error';
      case 'due_soon':
        return 'warning';
      default:
        return 'default';
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };


  const formatCurrency = (amount, currency = 'INR') => {
    // Handle null or invalid currency codes
    const validCurrency = currency || 'INR';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: validCurrency,
    }).format(amount || 0);
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }


  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold" gutterBottom>
          Subscription Management
        </Typography>
        <Box
          display="flex"
          flexDirection={isMobile ? 'column' : 'row'}
          gap={2}
          mt={2}
        >
          <Box display="flex" gap={1} flex={1}>
            <Button
              variant={viewMode === 'subscriptions' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('subscriptions')}
              fullWidth={isMobile}
              size={isMobile ? 'small' : 'medium'}
            >
              Subscriptions
            </Button>
            <Button
              variant={viewMode === 'payments' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('payments')}
              fullWidth={isMobile}
              size={isMobile ? 'small' : 'medium'}
            >
              Payments
            </Button>
          </Box>
          <IconButton onClick={loadData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>


      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Shops
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.total_shops || 0}
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>


        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Active Subscriptions
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {stats.active_subscriptions || 0}
                    </Typography>
                  </Box>
                  <ActiveIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>


        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Monthly Revenue
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {formatCurrency(stats.total_monthly_revenue || 0)}
                    </Typography>
                  </Box>
                  <MoneyIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>


        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Pending Renewals
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {stats.pending_renewals || 0}
                    </Typography>
                  </Box>
                  <WarningIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>


      {/* Content Based on View Mode */}
      {viewMode === 'subscriptions' ? (
        // Subscriptions Cards (Mobile Friendly)
        <Box>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Shop Subscriptions
          </Typography>
          {shops.length === 0 ? (
            <Card>
              <CardContent>
                <Typography color="text.secondary" align="center" py={4}>
                  No shops found
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {shops.map((shop, index) => (
                <Grid item xs={12} key={shop.user_id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      sx={{
                        border: shop.payment_alert_status === 'overdue' ? '2px solid' : '1px solid',
                        borderColor: shop.payment_alert_status === 'overdue'
                          ? 'error.main'
                          : shop.payment_alert_status === 'due_soon'
                          ? 'warning.main'
                          : 'divider'
                      }}
                    >
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box flex={1}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                              {shop.store_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {shop.email}
                            </Typography>
                            {shop.store_phone && (
                              <Typography variant="body2" color="text.secondary">
                                {shop.store_phone}
                              </Typography>
                            )}
                          </Box>
                          <Box display="flex" gap={1}>
                            <Tooltip title={shop.is_subscription_active ? 'Deactivate' : 'Activate'}>
                              <IconButton
                                onClick={() =>
                                  handleToggleActive(shop.user_id, shop.is_subscription_active)
                                }
                                disabled={actionLoading}
                                color={shop.is_subscription_active ? 'success' : 'error'}
                                size="small"
                              >
                                {shop.is_subscription_active ? <ActiveIcon /> : <InactiveIcon />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Assign Plan">
                              <IconButton
                                onClick={() => {
                                  setSelectedShop(shop);
                                  setOpenPlanDialog(true);
                                }}
                                disabled={actionLoading}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>


                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Plan
                            </Typography>
                            <Chip
                              label={shop.plan_name || 'No Plan'}
                              size="small"
                              color={shop.plan_type === 'monthly' ? 'primary' : 'secondary'}
                              variant="outlined"
                              sx={{ mt: 0.5 }}
                            />
                          </Grid>


                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Status
                            </Typography>
                            <Chip
                              label={shop.subscription_status?.toUpperCase() || 'UNKNOWN'}
                              size="small"
                              color={getStatusColor(shop.subscription_status)}
                              sx={{ mt: 0.5 }}
                            />
                          </Grid>


                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Total Paid
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ mt: 0.5 }}>
                              {formatCurrency(shop.total_paid, shop.currency)}
                            </Typography>
                          </Grid>


                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Next Billing
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {shop.plan_type === 'monthly'
                                ? formatDate(shop.next_billing_date)
                                : 'One-time'}
                            </Typography>
                          </Grid>


                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Payments
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {shop.total_payments || 0} completed
                            </Typography>
                          </Grid>


                          {shop.payment_alert_status !== 'ok' && (
                            <Grid item xs={6} sm={4}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Alert
                              </Typography>
                              <Chip
                                label={shop.payment_alert_status?.replace('_', ' ').toUpperCase()}
                                size="small"
                                color={getPaymentAlertColor(shop.payment_alert_status)}
                                icon={<WarningIcon />}
                                sx={{ mt: 0.5 }}
                              />
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      ) : (
        // Payment History Cards (Mobile Friendly)
        <Box>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Payment History
          </Typography>
          {paymentHistory.length === 0 ? (
            <Card>
              <CardContent>
                <Typography color="text.secondary" align="center" py={4}>
                  No payment history found
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {paymentHistory.map((payment, index) => (
                <Grid item xs={12} key={payment.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box flex={1}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                              {shops.find((s) => s.user_id === payment.user_id)?.store_name || 'Unknown Shop'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(payment.payment_date)}
                            </Typography>
                          </Box>
                          <Chip
                            label={payment.payment_status?.toUpperCase()}
                            size="small"
                            color={
                              payment.payment_status === 'completed'
                                ? 'success'
                                : payment.payment_status === 'failed'
                                ? 'error'
                                : 'warning'
                            }
                          />
                        </Box>


                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Plan
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {payment.subscription_plans?.name || 'N/A'}
                            </Typography>
                          </Grid>


                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Amount
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ mt: 0.5 }}>
                              {formatCurrency(payment.amount, payment.currency)}
                            </Typography>
                          </Grid>


                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Method
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {payment.payment_method || 'N/A'}
                            </Typography>
                          </Grid>


                          {payment.transaction_id && (
                            <Grid item xs={12} sm={8}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Transaction ID
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  mt: 0.5,
                                  fontFamily: 'monospace',
                                  fontSize: '0.85rem',
                                  wordBreak: 'break-all'
                                }}
                              >
                                {payment.transaction_id}
                              </Typography>
                            </Grid>
                          )}


                          {payment.notes && (
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Notes
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {payment.notes}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}


      {/* Assign Plan Dialog */}
      <Dialog open={openPlanDialog} onClose={() => setOpenPlanDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Subscription Plan</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Shop: {selectedShop?.store_name}
            </Typography>
            <TextField
              select
              fullWidth
              label="Select Plan"
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              margin="normal"
            >
              {plans.map((plan) => (
                <MenuItem key={plan.id} value={plan.id}>
                  {plan.name} - {formatCurrency(plan.price, plan.currency)} ({plan.plan_type})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              margin="normal"
              placeholder="Enter any notes about this subscription assignment..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPlanDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAssignPlan}
            variant="contained"
            disabled={!selectedPlan || actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Assign Plan'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};


export default AdminSubscriptions;



