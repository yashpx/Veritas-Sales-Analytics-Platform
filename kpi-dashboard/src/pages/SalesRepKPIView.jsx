import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Container, Grid, Paper, Typography, Box, Avatar, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, CircularProgress 
} from '@mui/material';
import { PieChart, Pie, Cell, LineChart, Line, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import './SalesRepKPIView.css'; 

const supabaseUrl = 'https://coghrwmmyyzmbnndlawi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4OTcyMjUsImV4cCI6MjA1NjQ3MzIyNX0.WLm0l2UeFPiPNxyClnM4bQpxw4TcYFxleTdc7K0G6AM';
const supabase = createClient(supabaseUrl, supabaseKey);

const SalesRepKPIView = () => {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
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

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const { data: totalRevenueData } = await supabase.from('top_selling_products').select('total_revenue');
        const totalRevenue = totalRevenueData.reduce((acc, curr) => acc + parseFloat(curr.total_revenue), 0);
        
        const { data: revenueGrowthData } = await supabase.from('top_selling_products').select('month, total_revenue');
        const { data: churnData } = await supabase.from('top_selling_products').select('month, churn_rate');
        
        const { data: satisfactionData } = await supabase.from('top_selling_products').select('rating');
        const avgSatisfaction = (satisfactionData.reduce((acc, curr) => acc + parseFloat(curr.rating), 0) / satisfactionData.length).toFixed(2);

        const { data: topProductsData } = await supabase.from('top_selling_products').select('product_name, total_revenue').order('total_revenue', { ascending: false }).limit(5);
        
        const { data: revenueContributionData } = await supabase.from('top_selling_products').select('product_name, total_revenue');
        const totalRev = revenueContributionData.reduce((acc, curr) => acc + parseFloat(curr.total_revenue), 0);
        const revenueContribution = revenueContributionData.map(product => ({
          name: product.product_name,
          value: parseFloat(product.total_revenue) 
        }));

        setKpiData(prevData => ({
          ...prevData,
          totalRevenue,
          revenueGrowth: revenueGrowthData,
          churnRate: churnData,
          customerSatisfaction: avgSatisfaction,
          topSellingProducts: topProductsData,
          revenueContribution,
        }));
      } catch (error) {
        console.error('Error fetching KPIs:', error);
      }
    };
    fetchKPIs();
  }, []);

  if (!kpiData.totalRevenue) {
    return <CircularProgress />; 
  }

  return (
    <Container maxWidth="lg" sx={{ pt: 3, pb: 8 }}> 
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold">Sales Rep KPI Dashboard</Typography>
          <Typography>{currentDate}</Typography>
      </Box>

      {/* Stat Cards for Revenue, Satisfaction, Churn Rate */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        {/* Total Revenue Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 4, display: 'flex', flexDirection: 'center', borderRadius: 10, alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}}>
            <Avatar sx={{ bgcolor: '#4CAF50', width: 60, height: 60, mr: 2, p: 2}}>
              <AttachMoneyIcon sx={{ fontSize: 40, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#1a73e8', fontFamily: 'Inter, sans-serif' }}>
                ${kpiData.totalRevenue}
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
          <Paper sx={{ p: 4, display: 'flex', flexDirection: 'center', borderRadius: 10, alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}}>
            <Avatar sx={{ bgcolor: '#4CAF50', width: 60, height: 60, mr: 2, p: 2}}>
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
          <Paper sx={{ p: 4, display: 'flex', flexDirection: 'center', borderRadius: 10, alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}}>
            <Avatar sx={{ bgcolor: '#4CAF50', width: 60, height: 60, mr: 2, p: 2}}>
              <TrendingDownIcon sx={{ fontSize: 40, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#1a73e8', fontFamily: 'Inter, sans-serif' }}>
                {kpiData.churnRate[0]?.churn_rate || 0}%
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
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={kpiData.revenueGrowth}>
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total_revenue" stroke="#1a73e8" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Revenue Contribution Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: 10 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#FF9800', fontFamily: 'Inter, sans-serif' }}>Revenue Contribution</Typography>
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
                    marginTop: '12px',  // Adds some space between the pie chart and the legend
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

          </Paper>
        </Grid>
      </Grid>

      {/* Top Selling Products Table */}
      <Grid container spacing={4} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: 10 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#4CAF50', fontFamily: 'Inter, sans-serif' }}>Top Selling Products</Typography>
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
                      <TableCell>{product.product_name}</TableCell>
                      <TableCell>{product.total_revenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SalesRepKPIView;
