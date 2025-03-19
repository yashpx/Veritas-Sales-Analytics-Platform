#!/usr/bin/env python3
"""
Script to check the columns of the call_logs table in Supabase and process call insights.
"""
import os
import json
import logging
import subprocess
import sys
import re
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("SUPABASE_URL or SUPABASE_KEY not set in .env file")
    exit(1)

# Create Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_call_logs_columns():
    """Check the columns of the call_logs table in Supabase."""
    try:
        # Get one row from the call_logs table
        response = supabase.table("call_logs").select("*").limit(1).execute()
        
        if response.data:
            # Get the first row
            call_log = response.data[0]
            
            # Print the column names
            logger.info("Columns in call_logs table:")
            for column_name in call_log.keys():
                logger.info(f"  {column_name}")
            
            return call_log.keys()
        else:
            logger.warning("No data found in call_logs table")
            return []
    
    except Exception as e:
        logger.exception(f"Error checking call_logs columns: {str(e)}")
        return []

def get_call_log_by_id(call_log_id):
    """Get a specific call log by ID."""
    try:
        # First try with call_id field
        logger.info(f"Trying to find call log with call_id: {call_log_id}")
        response = supabase.table("call_logs").select("*").eq("call_id", call_log_id).execute()
        
        if response.data and len(response.data) > 0:
            logger.info(f"Found call log with call_id: {call_log_id}")
            return response.data[0]
        
        # If not found, try with id field
        logger.info(f"No call log found with call_id: {call_log_id}, trying with id field")
        response = supabase.table("call_logs").select("*").eq("id", call_log_id).execute()
        
        if response.data and len(response.data) > 0:
            logger.info(f"Found call log with id: {call_log_id}")
            return response.data[0]
        
        # If still not found, log warning and return None
        logger.warning(f"No call log found with either call_id or id: {call_log_id}")
        return None
    
    except Exception as e:
        logger.exception(f"Error getting call log by ID: {str(e)}")
        return None

def process_call_insights(call_log_id):
    """Process call insights for a specific call log."""
    try:
        # Get the call log
        call_log = get_call_log_by_id(call_log_id)
        
        if not call_log:
            logger.error(f"Call log with ID {call_log_id} not found")
            return None
        
        # Check if transcription exists
        if not call_log.get('transcription'):
            logger.error(f"Call log with ID {call_log_id} has no transcription")
            return None
        
        # Save transcription to a temporary file
        temp_transcript_file = "temp_transcript.json"
        try:
            # Parse the transcription if it's in JSON format, otherwise use as is
            try:
                transcript_data = json.loads(call_log['transcription'])
            except json.JSONDecodeError:
                # Create a simple structure for non-JSON transcriptions
                transcript_data = {
                    "transcript": [
                        {"speaker": "Unknown", "text": call_log['transcription']}
                    ]
                }
            
            with open(temp_transcript_file, 'w') as f:
                json.dump(transcript_data, f)
            
            # Get the path to the insights.py script
            current_dir = os.path.dirname(os.path.abspath(__file__))
            insights_script_path = os.path.join(current_dir, "insightspg", "insights.py")
            
            # Run the insights.py script
            result = subprocess.run(
                [sys.executable, insights_script_path],
                capture_output=True,
                text=True,
                env={**os.environ, "TRANSCRIPT_FILE": temp_transcript_file}
            )
            
            if result.returncode != 0:
                logger.error(f"Error running insights.py: {result.stderr}")
                return None
            
            # Parse the insights output
            try:
                # Try to find JSON in the output
                output = result.stdout
                logger.info(f"Raw insights output length: {len(output)}")
                
                # Look for JSON pattern in the output
                json_match = re.search(r'\{[\s\S]*\}', output)
                if json_match:
                    json_str = json_match.group(0)
                    logger.info(f"Extracted JSON from output, length: {len(json_str)}")
                    insights_data = json.loads(json_str)
                else:
                    # If no JSON pattern found, try to parse the entire output
                    logger.info("No JSON pattern found, trying to parse entire output")
                    insights_data = json.loads(output)
                
                logger.info(f"Successfully parsed insights with keys: {', '.join(insights_data.keys())}")
                
                # Process nested JSON strings if needed
                for key, value in insights_data.items():
                    if isinstance(value, dict) and 'output' in value:
                        try:
                            # Try to parse the output field as JSON
                            parsed_output = json.loads(value['output'])
                            insights_data[key]['parsed'] = parsed_output
                            logger.info(f"Successfully parsed nested JSON in {key}")
                        except json.JSONDecodeError:
                            logger.info(f"Could not parse nested JSON in {key}")
                
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing insights output: {output}")
                logger.exception(f"JSON parse error: {str(e)}")
                return None
            
            # Update the call log with insights
            # First determine which ID field to use for the update
            update_field = "call_id" if call_log.get("call_id") else "id"
            update_value = call_log.get(update_field)
            
            logger.info(f"Updating call log with insights using {update_field}={update_value}")
            
            update_response = supabase.table("call_logs").update({
                "insights": insights_data,
                "processed_at": datetime.now().isoformat()
            }).eq(update_field, update_value).execute()
            
            if update_response.data:
                logger.info(f"Successfully updated call log with insights: {call_log_id}")
                return insights_data
            else:
                logger.error(f"Failed to update call log with insights: {call_log_id}")
                return None
        
        finally:
            # Clean up temporary file
            if os.path.exists(temp_transcript_file):
                os.remove(temp_transcript_file)
    
    except Exception as e:
        logger.exception(f"Error processing call insights: {str(e)}")
        return None

def get_call_insights(call_log_id):
    """Get insights for a specific call log, processing them if needed."""
    try:
        logger.info(f"=== Starting get_call_insights for ID: {call_log_id} ===")
        
        # Get the call log
        call_log = get_call_log_by_id(call_log_id)
        
        if not call_log:
            logger.error(f"Call log with ID {call_log_id} not found")
            return None
        
        logger.info(f"Found call log with keys: {', '.join(call_log.keys())}")
        logger.info(f"Call log ID: {call_log.get('id')}, call_id: {call_log.get('call_id')}")
        
        # Check if insights already exist
        if call_log.get('insights'):
            logger.info(f"Using existing insights for call log: {call_log_id}")
            logger.info(f"Insights keys: {', '.join(call_log['insights'].keys()) if isinstance(call_log['insights'], dict) else 'not a dict'}")
            return call_log['insights']
        
        # Check if transcription exists
        if not call_log.get('transcription'):
            logger.error(f"Call log has no transcription, cannot process insights")
            return None
        
        logger.info(f"Transcription exists, length: {len(str(call_log.get('transcription')))}")
        
        # Process insights if they don't exist
        logger.info(f"Processing new insights for call log: {call_log_id}")
        insights = process_call_insights(call_log_id)
        
        if insights:
            logger.info(f"Successfully processed insights with keys: {', '.join(insights.keys()) if isinstance(insights, dict) else 'not a dict'}")
        else:
            logger.error("Failed to process insights")
            
        return insights
    
    except Exception as e:
        logger.exception(f"Error getting call insights: {str(e)}")
        return None

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Check call logs columns")
    parser.add_argument("--check-columns", action="store_true", help="Check call logs columns")
    parser.add_argument("--get-insights", type=str, help="Get insights for a specific call log ID")
    parser.add_argument("--test-insights", type=str, help="Test getting insights for a specific call log ID")
    args = parser.parse_args()
    
    if args.check_columns:
        check_call_logs_columns()
    elif args.get_insights:
        insights = get_call_insights(args.get_insights)
        if insights:
            print(json.dumps(insights))
        else:
            print(json.dumps({"error": "Failed to get insights"}))
    elif args.test_insights:
        logger.info(f"Testing get_call_insights for ID: {args.test_insights}")
        call_log = get_call_log_by_id(args.test_insights)
        if call_log:
            logger.info(f"Call log found with keys: {', '.join(call_log.keys())}")
            logger.info(f"Call log ID: {call_log.get('id')}, call_id: {call_log.get('call_id')}")
            logger.info(f"Transcription exists: {bool(call_log.get('transcription'))}")
            logger.info(f"Insights exist: {bool(call_log.get('insights'))}")
            
            if call_log.get('transcription'):
                logger.info(f"Transcription length: {len(str(call_log.get('transcription')))}")
                logger.info(f"Transcription sample: {str(call_log.get('transcription'))[:100]}...")
            
            if call_log.get('insights'):
                logger.info(f"Insights keys: {', '.join(call_log['insights'].keys()) if isinstance(call_log['insights'], dict) else 'not a dict'}")
        else:
            logger.error(f"No call log found with ID: {args.test_insights}")
    else:
        parser.print_help()
