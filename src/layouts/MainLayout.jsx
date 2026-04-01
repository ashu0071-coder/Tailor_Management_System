import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  People as PeopleIcon,
  Straighten as StraightenIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  CameraAlt as CameraIcon,
  Home as HomeIcon,
  Receipt as ReceiptIcon,
  Store as StoreIcon,
  Subscriptions as SubscriptionsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import SubscriptionStatus from '../components/SubscriptionStatus';


const MainLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, userProfile, isAdmin } = useAuth();
 
  const storeName = userProfile?.store_name || 'Tailor Manager';


  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };


  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };


  const menuItems = isAdmin
    ? [
        { text: 'Manage Shops', icon: <StoreIcon />, path: '/admin/shops' },
        { text: 'Subscriptions', icon: <SubscriptionsIcon />, path: '/admin/subscriptions' },
      ]
    : [
        { text: 'Orders', icon: <ReceiptIcon />, path: '/' },
        { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
        { text: 'Measurements', icon: <StraightenIcon />, path: '/measurements' },
      ];


  const bottomNavItems = [
    { icon: <HomeIcon />, label: 'Home', path: '/' },
    { icon: <ReceiptIcon />, label: 'Orders', path: '/customers' },
  ];


  const handleNavigation = (path) => {
    navigate(path);
    if (menuOpen) {
      setMenuOpen(false);
    }
  };


  const menuDrawer = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#ffffff',
      color: '#1e293b'
    }}>
      <Toolbar sx={{
        minHeight: 64,
        borderBottom: '1px solid #e0e0e0',
        background: '#ffffff',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: '1.5rem' }}>✂️</Typography>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1e293b',
            }}
          >
            TailorBook
          </Typography>
        </Box>
      </Toolbar>
     
      <Box sx={{ px: 2, py: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            borderRadius: 2,
            background: '#f5f5f5',
            border: '1px solid #e0e0e0',
          }}>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                background: '#2196F3',
                fontWeight: 600
              }}
            >
              {storeName?.charAt(0) || 'T'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: '#1e293b'
                }}
              >
                {storeName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#666',
                  fontSize: '0.75rem'
                }}
              >
                Tailor Shop
              </Typography>
            </Box>
          </Box>
        </motion.div>
      </Box>
     
      <Divider sx={{ borderColor: '#e0e0e0' }} />
     
      <List sx={{ py: 2, px: 2 }}>
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    minHeight: 52,
                    px: 2,
                    borderRadius: 2,
                    background: isActive ? '#E3F2FD' : 'transparent',
                    border: isActive ? '1px solid #2196F3' : '1px solid transparent',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    '&:hover': {
                      background: isActive ? '#E3F2FD' : '#f5f5f5',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: 44,
                    color: isActive ? '#2196F3' : '#666',
                    transition: 'color 0.3s ease'
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      sx: {
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.95rem',
                        color: isActive ? '#2196F3' : '#666'
                      }
                    }}
                  />
                  {isActive && (
                    <Box
                      sx={{
                        position: 'absolute',
                        right: 8,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#2196F3',
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </motion.div>
          );
        })}
      </List>
     
      <Box sx={{ flexGrow: 1 }} />
     
      <Divider sx={{ borderColor: '#e0e0e0' }} />
     
      <List sx={{ py: 2, px: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              minHeight: 52,
              px: 2,
              borderRadius: 2,
              background: 'rgba(244, 67, 54, 0.08)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(244, 67, 54, 0.15)',
                transform: 'translateX(4px)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 44, color: '#F44336' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                sx: { fontWeight: 600, color: '#F44336', fontSize: '0.95rem' }
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: '#ffffff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: 56, justifyContent: 'space-between', px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              edge="start"
              onClick={handleMenuToggle}
              sx={{
                color: '#1e293b',
                '&:active': { transform: 'scale(0.95)' }
              }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '1.5rem' }}>✂️</Typography>
              <Typography
                variant="h6"
                noWrap
                sx={{
                  color: '#1e293b',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                }}
              >
                {storeName}
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
     
      <Drawer
        anchor="left"
        open={menuOpen}
        onClose={handleMenuToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            border: 'none',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              {menuDrawer}
            </motion.div>
          )}
        </AnimatePresence>
      </Drawer>
     
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pb: 2,
          pt: 8,
          px: { xs: 0, sm: 2 },
          background: '#f5f5f5',
          minHeight: '100vh',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Show subscription status for non-admin users */}
          {/* {!isAdmin && (
            <Box sx={{ px: { xs: 2, sm: 0 } }}>
              <SubscriptionStatus />
            </Box>
          )} */}
          <Outlet />
        </motion.div>
      </Box>
    </Box>
  );
};


export default MainLayout;



