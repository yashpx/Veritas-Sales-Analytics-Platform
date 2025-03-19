import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import { fetchSalesRepDashboardData } from '../utils/salesrepdashboardApiClient';
import supabase from '../utils/supabaseClient';
import '../styles/salesrepdashboard.css';

const SalesRepDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    repName: '',
    totalCalls: 0,
    salesClosed: 0,
    callMinutes: 0,
    salesPending: 0,
    recentCalls: [],
    monthlySales: 0,
    currentMonthName: '',
    callSentiment: { positive: 0, negative: 0, neutral: 0 },
    sentimentData: { positive: 0, negative: 0, neutral: 0, total: 0 },
    salesTrend: [],
    topCustomers: [],
    productMix: [],
    kpi: {
      targetSales: 0,
      targetTransactions: 0,
      salesProgress: 0,
      transactionsProgress: 0
    },
    analytics: {
      averageDailyCalls: '0',
      averageCallDuration: '0'
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryTimeframe, setSummaryTimeframe] = useState('weekly');
  
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // First check if we already have the salesRepId in the user object
        let salesRepId = user?.salesRepId;
        
        // If not, and this is a sales rep login with user_auth id, we need to query the sales_reps table
        if (!salesRepId && user?.role === 'sales_rep' && user?.id) {
          console.log("Querying sales_rep_id for user_auth id:", user.id);
          try {
            // Query sales_reps table by email to get the actual sales_rep_id
            const { data, error } = await supabase
              .from('user_auth')
              .select('email')
              .eq('id', user.id)
              .single();
              
            if (error) throw error;
            
            if (data?.email) {
              // Now use the email to find the correct sales_rep_id
              const { data: repData, error: repError } = await supabase
                .from('sales_reps')
                .select('sales_rep_id')
                .eq('Email', data.email)
                .single();
                
              if (repError) throw repError;
              
              if (repData?.sales_rep_id) {
                salesRepId = repData.sales_rep_id;
                console.log("Found correct sales_rep_id:", salesRepId);
                
                // Update user object with the correct salesRepId for future use
                const updatedUser = { ...user, salesRepId };
                localStorage.setItem('sales_rep_user', JSON.stringify(updatedUser));
              }
            }
          } catch (err) {
            console.error("Error querying sales_rep_id:", err);
          }
        }
        
        if (!salesRepId) {
          console.error("Missing sales rep ID in user data:", user);
          setError("Failed to load dashboard: Missing sales rep ID");
          setLoading(false);
          return;
        }
        
        console.log(`Loading data for sales rep ID: ${salesRepId}`);
        const data = await fetchSalesRepDashboardData(salesRepId, summaryTimeframe);
        
        if (data.error) {
          throw new Error(data.errorMessage);
        }
        
        setDashboardData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading sales rep dashboard data:', err);
        setError("Failed to load dashboard data: " + err.message);
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user, summaryTimeframe]);

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  // For the pie chart
  const COLORS = ['#4ADE80', '#FF6B6B', '#E2E8F0'];

  const renderSentimentPieChart = () => {
    // Use the sentiment data directly from the API response
    const data = [
      { name: 'Positive', value: dashboardData.callSentiment.positive },
      { name: 'Negative', value: dashboardData.callSentiment.negative },
      { name: 'Neutral', value: dashboardData.callSentiment.neutral }
    ];

    return (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
            <tspan x="50%" dy="-10" fontSize="24" fontWeight="bold" fill="#000">
              {dashboardData.totalCalls}
            </tspan>
            <tspan x="50%" dy="25" fontSize="14" fill="#666">
              Calls made
            </tspan>
          </text>
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Format the monthlySales value with commas for thousands
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Render a progress bar for KPIs
  const renderProgressBar = (value, label) => {
    return (
      <div className="progress-item">
        <div className="progress-label">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${value}%`, backgroundColor: value >= 100 ? '#4ADE80' : '#9333ea' }}
          />
        </div>
      </div>
    );
  };

  // Render product mix bar chart
  const renderProductMixChart = () => {
    const data = dashboardData.productMix.slice(0, 5).map(product => ({
      name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
      sales: product.totalSales
    }));

    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 15 }}>
          <XAxis type="number" hide={true} />
          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Bar dataKey="sales" fill="#9333ea" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="dashboard-loading">
          <h2>Loading dashboard data...</h2>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="dashboard-error">
          <h2>Error: {error}</h2>
          <p>Please try refreshing the page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="salesrep-dashboard-container">
        <div className="dashboard-header">
          <div className="greeting-section">
            <h1>My Dashboard</h1>
            <p className="welcome-message">Welcome back, {dashboardData.repName}</p>
          </div>
          <div className="timeframe-filter">
            <button 
              className={`filter-btn ${summaryTimeframe === 'weekly' ? 'active' : ''}`}
              onClick={() => setSummaryTimeframe('weekly')}
            >
              Weekly
            </button>
            <button 
              className={`filter-btn ${summaryTimeframe === 'monthly' ? 'active' : ''}`}
              onClick={() => setSummaryTimeframe('monthly')}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="dashboard-summary">
          <div className="summary-card">
            <div className="icon-blue">📞</div>
            <div className="summary-content">
              <h2>{dashboardData.totalCalls}</h2>
              <p>Calls made this {summaryTimeframe === 'weekly' ? 'week' : 'month'}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="icon-yellow">🏆</div>
            <div className="summary-content">
              <h2>{dashboardData.salesClosed}</h2>
              <p>Sales closed</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="icon-orange">⏱️</div>
            <div className="summary-content">
              <h2>{dashboardData.callMinutes}</h2>
              <p>Minutes on call</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="icon-purple">📋</div>
            <div className="summary-content">
              <h2>{dashboardData.salesPending}</h2>
              <p>Sales pending</p>
            </div>
          </div>
        </div>

        <div className="dashboard-main">
          <div className="left-column">
            <div className="kpi-section">
              <div className="section-header">
                <h2>My KPI Progress</h2>
                <span className="period-badge">{dashboardData.currentMonthName}</span>
              </div>
              <div className="kpi-content">
                {renderProgressBar(dashboardData.kpi.salesProgress, 'Sales Target')}
                {renderProgressBar(dashboardData.kpi.transactionsProgress, 'Transactions Target')}
                <div className="kpi-details">
                  <div className="kpi-detail-item">
                    <span className="kpi-label">Sales Target:</span>
                    <span className="kpi-value">{formatCurrency(dashboardData.kpi.targetSales)}</span>
                  </div>
                  <div className="kpi-detail-item">
                    <span className="kpi-label">Current Sales:</span>
                    <span className="kpi-value">{formatCurrency(dashboardData.monthlySales)}</span>
                  </div>
                  <div className="kpi-detail-item">
                    <span className="kpi-label">Transactions Target:</span>
                    <span className="kpi-value">{dashboardData.kpi.targetTransactions}</span>
                  </div>
                  <div className="kpi-detail-item">
                    <span className="kpi-label">Current Transactions:</span>
                    <span className="kpi-value">{dashboardData.salesClosed}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="analytics-section">
              <div className="section-header">
                <h2>Call Analytics</h2>
              </div>
              <div className="analytics-content">
                <div className="analytics-item">
                  <span className="analytics-label">Average Daily Calls:</span>
                  <span className="analytics-value">{dashboardData.analytics.averageDailyCalls}</span>
                </div>
                <div className="analytics-item">
                  <span className="analytics-label">Average Call Duration:</span>
                  <span className="analytics-value">{dashboardData.analytics.averageCallDuration} minutes</span>
                </div>
              </div>
            </div>

            <div className="recent-calls-section">
              <div className="section-header">
                <h2>Recent Calls</h2>
              </div>
              <div className="table-responsive">
                <table className="recent-calls-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Client</th>
                      <th>Duration</th>
                      <th>Outcome</th>
                      <th>Sentiment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentCalls.map((call, index) => (
                      <tr key={index}>
                        <td>{call.date}</td>
                        <td>{call.client}</td>
                        <td>{call.duration}</td>
                        <td>
                          <span className={`outcome-badge ${call.outcome.toLowerCase()}`}>
                            {call.outcome}
                          </span>
                        </td>
                        <td>
                          <span className={`sentiment-badge ${call.sentiment.toLowerCase()}`}>
                            {call.sentiment}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {dashboardData.recentCalls.length === 0 && (
                      <tr>
                        <td colSpan="5" className="no-data">No recent calls to display</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="product-mix-section">
              <div className="section-header">
                <h2>Product Mix</h2>
              </div>
              <div className="product-mix-content">
                {renderProductMixChart()}
              </div>
            </div>
          </div>

          <div className="right-column">
            <div className="sales-section">
              <div className="section-header">
                <h2>Sales Summary</h2>
                <span className="period-badge">{dashboardData.currentMonthName}</span>
              </div>
              <div className="sales-content">
                <div className="sales-amount">
                  <span className="sales-label">Total Sales</span>
                  <span className="sales-value">{formatCurrency(dashboardData.monthlySales)}</span>
                </div>
                <div className="sales-chart">
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={dashboardData.salesTrend}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <XAxis dataKey="day" />
                      <YAxis hide={true} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="sales" stroke="#9333ea" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="sentiment-section">
              <div className="section-header">
                <h2>Call Sentiment</h2>
              </div>
              <div className="sentiment-content">
                {renderSentimentPieChart()}
                <div className="sentiment-legend">
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: COLORS[0] }}></span>
                    <span className="legend-label">Positive</span>
                    <span className="legend-value">{dashboardData.callSentiment.positive}%</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: COLORS[1] }}></span>
                    <span className="legend-label">Negative</span>
                    <span className="legend-value">{dashboardData.callSentiment.negative}%</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: COLORS[2] }}></span>
                    <span className="legend-label">Neutral</span>
                    <span className="legend-value">{dashboardData.callSentiment.neutral}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="top-customers-section">
              <div className="section-header">
                <h2>Top Customers</h2>
              </div>
              <div className="top-customers-content">
                {dashboardData.topCustomers.map((customer, index) => (
                  <div key={index} className="customer-item">
                    <div className="customer-rank">{index + 1}</div>
                    <div className="customer-details">
                      <div className="customer-name">{customer.name}</div>
                      <div className="customer-stats">
                        <span className="customer-deals">{customer.deals} deals</span>
                        <span className="customer-value">{formatCurrency(customer.totalSales)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {dashboardData.topCustomers.length === 0 && (
                  <div className="no-data">No customer data available</div>
                )}
              </div>
            </div>

            
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SalesRepDashboard;