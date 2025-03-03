import psycopg2
import pandas as pd 
import matplotlib.pyplot as plt
import seaborn as sns

conn = psycopg2.connect(
    dbname="kpi",
    user="puriy",
    password="root", 
    host="localhost",
    port="5432"
)

query_products = """
    SELECT product_name, SUM(total_units_sold) AS units_sold, SUM(total_revenue) AS total_revenue, 
           AVG(churn_rate) AS avg_churn_rate, AVG(rating) AS avg_customer_rating, 
           SUM(customer_feedback_count) AS customer_count, SUM(total_revenue) / NULLIF(SUM(total_units_sold), 0) AS revenue_per_unit
    FROM top_selling_products 
    GROUP BY product_name 
    ORDER BY units_sold DESC;
"""

query_leaderboard = """
    SELECT sales_rep_name AS rep_name, SUM(revenue_generated) AS revenue_generated, 
           AVG(conversion_rate) AS conversion_rate, SUM(total_calls) AS calls_made, 
           SUM(successful_calls) AS deals_closed, AVG(customer_satisfaction) AS avg_satisfaction_score,
           SUM(revenue_generated) / NULLIF(SUM(total_calls), 0) AS revenue_per_call
    FROM leaderboard 
    GROUP BY sales_rep_name 
    ORDER BY revenue_generated DESC;
"""

df_products = pd.read_sql(query_products, conn)
df_leaderboard = pd.read_sql(query_leaderboard, conn)

# --- KPI 1: Total Revenue (Sum of revenue across all products) ---
total_revenue = df_products['total_revenue'].sum()
print(f"Total Revenue: ${total_revenue:,.2f}")

# --- KPI 2: Monthly Revenue Growth (Percentage change from previous month) ---
# This query would need to pull month-by-month data and calculate growth over time
query_monthly_revenue = """
    SELECT month, SUM(total_revenue) AS monthly_revenue
    FROM top_selling_products
    GROUP BY month
    ORDER BY month;
"""
df_monthly_revenue = pd.read_sql(query_monthly_revenue, conn)

df_monthly_revenue['previous_month_revenue'] = df_monthly_revenue['monthly_revenue'].shift(1)
df_monthly_revenue['revenue_growth_percentage'] = (df_monthly_revenue['monthly_revenue'] - df_monthly_revenue['previous_month_revenue']) / df_monthly_revenue['previous_month_revenue'] * 100

plt.figure(figsize=(10, 5))
sns.lineplot(x='month', y='revenue_growth_percentage', data=df_monthly_revenue, marker="o", color="b")
plt.xlabel("Month")
plt.ylabel("Revenue Growth (%)")
plt.title("Monthly Revenue Growth")
plt.xticks(rotation=45)
plt.show()

# --- KPI 3: Churn Rate (Average Churn Rate across all products per month) ---
plt.figure(figsize=(10, 5))
sns.lineplot(x="month", y="avg_churn_rate", data=df_products, marker="o", color="r")
plt.xlabel("Month")
plt.ylabel("Churn Rate (%)")
plt.title("Churn Rate Over Time")
plt.xticks(rotation=45)
plt.show()

# --- KPI 4: Customer Satisfaction (Average Rating across all products) ---
avg_customer_rating = df_products['avg_customer_rating'].mean()
print(f"Average Customer Satisfaction Rating: {avg_customer_rating:.2f}")

# --- KPI 5: Top 5 Best-Selling Products (By Revenue) ---
plt.figure(figsize=(10, 5))
sns.barplot(x="total_revenue", y="product_name", data=df_products.head(5), palette="Blues_r")
plt.xlabel("Total Revenue")
plt.ylabel("Product Name")
plt.title("Top 5 Products by Total Revenue")
plt.show()

# --- KPI 6: Revenue Contribution by Product (% of Total Revenue) ---
total_revenue_all_products = df_products['total_revenue'].sum()
df_products['revenue_percentage'] = (df_products['total_revenue'] / total_revenue_all_products) * 100

plt.figure(figsize=(10, 5))
sns.barplot(x="revenue_percentage", y="product_name", data=df_products.head(5), palette="Greens_r")
plt.xlabel("Revenue Percentage (%)")
plt.ylabel("Product Name")
plt.title("Revenue Contribution by Product")
plt.show()


# --- KPI for Sales Rep Performance ---
# KPI 1: Total Revenue per Sales Rep
plt.figure(figsize=(10, 5))
sns.barplot(x="revenue_generated", y="rep_name", data=df_leaderboard.head(5), palette="Oranges_r")
plt.xlabel("Revenue Generated")
plt.ylabel("Sales Rep")
plt.title("Top 5 Sales Reps by Revenue Generated")
plt.show()

# KPI 2: Success Rate (%) - (Successful Calls / Total Calls) * 100
df_leaderboard['success_rate'] = (df_leaderboard['deals_closed'] / df_leaderboard['calls_made']) * 100
plt.figure(figsize=(10, 5))
sns.barplot(x="success_rate", y="rep_name", data=df_leaderboard.head(5), palette="coolwarm")
plt.xlabel("Success Rate (%)")
plt.ylabel("Sales Rep")
plt.title("Top 5 Sales Reps by Success Rate")
plt.show()

# KPI 3: Revenue per Call (Total revenue divided by total calls)
plt.figure(figsize=(10, 5))
sns.barplot(x="revenue_per_call", y="rep_name", data=df_leaderboard.head(5), palette="Blues")
plt.xlabel("Revenue per Call")
plt.ylabel("Sales Rep")
plt.title("Top 5 Sales Reps by Revenue per Call")
plt.show()

# KPI 4: Customer Satisfaction by Sales Rep (Average satisfaction score)
plt.figure(figsize=(10, 5))
sns.barplot(x="avg_satisfaction_score", y="rep_name", data=df_leaderboard.head(5), palette="coolwarm")
plt.xlabel("Average Satisfaction Score")
plt.ylabel("Sales Rep")
plt.title("Top 5 Sales Reps by Satisfaction Score")
plt.show()

# KPI 5: Monthly Sales Revenue Trend (Revenue per month)
plt.figure(figsize=(10, 5))
sns.lineplot(x="month", y="revenue_generated", data=df_leaderboard, marker="o", color="g")
plt.xlabel("Month")
plt.ylabel("Total Revenue")
plt.title("Monthly Sales Revenue Trend")
plt.xticks(rotation=45)
plt.show()

# KPI 6: Call Effectiveness Score (Revenue per Call * Satisfaction Score)
df_leaderboard['call_effectiveness_score'] = df_leaderboard['revenue_per_call'] * df_leaderboard['avg_satisfaction_score']
plt.figure(figsize=(10, 5))
sns.barplot(x="call_effectiveness_score", y="rep_name", data=df_leaderboard.head(5), palette="YlGnBu")
plt.xlabel("Call Effectiveness Score")
plt.ylabel("Sales Rep")
plt.title("Top 5 Sales Reps by Call Effectiveness Score")
plt.show()

conn.close()