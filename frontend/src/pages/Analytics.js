import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Grid, Paper, Typography, Avatar, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Card, CardContent, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Snackbar, Alert
} from '@mui/material';
import { 
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, Legend, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MarkChatReadIcon from '@mui/icons-material/MarkChatRead';
import AddIcon from '@mui/icons-material/Add';

import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import supabase from '../utils/supabaseClient';
import '../styles/analytics.css';

const ManagerAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dialogLoading, setDialogLoading] = useState(false);
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const [openKpiDialog, setOpenKpiDialog] = useState(false);
  const [selectedSalesRep, setSelectedSalesRep] = useState('');
  const [targetTransactions, setTargetTransactions] = useState('');
  const [targetSalesAmount, setTargetSalesAmount] = useState('');
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7));
  const [salesReps, setSalesReps] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const [dashboardData, setDashboardData] = useState({
    overallStats: {
      totalRevenue: 0,
      salesRepsCount: 0,
      conversionRate: 0,
      avgCallDuration: 0
    },
    salesRepKpi: [],
    revenueTrend: [],
    productPerformance: [],
    callStats: {
      totalCalls: 0,
      avgDuration: 0,
      callOutcomes: []
    },
    paymentMethodDistribution: []
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

  const handleOpenKpiDialog = () => {
    // Refresh sales rep list when opening dialog
    fetchSalesReps();
    setOpenKpiDialog(true);
  };

  const handleCloseKpiDialog = () => {
    setOpenKpiDialog(false);
    // Reset form fields when closing
    setSelectedSalesRep('');
    setTargetTransactions('');
    setTargetSalesAmount('');
    setTargetMonth(new Date().toISOString().slice(0, 7));
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const validateKpiForm = () => {
    if (!selectedSalesRep) {
      setSnackbar({
        open: true,
        message: 'Please select a sales representative',
        severity: 'error'
      });
      return false;
    }
    if (!targetTransactions || isNaN(parseInt(targetTransactions)) || parseInt(targetTransactions) <= 0) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid number of target transactions',
        severity: 'error'
      });
      return false;
    }
    if (!targetSalesAmount || isNaN(parseFloat(targetSalesAmount)) || parseFloat(targetSalesAmount) <= 0) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid target sales amount',
        severity: 'error'
      });
      return false;
    }
    return true;
  };

  // Updated to fetch the correct sales rep data
  const fetchSalesReps = async () => {
    try {
      // Query the sales_data table to get unique sales reps with their names
      const { data, error } = await supabase
        .from('sales_data')
        .select('sales_rep_id, sales_rep_first_name, sales_rep_last_name')
        .order('sales_rep_id')
        .limit(100);
      
      if (error) throw error;
      
      // Create a unique set of sales reps
      const uniqueReps = [];
      const repIds = new Set();
      
      data.forEach(rep => {
        if (!repIds.has(rep.sales_rep_id)) {
          repIds.add(rep.sales_rep_id);
          uniqueReps.push({
            sales_rep_id: rep.sales_rep_id,
            first_name: rep.sales_rep_first_name,
            last_name: rep.sales_rep_last_name
          });
        }
      });
      
      console.log('Fetched sales reps:', uniqueReps);
      setSalesReps(uniqueReps);
    } catch (error) {
      console.error('Error fetching sales reps:', error);
      setSnackbar({
        open: true,
        message: `Error fetching sales representatives: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleSubmitKpi = async () => {
    if (!validateKpiForm()) return;
    
    try {
      setDialogLoading(true);
      
      // Find the selected sales rep data
      const salesRepId = parseInt(selectedSalesRep);
      const salesRep = salesReps.find(rep => rep.sales_rep_id === salesRepId);
      
      if (!salesRep) {
        throw new Error('Selected sales representative not found');
      }
      
      console.log('Selected sales rep:', salesRep);
      
      // Create date objects for start and end of the month
      const startDate = new Date(`${targetMonth}-01T00:00:00`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      // Format dates for Supabase query
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log(`Checking for KPIs between ${startDateStr} and ${endDateStr}`);
      
      // Check if KPI already exists for this sales rep and month
      const { data: existingKpi, error: checkError } = await supabase
        .from('sales_kpi')
        .select('*')
        .eq('sales_rep_id', salesRepId)
        .gte('month', startDateStr)
        .lt('month', endDateStr);
      
      if (checkError) {
        console.error('Error checking existing KPI:', checkError);
        throw checkError;
      }
      
      console.log('Existing KPI data:', existingKpi);
      
      let result;
      
      if (existingKpi && existingKpi.length > 0) {
        // Update existing KPI
        console.log(`Updating KPI with ID: ${existingKpi[0].kpi_id}`);
        
        result = await supabase
          .from('sales_kpi')
          .update({
            target_transactions: parseInt(targetTransactions),
            target_sales_amount: parseFloat(targetSalesAmount)
          })
          .eq('kpi_id', existingKpi[0].kpi_id);
      } else {
        // Insert new KPI
        console.log('Creating new KPI entry');
        
        result = await supabase
          .from('sales_kpi')
          .insert({
            sales_rep_id: salesRepId,
            sales_rep_first_name: salesRep.first_name,
            sales_rep_last_name: salesRep.last_name,
            month: startDateStr,
            target_transactions: parseInt(targetTransactions),
            target_sales_amount: parseFloat(targetSalesAmount)
          });
      }
      
      if (result.error) {
        console.error('Error saving KPI target:', result.error);
        throw result.error;
      }
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'KPI target saved successfully',
        severity: 'success'
      });
      
      // Close dialog and reset form
      handleCloseKpiDialog();
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Error saving KPI target:', error);
      setSnackbar({
        open: true,
        message: `Error saving KPI target: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setDialogLoading(false);
    }
  };

  // Effect to fetch initial sales reps when component mounts
  useEffect(() => {
    if (user) {
      fetchSalesReps();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Current month for KPI data
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthIso = currentMonth.toISOString();
      
      // Fetch total revenue
      const { data: salesData, error: salesError } = await supabase
        .from('sales_data')
        .select('sale_amount');
      
      if (salesError) throw salesError;
      
      const totalRevenue = salesData.reduce((sum, item) => sum + parseFloat(item.sale_amount), 0);

      // Count unique sales reps
      const { data: salesRepsData, error: repsError } = await supabase
        .from('sales_data')
        .select('sales_rep_id')
        .limit(1000);
      
      if (repsError) throw repsError;
      
      const uniqueSalesReps = new Set(salesRepsData.map(item => item.sales_rep_id)).size;

      // Fetch call logs for conversion rate calculation
      const { data: callLogsData, error: callError } = await supabase
        .from('call_logs')
        .select('call_outcome, duration_minutes');
      
      if (callError) throw callError;
      
      const successfulCalls = callLogsData.filter(call => call.call_outcome === 'Closed').length;
      const totalCalls = callLogsData.length;
      const conversionRate = totalCalls > 0 ? (successfulCalls / totalCalls * 100).toFixed(1) : 0;
      
      // Calculate average call duration
      const totalDuration = callLogsData.reduce((sum, call) => sum + call.duration_minutes, 0);
      const avgCallDuration = totalCalls > 0 ? (totalDuration / totalCalls).toFixed(1) : 0;

      // Fetch KPI data for the current month
      const { data: kpiData, error: kpiError } = await supabase
        .from('sales_kpi')
        .select('*')
        .gte('month', currentMonthIso)
        .lt('month', new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString());
      
      if (kpiError) throw kpiError;
      
      // Fetch actual sales data for the current month
      const { data: actualSalesData, error: actualSalesError } = await supabase
        .from('sales_data')
        .select('sales_rep_id, sale_amount')
        .gte('sale_date', currentMonthIso)
        .lt('sale_date', new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString());
      
      if (actualSalesError) throw actualSalesError;
      
      // Count transactions and sum sales amount by sales rep
      const actualSalesByRep = {};
      actualSalesData.forEach(sale => {
        const repId = sale.sales_rep_id;
        if (!actualSalesByRep[repId]) {
          actualSalesByRep[repId] = {
            transactions: 0,
            salesAmount: 0
          };
        }
        actualSalesByRep[repId].transactions += 1;
        actualSalesByRep[repId].salesAmount += parseFloat(sale.sale_amount);
      });
      
      // Combine KPI and actual data
      const salesRepKpi = kpiData.map(kpi => {
        const repId = kpi.sales_rep_id;
        const actual = actualSalesByRep[repId] || { transactions: 0, salesAmount: 0 };
        
        return {
          id: repId,
          name: `${kpi.sales_rep_first_name} ${kpi.sales_rep_last_name}`,
          targetTransactions: kpi.target_transactions,
          actualTransactions: actual.transactions,
          transactionsPercentage: kpi.target_transactions > 0 
            ? (actual.transactions / kpi.target_transactions * 100).toFixed(1) 
            : 0,
          targetSalesAmount: parseFloat(kpi.target_sales_amount),
          actualSalesAmount: actual.salesAmount,
          salesAmountPercentage: kpi.target_sales_amount > 0 
            ? (actual.salesAmount / parseFloat(kpi.target_sales_amount) * 100).toFixed(1) 
            : 0
        };
      });

      // Get revenue trend by month
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('sales_data')
        .select('sale_date, sale_amount');
      
      if (monthlyError) throw monthlyError;
      
      // Group by month and sum revenue
      const monthlyRevenue = {};
      monthlyData.forEach(sale => {
        const month = new Date(sale.sale_date).toLocaleString('default', { month: 'short' });
        if (!monthlyRevenue[month]) {
          monthlyRevenue[month] = 0;
        }
        monthlyRevenue[month] += parseFloat(sale.sale_amount);
      });
      
      const revenueTrend = Object.entries(monthlyRevenue).map(([month, amount]) => ({
        month,
        revenue: amount
      }));

      // Get product performance
      const { data: productData, error: productError } = await supabase
        .from('sales_data')
        .select('product_id, product_name, sale_amount, quantity_sold');
      
      if (productError) throw productError;
      
      // Group by product and calculate metrics
      const productPerformance = {};
      productData.forEach(sale => {
        const productId = sale.product_id;
        if (!productPerformance[productId]) {
          productPerformance[productId] = {
            productId,
            productName: sale.product_name,
            revenue: 0,
            quantity: 0,
            transactions: 0
          };
        }
        productPerformance[productId].revenue += parseFloat(sale.sale_amount);
        productPerformance[productId].quantity += sale.quantity_sold;
        productPerformance[productId].transactions += 1;
      });
      
      const productPerformanceData = Object.values(productPerformance)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Get call outcomes distribution
      const callOutcomes = {};
      callLogsData.forEach(call => {
        const outcome = call.call_outcome || 'Unknown';
        if (!callOutcomes[outcome]) {
          callOutcomes[outcome] = 0;
        }
        callOutcomes[outcome] += 1;
      });
      
      const callOutcomesData = Object.entries(callOutcomes).map(([name, value]) => ({
        name,
        value
      }));

      // Get payment method distribution
      const { data: paymentData, error: paymentError } = await supabase
        .from('sales_data')
        .select('payment_method, sale_amount');
      
      if (paymentError) throw paymentError;
      
      const paymentMethods = {};
      paymentData.forEach(sale => {
        const method = sale.payment_method || 'Unknown';
        if (!paymentMethods[method]) {
          paymentMethods[method] = 0;
        }
        paymentMethods[method] += parseFloat(sale.sale_amount);
      });
      
      const paymentMethodData = Object.entries(paymentMethods).map(([name, value]) => ({
        name,
        value
      }));

      // Update state with all fetched data
      setDashboardData({
        overallStats: {
          totalRevenue,
          salesRepsCount: uniqueSalesReps,
          conversionRate,
          avgCallDuration
        },
        salesRepKpi,
        revenueTrend,
        productPerformance: productPerformanceData,
        callStats: {
          totalCalls,
          avgDuration: avgCallDuration,
          callOutcomes: callOutcomesData
        },
        paymentMethodDistribution: paymentMethodData
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setSnackbar({
        open: true,
        message: `Error fetching dashboard data: ${error.message}`,
        severity: 'error'
      });
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Colors for charts
  const COLORS = ['#4E8AF4', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0'];

  // Function to determine color based on percentage
  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#4CAF50'; // Green for 100% or more
    if (percentage >= 75) return '#8BC34A';  // Light green for 75% or more
    if (percentage >= 50) return '#FFC107';  // Yellow/amber for 50% or more
    if (percentage >= 25) return '#FF9800';  // Orange for 25% or more
    return '#F44336';                         // Red for less than 25%
  };

  if (loading && !dashboardData.overallStats.totalRevenue) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                width: 56, 
                height: 56, 
                bgcolor: '#4E8AF4',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                mr: 2
                }}
              >
                M
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Manager View KPIs and Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Performance Analytics - Manager View
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {currentDate}
            </Typography>
          </Box>

        {/* KPI Cards */}
        <Grid container spacing={3}>
          {/* Total Revenue Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '8px',
                  bgcolor: '#E3F2FD',
                  mr: 2
                }}
              >
                <AttachMoneyIcon sx={{ color: '#1a73e8' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="bold" color="#1a73e8">
                  {formatCurrency(dashboardData.overallStats.totalRevenue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Revenue
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Sales Reps Count */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '8px',
                  bgcolor: '#E8F5E9',
                  mr: 2
                }}
              >
                <PeopleAltIcon sx={{ color: '#4CAF50' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="bold" color="#4CAF50">
                  {dashboardData.overallStats.salesRepsCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sales Representatives
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Conversion Rate */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '8px',
                  bgcolor: '#FFF8E1',
                  mr: 2
                }}
              >
                <TrendingUpIcon sx={{ color: '#FF9800' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="bold" color="#FF9800">
                  {dashboardData.overallStats.conversionRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Conversion Rate
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Avg Call Duration */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '8px',
                  bgcolor: '#E8EAF6',
                  mr: 2
                }}
              >
                <MarkChatReadIcon sx={{ color: '#3F51B5' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="bold" color="#3F51B5">
                  {dashboardData.overallStats.avgCallDuration} min
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Call Duration
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          {/* Monthly Revenue Trend */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ mb: 2, color: '#1a73e8', fontFamily: 'Inter, sans-serif' }}
              >
                Monthly Revenue Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#4E8AF4" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Call Outcomes Distribution */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: 4}}>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ mb: 2, color: '#FF9800', fontFamily: 'Inter, sans-serif' }}
              >
                Call Outcomes
              </Typography>

              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.callStats.callOutcomes}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    fill="#FF9800"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {dashboardData.callStats.callOutcomes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Payment Method Distribution & Top Products */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          {/* Payment Method Distribution */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: 4}}>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ mb: 2, color: '#4CAF50', fontFamily: 'Inter, sans-serif' }}
              >
                Payment Method Distribution
              </Typography>

              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dashboardData.paymentMethodDistribution}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    fill="#4CAF50"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {dashboardData.paymentMethodDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Top Products */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ mb: 2, color: '#3F51B5', fontFamily: 'Inter, sans-serif' }}
              >
                Top Performing Products
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                    <TableCell>Product Name</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Transactions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.productPerformance.map((product, index) => (
                      <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                      <TableCell sx={{ color: '#3F51B5', fontWeight: 500 }}>{product.productName}</TableCell>
                      <TableCell align="right" sx={{ color: '#4CAF50', fontWeight: 500 }}>
                        {formatCurrency(product.revenue)}
                      </TableCell>
                      <TableCell align="right">{product.quantity}</TableCell>
                      <TableCell align="right">{product.transactions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Sales Rep KPI Section */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3}}>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ color: '#E91E63', fontFamily: 'Inter, sans-serif' }}
              >
                Sales Rep KPIs Targets
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleOpenKpiDialog}
                sx={{ 
                  bgcolor: '#E91E63', 
                  '&:hover': { bgcolor: '#C2185B' },
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(233, 30, 99, 0.3)'
                }}
              >
                Set New KPI Targets
              </Button>
            </Box>
            
            {dashboardData.salesRepKpi.length > 0 ? (
              <Grid container spacing={3}>
                {dashboardData.salesRepKpi.map((rep) => (
                  <Grid item xs={12} md={6} key={rep.id}>
                    <Card sx={{ 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                      borderRadius: 2,
                      overflow: 'visible',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                      }
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: '#E91E63', 
                              color: '#fff',
                              width: 40,
                              height: 40,
                              mr: 2
                            }}
                          >
                            {rep.name.split(' ').map(name => name[0]).join('')}
                          </Avatar>
                          <Typography variant="h6" fontWeight="500">{rep.name}</Typography>
                        </Box>
                        
                        {/* Transaction Progress */}
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Transactions
                            </Typography>
                            <Typography variant="body2" fontWeight="500">
                              {rep.actualTransactions} / {rep.targetTransactions} ({rep.transactionsPercentage}%)
                            </Typography>
                          </Box>
                          <Box sx={{ width: '100%', bgcolor: '#f0f0f0', borderRadius: 5, height: 10, position: 'relative' }}>
                            <Box
                              sx={{
                                position: 'absolute',
                                height: '100%',
                                borderRadius: 5,
                                bgcolor: getProgressColor(rep.transactionsPercentage),
                                width: `${Math.min(rep.transactionsPercentage, 100)}%`,
                                transition: 'width 1s ease-in-out'
                              }}
                            />
                          </Box>
                        </Box>
                        
                        {/* Sales Amount Progress */}
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Sales Amount
                            </Typography>
                            <Typography variant="body2" fontWeight="500">
                              {formatCurrency(rep.actualSalesAmount)} / {formatCurrency(rep.targetSalesAmount)} ({rep.salesAmountPercentage}%)
                            </Typography>  
                          </Box>
                          <Box sx={{ width: '100%', bgcolor: '#f0f0f0', borderRadius: 5, height: 10, position: 'relative' }}>
                            <Box
                              sx={{
                                position: 'absolute',
                                height: '100%',
                                borderRadius: 5,
                                bgcolor: getProgressColor(rep.salesAmountPercentage),
                                width: `${Math.min(rep.salesAmountPercentage, 100)}%`,
                                transition: 'width 1s ease-in-out'
                              }}
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No KPI targets set for the current month. Click "Set New KPI Targets" to add.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* FIXED KPI Setting Dialog with proper sales_rep selection */}
      <Dialog 
        open={openKpiDialog} 
        onClose={handleCloseKpiDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 2,
            overflow: 'hidden'
          } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#E91E63', pb: 1 }}>
          Set KPI Target
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mt: 1 }}>
            {/* Sales Rep Selection - FIXED to use the correct schema */}
            <FormControl fullWidth sx={{ mb: 3 }} variant="outlined">
              <InputLabel id="sales-rep-select-label">Sales Representative</InputLabel>
              <Select
                labelId="sales-rep-select-label"
                id="sales-rep-select"
                value={selectedSalesRep}
                label="Sales Representative"
                onChange={(e) => {
                  console.log('Selected sales rep:', e.target.value);
                  setSelectedSalesRep(e.target.value);
                }}
                displayEmpty={salesReps.length === 0}
              >
                {salesReps.length > 0 ? (
                  salesReps.map((rep) => (
                    <MenuItem 
                      key={rep.sales_rep_id} 
                      value={String(rep.sales_rep_id)}
                      sx={{
                        padding: '10px 16px',
                        '&:hover': {
                          backgroundColor: '#f5f5f5'
                        }
                      }}
                    >
                      {/* Display the rep name based on the actual schema */}
                      {`${rep.first_name || ''} ${rep.last_name || ''}`}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No sales representatives found</MenuItem>
                )}
              </Select>
            </FormControl>
            
            <TextField
              label="Target Month"
              type="month"
              fullWidth
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              sx={{ mb: 3 }}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              label="Target Transactions"
              type="number"
              fullWidth
              value={targetTransactions}
              onChange={(e) => setTargetTransactions(e.target.value)}
              inputProps={{
                min: 1,
                step: 1
              }}
              sx={{ mb: 3 }}
            />
            
            <TextField
              label="Target Sales Amount"
              type="number"
              fullWidth
              value={targetSalesAmount}
              onChange={(e) => setTargetSalesAmount(e.target.value)}
              inputProps={{
                min: 1,
                step: 100
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseKpiDialog} 
            color="inherit" 
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitKpi} 
            variant="contained"
            disabled={dialogLoading}
            sx={{ 
              bgcolor: '#E91E63', 
              '&:hover': { bgcolor: '#C2185B' },
              borderRadius: 2,
            }}
          >
            {dialogLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Save KPI Target'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>

    {/* Snackbar for notifications */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={handleCloseSnackbar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={handleCloseSnackbar} 
        severity={snackbar.severity} 
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  </DashboardLayout>
);
};

export default ManagerAnalytics;