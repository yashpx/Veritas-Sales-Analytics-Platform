import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Box, Avatar, CircularProgress, Paper, Typography, 
  Button, Modal, TextField, FormControl, InputLabel, 
  Select, MenuItem, InputAdornment, Grid, Table, 
  TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Snackbar, Alert
} from '@mui/material';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import TargetIcon from '@mui/icons-material/TrackChanges';
import CloseIcon from '@mui/icons-material/Close';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import supabase from '../utils/supabaseClient';

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salesReps, setSalesReps] = useState([]);
  const [kpiTargets, setKpiTargets] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [newKpi, setNewKpi] = useState({
    sales_rep_id: '',
    month: '',
    target_transactions: '',
    target_sales_amount: '',
  });
  const [kpiData, setKpiData] = useState({
    totalRevenue: 0,
    successRate: 0,
    revenuePerCall: 0,
    avgSatisfaction: 0,
    monthlyRevenueTrend: [],
    callEffectiveness: [],
    kpiPerformance: []
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date to month/year
  const formatMonth = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
  };

  // Handle modal open/close
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  // Handle snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewKpi({ ...newKpi, [name]: value });
  };

  // Handle form submission to add new KPI
  const handleAddKpi = async (e) => {
    e.preventDefault();
    
    try {
      // Validate inputs
      if (!newKpi.sales_rep_id || !newKpi.month || !newKpi.target_transactions || !newKpi.target_sales_amount) {
        setSnackbar({
          open: true,
          message: 'Please fill all required fields',
          severity: 'error',
        });
        return;
      }

      // Get sales rep details
      const selectedRep = salesReps.find(rep => rep.sales_rep_id === parseInt(newKpi.sales_rep_id));
      
      // Insert new KPI target into Supabase
      const { data, error } = await supabase
        .from('sales_kpi')
        .insert([
          {
            sales_rep_id: parseInt(newKpi.sales_rep_id),
            sales_rep_first_name: selectedRep.sales_rep_first_name,
            sales_rep_last_name: selectedRep.sales_rep_last_name,
            month: newKpi.month,
            target_transactions: parseInt(newKpi.target_transactions),
            target_sales_amount: parseFloat(newKpi.target_sales_amount),
          }
        ])
        .select();

      if (error) throw error;

      // Success - refresh data and reset form
      fetchKpiTargets();
      setSnackbar({
        open: true,
        message: 'KPI target added successfully!',
        severity: 'success',
      });
      setNewKpi({
        sales_rep_id: '',
        month: '',
        target_transactions: '',
        target_sales_amount: '',
      });
      handleCloseModal();
    } catch (error) {
      console.error('Error adding KPI target:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error',
      });
    }
  };

  // Fetch sales representatives
  const fetchSalesReps = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_reps')
        .select('*')
        .order('sales_rep_id', { ascending: true });

      if (error) throw error;
      setSalesReps(data || []);
    } catch (error) {
      console.error('Error fetching sales reps:', error);
    }
  };

  // Fetch KPI targets
  const fetchKpiTargets = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_kpi')
        .select('*')
        .order('month', { ascending: false });

      if (error) throw error;
      setKpiTargets(data || []);
      
      // Prepare data for KPI performance chart
      if (data && data.length > 0) {
        const kpiPerformanceData = data.map(kpi => ({
          name: `${kpi.sales_rep_first_name} ${kpi.sales_rep_last_name}`,
          target: parseFloat(kpi.target_sales_amount),
          actual: Math.floor(Math.random() * parseFloat(kpi.target_sales_amount) * 1.2), // Simulated actual performance
          month: formatMonth(kpi.month)
        }));
        
        // Update KPI data state with performance data
        setKpiData(prevData => ({
          ...prevData,
          kpiPerformance: kpiPerformanceData.slice(0, 5) // Limit to 5
        }));
      }
    } catch (error) {
      console.error('Error fetching KPI targets:', error);
    }
  };

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        
        // Fetch real KPI targets data
        await fetchSalesReps();
        await fetchKpiTargets();
        
        // For demo purposes, using mock data for other analytics
        const totalRevenue = 125000;
        const successRate = 68;
        const revenuePerCall = 380;
        const avgSatisfaction = 4.2;
        
        const monthlyRevenueTrend = [
          { month: 'Jan', total_revenue: 10500 },
          { month: 'Feb', total_revenue: 12200 },
          { month: 'Mar', total_revenue: 9800 },
          { month: 'Apr', total_revenue: 14500 },
          { month: 'May', total_revenue: 15800 },
          { month: 'Jun', total_revenue: 18500 },
        ];
        
        const callEffectiveness = [
          { month: 'Successful', call_effectiveness: 65 },
          { month: 'Pending', call_effectiveness: 25 },
          { month: 'Failed', call_effectiveness: 10 },
        ];
        
        setKpiData(prevData => ({
          ...prevData,
          totalRevenue,
          successRate,
          revenuePerCall,
          avgSatisfaction,
          monthlyRevenueTrend,
          callEffectiveness
        }));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching KPIs:', error);
        setLoading(false);
      }
    };
    
    if (user) {
      fetchKPIs();
    }
  }, [user]);

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  // Modal style
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 500,
    bgcolor: 'background.paper',
    borderRadius: 2,
    boxShadow: 24,
    p: 4,
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--heading-color)' }}>
            Analytics Dashboard
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleOpenModal}
            sx={{ 
              bgcolor: '#5a2ca0', 
              '&:hover': { bgcolor: '#4A1D85' },
              borderRadius: 2,
              boxShadow: 2
            }}
          >
            Add KPI Target
          </Button>
        </Box>

        {/* KPI Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4, mt: 3 }}>
          <Paper sx={{ p: 4, display: 'flex', alignItems: 'center', borderRadius: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <Avatar sx={{ bgcolor: '#4CAF50', width: 60, height: 60, mr: 3 }}>
              <AttachMoneyIcon sx={{ fontSize: 35, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--primary-color)' }}>
                ${kpiData.totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'var(--text-color)' }}>Total Revenue</Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 4, display: 'flex', alignItems: 'center', borderRadius: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <Avatar sx={{ bgcolor: '#FF9800', width: 60, height: 60, mr: 3 }}>
              <ThumbUpIcon sx={{ fontSize: 35, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--primary-color)' }}>
                {kpiData.successRate}%
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'var(--text-color)' }}>Success Rate</Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 4, display: 'flex', alignItems: 'center', borderRadius: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <Avatar sx={{ bgcolor: '#2196F3', width: 60, height: 60, mr: 3 }}>
              <TrendingUpIcon sx={{ fontSize: 35, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--primary-color)' }}>
                ${kpiData.revenuePerCall}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'var(--text-color)' }}>Revenue Per Call</Typography>
            </Box>
          </Paper>
        </Box>

        {/* KPI Performance Chart */}
        <Paper sx={{ p: 4, mt: 4, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#5a2ca0' }}>
              <TargetIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Sales Rep KPI Performance
            </Typography>
          </Box>
          
          {kpiData.kpiPerformance && kpiData.kpiPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kpiData.kpiPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                <Legend />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="target" name="Target" fill="#5a2ca0" />
                <Bar dataKey="actual" name="Actual" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No KPI data available. Add targets to see performance.
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Other Analytics Charts */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4, mt: 4 }}>
          <Paper sx={{ p: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'var(--primary-color)' }}>Monthly Revenue Trend</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={kpiData.monthlyRevenueTrend}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="total_revenue" stroke="var(--primary-color)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          <Paper sx={{ p: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#FF9800' }}>Call Effectiveness</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie 
                  data={kpiData.callEffectiveness} 
                  dataKey="call_effectiveness" 
                  nameKey="month" 
                  outerRadius={80} 
                  fill="#FF9800"
                  label={(entry) => entry.month}
                >
                  {kpiData.callEffectiveness.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#4CAF50', '#FF9800', '#f44336'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* KPI Targets Table */}
        <Paper sx={{ p: 4, mt: 4, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: '#5a2ca0' }}>
            Sales Rep KPI Targets
          </Typography>
          
          {kpiTargets.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sales Rep</TableCell>
                    <TableCell>Month</TableCell>
                    <TableCell>Target Transactions</TableCell>
                    <TableCell>Target Sales Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {kpiTargets.map((kpi) => (
                    <TableRow key={kpi.kpi_id}>
                      <TableCell>{`${kpi.sales_rep_first_name} ${kpi.sales_rep_last_name}`}</TableCell>
                      <TableCell>{formatMonth(kpi.month)}</TableCell>
                      <TableCell>{kpi.target_transactions}</TableCell>
                      <TableCell>{formatCurrency(kpi.target_sales_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No KPI targets found. Add targets using the button above.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Add KPI Modal */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="add-kpi-modal"
      >
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography id="add-kpi-modal" variant="h6" component="h2" fontWeight="bold">
              Add New KPI Target
            </Typography>
            <IconButton onClick={handleCloseModal} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box component="form" onSubmit={handleAddKpi} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="sales-rep-label">Sales Representative</InputLabel>
                  <Select
                    labelId="sales-rep-label"
                    id="sales_rep_id"
                    name="sales_rep_id"
                    value={newKpi.sales_rep_id}
                    label="Sales Representative"
                    onChange={handleInputChange}
                  >
                    {salesReps.map((rep) => (
                      <MenuItem key={rep.sales_rep_id} value={rep.sales_rep_id}>
                        {`${rep.sales_rep_first_name} ${rep.sales_rep_last_name}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="month"
                  name="month"
                  label="Target Month"
                  type="date"
                  value={newKpi.month}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  helperText="Select the month for this KPI target"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  id="target_transactions"
                  name="target_transactions"
                  label="Target Transactions"
                  type="number"
                  value={newKpi.target_transactions}
                  onChange={handleInputChange}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  id="target_sales_amount"
                  name="target_sales_amount"
                  label="Target Sales Amount"
                  type="number"
                  value={newKpi.target_sales_amount}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    inputProps: { min: 1 }
                  }}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                onClick={handleCloseModal} 
                sx={{ mr: 2 }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="contained"
                sx={{ bgcolor: '#5a2ca0', '&:hover': { bgcolor: '#4A1D85' } }}
              >
                Add KPI Target
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
};

export default Analytics;