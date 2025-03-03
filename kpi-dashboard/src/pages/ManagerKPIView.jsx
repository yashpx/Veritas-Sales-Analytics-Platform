import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Container, Grid, Paper, Typography, Box, Avatar, 
  CircularProgress 
} from '@mui/material';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import './ManagerKPIView.css'; 

const supabaseUrl = 'https://coghrwmmyyzmbnndlawi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4OTcyMjUsImV4cCI6MjA1NjQ3MzIyNX0.WLm0l2UeFPiPNxyClnM4bQpxw4TcYFxleTdc7K0G6AM';
const supabase = createClient(supabaseUrl, supabaseKey);

const ManagerKPIView = () => {
  const [kpiData, setKpiData] = useState({
    totalRevenue: 0,
    successRate: 0,
    revenuePerCall: 0,
    avgSatisfaction: 0,
    monthlyRevenueTrend: [],
    callEffectiveness: []
  });

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const { data: totalRevenueData = [] } = await supabase.from('leaderboard').select('total_revenue');
        const totalRevenue = totalRevenueData.reduce((acc, curr) => acc + parseFloat(curr.total_revenue), 0);

        const { data: successRateData = []} = await supabase.from('leaderboard').select('success_rate');
        const successRate = successRateData.length > 0 ? successRateData[0].success_rate : 0;

        const { data: revenuePerCallData = []} = await supabase.from('leaderboard').select('revenue_per_call');
        const revenuePerCall = revenuePerCallData.length > 0 ? revenuePerCallData[0].revenue_per_call : 0;

        const { data: satisfactionData = []} = await supabase.from('leaderboard').select('avg_satisfaction');
        const avgSatisfaction = satisfactionData.length > 0 ? satisfactionData[0].avg_satisfaction : 0;

        const { data: monthlyRevenueTrend = []} = await supabase.from('leaderboard').select('month, total_revenue');

        const { data: callEffectiveness = []} = await supabase.from('leaderboard').select('month, call_effectiveness');

        setKpiData({
          totalRevenue,
          successRate,
          revenuePerCall,
          avgSatisfaction,
          monthlyRevenueTrend,
          callEffectiveness
        });
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
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4, color: '#333' }}>Manager KPI Dashboard</Typography>

      <Grid container spacing={4} sx={{ mt: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 5, display: 'flex', alignItems: 'center', borderRadius: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <Avatar sx={{ bgcolor: '#4CAF50', width: 60, height: 60, mr: 4 }}>
              <AttachMoneyIcon sx={{ fontSize: 40, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#1a73e8' }}>
                ${kpiData.totalRevenue}
              </Typography>
              <Typography variant="h6" sx={{ color: '#333' }}>Total Revenue</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 5, display: 'flex', alignItems: 'center', borderRadius: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <Avatar sx={{ bgcolor: '#FF9800', width: 60, height: 60, mr: 4 }}>
              <ThumbUpIcon sx={{ fontSize: 40, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#1a73e8' }}>
                {kpiData.successRate}%
              </Typography>
              <Typography variant="h6" sx={{ color: '#333' }}>Success Rate</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 5, display: 'flex', alignItems: 'center', borderRadius: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <Avatar sx={{ bgcolor: '#2196F3', width: 60, height: 60, mr: 4 }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#1a73e8' }}>
                ${kpiData.revenuePerCall}
              </Typography>
              <Typography variant="h6" sx={{ color: '#333' }}>Revenue Per Call</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={4} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: 10 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#1a73e8' }}>Monthly Revenue Trend</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={kpiData.monthlyRevenueTrend}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total_revenue" stroke="#1a73e8" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: 10 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#FF9800' }}>Call Effectiveness</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={kpiData.callEffectiveness} dataKey="call_effectiveness" nameKey="month" outerRadius={80} fill="#FF9800">
                  {kpiData.callEffectiveness.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#FF9800', '#4CAF50', '#3F51B5'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ManagerKPIView;
