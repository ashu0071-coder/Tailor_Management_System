// Order status options
export const ORDER_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};


// Measurement types
export const MEASUREMENT_TYPES = {
  SHIRT: 'Shirt',
  PANT: 'Pant',
  KURTA: 'Kurta',
  DRESS: 'Dress',
  SUIT: 'Suit',
  BLAZER: 'Blazer',
  SHERWANI: 'Sherwani',
};


// Payment status
export const PAYMENT_STATUS = {
  UNPAID: 'Unpaid',
  PARTIAL: 'Partial',
  PAID: 'Paid',
};


// Status colors for MUI Chip
export const STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'warning',
  [ORDER_STATUS.IN_PROGRESS]: 'primary',
  [ORDER_STATUS.COMPLETED]: 'success',
  [ORDER_STATUS.DELIVERED]: 'success',
  [ORDER_STATUS.CANCELLED]: 'error',
};



