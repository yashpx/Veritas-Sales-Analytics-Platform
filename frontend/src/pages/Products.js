import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import supabase from '../utils/supabaseClient';
import '../styles/products.css';

const Products = () => {
  const { user, authType } = useAuth();
  const [products, setProducts] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [salesRepProducts, setSalesRepProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('monthly');
  const [showSidebar, setShowSidebar] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_name: '',
    subscription_type: 'Standard',
    avg_price_per_unit: ''
  });
  const [successMessage, setSuccessMessage] = useState('');

  const isSalesRep = authType === 'sales_rep';

  // Fetch products data
  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        setLoading(true);
        
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('product_id', { ascending: true });
        
        if (productsError) throw productsError;
        
        // Fetch top selling products
        const { data: topData, error: topError } = await supabase
          .from('top_selling_products')
          .select('*')
          .order('total_units_sold', { ascending: false });
          
        if (topError) throw topError;
        
        // Fetch sales data
        const { data: salesDataRes, error: salesError } = await supabase
          .from('sales_data')
          .select('*');
          
        if (salesError) throw salesError;
        
        // If user is a sales rep, fetch their specific sales data
        if (isSalesRep && user?.salesRepId) {
          const { data: repSales, error: repError } = await supabase
            .from('sales_data')
            .select('*')
            .eq('sales_rep_id', user.salesRepId);
            
          if (repError) throw repError;
          
          // Process data to get products sold by this sales rep
          const repProductsMap = {};
          
          repSales.forEach(sale => {
            if (!repProductsMap[sale.product_id]) {
              repProductsMap[sale.product_id] = {
                product_id: sale.product_id,
                product_name: sale.product_name,
                total_quantity: 0,
                total_revenue: 0,
                sales_count: 0
              };
            }
            
            repProductsMap[sale.product_id].total_quantity += sale.quantity_sold;
            repProductsMap[sale.product_id].total_revenue += parseFloat(sale.sale_amount);
            repProductsMap[sale.product_id].sales_count += 1;
          });
          
          setSalesRepProducts(Object.values(repProductsMap)
            .sort((a, b) => b.total_revenue - a.total_revenue));
        }
        
        // Set state with the fetched data
        setProducts(productsData);
        setTopSellingProducts(topData);
        setSalesData(salesDataRes);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products data:', err);
        setError('Failed to load products data');
        setLoading(false);
      }
    };

    if (user) {
      fetchProductsData();
    }
  }, [user, isSalesRep, user?.salesRepId]);

  // Process sales data to generate chart data
  const generateChartData = () => {
    const productSales = {};
    
    salesData.forEach(sale => {
      if (!productSales[sale.product_id]) {
        productSales[sale.product_id] = {
          product_id: sale.product_id,
          product_name: sale.product_name,
          total_quantity: 0,
          total_revenue: 0
        };
      }
      
      productSales[sale.product_id].total_quantity += sale.quantity_sold;
      productSales[sale.product_id].total_revenue += parseFloat(sale.sale_amount);
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 5); // Top 5 products by revenue
  };

  // Get sales trend data for a specific product
  const getProductSalesTrend = (productId) => {
    // Filter sales for the selected product
    const productSales = salesData.filter(sale => sale.product_id === productId);
    
    // Group sales by month
    const salesByMonth = {};
    
    productSales.forEach(sale => {
      const date = new Date(sale.sale_date);
      const month = date.toLocaleString('default', { month: 'short' });
      
      if (!salesByMonth[month]) {
        salesByMonth[month] = {
          month,
          sales: 0,
          quantity: 0
        };
      }
      
      salesByMonth[month].sales += parseFloat(sale.sale_amount);
      salesByMonth[month].quantity += sale.quantity_sold;
    });
    
    // Convert to array and sort by month
    return Object.values(salesByMonth);
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Handle view product details
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowSidebar(true);
  };

  // Close sidebar
  const handleCloseSidebar = () => {
    setShowSidebar(false);
    setSelectedProduct(null);
    setIsAddingProduct(false);
    setNewProduct({
      product_name: '',
      subscription_type: 'Standard',
      avg_price_per_unit: ''
    });
  };
  
  // Show success message for a few seconds
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  // Handle adding a new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (!newProduct.product_name || !newProduct.avg_price_per_unit) {
        alert('Please fill in all required fields');
        return;
      }
      
      // Validate price format
      const price = parseFloat(newProduct.avg_price_per_unit);
      if (isNaN(price) || price <= 0) {
        alert('Please enter a valid price');
        return;
      }
      
      const { data, error } = await supabase
        .from('products')
        .insert({
          product_name: newProduct.product_name,
          subscription_type: newProduct.subscription_type,
          avg_price_per_unit: price
        })
        .select();
      
      if (error) throw error;
      
      // Close form and reset
      setIsAddingProduct(false);
      setNewProduct({
        product_name: '',
        subscription_type: 'Standard',
        avg_price_per_unit: ''
      });
      
      // Fetch updated products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('product_id', { ascending: true });
      
      if (productsError) throw productsError;
      
      setProducts(productsData);
      showSuccessMessage('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      alert(`Failed to add product: ${error.message}`);
    }
  };
  
  // Handle input change for new product form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle delete product
  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      // Check if product has associated sales data
      const { data: salesData, error: salesError } = await supabase
        .from('sales_data')
        .select('sale_id')
        .eq('product_id', id)
        .limit(1);

      if (salesError) throw salesError;

      // If sales data exists, ask user if they want to proceed
      if (salesData && salesData.length > 0) {
        const confirmDelete = window.confirm(
          'This product has associated sales data. Deleting will not remove the sales records. Do you want to proceed?'
        );
        if (!confirmDelete) return;
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('product_id', id);

      if (error) {
        throw error;
      }

      // Close sidebar if the deleted product was selected
      if (selectedProduct && selectedProduct.product_id === id) {
        setShowSidebar(false);
        setSelectedProduct(null);
      }

      // Fetch updated products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('product_id', { ascending: true });
      
      if (productsError) throw productsError;
      
      setProducts(productsData);
      showSuccessMessage('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(`Failed to delete product: ${error.message}`);
    }
  };

  // Calculate product performance metrics
  const getProductPerformance = (product) => {
    const productSales = salesData.filter(sale => sale.product_id === product.product_id);
    
    if (productSales.length === 0) {
      return {
        totalRevenue: 0,
        totalQuantity: 0,
        avgSaleValue: 0,
        salesCount: 0
      };
    }
    
    const totalRevenue = productSales.reduce((sum, sale) => sum + parseFloat(sale.sale_amount), 0);
    const totalQuantity = productSales.reduce((sum, sale) => sum + sale.quantity_sold, 0);
    
    return {
      totalRevenue,
      totalQuantity,
      avgSaleValue: totalRevenue / totalQuantity,
      salesCount: productSales.length
    };
  };

  // Generate the colors for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="products-loading">
          <h2>Loading products data...</h2>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="products-error">
          <h2>Error: {error}</h2>
          <p>Please try refreshing the page.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Transform data for the top products chart
  const topProductsChartData = topSellingProducts
    .slice(0, 5)
    .map(product => ({
      name: product.product_name,
      value: product.total_units_sold
    }));

  // Get chart data for revenue by product
  const revenueByProductData = generateChartData();

  // Get the product sales trend data if a product is selected
  const selectedProductTrendData = selectedProduct 
    ? getProductSalesTrend(selectedProduct.product_id)
    : [];

  return (
    <DashboardLayout>
      <div className={`products-container ${showSidebar ? 'with-sidebar' : ''}`}>
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}
        <div className="products-header">
          <h1>Products</h1>
          <div className="header-actions">
            <div className="timeframe-filter">
              <button 
                className={`filter-btn ${timeframe === 'weekly' ? 'active' : ''}`}
                onClick={() => setTimeframe('weekly')}
              >
                Weekly
              </button>
              <button 
                className={`filter-btn ${timeframe === 'monthly' ? 'active' : ''}`}
                onClick={() => setTimeframe('monthly')}
              >
                Monthly
              </button>
            </div>
            {!isSalesRep && (
              <button 
                className="add-product-btn"
                onClick={() => {
                  setIsAddingProduct(true);
                  setShowSidebar(true);
                  setSelectedProduct(null);
                }}
              >
                Add Product
              </button>
            )}
          </div>
        </div>

        {isSalesRep && salesRepProducts.length > 0 && (
          <div className="sales-rep-products">
            <h2>Your Products Performance</h2>
            <div className="rep-products-grid">
              {salesRepProducts.slice(0, 4).map(product => (
                <div 
                  key={product.product_id} 
                  className="rep-product-card"
                  onClick={() => handleViewProduct(
                    products.find(p => p.product_id === product.product_id)
                  )}
                >
                  <div className="rep-product-header">
                    <h3>{product.product_name}</h3>
                    <span className="product-type">
                      {products.find(p => p.product_id === product.product_id)?.subscription_type || 'Standard'}
                    </span>
                  </div>
                  <div className="rep-product-stats">
                    <div className="stat">
                      <span className="stat-value">{product.sales_count}</span>
                      <span className="stat-label">Sales</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{product.total_quantity}</span>
                      <span className="stat-label">Units</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{formatCurrency(product.total_revenue)}</span>
                      <span className="stat-label">Revenue</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="products-main">
          <div className="left-column">
            <div className="products-list-section">
              <div className="section-header">
                <h2>Products</h2>
              </div>
              <div className="products-table-container">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th className="id-column">ID</th>
                      <th className="name-column">Name</th>
                      <th className="type-column">Type</th>
                      <th className="price-column">Price</th>
                      <th className="actions-column"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length > 0 ? (
                      products.map(product => (
                        <tr 
                          key={product.product_id}
                          className={selectedProduct?.product_id === product.product_id ? 'selected-row' : ''}
                        >
                          <td className="id-column">{product.product_id}</td>
                          <td className="name-column">{product.product_name}</td>
                          <td className="type-column">
                            <span className={`type-badge ${product.subscription_type?.toLowerCase() || 'standard'}`}>
                              {product.subscription_type || 'Standard'}
                            </span>
                          </td>
                          <td className="price-column">{formatCurrency(product.avg_price_per_unit)}</td>
                          <td className="actions-column">
                            <button 
                              className="view-btn"
                              onClick={() => handleViewProduct(product)}
                            >
                              View
                            </button>
                            {!isSalesRep && (
                              <button 
                                className="delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteProduct(product.product_id);
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center' }}>No products available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="product-sales-section">
              <h2>Top Products by Revenue</h2>
              <div className="product-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={revenueByProductData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product_name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="total_revenue" fill="#8884d8" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="right-column">
            <div className="top-selling-section">
              <h2>Top Selling Products</h2>
              <div className="pie-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topProductsChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {topProductsChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [value, props.payload.name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="top-products-grid">
                {topSellingProducts.slice(0, 4).map((product, index) => (
                  <div key={product.product_id} className="top-product-card">
                    <div className="top-product-rank">#{index + 1}</div>
                    <div className="top-product-info">
                      <h3>{product.product_name}</h3>
                      <div className="top-product-stats">
                        <div className="stat">
                          <span className="stat-label">Units Sold:</span>
                          <span className="stat-value">{product.total_units_sold}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Revenue:</span>
                          <span className="stat-value">{formatCurrency(product.total_revenue)}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Rating:</span>
                          <span className="stat-value">{product.rating}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Detail Sidebar */}
        <div className={`product-detail-sidebar ${showSidebar ? 'show' : ''}`}>
          {isAddingProduct ? (
            <>
              <div className="sidebar-header">
                <h3>Add New Product</h3>
                <button className="close-sidebar" onClick={handleCloseSidebar}>×</button>
              </div>
              
              <div className="product-detail-content">
                <form className="add-product-form" onSubmit={handleAddProduct}>
                  <div className="form-group">
                    <label htmlFor="product_name">Product Name*</label>
                    <input
                      type="text"
                      id="product_name"
                      name="product_name"
                      value={newProduct.product_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="subscription_type">Subscription Type</label>
                    <select
                      id="subscription_type"
                      name="subscription_type"
                      value={newProduct.subscription_type}
                      onChange={handleInputChange}
                    >
                      <option value="Standard">Standard</option>
                      <option value="Premium">Premium</option>
                      <option value="Enterprise">Enterprise</option>
                      <option value="Basic">Basic</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="avg_price_per_unit">Price Per Unit ($)*</label>
                    <input
                      type="number"
                      id="avg_price_per_unit"
                      name="avg_price_per_unit"
                      value={newProduct.avg_price_per_unit}
                      onChange={handleInputChange}
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="submit-btn">Add Product</button>
                    <button type="button" className="cancel-btn" onClick={handleCloseSidebar}>Cancel</button>
                  </div>
                </form>
              </div>
            </>
          ) : selectedProduct && (
            <>
              <div className="sidebar-header">
                <h3>Product Details</h3>
                <button className="close-sidebar" onClick={handleCloseSidebar}>×</button>
              </div>
              
              <div className="product-detail-content">
                <div className="product-detail-header">
                  <h2>{selectedProduct.product_name}</h2>
                  <span className={`type-badge large ${selectedProduct.subscription_type?.toLowerCase() || 'standard'}`}>
                    {selectedProduct.subscription_type || 'Standard'}
                  </span>
                </div>
                
                <div className="product-price">
                  <span className="price-label">Price per unit:</span>
                  <span className="price-value">{formatCurrency(selectedProduct.avg_price_per_unit)}</span>
                </div>
                
                <div className="product-performance">
                  <h3>Performance Metrics</h3>
                  
                  {(() => {
                    const metrics = getProductPerformance(selectedProduct);
                    return (
                      <div className="metrics-grid">
                        <div className="metric-card">
                          <span className="metric-value">{formatCurrency(metrics.totalRevenue)}</span>
                          <span className="metric-label">Total Revenue</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-value">{metrics.totalQuantity}</span>
                          <span className="metric-label">Units Sold</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-value">{metrics.salesCount}</span>
                          <span className="metric-label">Sales Count</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-value">{formatCurrency(metrics.avgSaleValue)}</span>
                          <span className="metric-label">Avg. Value</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                <div className="product-trend">
                  <h3>Sales Trend</h3>
                  {selectedProductTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={selectedProductTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#8884d8" name="Revenue" />
                        <Line yAxisId="right" type="monotone" dataKey="quantity" stroke="#82ca9d" name="Units Sold" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">No sales data available for this product</div>
                  )}
                </div>
                
                {isSalesRep && (
                  <div className="sales-rep-product-stats">
                    <h3>Your Performance</h3>
                    {(() => {
                      const repProduct = salesRepProducts.find(p => p.product_id === selectedProduct.product_id);
                      
                      if (!repProduct) {
                        return <div className="no-data-message">You haven't sold this product yet</div>;
                      }
                      
                      return (
                        <div className="metrics-grid">
                          <div className="metric-card highlight">
                            <span className="metric-value">{formatCurrency(repProduct.total_revenue)}</span>
                            <span className="metric-label">Your Revenue</span>
                          </div>
                          <div className="metric-card highlight">
                            <span className="metric-value">{repProduct.total_quantity}</span>
                            <span className="metric-label">Units Sold</span>
                          </div>
                          <div className="metric-card highlight">
                            <span className="metric-value">{repProduct.sales_count}</span>
                            <span className="metric-label">Sales Count</span>
                          </div>
                          <div className="metric-card highlight">
                            <span className="metric-value">{formatCurrency(repProduct.total_revenue / repProduct.total_quantity)}</span>
                            <span className="metric-label">Avg. Value</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {!isSalesRep && (
                  <div className="action-buttons">
                    <button
                      className="delete-product-btn"
                      onClick={() => deleteProduct(selectedProduct.product_id)}
                    >
                      Delete Product
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Products;