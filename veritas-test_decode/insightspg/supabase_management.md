# Adding Columns to Supabase Call Logs Table

Since we're encountering permission issues with programmatically adding columns, here's how to add the required columns manually through the Supabase dashboard:

## Method 1: Using the Supabase Dashboard

1. Log in to your Supabase dashboard
2. Go to **Table Editor**
3. Select the `call_logs` table
4. Click on **Edit Table**
5. Add the following columns:
   - Column Name: `insights`
     - Type: `JSONB`
     - Default Value: `null`
     - Nullable: `true`
   - Column Name: `processed_at`
     - Type: `timestamp with time zone`
     - Default Value: `null`
     - Nullable: `true`
6. Click **Save**

## Method 2: Using SQL Editor

1. Log in to your Supabase dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Paste the following SQL:

```sql
-- Add insights column (JSONB type) to call_logs table
ALTER TABLE call_logs 
ADD COLUMN IF NOT EXISTS insights JSONB DEFAULT NULL;

-- Add processed_at column (TIMESTAMP type) to call_logs table
ALTER TABLE call_logs 
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
```

5. Click **Run** to execute the SQL

## Verifying the Columns

After adding the columns, you can verify they were added correctly by:

1. Going to **Table Editor**
2. Selecting the `call_logs` table
3. Checking that the `insights` and `processed_at` columns are present

## Next Steps

Once the columns are added, you can:

1. Start the webhook server:
   ```bash
   cd insightspg
   ./start_services.sh
   ```

2. Configure the Supabase webhook as described in the AUTOMATION_GUIDE.md

3. Test the pipeline by adding a new row to the `call_logs` table
