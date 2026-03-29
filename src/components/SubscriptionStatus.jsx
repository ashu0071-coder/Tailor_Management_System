import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  LinearProgress,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  getCurrentUserSubscription,
  getDaysRemaining,
  getSubscriptionPlans,
  subscribeToPlan,
  renewSubscription,
} from '../services/subscriptionService';
import { isAbortError } from '../services/supabase';


const SubscriptionStatus = () => {
  const [subscription, setSubscription] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPlansDialog, setOpenPlansDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);


  useEffect(() => {
    loadSubscriptionData();
  }, []);


  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [subData, daysData, plansData] = await Promise.all([
        getCurrentUserSubscription(),
        getDaysRemaining(),
        getSubscriptionPlans(),
      ]);
     
      setSubscription(subData);
      setDaysRemaining(daysData);
      setPlans(plansData);
    } catch (error) {
      if (!isAbortError(error)) console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };


  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0);
  };


  const getStatusColor = () => {
    if (!subscription) return 'default';
   
    switch (subscription.subscription_status) {
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


  const getProgressPercentage = () => {
    if (!daysRemaining) return 0;
   
    if (daysRemaining.type === 'trial') {
      const totalTrialDays = 14; // Default trial period
      return ((totalTrialDays - daysRemaining.days) / totalTrialDays) * 100;
    }
   
    if (daysRemaining.type === 'billing') {
      const totalDays = 30; // Monthly subscription
      return ((totalDays - daysRemaining.days) / totalDays) * 100;
    }
   
    return 0;
  };


  const handleRenewNow = async () => {
    // In a real app, this would integrate with a payment gateway
    alert('Payment gateway integration required. Contact admin for manual renewal.');
  };


  const handleUpgradeSubscription = () => {
    setOpenPlansDialog(true);
  };


  if (loading) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }


  // Don't show for admins
  if (subscription?.role === 'admin') {
    return null;
  }


  const isInactive = !subscription?.is_subscription_active;
  const isExpiringSoon = daysRemaining && daysRemaining.days <= 3 && daysRemaining.days >= 0;
  const isExpired = subscription?.subscription_status === 'expired' ||
                    subscription?.subscription_status === 'inactive';


  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Subscription Status
              </Typography>
              <Chip
                label={subscription?.subscription_status?.toUpperCase() || 'UNKNOWN'}
                color={getStatusColor()}
                icon={
                  isInactive ? <ErrorIcon /> :
                  isExpiringSoon ? <WarningIcon /> :
                  <CheckIcon />
                }
              />
            </Box>


            {/* Alert Messages */}
            {isExpired && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <AlertTitle>Subscription Expired</AlertTitle>
                Your subscription has expired. Please renew to continue using the service.
              </Alert>
            )}


            {isExpiringSoon && !isExpired && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <AlertTitle>Renewal Due Soon</AlertTitle>
                Your subscription will expire in {daysRemaining.days} day{daysRemaining.days !== 1 ? 's' : ''}.
                Please renew to avoid service interruption.
              </Alert>
            )}


            {subscription?.subscription_status === 'trial' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <AlertTitle>Trial Period</AlertTitle>
                You have {daysRemaining?.days || 0} day{daysRemaining?.days !== 1 ? 's' : ''} remaining in your trial.
                Subscribe now to continue using the service.
              </Alert>
            )}


            {/* Subscription Details */}
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Current Plan
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {subscription?.subscription_plans?.name || 'No Plan'}
                </Typography>
              </Grid>


              {subscription?.subscription_plans?.plan_type === 'monthly' && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Next Billing Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(subscription?.next_billing_date)}
                  </Typography>
                </Grid>
              )}


              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Plan Type
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {subscription?.subscription_plans?.plan_type === 'one_time'
                    ? 'One-Time Purchase'
                    : 'Monthly Subscription'}
                </Typography>
              </Grid>


              {subscription?.subscription_plans?.plan_type === 'monthly' && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Cost
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(
                      subscription?.subscription_plans?.price,
                      subscription?.subscription_plans?.currency
                    )}
                  </Typography>
                </Grid>
              )}
            </Grid>


            {/* Progress Bar for Trial/Monthly */}
            {(daysRemaining?.type === 'trial' || daysRemaining?.type === 'billing') && (
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    {daysRemaining.type === 'trial' ? 'Trial Progress' : 'Billing Cycle'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {daysRemaining.days} days remaining
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getProgressPercentage()}
                  color={isExpiringSoon ? 'warning' : 'primary'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}


            {/* Action Buttons */}
            <Box display="flex" gap={2} flexWrap="wrap">
              {(isExpired || subscription?.subscription_status === 'trial') && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PaymentIcon />}
                  onClick={handleUpgradeSubscription}
                >
                  Subscribe Now
                </Button>
              )}


              {subscription?.subscription_plans?.plan_type === 'monthly' &&
               subscription?.subscription_status === 'active' && (
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRenewNow}
                >
                  Renew Now
                </Button>
              )}


              <Button
                variant="outlined"
                onClick={loadSubscriptionData}
              >
                Refresh Status
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>


      {/* Plans Dialog */}
      <Dialog
        open={openPlansDialog}
        onClose={() => setOpenPlansDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Choose Your Subscription Plan</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ pt: 2 }}>
            {plans.map((plan) => (
              <Grid item xs={12} md={6} key={plan.id}>
                <Card
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    border: selectedPlan?.id === plan.id ? 2 : 1,
                    borderColor: selectedPlan?.id === plan.id ? 'primary.main' : 'divider',
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {plan.name}
                    </Typography>
                    <Typography variant="h4" color="primary" gutterBottom>
                      {formatCurrency(plan.price, plan.currency)}
                      {plan.plan_type === 'monthly' && (
                        <Typography component="span" variant="body2" color="text.secondary">
                          /month
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {plan.description}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <List dense>
                      {(plan.features || []).map((feature, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPlansDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!selectedPlan}
            onClick={() => {
              // In a real app, integrate with payment gateway
              alert(`Selected plan: ${selectedPlan?.name}. Payment integration required.`);
              setOpenPlansDialog(false);
            }}
          >
            Continue to Payment
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};


export default SubscriptionStatus;



