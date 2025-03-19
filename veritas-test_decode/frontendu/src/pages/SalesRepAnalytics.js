import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, Paper, Typography, Avatar, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip
} from '@mui/material';
import { 
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, Legend, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import supabase from '../utils/supabaseClient';
import '../styles/salesrepanalytics.css';

const SalesRepAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salesRepId, setSalesRepId] = useState(null);
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const [salesRepData, setSalesRepData] = useState({
    personalStats: {
      name: '',
      totalRevenue: 0,
      totalSales: 0,
      totalCalls: 0,
      conversionRate: 0,
      avgCallDuration: 0,
      targetProgress: 0
    },
    salesPerformance: [],
    callActivity: [],
    productPerformance: [],
    callOutcomes: [],
    kpiProgress: {
      transactions: {
        current: 0,
        target: 0,
        progress: 0
      },
      revenue: {
        current: 0,
        target: 0,
        progress: 0
      }
    },
    customerInteractions: [],
    callSentimentAnalysis: {
      positive: 0,
      neutral: 0,
      negative: 0
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

  // Get the current month in format 'YYYY-MM'
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // Fetch the sales rep ID for the current user
  useEffect(() => {
    const fetchSalesRepId = async () => {
      if (user) {
        try {
          // Check for salesRepId in user data (new format)
          if (user.salesRepId) {
            console.log("Using salesRepId from user data:", user.salesRepId);
            setSalesRepId(user.salesRepId);
            return;
          }
          
          // If user has role 'sales_rep' and id property, we need to find the correct sales_rep_id
          if (user.role === 'sales_rep' && user.id) {
            console.log("Need to query actual sales_rep_id for user_auth id:", user.id);
            
            // First get the email from user_auth
            const { data: userData, error: userError } = await supabase
              .from('user_auth')
              .select('email')
              .eq('id', user.id)
              .single();
              
            if (userError) {
              console.error("Error fetching user email:", userError);
              throw userError;
            }
            
            if (userData?.email) {
              // Now use the email to find the correct sales_rep_id
              const { data: repData, error: repError } = await supabase
                .from('sales_reps')
                .select('sales_rep_id')
                .eq('Email', userData.email)
                .single();
                
              if (repError) {
                console.error("Error fetching sales_rep_id:", repError);
                throw repError;
              }
              
              if (repData?.sales_rep_id) {
                console.log("Found correct sales_rep_id:", repData.sales_rep_id);
                setSalesRepId(repData.sales_rep_id);
                
                // Update user object for future use
                const updatedUser = { ...user, salesRepId: repData.sales_rep_id };
                localStorage.setItem('sales_rep_user', JSON.stringify(updatedUser));
                return;
              }
            }
          }
          
          // If still not found, try direct lookup by email if available
          if (user.email) {
            console.log("Trying to fetch sales rep ID from Supabase by email");
            const { data, error } = await supabase
              .from('sales_reps')
              .select('sales_rep_id')
              .eq('Email', user.email)
              .single();
          
            if (error) {
              console.error("Supabase query error:", error);
              throw error;
            }
            
            if (data) {
              console.log("Found sales rep ID in Supabase:", data.sales_rep_id);
              setSalesRepId(data.sales_rep_id);
            } else {
              console.warn("No sales rep found for this user, using default ID 1");
              // For demo purposes, use a fixed sales rep ID if not found
              setSalesRepId(1);
            }
          }
        } catch (error) {
          console.error('Error fetching sales rep ID:', error);
          // For demo purposes, use a fixed sales rep ID if error
          setSalesRepId(1);
        }
      }
    };
    
    fetchSalesRepId();
  }, [user]);

  useEffect(() => {
    const fetchSalesRepData = async () => {
      if (!salesRepId) return;
      
      try {
        setLoading(true);
        
        // Fetch sales rep basic info
        const { data: repData, error: repError } = await supabase
          .from('sales_data')
          .select('sales_rep_first_name, sales_rep_last_name')
          .eq('sales_rep_id', salesRepId)
          .limit(1);
        
        if (repError) throw repError;
        
        let repName = 'Sales Rep';
        if (repData && repData.length > 0) {
          repName = `${repData[0].sales_rep_first_name} ${repData[0].sales_rep_last_name}`;
        }
        
        // Fetch sales data for the rep
        const { data: salesData, error: salesError } = await supabase
          .from('sales_data')
          .select('*')
          .eq('sales_rep_id', salesRepId);
        
        if (salesError) throw salesError;
        
        const totalRevenue = salesData.reduce((sum, item) => sum + parseFloat(item.sale_amount), 0);
        const totalSales = salesData.length;

        // Fetch call logs
        const { data: callLogsData, error: callError } = await supabase
          .from('call_logs')
          .select('*')
          .eq('sales_rep_id', salesRepId);
        
        if (callError) throw callError;
        
        const totalCalls = callLogsData.length;
        const successfulCalls = callLogsData.filter(call => call.call_outcome === 'Closed').length;
        const conversionRate = totalCalls > 0 ? (successfulCalls / totalCalls * 100).toFixed(1) : 0;
        
        // Calculate average call duration
        const totalDuration = callLogsData.reduce((sum, call) => sum + call.duration_minutes, 0);
        const avgCallDuration = totalCalls > 0 ? (totalDuration / totalCalls).toFixed(1) : 0;

        // Group sales data by month
        const monthlySales = {};
        salesData.forEach(sale => {
          const month = new Date(sale.sale_date).toLocaleString('default', { month: 'short' });
          if (!monthlySales[month]) {
            monthlySales[month] = {
              revenue: 0,
              transactions: 0
            };
          }
          monthlySales[month].revenue += parseFloat(sale.sale_amount);
          monthlySales[month].transactions += 1;
        });
        
        const salesPerformance = Object.entries(monthlySales).map(([month, data]) => ({
          month,
          revenue: data.revenue,
          transactions: data.transactions
        }));

        // Group call data by day of week for the last 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        
        const recentCalls = callLogsData.filter(call => 
          new Date(call.call_date) >= thirtyDaysAgo
        );
        
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const callsByDay = Array(7).fill(0).map((_, i) => ({
          day: dayNames[i],
          calls: 0,
          successRate: 0
        }));
        
        recentCalls.forEach(call => {
          const day = new Date(call.call_date).getDay();
          callsByDay[day].calls += 1;
          if (call.call_outcome === 'Closed') {
            callsByDay[day].successRate += 1;
          }
        });
        
        // Calculate success rate percentage
        callsByDay.forEach(day => {
          if (day.calls > 0) {
            day.successRate = (day.successRate / day.calls * 100).toFixed(1);
          } else {
            day.successRate = 0;
          }
        });

        // Get product performance
        const productPerformance = {};
        salesData.forEach(sale => {
          const productId = sale.product_id;
          if (!productPerformance[productId]) {
            productPerformance[productId] = {
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
        const paymentMethods = {};
        salesData.forEach(sale => {
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

        // Get KPI data for the current month
        const currentMonth = getCurrentMonth();
        const { data: kpiData, error: kpiError } = await supabase
          .from('sales_kpi')
          .select('*')
          .eq('sales_rep_id', salesRepId)
          .gte('month', currentMonth + '-01')
          .lte('month', currentMonth + '-31');
        
        if (kpiError) throw kpiError;
        
        let kpiProgress = {
          transactions: {
            current: totalSales,
            target: 0,
            progress: 0
          },
          revenue: {
            current: totalRevenue,
            target: 0,
            progress: 0
          }
        };
        
        if (kpiData && kpiData.length > 0) {
          const targetTransactions = kpiData[0].target_transactions;
          const targetRevenue = parseFloat(kpiData[0].target_sales_amount);
          
          kpiProgress = {
            transactions: {
              current: totalSales,
              target: targetTransactions,
              progress: Math.min(100, (totalSales / targetTransactions * 100).toFixed(1))
            },
            revenue: {
              current: totalRevenue,
              target: targetRevenue,
              progress: Math.min(100, (totalRevenue / targetRevenue * 100).toFixed(1))
            }
          };
        }

        // Get recent customer interactions
        const { data: customerData, error: customerError } = await supabase
          .from('call_logs')
          .select(`
            call_id, 
            call_date, 
            duration_minutes, 
            call_outcome, 
            customers:customer_id (
              customer_id, customer_first_name, customer_last_name
            )
          `)
          .eq('sales_rep_id', salesRepId)
          .order('call_date', { ascending: false })
          .limit(5);
        
        if (customerError) throw customerError;
        
        const customerInteractions = customerData.map(log => ({
          callId: log.call_id,
          date: new Date(log.call_date).toLocaleString(),
          duration: log.duration_minutes,
          outcome: log.call_outcome,
          customerName: log.customers ? `${log.customers.customer_first_name} ${log.customers.customer_last_name}` : 'Unknown Customer'
        }));

        // Get call sentiment analysis
        const sentimentCounts = {
          positive: 0,
          neutral: 0,
          negative: 0
        };
        
        callLogsData.forEach(call => {
          if (call["Sentiment Result"]) {
            const sentiment = call["Sentiment Result"].toLowerCase();
            if (sentiment.includes('positive')) {
              sentimentCounts.positive += 1;
            } else if (sentiment.includes('negative')) {
              sentimentCounts.negative += 1;
            } else {
              sentimentCounts.neutral += 1;
            }
          }
        });
        
        // Calculate target progress average
        const targetProgress = (parseFloat(kpiProgress.transactions.progress) + parseFloat(kpiProgress.revenue.progress)) / 2;

        // Update state with all fetched data
        setSalesRepData({
          personalStats: {
            name: repName,
            totalRevenue,
            totalSales,
            totalCalls,
            conversionRate,
            avgCallDuration,
            targetProgress
          },
          salesPerformance,
          callActivity: callsByDay,
          productPerformance: productPerformanceData,
          callOutcomes: callOutcomesData,
          kpiProgress,
          customerInteractions,
          callSentimentAnalysis: sentimentCounts,
          paymentMethodDistribution: paymentMethodData
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sales rep data:', error);
        setLoading(false);
      }
    };
    
    if (salesRepId) {
      fetchSalesRepData();
    }
  }, [salesRepId]);

  // Colors for charts
  const COLORS = ['#4E8AF4', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0'];
  const SENTIMENT_COLORS = {
    positive: '#4CAF50',
    neutral: '#FFC107',
    negative: '#F44336'
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  // Transform sentiment data for chart
  const sentimentData = Object.entries(salesRepData.callSentimentAnalysis).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
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
              {salesRepData.personalStats.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {salesRepData.personalStats.name}'s KPIs and Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sales Representative Performance Analytics
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
            <Paper className="kpi-card">
              <Box className="icon-container" sx={{ bgcolor: '#E3F2FD' }}>
                <AttachMoneyIcon sx={{ color: '#1a73e8' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="bold" color="#1a73e8">
                  {formatCurrency(salesRepData.personalStats.totalRevenue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Revenue
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Total Calls */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper className="kpi-card">
              <Box className="icon-container" sx={{ bgcolor: '#E8F5E9' }}>
                <LocalPhoneIcon sx={{ color: '#4CAF50' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="bold" color="#4CAF50">
                  {salesRepData.personalStats.totalCalls}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Calls
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Conversion Rate */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper className="kpi-card">
              <Box className="icon-container" sx={{ bgcolor: '#FFF8E1' }}>
                <TrendingUpIcon sx={{ color: '#FF9800' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="bold" color="#FF9800">
                  {salesRepData.personalStats.conversionRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Conversion Rate
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Target Progress */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper className="kpi-card">
              <Box className="icon-container" sx={{ bgcolor: '#E8EAF6' }}>
                <GpsFixedIcon sx={{ color: '#3F51B5' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="bold" color="#3F51B5">
                  {salesRepData.personalStats.targetProgress}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Target Progress
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          {/* Monthly Sales Performance */}
          <Grid item xs={12} md={8}>
            <Paper className="chart-paper">
              <Typography
                variant="h6"
                fontWeight="bold"
                className="chart-title"
                sx={{ color: '#1a73e8' }}
              >
                Monthly Sales Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesRepData.salesPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" stroke="#1a73e8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#4CAF50" />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'revenue') return formatCurrency(value);
                    return value;
                  }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#1a73e8" />
                  <Bar yAxisId="right" dataKey="transactions" name="Transactions" fill="#4CAF50" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Call Outcomes */}
          <Grid item xs={12} md={4}>
            <Paper className="chart-paper">
              <Typography
                variant="h6"
                fontWeight="bold"
                className="chart-title"
                sx={{ color: '#FF9800' }}
              >
                Call Outcomes
              </Typography>

              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={salesRepData.callOutcomes}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    fill="#FF9800"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {salesRepData.callOutcomes.map((entry, index) => (
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

        {/* KPI Progress and Call Sentiment */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          {/* KPI Progress */}
          <Grid item xs={12} md={6}>
            <Paper className="chart-paper">
              <Typography
                variant="h6"
                fontWeight="bold"
                className="chart-title"
                sx={{ color: '#3F51B5' }}
              >
                KPI Progress
              </Typography>
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" fontWeight="500" sx={{ mb: 1 }}>
                  Transactions: {salesRepData.kpiProgress.transactions.current} / {salesRepData.kpiProgress.transactions.target}
                </Typography>
                <Box 
                  sx={{ 
                    position: 'relative', 
                    height: '10px', 
                    bgcolor: '#e0e0e0', 
                    borderRadius: '5px',
                    mb: 3
                  }}
                >
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      height: '100%', 
                      width: `${salesRepData.kpiProgress.transactions.progress}%`,
                      bgcolor: '#3F51B5',
                      borderRadius: '5px'
                    }}
                  />
                </Box>
                
                <Typography variant="body2" fontWeight="500" sx={{ mb: 1 }}>
                  Revenue: {formatCurrency(salesRepData.kpiProgress.revenue.current)} / {formatCurrency(salesRepData.kpiProgress.revenue.target)}
                </Typography>
                <Box 
                  sx={{ 
                    position: 'relative', 
                    height: '10px', 
                    bgcolor: '#e0e0e0', 
                    borderRadius: '5px',
                    mb: 1
                  }}
                >
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      height: '100%', 
                      width: `${salesRepData.kpiProgress.revenue.progress}%`,
                      bgcolor: '#4E8AF4',
                      borderRadius: '5px'
                    }}
                  />
                </Box>
              </Box>
              
              <Box sx={{ mt: 4, p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem' }}>
                  Weekly Call Activity
                </Typography>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={salesRepData.callActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="calls" fill="#4E8AF4" name="Number of Calls" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Call Sentiment Analysis */}
          <Grid item xs={12} md={6}>
            <Paper className="chart-paper">
              <Typography
                variant="h6"
                fontWeight="bold"
                className="chart-title"
                sx={{ color: '#4CAF50' }}
              >
                Call Sentiment Analysis
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={70}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {sentimentData.map((entry) => (
                        <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name.toLowerCase()]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              
              <Box sx={{ mt: 2, p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem' }}>
                  Success Rate by Day
                </Typography>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={salesRepData.callActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Line type="monotone" dataKey="successRate" stroke="#E91E63" strokeWidth={2} name="Success Rate %" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Product Performance & Recent Customer Interactions */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          {/* Product Performance */}
          <Grid item xs={12} md={7}>
            <Paper className="chart-paper">
              <Typography
                variant="h6"
                fontWeight="bold"
                className="chart-title"
                sx={{ color: '#9C27B0' }}
              >
                Your Top Products
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Name</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Deals</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salesRepData.productPerformance.map((product, index) => (
                      <TableRow key={index} className="hoverable-row">
                        <TableCell sx={{ color: '#9C27B0', fontWeight: 500 }}>{product.productName}</TableCell>
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

          {/* Recent Customer Interactions */}
          <Grid item xs={12} md={5}>
            <Paper className="chart-paper">
              <Typography
                variant="h6"
                fontWeight="bold"
                className="chart-title"
                sx={{ color: '#E91E63' }}
              >
                Recent Customer Interactions
              </Typography>
              <TableContainer sx={{ maxHeight: 315, overflowY: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Duration</TableCell>
                      <TableCell align="right">Outcome</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salesRepData.customerInteractions.map((interaction, index) => (
                      <TableRow key={index} className="hoverable-row">
                        <TableCell sx={{ fontWeight: 500 }}>{interaction.customerName}</TableCell>
                        <TableCell>{new Date(interaction.date).toLocaleDateString()}</TableCell>
                        <TableCell align="right">{interaction.duration} min</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={interaction.outcome} 
                            size="small"
                            sx={{
                              bgcolor: interaction.outcome === 'Closed' 
                                ? '#E8F5E9' 
                                : interaction.outcome === 'Fail' 
                                  ? '#FFEBEE' 
                                  : '#E3F2FD',
                              color: interaction.outcome === 'Closed' 
                                ? '#4CAF50' 
                                : interaction.outcome === 'Fail' 
                                  ? '#F44336' 
                                  : '#1a73e8'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Performance Skills */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12}>
            <Paper className="chart-paper">
              <Typography
                variant="h6"
                fontWeight="bold"
                className="chart-title"
                sx={{ color: '#1976D2' }}
              >
                Performance Analysis
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>Your Sales Skills</Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart outerRadius={90} data={[
                        { subject: 'Closing Rate', A: salesRepData.personalStats.conversionRate, fullMark: 100 },
                        { subject: 'Revenue', A: salesRepData.kpiProgress.revenue.progress, fullMark: 100 },
                        { subject: 'Call Volume', A: Math.min(100, salesRepData.personalStats.totalCalls / 100 * 100), fullMark: 100 },
                        { subject: 'Customer Satisfaction', A: sentimentData.find(item => item.name === 'Positive')?.value / 
                          (sentimentData.reduce((sum, item) => sum + item.value, 0) || 1) * 100 || 0, fullMark: 100 },
                        { subject: 'Target Achievement', A: salesRepData.personalStats.targetProgress, fullMark: 100 },
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name="Performance" dataKey="A" stroke="#1976D2" fill="#1976D2" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>Payment Method Distribution</Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={salesRepData.paymentMethodDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          fill="#8884d8"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {salesRepData.paymentMethodDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default SalesRepAnalytics;