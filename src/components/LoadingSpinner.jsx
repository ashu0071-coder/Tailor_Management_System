import { Box, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';


const LoadingSpinner = ({ fullScreen = false, message = 'Loading...' }) => {
  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <CircularProgress
          size={fullScreen ? 60 : 40}
          thickness={4}
          sx={{
            color: '#667eea',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{
              color: '#64748b',
              fontSize: '0.95rem',
              fontWeight: 500,
              margin: 0,
            }}
          >
            {message}
          </motion.p>
        )}
      </Box>
    </motion.div>
  );


  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
        }}
      >
        {content}
      </Box>
    );
  }


  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        py: 4,
      }}
    >
      {content}
    </Box>
  );
};


export default LoadingSpinner;



