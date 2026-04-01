import { Container, Typography, Box, Card, CardContent } from '@mui/material';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCustomers } from '../services/customerService';
import { getMeasurements } from '../services/measurementService';
import { isAbortError } from '../services/supabase';
import LoadingSpinner from '../components/LoadingSpinner';


const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    workingOrders: 0,
    completedOrders: 0
  });
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchStats();
  }, []);


  const fetchStats = async () => {
    try {
      setLoading(true);
      const [customers, measurements] = await Promise.all([
        getCustomers(),
        getMeasurements()
      ]);


      const pending = measurements.filter(m => m.status === 'Pending').length;
      const working = measurements.filter(m => m.status === 'Working').length;
      const completed = measurements.filter(m => m.status === 'Completed').length;


      setStats({
        totalCustomers: customers.length,
        totalOrders: measurements.length,
        pendingOrders: pending,
        workingOrders: working,
        completedOrders: completed
      });
    } catch (error) {
      if (!isAbortError(error)) console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };


  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };


  const statsCards = [
    {
      title: 'Orders',
      value: stats.totalOrders,
      icon: '📏',
      bg: '#f8fafc',
      iconBg: '#fce7f3',
      iconColor: '#db2777',
      borderColor: '#fbcfe8',
    },
    {
      title: 'Pending',
      value: stats.pendingOrders,
      icon: '🧵',
      bg: '#f8fafc',
      iconBg: '#fef3c7',
      iconColor: '#f59e0b',
      borderColor: '#fde68a',
    },
    {
      title: 'Working',
      value: stats.workingOrders,
      icon: '🪡',
      bg: '#f8fafc',
      iconBg: '#ddd6fe',
      iconColor: '#7c3aed',
      borderColor: '#c4b5fd',
    },
    {
      title: 'Completed',
      value: stats.completedOrders,
      icon: '✂️',
      bg: '#f8fafc',
      iconBg: '#d1fae5',
      iconColor: '#059669',
      borderColor: '#a7f3d0',
    }
  ];


  return (
<Box
  sx={{
    height: '100vh',
    backgroundImage: 'url(/stitch_bg.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    overflowX: 'hidden',
    overflowY: 'auto',
    margin: 0,
    padding: 0,
    width: '100%',

    // overlay for softness
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 1,
    }
  }}
>
     
      {/* Top Right Scissors */}
      {/* <motion.div
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
      </motion.div> */}
     
      {/* Bottom Left Thread */}
      {/* <motion.div
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
      </motion.div> */}
     
      {/* Middle Left Needle */}
      {/* <motion.div
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
      </motion.div> */}


      {/* Bottom Right Scissors */}
      {/* <motion.div
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
      </motion.div> */}


      {/* Top Center Button */}
      {/* <motion.div
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
      </motion.div> */}


      <Container maxWidth="lg" sx={{ pt: { xs: 3, sm: 4, md: 5 }, pb: { xs: 3, sm: 4, md: 5 }, px: { xs: 2.5, sm: 3, md: 4 }, position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 800,
              mb: { xs: 3, sm: 4 },
              background: '#ffffff',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textAlign: 'center',
              letterSpacing: '-0.5px',
            }}
          >
            Dashboard
          </Typography>
        </motion.div>
     
        <AnimatePresence>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(5, 1fr)'
              },
              gap: { xs: 2.5, sm: 3, md: 3.5 },
            }}>
              {statsCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  variants={cardVariants}
                  whileHover={{
                    y: -8,
                    scale: 1.03,
                    transition: { duration: 0.3, type: "spring", stiffness: 300 }
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: 3,
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      border: `2px solid ${card.borderColor}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                        position: 'absolute',
                        fontSize: { xs: '120px', sm: '140px', md: '160px' },
                        opacity: 0.1,
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        zIndex: 0,
                      },
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 12px 24px -8px ${card.iconColor}33`,
                        borderColor: card.iconColor,
                        '&::before': {
                          opacity: 0.15,
                          fontSize: { xs: '130px', sm: '150px', md: '170px' },
                        }
                      }
                    }}
                  >
                    <CardContent sx={{
                      p: { xs: 3, sm: 3.5 },
                      '&:last-child': { pb: { xs: 3, sm: 3.5 } },
                      position: 'relative',
                      zIndex: 1,
                    }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: '0.9rem', sm: '0.875rem' },
                          color: '#64748b',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          mb: 2,
                        }}
                      >
                        {card.title}
                      </Typography>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                      >
                        <Typography
                          variant="h3"
                          sx={{
                            fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                            fontWeight: 800,
                            lineHeight: 1,
                            color: card.iconColor,
                          }}
                        >
                          {card.value}
                        </Typography>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Box>
          </motion.div>
        </AnimatePresence>
      </Container>
    </Box>
  );
};


export default Dashboard;



