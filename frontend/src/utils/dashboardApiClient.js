import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
}

// Create a separate client for dashboard-related operations
const dashboardClient = createClient(supabaseUrl, supabaseAnonKey);

// Dashboard data fetching functions
export const fetchDashboardData = async () => {
  try {
    // Get total calls (last 7 days)
    const year = new Date().getFullYear();
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const endOfWeek = new Date();

    const { data: callData, error: callError } = await dashboardClient
      .from('call_logs')
      .select('call_id')
      .gte('call_date', startOfWeek.toISOString())
      .lt('call_date', endOfWeek.toISOString());
    
    if (callError) throw callError;
    
    // Get closed sales
    const { data: closedSales, error: salesError } = await dashboardClient
      .from('call_logs')
      .select('call_id')
      .eq('call_outcome', 'Closed');
    
    if (salesError) throw salesError;
    
    // Get total call minutes
    const { data: minutesData, error: minutesError } = await dashboardClient
      .from('call_logs')
      .select('duration_minutes')
      .gte('call_date', startOfWeek.toISOString())
      .lt('call_date', endOfWeek.toISOString());
    
    if (minutesError) throw minutesError;
    
    const totalMinutes = minutesData.reduce((sum, call) => sum + call.duration_minutes, 0);
    
    // Get pending sales (in-progress calls)
    const { data: pendingSales, error: pendingError } = await dashboardClient
      .from('call_logs')
      .select('call_id')
      .eq('call_outcome', 'In-progress');
    
    if (pendingError) throw pendingError;
    
    // Get top sales reps
    const { data: salesReps, error: repsError } = await dashboardClient
      .from('sales_data')
      .select(`
        sales_rep_id,
        sales_reps!inner(sales_rep_first_name, sales_rep_last_name),
        sale_amount
      `)
      .order('sale_date', { ascending: false })
      .limit(50);
    
    if (repsError) throw repsError;
    
    // Process sales rep data
    const currentMonth = new Date().getMonth();
    const processedReps = {};
    
    salesReps.forEach(sale => {
      const repId = sale.sales_rep_id;
      const firstName = sale.sales_reps.sales_rep_first_name;
      const lastName = sale.sales_reps.sales_rep_last_name;
      const fullName = `${firstName} ${lastName}`;
      
      if (!processedReps[repId]) {
        processedReps[repId] = {
          id: repId,
          name: fullName,
          month: getMonthName(currentMonth),
          deals: 0,
          totalSales: 0
        };
      }
      
      processedReps[repId].deals += 1;
      processedReps[repId].totalSales += Number(sale.sale_amount);
    });
    
    // Convert to array and sort by sales
    const topReps = Object.values(processedReps)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);
    
    // Get recent calls
    const { data: recentCallsData, error: recentCallsError } = await dashboardClient
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
      .limit(5);
    
    if (recentCallsError) throw recentCallsError;
    
    const recentCalls = recentCallsData.map(call => ({
      date: new Date(call.call_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      client: `${call.customers.customer_first_name} ${call.customers.customer_last_name}`,
      salesRep: `${call.sales_reps.sales_rep_first_name} ${call.sales_reps.sales_rep_last_name}`,
      duration: `${call.duration_minutes}m`,
      outcome: call.call_outcome
    }));
    
    // Get monthly sales
    const currentYear = new Date().getFullYear();
    const currentMonthStart = new Date(currentYear, currentMonth, 1).toISOString();
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0).toISOString();
    
    const { data: monthlySalesData, error: monthlySalesError } = await dashboardClient
      .from('sales_data')
      .select('sale_amount')
      .gte('sale_date', currentMonthStart)
      .lte('sale_date', currentMonthEnd);
    
    if (monthlySalesError) throw monthlySalesError;
    
    const totalMonthlySales = monthlySalesData.reduce((sum, sale) => sum + Number(sale.sale_amount), 0);
    
    // Generate sales trend data (for the line chart)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    const trendData = last7Days.map(day => ({
      day: day.slice(8, 10),
      sales: Math.floor(Math.random() * 10 + 5) // For demo purposes - replace with real data in production
    }));
    
    return {
      totalCalls: callData.length,
      salesClosed: closedSales.length,
      callMinutes: totalMinutes,
      salesPending: pendingSales.length,
      topSalesReps: topReps,
      recentCalls: recentCalls,
      monthlySales: Math.round(totalMonthlySales),
      callSentiment: { positive: 30, negative: 45, neutral: 25 }, // Demo data
      salesTrend: trendData
    };
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

// Helper function to get month name
const getMonthName = (monthIndex) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex];
};

export default dashboardClient;