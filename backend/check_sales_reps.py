#!/usr/bin/env python3

import sys
import os

# Add the project root directory to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from backend.app.utils.supabase_client import get_supabase_admin
from backend.config.settings import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

def main():
    # Get Supabase admin client
    supabase = get_supabase_admin()
    
    try:
        print("Fetching all sales reps...")
        
        # Get all sales reps
        sales_rep_result = supabase.table("sales_reps").select("*").execute()
        
        if not sales_rep_result.data:
            print("No sales reps found in the database.")
            return
        
        # Print sales rep information
        print("\nSales Reps in the Database:")
        print("=" * 80)
        print(f"{'ID':<5} {'First Name':<15} {'Last Name':<15} {'Email':<30} {'Phone':<15}")
        print("-" * 80)
        
        for rep in sales_rep_result.data:
            print(f"{rep.get('sales_rep_id', ''):<5} {rep.get('sales_rep_first_name', ''):<15} {rep.get('sales_rep_last_name', ''):<15} {rep.get('Email', ''):<30} {rep.get('Phone Number', ''):<15}")
        
        print("\nNow checking user_auth table for existing entries:")
        
        # Check user_auth for sales reps
        user_auth_result = supabase.table("user_auth").select("*").eq("Role", "sales_rep").execute()
        
        if not user_auth_result.data:
            print("No sales rep entries found in user_auth table.")
        else:
            print("\nSales Rep Entries in user_auth:")
            print("=" * 80)
            print(f"{'ID':<5} {'Email':<30} {'Full Name':<30} {'Active':<10}")
            print("-" * 80)
            
            for user in user_auth_result.data:
                print(f"{user.get('id', ''):<5} {user.get('email', ''):<30} {user.get('Full Name', ''):<30} {str(user.get('Is active', False)):<10}")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()