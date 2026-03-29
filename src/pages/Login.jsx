import { useState } from 'react';
import { Container, Typography, Box, TextField, Button, Paper, CircularProgress, Alert, Tabs, Tab } from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';


const Login = () => {
  const [loginMode, setLoginMode] = useState('user'); // 'user' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();


  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setLoginMode(newValue);
    setError('');
  };


  // Handle login submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);


    try {
      const { error } = await signIn(email, password);
     
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      setLoading(false);
    }
  };


  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'float 20s linear infinite',
        },
        '@keyframes float': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(50px, 50px)' },
        },
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <Paper
            elevation={24}
            sx={{
              p: { xs: 4, sm: 5 },
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: '4rem', sm: '4.5rem' },
                      mb: 2,
                      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'
                    }}
                  >
                    ✂️
                  </Typography>
                </motion.div>
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1.75rem', sm: '2.125rem' },
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    mb: 1
                  }}
                >
                  Tailor Management
                </Typography>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    color: '#64748b',
                    fontWeight: 400
                  }}
                >
                  Welcome Back 👋
                </Typography>
               
                {/* User/Admin Tabs */}
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Tabs
                    value={loginMode}
                    onChange={handleTabChange}
                    centered
                    sx={{
                      '& .MuiTabs-indicator': {
                        backgroundColor: '#667eea',
                      },
                    }}
                  >
                    <Tab
                      label="User Login"
                      value="user"
                      sx={{
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                        '&.Mui-selected': {
                          color: '#667eea',
                        },
                      }}
                    />
                    <Tab
                      label="Admin Login"
                      value="admin"
                      sx={{
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                        '&.Mui-selected': {
                          color: '#667eea',
                        },
                      }}
                    />
                  </Tabs>
                </Box>
              </Box>
            </motion.div>
           
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    fontSize: { xs: '0.875rem', sm: '0.95rem' }
                  }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}
           
            <Box component="form" onSubmit={handleSubmit}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="email"
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: { xs: '1rem', sm: '1rem' },
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
                    },
                  }}
                />
              </motion.div>
             
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: { xs: '1rem', sm: '1rem' },
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
                    },
                  }}
                />
              </motion.div>
             
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    mt: 3,
                    mb: 2,
                    minHeight: 56,
                    fontSize: { xs: '1.05rem', sm: '1.1rem' },
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 3,
                    textTransform: 'none',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    '&.Mui-disabled': {
                      background: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)',
                      color: 'white',
                    }
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                      <span>Signing in...</span>
                    </Box>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </motion.div>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};


export default Login;



