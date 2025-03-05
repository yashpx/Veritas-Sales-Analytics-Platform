import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Box, CircularProgress, Paper, Typography, 
  Button, Modal, TextField, FormControl, InputLabel, 
  Select, MenuItem, InputAdornment, Grid,
  LinearProgress, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Snackbar, Alert
} from '@mui/material';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LockIcon from '@mui/icons-material/Lock';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CloseIcon from '@mui/icons-material/Close';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import supabase from '../utils/supabaseClient';

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salesReps, setSalesReps] = useState([]);
  const [repPerformance, setRepPerformance] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);
  const [productSalesData, setProductSalesData] = useState([]);
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

  // Fetch sales data
  const fetchSalesData = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_data')
        .select('*')
        .order('sale_date', { ascending: false });

      if (error) throw error;
      setSalesData(data || []);
    } catch (error) {
      console.error('Error fetching sales data:', error);
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
    } catch (error) {
      console.error('Error fetching KPI targets:', error);
    }
  };

  // Calculate sales rep performance vs targets
  const calculateSalesRepPerformance = () => {
    if (!kpiTargets.length || !salesData.length) return [];

    // Get current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Filter KPIs for current month
    const currentKpis = kpiTargets.filter(kpi => {
      const kpiDate = new Date(kpi.month);
      return kpiDate.getMonth() === currentMonth && kpiDate.getFullYear() === currentYear;
    });

    // Filter sales data for current month
    const currentMonthSales = salesData.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    });

    // Calculate transactions per sales rep
    const salesRepTransactions = {};
    const salesRepAmounts = {};
    
    currentMonthSales.forEach(sale => {
      const repId = sale.sales_rep_id;
      
      // Count transactions
      if (!salesRepTransactions[repId]) {
        salesRepTransactions[repId] = 0;
      }
      salesRepTransactions[repId]++;
      
      // Sum sales amounts
      if (!salesRepAmounts[repId]) {
        salesRepAmounts[repId] = 0;
      }
      salesRepAmounts[repId] += parseFloat(sale.sale_amount);
    });

    // Get all sales reps that have KPIs
    const salesRepsWithKpis = currentKpis.map(kpi => kpi.sales_rep_id);
    
    // Combine KPIs with actual performance
    return currentKpis.map(kpi => {
      const repId = kpi.sales_rep_id;
      const actualTransactions = salesRepTransactions[repId] || 0;
      const actualSalesAmount = salesRepAmounts[repId] || 0;
      
      // Calculate progress percentage for visual indicators
      const transactionProgress = Math.min(100, (actualTransactions / kpi.target_transactions) * 100);
      const salesProgress = Math.min(100, (actualSalesAmount / kpi.target_sales_amount) * 100);
      
      // Determine colors based on progress
      const transactionColor = transactionProgress >= 70 ? '#4E8AF4' : '#FF9B7B';
      const salesColor = salesProgress >= 70 ? '#4CAF50' : '#FF9B7B';
      
      return {
        id: kpi.kpi_id,
        sales_rep_id: repId,
        name: `${kpi.sales_rep_first_name} ${kpi.sales_rep_last_name}`,
        transactions: {
          value: actualTransactions,
          max: kpi.target_transactions,
          progress: transactionProgress,
          color: transactionColor
        },
        sales: {
          value: actualSalesAmount,
          max: kpi.target_sales_amount,
          progress: salesProgress,
          color: salesColor
        }
      };
    });
  };

  // Generate lead source data
  const generateLeadSourceData = () => {
    // Group by lead source
    const leadSources = {};
    
    salesData.forEach(sale => {
      // Using product_name as a stand-in for lead source
      const source = sale.product_name;
      if (!leadSources[source]) {
        leadSources[source] = {
          name: source,
          deals: 0,
          totalSales: 0,
          months: new Set()
        };
      }
      
      leadSources[source].deals++;
      leadSources[source].totalSales += sale.sale_amount;
      leadSources[source].months.add(new Date(sale.sale_date).getMonth());
    });
    
    // Convert to array and sort by total sales
    return Object.values(leadSources)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5)
      .map((source, index) => ({
        sn: index + 1,
        name: source.name,
        month: new Date(2021, Array.from(source.months)[0]).toLocaleString('default', { month: 'short' }),
        deals: source.deals,
        totalSales: source.totalSales
      }));
  };

  // Generate product sales data
  const generateProductSalesData = () => {
    let totalSold = 0;
    let inProgress = 0;
    let cancelled = 0;
    
    // Simulate status distribution (in a real app, you'd have status fields)
    salesData.forEach((sale, index) => {
      if (index % 10 === 0) cancelled++;
      else if (index % 5 === 0) inProgress++;
      else totalSold++;
    });
    
    return [
      { name: 'Total Sales', value: totalSold, color: '#4E8AF4' },
      { name: 'In-progress', value: inProgress, color: '#FFD66B' },
      { name: 'Cancelled', value: cancelled, color: '#FF9B7B' }
    ];
  };

  // Generate sentiment data
  const generateSentimentData = () => {
    // In a real app, you would have sentiment scores for each sales interaction
    // Here we're generating mock data
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      score: 3 + Math.sin(i / 5) + Math.random() * 0.5
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        await fetchSalesReps();
        await fetchKpiTargets();
        await fetchSalesData();
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (!loading && salesReps.length > 0 && kpiTargets.length > 0 && salesData.length > 0) {
      // Get performance data but keep it separate from salesReps data
      const performance = calculateSalesRepPerformance();
      setRepPerformance(performance);
      
      setLeadSources(generateLeadSourceData());
      setProductSalesData(generateProductSalesData());
      setSentimentData(generateSentimentData());
    }
  }, [loading, salesReps.length, kpiTargets.length, salesData.length]);

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
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" fontWeight="bold">
            KPIs and Analytics
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              10-10-2021
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
        </Box>

        <Grid container spacing={3}>
          {/* Left side: Sales Reps & Sentiment */}
          <Grid item xs={12} md={7}>
            {/* Sales Reps Section */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                Sales Reps
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                {repPerformance.length > 0 ? (
                  repPerformance.map((rep) => (
                    <Box key={rep.id} sx={{ mb: 4 }}>
                      <Typography variant="subtitle2" fontWeight="medium" sx={{ mb: 2 }}>
                        {rep.name}
                      </Typography>
                      
                      {/* Transactions progress */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">Transactions</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {`${rep.transactions.value} / ${rep.transactions.max}`}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={rep.transactions.progress}
                          sx={{ 
                            height: 10, 
                            borderRadius: 5,
                            backgroundColor: '#F0F0F0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: rep.transactions.color
                            }
                          }}
                        />
                      </Box>
                      
                      {/* Sales amount progress */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">Sales Amount</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {`${formatCurrency(rep.sales.value)} / ${formatCurrency(rep.sales.max)}`}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={rep.sales.progress}
                          sx={{ 
                            height: 10, 
                            borderRadius: 5,
                            backgroundColor: '#F0F0F0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: rep.sales.color
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No KPI data available for the current month. Add targets to see performance.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Average Sentiment Score */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    bgcolor: '#E3E9FC',
                    mr: 2
                  }}
                >
                  <LockIcon sx={{ color: '#4E8AF4' }} />
                </Box>
                <Typography variant="h6" fontWeight="medium">
                  Average Sentiment Score
                </Typography>
              </Box>
              
              <Box sx={{ height: 200, mt: 3 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sentimentData}>
                    <XAxis dataKey="day" hide />
                    <YAxis hide />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#4E8AF4" 
                      strokeWidth={2} 
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Right side: KPI Metrics & Product Sales */}
          <Grid item xs={12} md={5}>
            {/* KPI Metrics */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
              <Paper 
                sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'space-between'
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
                    bgcolor: '#FFF1F1',
                    mr: 2
                  }}
                >
                  <LockIcon sx={{ color: '#FF7A59' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" color="#FF7A59">
                  72%
                </Typography>
                <Typography variant="body2" sx={{ flex: 1, ml: 2 }}>
                  Connect Rate
                </Typography>
              </Paper>

              <Paper 
                sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'space-between'
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
                    bgcolor: '#FFF1F1',
                    mr: 2
                  }}
                >
                  <LockIcon sx={{ color: '#FF7A59' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" color="#FF7A59">
                  66%
                </Typography>
                <Typography variant="body2" sx={{ flex: 1, ml: 2 }}>
                  Contact Rate
                </Typography>
              </Paper>

              <Paper 
                sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'space-between'
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
                    bgcolor: '#FFE4D8',
                    mr: 2
                  }}
                >
                  <LockIcon sx={{ color: '#FF7A59' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" color="#FF7A59">
                  59%
                </Typography>
                <Typography variant="body2" sx={{ flex: 1, ml: 2 }}>
                  Meeting Scheduled Rate
                </Typography>
              </Paper>
            </Box>

            {/* Product Sales Analytics */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="medium">
                  Product Sales Analytics
                </Typography>
                <IconButton>
                  <MoreHorizIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ height: 250, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productSalesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {productSalesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h4" fontWeight="bold">
                    {productSalesData.reduce((sum, item) => sum + item.value, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                {productSalesData.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: item.color,
                        mr: 1
                      }} 
                    />
                    <Typography variant="body2" color="text.secondary">
                      {item.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Lead Source Analysis */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="medium">
                  Lead Source Analysis
                </Typography>
                <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                  See More
                </Typography>
              </Box>
              
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>SN</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Monthly</TableCell>
                      <TableCell>Deals</TableCell>
                      <TableCell>Total Sales</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leadSources.map((row) => (
                      <TableRow key={row.sn}>
                        <TableCell>{row.sn}</TableCell>
                        <TableCell sx={{ color: '#4E8AF4', fontWeight: 500 }}>{row.name}</TableCell>
                        <TableCell>{row.month}</TableCell>
                        <TableCell>{row.deals}</TableCell>
                        <TableCell sx={{ color: '#4CAF50', fontWeight: 500 }}>
                          ${row.totalSales.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* KPI Targets Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="medium" sx={{ mb: 3 }}>
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
          </Grid>
        </Grid>
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