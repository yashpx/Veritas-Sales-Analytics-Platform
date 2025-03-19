#!/usr/bin/env python3

import sys
import os
import bcrypt

# Add the project root directory to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from backend.app.utils.supabase_client import get_supabase_admin, hash_password
from backend.config.settings import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# Function to hash a password
def hash_password(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def main():
    # Get the sales rep ID from the command line or use default
    if len(sys.argv) > 1:
        sales_rep_id = int(sys.argv[1])
    else:
        # Default to ID 1 if not provided
        sales_rep_id = 2
    
    # Default password to use for the sales rep
    password = "password123"
    
    # Get Supabase admin client
    supabase = get_supabase_admin()
    
    try:
        print(f"Fetching sales rep with ID: {sales_rep_id}")
        
        # Step 1: Get sales rep data
        sales_rep_result = supabase.table("sales_reps").select("*").eq("sales_rep_id", sales_rep_id).execute()
        
        if not sales_rep_result.data:
            print(f"Error: Sales rep with ID {sales_rep_id} not found.")
            return
        
        sales_rep = sales_rep_result.data[0]
        email = sales_rep.get("Email")
        first_name = sales_rep.get("sales_rep_first_name", "")
        last_name = sales_rep.get("sales_rep_last_name", "")
        full_name = f"{first_name} {last_name}".strip()
        
        if not email:
            print("Error: Sales rep has no email address.")
            return
        
        print(f"Found sales rep: {full_name} ({email})")
        
        # Step 2: Check if the email already exists in user_auth
        user_auth_result = supabase.table("user_auth").select("*").eq("email", email).execute()
        
        if user_auth_result.data:
            print(f"User auth entry already exists for {email}")
            return
        
        # Step 3: Create hashed password
        hashed_password = hash_password(password)
        
        # Step 4: Insert into user_auth table
        user_auth_insert = supabase.table("user_auth").insert({
            "email": email,
            "Password": hashed_password,
            "Full Name": full_name,
            "Role": "sales_rep",
            "Is active": True
        }).execute()
        
        if not user_auth_insert.data:
            print("Error: Failed to create user auth entry.")
            return
        
        print(f"Successfully created user_auth entry for {full_name}")
        print(f"Login credentials: Email: {email}, Password: {password}")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()