import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Container, Typography, Button, Card, CardContent, Alert } from '@mui/material';
import { LockOutlined as LockIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { isSubscriptionActive, getCurrentUserSubscription } from '../services/subscriptionService';


const ProtectedRoute = ({ children, requireActiveSubscription = true }) => {
  const { user, loading } = useAuth();
  const [subscriptionActive, setSubscriptionActive] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);


  useEffect(() => {
    if (user && requireActiveSubscription) {
      checkSubscription();
    } else {
      setCheckingSubscription(false);
    }
  }, [user, requireActiveSubscription]);


  const checkSubscription = async () => {
    try {
      const [isActive, subData] = await Promise.all([
        isSubscriptionActive(),
        getCurrentUserSubscription(),
      ]);
     
      console.log('Subscription check result:', { isActive, subData });
     
      // If user has no subscription plan assigned (old users), allow access temporarily
      if (!subData?.subscription_plan_id) {
        console.log('User has no subscription plan - allowing access for existing user');
        setSubscriptionActive(true);
        setSubscriptionData(subData);
        setCheckingSubscription(false);
        return;
      }
     
      setSubscriptionActive(isActive);
      setSubscriptionData(subData);
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Allow access if there's an error (backwards compatibility)
      setSubscriptionActive(true);
    } finally {
      setCheckingSubscription(false);
    }
  };


  if (loading || checkingSubscription) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#667eea' }} />
      </Box>
    );
  }


  if (!user) {
    return <Navigate to="/login" />;
  }


  // Check subscription status (skip for admin users)
  if (requireActiveSubscription && subscriptionData?.role !== 'admin' && !subscriptionActive) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <LockIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Subscription Required
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your subscription is currently inactive. Please renew your subscription to continue using the application.
            </Typography>
           
            {subscriptionData?.subscription_status === 'trial' && (
              <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
                Your trial period has ended. Subscribe now to continue using all features.
              </Alert>
            )}
           
            {subscriptionData?.subscription_status === 'expired' && (
              <Alert severity="warning" sx={{ mt: 2, mb: 3 }}>
                Your subscription has expired. Please renew to regain access.
              </Alert>
            )}
           
            {subscriptionData?.subscription_status === 'inactive' && (
              <Alert severity="error" sx={{ mt: 2, mb: 3 }}>
                Your account is inactive. Please contact support or renew your subscription.
              </Alert>
            )}


            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => window.location.reload()}
              >
                Check Subscription Status
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => {
                  // Contact support or admin
                  alert('Please contact support at support@example.com or your administrator to activate your subscription.');
                }}
              >
                Contact Support
              </Button>
            </Box>


            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              If you believe this is an error, please contact our support team.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }


  return children;
};


ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requireActiveSubscription: PropTypes.bool,
};


export default ProtectedRoute;



