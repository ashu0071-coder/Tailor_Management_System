import { Card, CardContent, Box, Typography, Chip, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Phone as PhoneIcon, Email as EmailIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';


const CustomerCard = ({ customer, onEdit, onDelete, index }) => {
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return { bg: '#dcfce7', color: '#166534', border: '#86efac' };
      case 'Partial':
        return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' };
      case 'Not Paid':
        return { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
    }
  };


  const statusColors = getPaymentStatusColor(customer.payment_status);


  return (
    <motion.div
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
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 12px 32px rgba(102, 126, 234, 0.25), 0 6px 16px rgba(0, 0, 0, 0.15)',
            borderColor: '#667eea',
            transform: 'translateY(-2px)',
          },
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    fontWeight: 700,
                    color: '#1e293b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {customer.name}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                }}
              >
                #{customer.customer_number}
              </Typography>
            </Box>
           
            <Chip
              label={customer.payment_status}
              size="small"
              sx={{
                background: statusColors.bg,
                color: statusColors.color,
                border: `1px solid ${statusColors.border}`,
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 26,
                ml: 1,
              }}
            />
          </Box>


          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <PhoneIcon sx={{ fontSize: '1.1rem', color: '#667eea' }} />
              <Typography
                variant="body2"
                sx={{
                  color: '#475569',
                  fontSize: '0.9rem',
                }}
              >
                {customer.phone}
              </Typography>
            </Box>
           
            {customer.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                <EmailIcon sx={{ fontSize: '1.1rem', color: '#667eea' }} />
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
                  {customer.email}
                </Typography>
              </Box>
            )}
          </Box>


          {customer.address && (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontSize: '0.85rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                📍 {customer.address}
              </Typography>
             
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                <motion.div whileTap={{ scale: 0.9 }}>
                  <IconButton
                    onClick={() => onEdit(customer)}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      minWidth: 44,
                      minHeight: 44,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    <EditIcon sx={{ fontSize: '1.2rem' }} />
                  </IconButton>
                </motion.div>
               
                <motion.div whileTap={{ scale: 0.9 }}>
                  <IconButton
                    onClick={() => onDelete(customer)}
                    sx={{
                      background: '#fee2e2',
                      color: '#dc2626',
                      minWidth: 44,
                      minHeight: 44,
                      '&:hover': {
                        background: '#fca5a5',
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: '1.2rem' }} />
                  </IconButton>
                </motion.div>
              </Box>
            </Box>
          )}


          {!customer.address && (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <motion.div whileTap={{ scale: 0.9 }}>
                <IconButton
                  onClick={() => onEdit(customer)}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    minWidth: 44,
                    minHeight: 44,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <EditIcon sx={{ fontSize: '1.2rem' }} />
                </IconButton>
              </motion.div>
             
              <motion.div whileTap={{ scale: 0.9 }}>
                <IconButton
                  onClick={() => onDelete(customer)}
                  sx={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    minWidth: 44,
                    minHeight: 44,
                    '&:hover': {
                      background: '#fca5a5',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: '1.2rem' }} />
                </IconButton>
              </motion.div>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};


export default CustomerCard;



