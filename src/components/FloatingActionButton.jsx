import { Fab } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';


const FloatingActionButton = ({ onClick, icon = <AddIcon />, label = 'Add' }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: 0.3
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        marginLeft: '-32px',
        zIndex: 1000,
      }}
    >
      <Fab
        onClick={onClick}
        sx={{
          width: 64,
          height: 64,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
            boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)',
          },
          '&:active': {
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
          },
        }}
        aria-label={label}
      >
        {icon}
      </Fab>
    </motion.div>
  );
};


export default FloatingActionButton;



