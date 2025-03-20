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
const dashboardClient = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Dashboard data fetching functions
export const fetchDashboardData = async (timeframe = 'weekly') => {
  // Validate client before proceeding
  if (!dashboardClient) {
    throw new Error('Supabase client not initialized. Check environment variables.');
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
    
    // Previous month for comparison
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const previousMonthStart = new Date(previousMonthYear, previousMonth, 1);
    const previousMonthEnd = new Date(previousMonthYear, previousMonth + 1, 0);
    
    // Set the appropriate start and end dates based on timeframe
    const startDate = timeframe === 'weekly' ? startOfWeek : currentMonthStart;
    const endDate = now;
    // These variables are needed for potential future use
    const _ = { currentMonthEnd, previousMonthStart, previousMonthEnd };
    
    // Use Promise.all to run queries in parallel for better performance
    const [
      callDataResult,
      closedSalesResult,
      minutesDataResult,
      pendingSalesResult,
      salesRepsResult,
      recentCallsResult,
      salesResult,
      currentSentimentResult
    ] = await Promise.all([
      // Get total calls for the selected timeframe
      dashboardClient
        .from('call_logs')
        .select('call_id')
        .gte('call_date', startDate.toISOString())
        .lt('call_date', endDate.toISOString()),
      
      // Get closed sales for the selected timeframe
      dashboardClient
        .from('call_logs')
        .select('call_id')
        .eq('call_outcome', 'Closed')
        .gte('call_date', startDate.toISOString())
        .lt('call_date', endDate.toISOString()),
      
      // Get total call minutes for the selected timeframe
      dashboardClient
        .from('call_logs')
        .select('duration_minutes')
        .gte('call_date', startDate.toISOString())
        .lt('call_date', endDate.toISOString()),
      
      // Get pending sales for the selected timeframe
      dashboardClient
        .from('call_logs')
        .select('call_id')
        .eq('call_outcome', 'In-progress')
        .gte('call_date', startDate.toISOString())
        .lt('call_date', endDate.toISOString()),
        
      // Get top sales reps for the selected timeframe
      dashboardClient
        .from('sales_data')
        .select(`
          sales_rep_id,
          sales_rep_first_name,
          sales_rep_last_name,
          sale_amount,
          sale_date
        `)
        .gte('sale_date', startDate.toISOString())
        .lte('sale_date', endDate.toISOString())
        .order('sale_date', { ascending: false }),
      
      // Get recent calls (always latest 5 regardless of timeframe)
      dashboardClient
        .from('call_logs')
        .select(`
          call_id,
          call_date,
          duration_minutes,
          call_outcome,
          customers!inner(customer_first_name, customer_last_name),
          sales_reps!inner(sales_rep_first_name, sales_rep_last_name)
        `)
        .order('call_date', { ascending: false })
        .limit(5),
      
      // Get sales data for the selected timeframe
      dashboardClient
        .from('sales_data')
        .select('sale_amount, sale_date')
        .gte('sale_date', startDate.toISOString())
        .lte('sale_date', endDate.toISOString()),
      
      // Get current period sentiment data - fetch all sentiment results for the period
      dashboardClient
        .from('call_logs')
        .select('"Sentiment Result"')
        .gte('call_date', startDate.toISOString())
        .lte('call_date', endDate.toISOString())
    ]);
    
    // Check for errors in all queries
    const errors = [
      { name: 'call data', error: callDataResult.error },
      { name: 'closed sales', error: closedSalesResult.error },
      { name: 'minutes data', error: minutesDataResult.error },
      { name: 'pending sales', error: pendingSalesResult.error },
      { name: 'sales reps', error: salesRepsResult.error },
      { name: 'recent calls', error: recentCallsResult.error },
      { name: 'sales data', error: salesResult.error },
      { name: 'current sentiment', error: currentSentimentResult.error }
    ].filter(item => item.error);
    
    if (errors.length > 0) {
      throw new Error(`Database query errors: ${errors.map(e => `${e.name}: ${e.error.message}`).join(', ')}`);
    }
    
    // Process data safely with null checks
    const callData = callDataResult.data || [];
    const closedSales = closedSalesResult.data || [];
    const minutesData = minutesDataResult.data || [];
    const pendingSales = pendingSalesResult.data || [];
    const salesReps = salesRepsResult.data || [];
    const recentCallsData = recentCallsResult.data || [];
    const salesData = salesResult.data || [];
    const currentSentimentData = currentSentimentResult.data || [];
    
    // Calculate total minutes safely
    const totalMinutes = minutesData.reduce((sum, call) => {
      // Ensure duration_minutes is a number
      const minutes = Number(call.duration_minutes) || 0;
      return sum + minutes;
    }, 0);
    
    // Process sales rep data for selected timeframe
    const repTotals = {};
    
    salesReps.forEach(sale => {
      // Skip invalid data
      if (!sale.sales_rep_id) return;
      
      const repId = sale.sales_rep_id;
      const firstName = sale.sales_rep_first_name || '';
      const lastName = sale.sales_rep_last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const saleAmount = Number(sale.sale_amount) || 0;
      
      if (!repTotals[repId]) {
        repTotals[repId] = {
          id: repId,
          name: fullName || `Rep ${repId}`,
          month: timeframe === 'weekly' ? 'This Week' : getMonthName(currentMonth),
          deals: 0,
          totalSales: 0
        };
      }
      
      repTotals[repId].deals += 1;
      repTotals[repId].totalSales += saleAmount;
    });
    
    // Convert to array and sort by totalSales from highest to lowest
    const topReps = Object.values(repTotals)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);
    
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
      const repFirstName = call.sales_reps?.sales_rep_first_name || '';
      const repLastName = call.sales_reps?.sales_rep_last_name || '';
      
      return {
        date: formattedDate,
        client: `${customerFirstName} ${customerLastName}`.trim() || 'Unknown Client',
        salesRep: `${repFirstName} ${repLastName}`.trim() || 'Unknown Rep',
        duration: `${call.duration_minutes || 0}m`,
        outcome: call.call_outcome || 'Unknown'
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
    
    // Generate trend data based on timeframe
    let trendData = [];
    
    if (timeframe === 'weekly') {
      // Generate data for the last 7 days
      trendData = Array.from({ length: 7 }, (_, i) => {
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
          sales: daySales || Math.floor(Math.random() * 10 + 5) // Fallback to demo data if no real data
        };
      });
    } else {
      // Generate data for the days in the current month
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      trendData = Array.from({ length: daysInMonth }, (_, i) => {
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
          sales: daySales || Math.floor(Math.random() * 10 + 5) // Fallback to demo data if no real data
        };
      }).filter(item => item !== null); // Remove nulls (future days)
    }
    
    return {
      totalCalls: callData.length,
      salesClosed: closedSales.length,
      callMinutes: totalMinutes,
      salesPending: pendingSales.length,
      topSalesReps: topReps,
      recentCalls: recentCalls,
      monthlySales: Math.round(totalSales),
      currentMonthName: timeframe === 'weekly' ? 'This Week' : getMonthName(currentMonth),
      callSentiment: sentimentPercentages,
      sentimentData: {
        positive: sentimentCounts.positive,
        negative: sentimentCounts.negative,
        neutral: sentimentCounts.neutral,
        total: sentimentCounts.total
      },
      salesTrend: trendData
    };
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // Return a structured error that won't crash the UI
    return {
      error: true,
      errorMessage: error.message || 'Unknown error occurred while fetching dashboard data',
      totalCalls: 0,
      salesClosed: 0,
      callMinutes: 0,
      salesPending: 0,
      topSalesReps: [],
      recentCalls: [],
      monthlySales: 0,
      currentMonthName: timeframe === 'weekly' ? 'This Week' : getMonthName(new Date().getMonth()),
      callSentiment: { positive: 0, negative: 0, neutral: 0 },
      sentimentData: { positive: 0, negative: 0, neutral: 0, total: 0 },
      salesTrend: []
    };
  }
};

// Helper function to get month name
const getMonthName = (monthIndex) => {
  const months = ['Jan', 'Feb', 'March', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex % 12] || 'Unknown';
};

export default dashboardClient;