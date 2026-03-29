import { Container, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid, Snackbar, Alert, CircularProgress, Chip, IconButton, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper, Card, CardContent, Tabs, Tab } from '@mui/material';
import LoadingAnimation from '../components/LoadingAnimation';
import { Add as AddIcon, Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMeasurements, createMeasurement, updateMeasurement } from '../services/measurementService';
import { isAbortError } from '../services/supabase';
import { getCustomers } from '../services/customerService';


const Measurements = () => {
  const [measurements, setMeasurements] = useState([]);
  const [filteredMeasurements, setFilteredMeasurements] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    customer_id: '',
    type: 'Shirt',
    chest: '',
    waist: '',
    shoulder: '',
    length: '',
    sleeve: '',
    neck: '',
    hip: '',
    inseam: '',
    notes: '',
    status: 'Pending'
  });


  const measurementTypes = ['Shirt', 'Pant', 'Kurta', 'Dress', 'Suit', 'Blazer', 'Sherwani'];


  useEffect(() => {
    fetchMeasurements();
    fetchCustomers();
  }, []);


  const fetchMeasurements = async () => {
    try {
      setLoading(true);
      const data = await getMeasurements();
      const formattedMeasurements = data.map(measurement => ({
        id: measurement.id,
        measurementId: measurement.id,
        customerId: measurement.customer?.customer_number || 'N/A',
        customerName: measurement.customer?.name || 'N/A',
        customerPhone: measurement.customer?.phone || '',
        type: measurement.type,
        chest: measurement.chest || '-',
        waist: measurement.waist || '-',
        shoulder: measurement.shoulder || '-',
        length: measurement.length || '-',
        sleeve: measurement.sleeve || '-',
        neck: measurement.neck || '-',
        hip: measurement.hip || '-',
        inseam: measurement.inseam || '-',
        notes: measurement.notes || '',
        status: measurement.status || 'Pending',
        lastUpdated: new Date(measurement.updated_at).toLocaleDateString()
      }));
      setMeasurements(formattedMeasurements);
      setFilteredMeasurements(formattedMeasurements);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Error fetching measurements:', error);
        setSnackbar({ open: true, message: 'Error loading measurements: ' + error.message, severity: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };


  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data || []);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Error fetching customers:', error);
      }
    }
  };


  const handleOpenDialog = () => {
    setOpenDialog(true);
  };


  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      customer_id: '',
      type: 'Shirt',
      chest: '',
      waist: '',
      shoulder: '',
      length: '',
      sleeve: '',
      neck: '',
      hip: '',
      inseam: '',
      notes: '',
      status: 'Pending'
    });
  };


  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
   
    if (!value.trim()) {
      setFilteredMeasurements(measurements);
      return;
    }
   
    const filtered = measurements.filter(m =>
      m.customerId?.toLowerCase().includes(value) ||
      m.customerName?.toLowerCase().includes(value) ||
      m.customerPhone?.toLowerCase().includes(value) ||
      m.type?.toLowerCase().includes(value) ||
      m.status?.toLowerCase().includes(value)
    );
    setFilteredMeasurements(filtered);
  };


  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredMeasurements(measurements);
  };


  const handleStatusChange = async (newStatus) => {
    try {
      await updateMeasurement(selectedMeasurement.measurementId, { status: newStatus });
      await fetchMeasurements();
      setSnackbar({
        open: true,
        message: 'Status updated successfully!',
        severity: 'success'
      });
      setOpenStatusDialog(false);
    } catch (error) {
      console.error('Error updating status:', error);
      setSnackbar({
        open: true,
        message: 'Error updating status: ' + error.message,
        severity: 'error'
      });
    }
  };


  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
   
    try {
      await createMeasurement(formData);
      await fetchMeasurements(); // Refresh the list
      setSnackbar({
        open: true,
        message: 'Measurement added successfully!',
        severity: 'success'
      });
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating measurement:', error);
      setSnackbar({
        open: true,
        message: 'Error adding measurement: ' + error.message,
        severity: 'error'
      });
    }
  };


  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };


  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };


  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };


  const handleRowClick = (measurement) => {
    setSelectedMeasurement(measurement);
    setOpenStatusDialog(true);
  };


  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };


  const getFilteredByTab = () => {
    const baseFiltered = searchTerm ? filteredMeasurements : measurements;
   
    switch (activeTab) {
      case 0: // Active = Working
        return baseFiltered.filter(m => m.status === 'Working');
      case 1: // Upcoming = Pending
        return baseFiltered.filter(m => m.status === 'Pending');
      case 2: // Completed
        return baseFiltered.filter(m => m.status === 'Completed');
      default:
        return baseFiltered;
    }
  };


  const displayedMeasurements = getFilteredByTab();


  return (
    <Box sx={{
      minHeight: '100vh',
      background: '#ffffff',
      position: 'relative',
      overflow: 'hidden'
    }}>
     
      {/* Enhanced Floating Scissors */}
      <motion.div
        style={{
          position: 'fixed',
          top: '10%',
          right: '5%',
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
      </motion.div>
     
      {/* Enhanced Floating Thread */}
      <motion.div
        style={{
          position: 'fixed',
          bottom: '15%',
          left: '5%',
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
      </motion.div>
     
      {/* Enhanced Floating Needle */}
      <motion.div
        style={{
          position: 'fixed',
          top: '50%',
          left: '3%',
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
      </motion.div>


      {/* Tabs */}
      <Box sx={{ background: 'transparent', px: { xs: 0, sm: 2 }, position: 'relative', zIndex: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#999',
              textTransform: 'none',
              '&.Mui-selected': {
                color: '#2196F3',
                fontWeight: 600,
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#2196F3',
              height: 3,
            }
          }}
        >
          <Tab label="Active" />
          <Tab label="Upcoming" />
          <Tab label="Completed" />
        </Tabs>
      </Box>


      <Container maxWidth="lg" sx={{ pt: 2, pb: 2, px: { xs: 2.5, sm: 3, md: 4 } }}>
        {/* Search Bar - Updated to blue theme */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by customer ID, name, phone, type, or status..."
            value={searchTerm}
            onChange={handleSearch}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#999' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              background: '#fff',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: '#2196F3',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#2196F3',
                }
              }
            }}
          />
        </Box>


      {/* Add Measurement Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={{ xs: true, sm: false }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          Add New Measurement
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              select
              label="Customer"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleInputChange}
              margin="normal"
              required
              autoFocus
            >
              <MenuItem value="">Select a customer</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Measurement Type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              margin="normal"
              required
            >
              {measurementTypes.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
           
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
              Measurements (in inches)
            </Typography>
           
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  label="Chest"
                  name="chest"
                  type="number"
                  value={formData.chest}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { step: '0.5' } }}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  label="Waist"
                  name="waist"
                  type="number"
                  value={formData.waist}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { step: '0.5' } }}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  label="Shoulder"
                  name="shoulder"
                  type="number"
                  value={formData.shoulder}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { step: '0.5' } }}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  label="Length"
                  name="length"
                  type="number"
                  value={formData.length}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { step: '0.5' } }}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  label="Sleeve"
                  name="sleeve"
                  type="number"
                  value={formData.sleeve}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { step: '0.5' } }}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  label="Neck"
                  name="neck"
                  type="number"
                  value={formData.neck}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { step: '0.5' } }}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  label="Hip"
                  name="hip"
                  type="number"
                  value={formData.hip}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { step: '0.5' } }}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  label="Inseam"
                  name="inseam"
                  type="number"
                  value={formData.inseam}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { step: '0.5' } }}
                />
              </Grid>
            </Grid>
           
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={2}
              placeholder="Any special instructions or notes..."
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              variant='outlined'
              onClick={handleCloseDialog}
              sx={{ minHeight: { xs: 44, sm: 36 }, borderColor: '#e0e0e0', color: '#666' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                minHeight: { xs: 44, sm: 36 },
                background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)' }
              }}
            >
              Add Measurement
            </Button>
          </DialogActions>
        </form>
      </Dialog>


      {/* Status Change Dialog */}
      <Dialog
        open={openStatusDialog}
        onClose={() => setOpenStatusDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{fontWeight: 600}}>Update Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Customer: <span style={{fontWeight: 600}}>{selectedMeasurement?.customerName}</span>
            </Typography>
            {/* <Typography variant="body2" color="text.secondary" gutterBottom>
              Customer ID: {selectedMeasurement?.customerId}
            </Typography> */}
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Type: <span style={{fontWeight: 600}}>{selectedMeasurement?.type}</span>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Current Status: <Chip label={selectedMeasurement?.status} size="small" />
            </Typography>


            {/* Measurement Details Grid */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Measurement Details
              </Typography>
              <Grid container spacing={2} style={{border: '1px solid #e2e8f0', borderRadius: 1, padding: '16px'}}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Chest</Typography>
                  <Typography variant="body2">{selectedMeasurement?.chest || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Waist</Typography>
                  <Typography variant="body2">{selectedMeasurement?.waist || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Shoulder</Typography>
                  <Typography variant="body2">{selectedMeasurement?.shoulder || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Length</Typography>
                  <Typography variant="body2">{selectedMeasurement?.length || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Sleeve</Typography>
                  <Typography variant="body2">{selectedMeasurement?.sleeve || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Neck</Typography>
                  <Typography variant="body2">{selectedMeasurement?.neck || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Hip</Typography>
                  <Typography variant="body2">{selectedMeasurement?.hip || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Inseam</Typography>
                  <Typography variant="body2">{selectedMeasurement?.inseam || 'N/A'}</Typography>
                </Grid>
                {selectedMeasurement?.notes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Notes</Typography>
                    <Typography variant="body2">{selectedMeasurement.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
           
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>
              Update Status
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, marginBottom:2 }}>
              <Button
                variant={selectedMeasurement?.status === 'Pending' ? 'contained' : 'outlined'}
                color="warning"
                fullWidth
                onClick={() => handleStatusChange('Pending')}
                sx={{ minHeight: 44 }}
              >
                Pending
              </Button>
              <Button
                variant={selectedMeasurement?.status === 'Working' ? 'contained' : 'outlined'}
                color="info"
                fullWidth
                onClick={() => handleStatusChange('Working')}
                sx={{ minHeight: 44 }}
              >
                Working
              </Button>
              <Button
                variant={selectedMeasurement?.status === 'Completed' ? 'contained' : 'outlined'}
                color="success"
                fullWidth
                onClick={() => handleStatusChange('Completed')}
                sx={{ minHeight: 44 }}
              >
                Completed
              </Button>
            </Box>
            <hr />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenStatusDialog(false)}
            variant="outlined"
            sx={{ minHeight: 44, borderColor: '#2196F3', color: '#2196F3' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>


      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>


      {/* Mobile Card View with Animations */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress sx={{ color: '#667eea' }} />
          </Box>
        ) : displayedMeasurements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography sx={{ fontSize: '4rem', mb: 2 }}>📏</Typography>
              <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, mb: 1 }}>
                No measurements found
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {activeTab === 0 && "No active (working) measurements"}
                {activeTab === 1 && "No upcoming (pending) measurements"}
                {activeTab === 2 && "No completed measurements"}
              </Typography>
            </Box>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {displayedMeasurements
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((measurement, index) => {
                    const statusColors = {
                      'Pending': { bg: '#FFF3E0', color: '#F57C00', dot: '#FF9800' },
                      'Working': { bg: '#E3F2FD', color: '#1976D2', dot: '#2196F3' },
                      'Completed': { bg: '#E8F5E9', color: '#388E3C', dot: '#4CAF50' }
                    };
                    const colors = statusColors[measurement.status] || statusColors['Pending'];
                   
                    return (
                      <motion.div
                        key={measurement.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <Card
                          elevation={0}
                          onClick={() => handleRowClick(measurement)}
                          sx={{
                            borderRadius: 2,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08)',
                            '&:hover': {
                              boxShadow: '0 8px 24px rgba(33, 150, 243, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1)',
                              transform: 'translateY(-3px)',
                            },
                            '&:active': {
                              transform: 'scale(0.98)',
                            }
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 0.5, color: '#1e293b' }}>
                                  {measurement.customerName}
                                </Typography>
                              </Box>
                              <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 10,
                                bgcolor: colors.bg
                              }}>
                                <Box sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  bgcolor: colors.dot
                                }} />
                                <Typography sx={{
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: colors.color
                                }}>
                                  {measurement.status}
                                </Typography>
                              </Box>
                            </Box>
                           
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                                📞 {measurement.customerPhone}
                              </Typography>
                              <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
                              <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#2196F3', fontWeight: 600 }}>
                                {measurement.type}
                              </Typography>
                            </Box>
                           
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                              <motion.div
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    fontSize: '0.75rem',
                                    color: '#667eea',
                                    borderColor: '#667eea',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    px: 1.5,
                                    py: 0.25,
                                    borderRadius: 1.5,
                                    '&:hover': {
                                      borderColor: '#764ba2',
                                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                                    }
                                  }}
                                >
                                  View Measurements
                                </Button>
                              </motion.div>
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
              </Box>
            </motion.div>
          </AnimatePresence>
        )}
        {!loading && displayedMeasurements.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={displayedMeasurements.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              mt: 2,
              backgroundColor: 'white',
              borderRadius: 1,
            }}
          />
        )}
      </Box>


      {/* Desktop Table View */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          display: { xs: 'none', md: 'block' },
          borderRadius: 2,
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress sx={{ color: '#667eea' }} />
          </Box>
        ) : displayedMeasurements.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: '4rem', mb: 2 }}>📏</Typography>
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, mb: 1 }}>
              No measurements found
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Add your first measurement
            </Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#ffff', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>ID</TableCell>
                  <TableCell sx={{ backgroundColor: '#ffff', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Customer</TableCell>
                  <TableCell sx={{ backgroundColor: '#ffff', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Type</TableCell>
                  <TableCell sx={{ backgroundColor: '#ffff', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Status</TableCell>
                  <TableCell sx={{ backgroundColor: '#ffff', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Shoulder</TableCell>
                  <TableCell sx={{ backgroundColor: '#ffff', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Length</TableCell>
                  <TableCell sx={{ backgroundColor: '#ffff', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Updated</TableCell>
                </TableRow>
              </TableHead>
              <AnimatePresence mode="wait">
                <TableBody
                  component={motion.tbody}
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {displayedMeasurements
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((measurement) => {
                        const statusColors = {
                          'Pending': { bg: '#FFF3E0', color: '#F57C00' },
                          'Working': { bg: '#E3F2FD', color: '#1976D2' },
                          'Completed': { bg: '#E8F5E9', color: '#388E3C' }
                        };
                        const colors = statusColors[measurement.status] || statusColors['Pending'];
                        return (
                          <TableRow
                            key={measurement.id}
                            hover
                            onClick={() => handleRowClick(measurement)}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: '#ffff'
                              }
                            }}
                          >
                            <TableCell sx={{ fontSize: '0.875rem', color: '#64748b' }}>#{measurement.customerId}</TableCell>
                            <TableCell>
                              <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                                  {measurement.customerName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                  {measurement.customerPhone}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: '0.875rem', color: '#2196F3', fontWeight: 500 }}>
                                {measurement.type}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 10,
                                bgcolor: colors.bg
                              }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: colors.color }} />
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.color }}>
                                  {measurement.status}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{measurement.shoulder}</TableCell>
                            <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{measurement.length}</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>{measurement.lastUpdated}</TableCell>
                          </TableRow>
                        );
                    })}
                </TableBody>
              </AnimatePresence>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={displayedMeasurements.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ borderTop: '1px solid #e0e0e0' }}
            />
          </>
        )}
      </TableContainer>
      </Container>
    </Box>
  );
};


export default Measurements;



