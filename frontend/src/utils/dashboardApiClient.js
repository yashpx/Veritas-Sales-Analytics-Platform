import { createClient } from '@supabase/supabase-js';
import supabase from './supabaseClient';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
}

// Create a separate client for dashboard-related operations
const dashboardClient = createClient(supabaseUrl, supabaseAnonKey);

// Get the user's organization ID from userProfile
const getOrganizationId = () => {
  const userProfileStr = localStorage.getItem('userProfile');
  if (!userProfileStr) return null;
  
  try {
    const userProfile = JSON.parse(userProfileStr);
    return userProfile.organization_id;
  } catch (e) {
    console.error('Error parsing user profile:', e);
    return null;
  }
};

// Dashboard data fetching functions
export const fetchDashboardData = async (organizationId = getOrganizationId()) => {
  if (!organizationId) {
    console.error('No organization ID available');
    return defaultDashboardData();
  }
  
  try {
    // Get total calls (last 7 days)
    const year = new Date().getFullYear();
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const endOfWeek = new Date();

    const { data: callData, error: callError } = await dashboardClient
      .from('call_logs')
      .select('call_id')
      .eq('organization_id', organizationId)
      .gte('call_date', startOfWeek.toISOString())
      .lt('call_date', endOfWeek.toISOString());
    
    if (callError) throw callError;
    
    // Get closed sales
    const { data: closedSales, error: salesError } = await dashboardClient
      .from('call_logs')
      .select('call_id')
      .eq('organization_id', organizationId)
      .eq('call_outcome', 'Closed');
    
    if (salesError) throw salesError;
    
    // Get total call minutes
    const { data: minutesData, error: minutesError } = await dashboardClient
      .from('call_logs')
      .select('duration_minutes')
      .eq('organization_id', organizationId)
      .gte('call_date', startOfWeek.toISOString())
      .lt('call_date', endOfWeek.toISOString());
    
    if (minutesError) throw minutesError;
    
    const totalMinutes = minutesData.reduce((sum, call) => sum + call.duration_minutes, 0);
    
    // Get pending sales (in-progress calls)
    const { data: pendingSales, error: pendingError } = await dashboardClient
      .from('call_logs')
      .select('call_id')
      .eq('organization_id', organizationId)
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
      .eq('organization_id', organizationId)
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
      .eq('organization_id', organizationId)
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
      .eq('organization_id', organizationId)
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
    return defaultDashboardData();
  }
};

// Function to get all call logs for the organization
export async function getCallLogs(organizationId = getOrganizationId()) {
  if (!organizationId) return [];
  
  try {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('call_start_time', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching call logs:', error);
    return [];
  }
}

// Function to get all sales representatives for the organization
export async function getSalesReps(organizationId = getOrganizationId()) {
  if (!organizationId) return [];
  
  try {
    const { data, error } = await supabase
      .from('sales_reps')
      .select('*')
      .eq('organization_id', organizationId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching sales reps:', error);
    return [];
  }
}

// Function to get all customers for the organization
export async function getCustomers(organizationId = getOrganizationId()) {
  if (!organizationId) return [];
  
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('organization_id', organizationId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}

// Function to get call transcription by call ID
export async function getCallTranscription(callId, organizationId = getOrganizationId()) {
  if (!organizationId) return null;
  
  try {
    const { data, error } = await supabase
      .from('call_transcription')
      .select('*')
      .eq('call_id', callId)
      .eq('organization_id', organizationId)
      .single();
      
    if (error) {
      // If not found, return null without throwing
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching transcription for call ${callId}:`, error);
    return null;
  }
}

// Function to get sales data for dashboard
export async function getSalesData(organizationId = getOrganizationId()) {
  if (!organizationId) return [];
  
  try {
    const { data, error } = await supabase
      .from('sales_data')
      .select(`
        *,
        sales_reps (sales_rep_first_name, sales_rep_last_name),
        customers (customer_first_name, customer_last_name, "Company")
      `)
      .eq('organization_id', organizationId)
      .order('sale_date', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return [];
  }
}

// Function to get KPI targets for sales reps
export async function getSalesKPITargets(organizationId = getOrganizationId()) {
  if (!organizationId) return [];
  
  try {
    const { data, error } = await supabase
      .from('sales_kpi')
      .select(`
        *,
        sales_reps (sales_rep_first_name, sales_rep_last_name)
      `)
      .eq('organization_id', organizationId)
      .order('month', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching KPI targets:', error);
    return [];
  }
}

// Function to create a new call log
export async function createCallLog(callData, organizationId = getOrganizationId()) {
  if (!organizationId) throw new Error('Organization ID is required');
  
  try {
    const { data, error } = await supabase
      .from('call_logs')
      .insert([{
        ...callData,
        organization_id: organizationId
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating call log:', error);
    throw error;
  }
}

// Function to save call transcription
export async function saveCallTranscription(callId, transcriptionData, organizationId = getOrganizationId()) {
  if (!organizationId) throw new Error('Organization ID is required');
  
  try {
    const { data, error } = await supabase
      .from('call_transcription')
      .insert([{
        call_id: callId,
        organization_id: organizationId,
        call_transcription: transcriptionData
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving call transcription:', error);
    throw error;
  }
}

// Function to create a new product
export async function createProduct(productData, organizationId = getOrganizationId()) {
  if (!organizationId) throw new Error('Organization ID is required');
  
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...productData,
        organization_id: organizationId
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// Get all products for an organization
export async function getProducts(organizationId = getOrganizationId()) {
  if (!organizationId) return [];
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', organizationId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// Helper function to get month name
const getMonthName = (monthIndex) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex];
};

// Default empty dashboard data when organization is not available
const defaultDashboardData = () => ({
  totalCalls: 0,
  salesClosed: 0,
  callMinutes: 0,
  salesPending: 0,
  topSalesReps: [],
  recentCalls: [],
  monthlySales: 0,
  callSentiment: { positive: 0, negative: 0, neutral: 0 },
  salesTrend: []
});

export default dashboardClient;