import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Container, Grid, Paper, Typography, Box, Avatar, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, CircularProgress, Alert
} from '@mui/material';
import { PieChart, Pie, Cell, LineChart, Line, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import './Dashboard.css'; // Ensure you have your custom CSS to fine-tune

const supabaseUrl = 'https://coghrwmmyyzmbnndlawi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NjAyMzIsImV4cCI6MjA1MjQzNjIzMn0.TqSt8BDML0yLvcJWIG-2bcF6PieMqAep3b_VTAkpHDs';
const supabase = createClient(supabaseUrl, supabaseKey);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpiData, setKpiData] = useState({
    totalRevenue: 0,
    revenueGrowth: [],
    churnRate: [],
    customerSatisfaction: 0,
    topSellingProducts: [],
    revenueContribution: [],
    leaderboardKPIs: {
      totalRevenue: [],
      successRate: [],
      revenuePerCall: [],
      avgSatisfaction: [],
      monthlyRevenueTrend: [],
      callEffectiveness: []
    }
  });

  // Test Supabase connection
  const testConnection = async () => {
    try {
      // Simple query to test the connection
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase.from('top_selling_products').select('count(*)', { count: 'exact' });
      
      if (error) {
        throw new Error(`Supabase connection error: ${error.message}`);
      }
      
      console.log('Supabase connection successful', data);
      return true;
    } catch (error) {
      console.error('Failed to connect to Supabase:', error);
      setError(`Database connection error: ${error.message}. Please check your Supabase credentials and table configuration.`);
      setLoading(false);
      return false;
    }
  };

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        // First test the connection
        const connectionValid = await testConnection();
        if (!connectionValid) return;
        
        console.log('Fetching KPI data...');
        
        // Fetch data for KPIs with error handling for each query
        const { data: totalRevenueData, error: revenueError } = await supabase
          .from('top_selling_products')
          .select('total_revenue');
        
        if (revenueError) throw new Error(`Error fetching revenue data: ${revenueError.message}`);
        console.log('Total revenue data:', totalRevenueData);
        
        // Handle empty data case
        if (!totalRevenueData || totalRevenueData.length === 0) {
          console.log('No revenue data available');
          const emptyDataError = new Error('No data available in the database. Please check your database tables.');
          setError(emptyDataError.message);
          setLoading(false);
          return;
        }
        
        const totalRevenue = totalRevenueData.reduce((acc, curr) => {
          const value = parseFloat(curr.total_revenue) || 0;
          return acc + value;
        }, 0);
        console.log('Calculated total revenue:', totalRevenue);
        
        // Fetch revenue growth data
        const { data: revenueGrowthData, error: growthError } = await supabase
          .from('top_selling_products')
          .select('month, total_revenue');
        
        if (growthError) throw new Error(`Error fetching growth data: ${growthError.message}`);
        console.log('Revenue growth data:', revenueGrowthData);
        
        // Fetch churn rate data
        const { data: churnData, error: churnError } = await supabase
          .from('top_selling_products')
          .select('month, churn_rate');
        
        if (churnError) throw new Error(`Error fetching churn data: ${churnError.message}`);
        console.log('Churn rate data:', churnData);
        
        // Fetch satisfaction data
        const { data: satisfactionData, error: satisfactionError } = await supabase
          .from('top_selling_products')
          .select('rating');
        
        if (satisfactionError) throw new Error(`Error fetching satisfaction data: ${satisfactionError.message}`);
        console.log('Satisfaction data:', satisfactionData);
        
        const avgSatisfaction = satisfactionData.length > 0 
          ? (satisfactionData.reduce((acc, curr) => acc + (parseFloat(curr.rating) || 0), 0) / satisfactionData.length).toFixed(2)
          : 0;
        console.log('Calculated avg satisfaction:', avgSatisfaction);
        
        // Fetch top products data
        const { data: topProductsData, error: productsError } = await supabase
          .from('top_selling_products')
          .select('product_name, total_revenue')
          .order('total_revenue', { ascending: false })
          .limit(5);
        
        if (productsError) throw new Error(`Error fetching top products: ${productsError.message}`);
        console.log('Top products data:', topProductsData);
        
        // Fetch revenue contribution data
        const { data: revenueContributionData, error: contributionError } = await supabase
          .from('top_selling_products')
          .select('product_name, total_revenue');
        
        if (contributionError) throw new Error(`Error fetching revenue contribution: ${contributionError.message}`);
        console.log('Revenue contribution data:', revenueContributionData);
        
        const totalRev = revenueContributionData.reduce((acc, curr) => acc + (parseFloat(curr.total_revenue) || 0), 0);
        const revenueContribution = revenueContributionData.map(product => ({
          name: product.product_name || 'Unknown',
          value: parseFloat(product.total_revenue) || 0
        }));
        console.log('Processed revenue contribution:', revenueContribution);

        setKpiData({
          totalRevenue,
          revenueGrowth: revenueGrowthData || [],
          churnRate: churnData || [],
          customerSatisfaction: avgSatisfaction,
          topSellingProducts: topProductsData || [],
          revenueContribution: revenueContribution || [],
          leaderboardKPIs: {
            totalRevenue: [],
            successRate: [],
            revenuePerCall: [],
            avgSatisfaction: [],
            monthlyRevenueTrend: [],
            callEffectiveness: []
          }
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching KPIs:', error);
        setError(`Failed to load dashboard data: ${error.message}`);
        setLoading(false);
      }
    };
    
    fetchKPIs();
  }, []);

  // Render loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" flexDirection="column">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading dashboard data...</Typography>
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ pt: 5 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body1">
          Please check your database connection and make sure the necessary tables exist with the expected data.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ pt: 3, pb: 8 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4, fontFamily: 'Roboto, sans-serif', color: '#333' }}>Sales Rep KPI Dashboard</Typography>

      {/* Stat Cards for Revenue, Satisfaction, Churn Rate */}
      <Grid container spacing={4} sx={{ mt: 3 }}>
        {/* Total Revenue Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 5, display: 'flex', flexDirection: 'center', borderRadius: 10, alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}}>
            <Avatar sx={{ bgcolor: '#4CAF50', width: 60, height: 60, mr: 4, p: 4}}>
              <AttachMoneyIcon sx={{ fontSize: 40, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#1a73e8', fontFamily: 'Inter, sans-serif' }}>
                ${kpiData.totalRevenue.toLocaleString()}
              </Typography>
              <Typography 
                variant="h5" color="text.primary" sx={{ fontFamily: 'Lato, sans-serif', fontWeight: 720, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: 1.5, color: '#333333', lineHeight: 1}}>
                Total Revenue
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Customer Satisfaction Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 5, display: 'flex', flexDirection: 'center', borderRadius: 10, alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}}>
            <Avatar sx={{ bgcolor: '#4CAF50', width: 60, height: 60, mr: 4, p: 4}}>
              <ThumbUpIcon sx={{ fontSize: 40, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#1a73e8', fontFamily: 'Inter, sans-serif' }}>
                {kpiData.customerSatisfaction}%
              </Typography>
              <Typography 
                variant="h5" color="text.primary" sx={{ fontFamily: 'Lato, sans-serif', fontWeight: 720, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: 1.5, color: '#333333', lineHeight: 1}}>
                Customer Satisfaction
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Churn Rate Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 5, display: 'flex', flexDirection: 'center', borderRadius: 10, alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}}>
            <Avatar sx={{ bgcolor: '#4CAF50', width: 60, height: 60, mr: 8, p: 4}}>
              <TrendingDownIcon sx={{ fontSize: 40, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#1a73e8', fontFamily: 'Inter, sans-serif' }}>
                {kpiData.churnRate[0]?.churn_rate || '0'}%
              </Typography>
              <Typography 
                variant="h5" color="text.primary" sx={{ fontFamily: 'Lato, sans-serif', fontWeight: 720, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: 1.5, color: '#333333', lineHeight: 1}}>
                Churn Rate
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Revenue Growth Chart */}
      <Grid container spacing={4} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: 10 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#1a73e8', fontFamily: 'Inter, sans-serif' }}>Revenue Growth</Typography>
            {kpiData.revenueGrowth && kpiData.revenueGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={kpiData.revenueGrowth}>
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(month, index) => {
                      return month === 'January' || month === 'February' ? month : '';
                    }} 
                  />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total_revenue" stroke="#1a73e8" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={250}>
                <Typography variant="body1" color="text.secondary">No revenue growth data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Revenue Contribution Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: 10 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#FF9800', fontFamily: 'Inter, sans-serif' }}>Revenue Contribution</Typography>
            {kpiData.revenueContribution && kpiData.revenueContribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={kpiData.revenueContribution}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    fill="#FF9800"
                  >
                    {kpiData.revenueContribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={['#FF9800', '#4CAF50', '#3F51B5', '#E91E63', '#9C27B0'][index % 5]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    iconType="circle"
                    iconSize={9}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{
                      padding: '5px',
                      fontSize: '9px',
                      fontFamily: 'Arial, sans-serif',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '5px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                      marginTop: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={250}>
                <Typography variant="body1" color="text.secondary">No revenue contribution data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Top Selling Products Table */}
      <Grid container spacing={4} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: 10 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#4CAF50', fontFamily: 'Inter, sans-serif' }}>Top Selling Products</Typography>
            {kpiData.topSellingProducts && kpiData.topSellingProducts.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 'bold', color: '#333' } }}>
                      <TableCell>Product Name</TableCell>
                      <TableCell>Total Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {kpiData.topSellingProducts.map((product, index) => (
                      <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                        <TableCell>{product.product_name || 'Unknown'}</TableCell>
                        <TableCell>{product.total_revenue ? `$${parseFloat(product.total_revenue).toLocaleString()}` : '$0'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={100}>
                <Typography variant="body1" color="text.secondary">No top selling products data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
