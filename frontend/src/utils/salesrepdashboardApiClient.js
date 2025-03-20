import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check for environment variables and provide more helpful error messages
if (!supabaseUrl) {
  console.error('Missing REACT_APP_SUPABASE_URL environment variable. Check your .env file.');
}

if (!supabaseAnonKey) {
  console.error('Missing REACT_APP_SUPABASE_ANON_KEY environment variable. Check your .env file.');
}

// Only create client if we have the required configuration
const salesRepDashboardClient = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Sales Rep Dashboard data fetching functions
export const fetchSalesRepDashboardData = async (salesRepId, timeframe = 'weekly') => {
  // Validate client and salesRepId before proceeding
  if (!salesRepDashboardClient) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }

  if (!salesRepId) {
    throw new Error('Sales Rep ID is required.');
  }

  try {
    // Get date ranges for queries based on timeframe
    const now = new Date();
    
    // For weekly timeframe
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    
    // For monthly timeframe
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);
    
    // Set the appropriate start and end dates based on timeframe
    const startDate = timeframe === 'weekly' ? startOfWeek : currentMonthStart;
    const endDate = now;
    // This variable is needed for potential future use
    const _ = { currentMonthEnd };
    
    // Use Promise.all to run queries in parallel for better performance
    const [
      repInfoResult,
      callDataResult,
      closedSalesResult,
      minutesDataResult,
      pendingSalesResult,
      kpiDataResult,
      recentCallsResult,
      salesResult,
      currentSentimentResult,
      topCustomersResult,
      productMixResult
    ] = await Promise.all([
      // Get rep info
      salesRepDashboardClient
        .from('sales_reps')
        .select('sales_rep_first_name, sales_rep_last_name')
        .eq('sales_rep_id', salesRepId)
        .single(),
      
      // Get total calls for the selected timeframe
      salesRepDashboardClient
        .from('call_logs')
        .select('call_id')
        .eq('sales_rep_id', salesRepId)
        .gte('call_date', startDate.toISOString())
        .lt('call_date', endDate.toISOString()),
      
      // Get closed sales for the selected timeframe
      salesRepDashboardClient
        .from('call_logs')
        .select('call_id')
        .eq('sales_rep_id', salesRepId)
        .eq('call_outcome', 'Closed')
        .gte('call_date', startDate.toISOString())
        .lt('call_date', endDate.toISOString()),
      
      // Get total call minutes for the selected timeframe
      salesRepDashboardClient
        .from('call_logs')
        .select('duration_minutes')
        .eq('sales_rep_id', salesRepId)
        .gte('call_date', startDate.toISOString())
        .lt('call_date', endDate.toISOString()),
      
      // Get pending sales for the selected timeframe
      salesRepDashboardClient
        .from('call_logs')
        .select('call_id')
        .eq('sales_rep_id', salesRepId)
        .eq('call_outcome', 'In-progress')
        .gte('call_date', startDate.toISOString())
        .lt('call_date', endDate.toISOString()),
        
      // Get KPI data for the rep - using order and limit instead of single() to avoid errors
      salesRepDashboardClient
        .from('sales_kpi')
        .select('*')
        .eq('sales_rep_id', salesRepId)
        .gte('month', timeframe === 'weekly' 
          ? new Date(currentYear, currentMonth, 1).toISOString().split('T')[0] 
          : new Date(currentYear, currentMonth, 1).toISOString().split('T')[0])
        .lte('month', new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0])
        .order('month', { ascending: false })
        .limit(1),
      
      // Get recent calls (5 most recent)
      salesRepDashboardClient
        .from('call_logs')
        .select(`
          call_id,
          call_date,
          duration_minutes,
          call_outcome,
          "Sentiment Result",
          customers!inner(customer_first_name, customer_last_name)
        `)
        .eq('sales_rep_id', salesRepId)
        .order('call_date', { ascending: false })
        .limit(5),
      
      // Get sales data for the selected timeframe
      salesRepDashboardClient
        .from('sales_data')
        .select('sale_amount, sale_date, product_name')
        .eq('sales_rep_id', salesRepId)
        .gte('sale_date', startDate.toISOString())
        .lte('sale_date', endDate.toISOString()),
      
      // Get current period sentiment data for this rep
      salesRepDashboardClient
        .from('call_logs')
        .select('"Sentiment Result"')
        .eq('sales_rep_id', salesRepId)
        .gte('call_date', startDate.toISOString())
        .lte('call_date', endDate.toISOString()),
        
      // Get top customers by sales amount
      salesRepDashboardClient
        .from('sales_data')
        .select(`
          customer_id,
          customer_first_name, 
          customer_last_name,
          sale_amount
        `)
        .eq('sales_rep_id', salesRepId)
        .gte('sale_date', startDate.toISOString())
        .lte('sale_date', endDate.toISOString()),
        
      // Get product mix
      salesRepDashboardClient
        .from('sales_data')
        .select(`
          product_id,
          product_name,
          sale_amount,
          quantity_sold
        `)
        .eq('sales_rep_id', salesRepId)
        .gte('sale_date', startDate.toISOString())
        .lte('sale_date', endDate.toISOString())
    ]);
    
    // Check for errors in all queries
    const errors = [
      { name: 'rep info', error: repInfoResult.error },
      { name: 'call data', error: callDataResult.error },
      { name: 'closed sales', error: closedSalesResult.error },
      { name: 'minutes data', error: minutesDataResult.error },
      { name: 'pending sales', error: pendingSalesResult.error },
      { name: 'kpi data', error: kpiDataResult.error },
      { name: 'recent calls', error: recentCallsResult.error },
      { name: 'sales data', error: salesResult.error },
      { name: 'current sentiment', error: currentSentimentResult.error },
      { name: 'top customers', error: topCustomersResult.error },
      { name: 'product mix', error: productMixResult.error }
    ].filter(item => item.error);
    
    if (errors.length > 0) {
      console.error('Query errors:', errors);
      throw new Error(`Database query errors: ${errors.map(e => `${e.name}: ${e.error.message}`).join(', ')}`);
    }
    
    // Process rep info
    const repInfo = repInfoResult.data || { sales_rep_first_name: '', sales_rep_last_name: '' };
    const repName = `${repInfo.sales_rep_first_name || ''} ${repInfo.sales_rep_last_name || ''}`.trim();
    
    // Process data safely with null checks
    const callData = callDataResult.data || [];
    const closedSales = closedSalesResult.data || [];
    const minutesData = minutesDataResult.data || [];
    const pendingSales = pendingSalesResult.data || [];
    // Process KPI data - get the first item if it exists, or default to empty object
    const kpiData = kpiDataResult.data && kpiDataResult.data.length > 0 ? kpiDataResult.data[0] : {};
    const recentCallsData = recentCallsResult.data || [];
    const salesData = salesResult.data || [];
    const currentSentimentData = currentSentimentResult.data || [];
    const topCustomersData = topCustomersResult.data || [];
    const productMixData = productMixResult.data || [];
    
    // Calculate total minutes safely
    const totalMinutes = minutesData.reduce((sum, call) => {
      // Ensure duration_minutes is a number
      const minutes = Number(call.duration_minutes) || 0;
      return sum + minutes;
    }, 0);
    
    // Process recent calls safely
    const recentCalls = recentCallsData.map(call => {
      // Default values if data is missing
      const callDate = call.call_date ? new Date(call.call_date) : new Date();
      const formattedDate = callDate.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
      });
      
      const customerFirstName = call.customers?.customer_first_name || '';
      const customerLastName = call.customers?.customer_last_name || '';
      const sentiment = call["Sentiment Result"] || 'Neutral';
      
      return {
        date: formattedDate,
        client: `${customerFirstName} ${customerLastName}`.trim() || 'Unknown Client',
        duration: `${call.duration_minutes || 0}m`,
        outcome: call.call_outcome || 'Unknown',
        sentiment: sentiment
      };
    });
    
    // Calculate total sales for the selected timeframe
    const totalSales = salesData.reduce((sum, sale) => {
      return sum + (Number(sale.sale_amount) || 0);
    }, 0);

    // Process sentiment data from the database
    // Count the number of each sentiment type
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0, total: 0 };
    
    currentSentimentData.forEach(record => {
      const sentiment = record["Sentiment Result"]?.toLowerCase();
      
      if (sentiment === 'positive') {
        sentimentCounts.positive += 1;
      } else if (sentiment === 'negative') {
        sentimentCounts.negative += 1;
      } else if (sentiment === 'neutral') {
        sentimentCounts.neutral += 1;
      }
      
      sentimentCounts.total += 1;
    });
    
    // Calculate percentages if there's data
    const sentimentPercentages = { positive: 0, negative: 0, neutral: 0 };
    
    if (sentimentCounts.total > 0) {
      sentimentPercentages.positive = Math.round((sentimentCounts.positive / sentimentCounts.total) * 100);
      sentimentPercentages.negative = Math.round((sentimentCounts.negative / sentimentCounts.total) * 100);
      sentimentPercentages.neutral = Math.round((sentimentCounts.neutral / sentimentCounts.total) * 100);
      
      // Adjust to ensure percentages sum to 100%
      const sum = sentimentPercentages.positive + sentimentPercentages.negative + sentimentPercentages.neutral;
      if (sum !== 100 && sum > 0) {
        // Add or subtract the difference from the largest percentage
        const diff = 100 - sum;
        if (sentimentPercentages.positive >= sentimentPercentages.negative && 
            sentimentPercentages.positive >= sentimentPercentages.neutral) {
          sentimentPercentages.positive += diff;
        } else if (sentimentPercentages.negative >= sentimentPercentages.positive && 
                   sentimentPercentages.negative >= sentimentPercentages.neutral) {
          sentimentPercentages.negative += diff;
        } else {
          sentimentPercentages.neutral += diff;
        }
      }
    }
    
    // Process top customers
    const customerTotals = {};
    
    topCustomersData.forEach(sale => {
      if (!sale.customer_id) return;
      
      const customerId = sale.customer_id;
      const firstName = sale.customer_first_name || '';
      const lastName = sale.customer_last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const saleAmount = Number(sale.sale_amount) || 0;
      
      if (!customerTotals[customerId]) {
        customerTotals[customerId] = {
          id: customerId,
          name: fullName || `Customer ${customerId}`,
          totalSales: 0,
          deals: 0
        };
      }
      
      customerTotals[customerId].deals += 1;
      customerTotals[customerId].totalSales += saleAmount;
    });
    
    // Convert to array and sort by totalSales from highest to lowest
    const topCustomers = Object.values(customerTotals)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);
    
    // Process product mix
    const productTotals = {};
    
    productMixData.forEach(sale => {
      if (!sale.product_id) return;
      
      const productId = sale.product_id;
      const productName = sale.product_name || `Product ${productId}`;
      const saleAmount = Number(sale.sale_amount) || 0;
      const quantity = Number(sale.quantity_sold) || 0;
      
      if (!productTotals[productId]) {
        productTotals[productId] = {
          id: productId,
          name: productName,
          totalSales: 0,
          quantity: 0
        };
      }
      
      productTotals[productId].totalSales += saleAmount;
      productTotals[productId].quantity += quantity;
    });
    
    // Convert to array and sort by totalSales from highest to lowest
    const productMix = Object.values(productTotals)
      .sort((a, b) => b.totalSales - a.totalSales);
    
    // Calculate KPI progress
    const kpiTargetSales = kpiData.target_sales_amount || 0;
    const kpiTargetTransactions = kpiData.target_transactions || 0;
    
    const salesProgress = kpiTargetSales > 0 
      ? Math.min(Math.round((totalSales / kpiTargetSales) * 100), 100) 
      : 0;
    
    const transactionsProgress = kpiTargetTransactions > 0 
      ? Math.min(Math.round((closedSales.length / kpiTargetTransactions) * 100), 100) 
      : 0;
    
    // Generate trend data based on timeframe
    let salesTrend = [];
    
    if (timeframe === 'weekly') {
      // Generate data for the last 7 days
      salesTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i)); // Count forwards from 6 days ago to today
        
        // Find sales for this day in real data
        const dayStr = date.getDate().toString().padStart(2, '0');
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Sum sales for this day from real data
        const daySales = salesData
          .filter(sale => sale.sale_date && sale.sale_date.startsWith(dateStr))
          .reduce((sum, sale) => sum + (Number(sale.sale_amount) || 0), 0);
        
        return {
          day: dayStr,
          sales: daySales
        };
      });
    } else {
      // Generate data for the days in the current month
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      salesTrend = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const date = new Date(currentYear, currentMonth, day);
        
        // Skip future days
        if (date > now) return null;
        
        const dayStr = day.toString().padStart(2, '0');
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Sum sales for this day from real data
        const daySales = salesData
          .filter(sale => sale.sale_date && sale.sale_date.startsWith(dateStr))
          .reduce((sum, sale) => sum + (Number(sale.sale_amount) || 0), 0);
        
        return {
          day: dayStr,
          sales: daySales
        };
      }).filter(item => item !== null); // Remove nulls (future days)
    }
    
    // Calculate daily averages for call analytics
    const averageDailyCalls = callData.length / (timeframe === 'weekly' ? 7 : daysInMonth(currentMonth, currentYear));
    const averageCallDuration = callData.length > 0 ? totalMinutes / callData.length : 0;
    
    // Put all the data together
    return {
      repName: repName,
      totalCalls: callData.length,
      salesClosed: closedSales.length,
      callMinutes: totalMinutes,
      salesPending: pendingSales.length,
      recentCalls: recentCalls,
      monthlySales: Math.round(totalSales),
      currentMonthName: timeframe === 'weekly' ? 'This Week' : getMonthName(currentMonth),
      callSentiment: sentimentPercentages,
      sentimentData: sentimentCounts,
      salesTrend: salesTrend,
      topCustomers: topCustomers,
      productMix: productMix,
      kpi: {
        targetSales: kpiTargetSales,
        targetTransactions: kpiTargetTransactions,
        salesProgress: salesProgress,
        transactionsProgress: transactionsProgress
      },
      analytics: {
        averageDailyCalls: averageDailyCalls.toFixed(1),
        averageCallDuration: averageCallDuration.toFixed(1)
      }
    };
    
  } catch (error) {
    console.error('Error fetching sales rep dashboard data:', error);
    
    // Return a structured error that won't crash the UI
    return {
      error: true,
      errorMessage: error.message || 'Unknown error occurred while fetching dashboard data',
      repName: '',
      totalCalls: 0,
      salesClosed: 0,
      callMinutes: 0,
      salesPending: 0,
      recentCalls: [],
      monthlySales: 0,
      currentMonthName: timeframe === 'weekly' ? 'This Week' : getMonthName(new Date().getMonth()),
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
    };
  }
};

// Helper function to get month name
const getMonthName = (monthIndex) => {
  const months = ['Jan', 'Feb', 'March', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex % 12] || 'Unknown';
};

// Helper function to calculate days in month
const daysInMonth = (month, year) => {
  return new Date(year, month + 1, 0).getDate();
};

export default salesRepDashboardClient;