import { Box, Card, CardContent, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';


const LoadingCard = ({ count = 1 }) => {
  return (
    <>
      {[...Array(count)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card
            sx={{
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              mb: 2,
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Skeleton
                variant="text"
                width="60%"
                height={32}
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  transform: 'scale(1, 1)',
                }}
              />
              <Skeleton
                variant="text"
                width="40%"
                height={24}
                sx={{
                  mb: 2,
                  borderRadius: 1,
                  transform: 'scale(1, 1)',
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Skeleton
                  variant="rounded"
                  width={80}
                  height={32}
                  sx={{ borderRadius: 2 }}
                />
                <Skeleton
                  variant="rounded"
                  width={80}
                  height={32}
                  sx={{ borderRadius: 2 }}
                />
              </Box>
              <Skeleton
                variant="rounded"
                width="100%"
                height={100}
                sx={{ borderRadius: 2 }}
              />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </>
  );
};


export default LoadingCard;



