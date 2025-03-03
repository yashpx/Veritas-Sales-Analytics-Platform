CREATE DATABASE kpi;
\c kpi;

CREATE TABLE top_selling_products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(100),
    month VARCHAR(20),
    total_units_sold INT,
    avg_price_per_unit DECIMAL(10,2),
    total_revenue DECIMAL(15,2),
    churn_rate DECIMAL(5,2),
    rating DECIMAL(3,2),
    customer_feedback_count INT,
    subscription_type VARCHAR(50),
    retention_rate DECIMAL(5,2)
);

INSERT INTO top_selling_products 
(product_name, month, total_units_sold, avg_price_per_unit, total_revenue, churn_rate, rating, customer_feedback_count, subscription_type, retention_rate)
VALUES 
('SaaS CRM', 'January', 120, 49.99, 5998.80, 5.2, 4.7, 150, 'Pro', 85.3),
('SaaS CRM', 'February', 135, 49.99, 6748.65, 4.8, 4.8, 160, 'Pro', 87.1),
('Email Automation', 'January', 100, 39.99, 3999.00, 6.0, 4.6, 120, 'Basic', 80.5),
('Email Automation', 'February', 90, 39.99, 3599.10, 6.2, 4.5, 110, 'Basic', 78.9),
('Marketing Suite', 'January', 80, 59.99, 4799.20, 4.5, 4.4, 100, 'Enterprise', 90.2),
('Marketing Suite', 'February', 85, 59.99, 5099.15, 4.2, 4.5, 105, 'Enterprise', 91.0),
('AI Analytics', 'January', 60, 89.99, 5399.40, 3.8, 4.9, 80, 'Pro', 92.5),
('AI Analytics', 'February', 75, 89.99, 6749.25, 3.5, 4.8, 95, 'Pro', 93.4),
('Cloud Storage', 'January', 50, 19.99, 999.50, 7.1, 4.2, 60, 'Basic', 75.0),
('Cloud Storage', 'February', 55, 19.99, 1099.45, 6.9, 4.3, 65, 'Basic', 77.2),
('Cybersecurity Suite', 'January', 100, 99.99, 9999.00, 3.5, 4.8, 90, 'Enterprise', 95.0),
('Cybersecurity Suite', 'February', 120, 99.99, 11998.80, 3.2, 4.9, 100, 'Enterprise', 96.3),
('Collaboration Tool', 'January', 130, 29.99, 3898.70, 5.5, 4.6, 130, 'Pro', 84.2),
('Collaboration Tool', 'February', 140, 29.99, 4198.60, 5.1, 4.7, 140, 'Pro', 85.5),
('Cloud Security', 'January', 95, 79.99, 7599.05, 4.3, 4.7, 85, 'Enterprise', 91.2),
('Cloud Security', 'February', 100, 79.99, 7999.00, 4.0, 4.8, 90, 'Enterprise', 92.0),
('Workflow Automation', 'January', 110, 69.99, 7698.90, 4.8, 4.6, 100, 'Enterprise', 89.5),
('Workflow Automation', 'February', 125, 69.99, 8748.75, 4.4, 4.7, 110, 'Enterprise', 90.8);


CREATE TABLE leaderboard (
    sales_rep_id SERIAL PRIMARY KEY,
    sales_rep_name VARCHAR(100),
    month VARCHAR(20),
    total_calls INT,
    successful_calls INT,
    revenue_generated DECIMAL(15,2),
    avg_call_duration INT, 
    customer_satisfaction DECIMAL(3,2),
    new_customers_acquired INT,
    conversion_rate DECIMAL(5,2),
    upsell_success_rate DECIMAL(5,2)
);

INSERT INTO leaderboard 
(sales_rep_name, month, total_calls, successful_calls, revenue_generated, avg_call_duration, customer_satisfaction, new_customers_acquired, conversion_rate, upsell_success_rate)
VALUES 
('Alice Johnson', 'January', 200, 60, 12000.50, 8, 4.6, 15, 30.0, 12.5),
('Alice Johnson', 'February', 180, 55, 11050.75, 7, 4.5, 14, 30.6, 11.8),
('Bob Smith', 'January', 150, 40, 8500.00, 9, 4.3, 10, 26.7, 10.0),
('Bob Smith', 'February', 140, 38, 8200.25, 8, 4.2, 9, 27.1, 9.5),
('Charlie Brown', 'January', 180, 50, 9500.30, 10, 4.4, 12, 27.8, 10.2),
('Charlie Brown', 'February', 190, 60, 11200.40, 9, 4.6, 14, 31.6, 12.0),
('David Lee', 'January', 170, 48, 9100.50, 7, 4.3, 13, 28.2, 10.5),
('David Lee', 'February', 160, 45, 8700.25, 8, 4.2, 12, 28.1, 9.8),
('Sophia Martinez', 'January', 210, 70, 13000.00, 9, 4.7, 18, 33.3, 13.0),
('Sophia Martinez', 'February', 220, 75, 14000.50, 10, 4.8, 20, 34.1, 14.5);


-- KPI QUERIES FOR TOP SELLING PRODUCTS
-- 1. Total Revenue (Sum of revenue across all products)
SELECT SUM(total_revenue) AS total_revenue
FROM top_selling_products;

-- 2. Monthly Revenue Growth (Percentage change from previous month)
SELECT 
    month, 
    SUM(total_revenue) AS monthly_revenue, 
    LAG(SUM(total_revenue)) OVER (ORDER BY month) AS previous_month_revenue,
    ROUND(
        ((SUM(total_revenue) - LAG(SUM(total_revenue)) OVER (ORDER BY month)) / 
        NULLIF(LAG(SUM(total_revenue)) OVER (ORDER BY month), 0)) * 100, 2
    ) AS revenue_growth_percentage
FROM top_selling_products
GROUP BY month
ORDER BY month;

-- 3. Churn Rate (Percentage of customers canceling subscriptions)
SELECT month, 
       AVG(churn_rate) AS avg_churn_rate
FROM top_selling_products
GROUP BY month
ORDER BY month;

-- 4. Customer Satisfaction (Average Rating Score)
SELECT 
    ROUND(AVG(rating), 2) AS avg_customer_rating
FROM top_selling_products;

-- 5. Top 5 Best-Selling Products (By Revenue)
SELECT product_name, SUM(total_revenue) AS total_revenue
FROM top_selling_products
GROUP BY product_name
ORDER BY total_revenue DESC
LIMIT 5;

-- 6. Revenue Contribution by Product (% of Total Revenue)
SELECT 
    product_name, 
    SUM(total_revenue) AS product_revenue,
    ROUND((SUM(total_revenue) / (SELECT SUM(total_revenue) FROM top_selling_products)) * 100, 2) AS revenue_percentage
FROM top_selling_products
GROUP BY product_name
ORDER BY revenue_percentage DESC;


-- KPI QUERIES FOR LEADERBOARD
-- 1. Total Revenue per Sales Rep
SELECT sales_rep_name, SUM(revenue_generated) AS total_revenue
FROM leaderboard
GROUP BY sales_rep_name
ORDER BY total_revenue DESC;

-- 2. Success Rate (%) - (Successful Calls / Total Calls) * 100
SELECT 
    sales_rep_name, 
    ROUND((SUM(successful_calls) * 100.0 / NULLIF(SUM(total_calls), 0)), 2) AS success_rate
FROM leaderboard
GROUP BY sales_rep_name
ORDER BY success_rate DESC;

-- 3. Revenue per Call (Total revenue divided by total calls)
SELECT 
    sales_rep_name, 
    ROUND(SUM(revenue_generated) / NULLIF(SUM(total_calls), 0), 2) AS revenue_per_call
FROM leaderboard
GROUP BY sales_rep_name
ORDER BY revenue_per_call DESC;

-- 4. Customer Satisfaction by Sales Rep (Average satisfaction score)
SELECT 
    sales_rep_name, 
    ROUND(AVG(customer_satisfaction), 2) AS avg_satisfaction_score
FROM leaderboard
GROUP BY sales_rep_name
ORDER BY avg_satisfaction_score DESC;

-- 5. Monthly Sales Revenue Trend (Revenue per month)
SELECT month, SUM(revenue_generated) AS total_revenue
FROM leaderboard
GROUP BY month
ORDER BY month;

-- 6. Call Effectiveness Score (Revenue per Call * Satisfaction Score)
SELECT 
    sales_rep_name, 
    ROUND((SUM(revenue_generated) / NULLIF(SUM(total_calls), 0)) * AVG(customer_satisfaction), 2) AS call_effectiveness_score
FROM leaderboard
GROUP BY sales_rep_name
ORDER BY call_effectiveness_score DESC;
