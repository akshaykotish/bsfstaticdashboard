import pandas as pd
import numpy as np
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

def merge_excel_to_csv(input_file, output_csv='merged_output.csv'):
    """
    Merge all Excel sheets into a single CSV file using exact column names
    """
    print(f"Reading Excel file: {input_file}")
    
    # Define the exact column names in order
    column_names = [
        's_no',
        'budget_head',
        'name_of_scheme',
        'sub_scheme_name',
        'ftr_hq_name',
        'shq_name',
        'location',
        'work_description',
        'executive_agency',
        'aa_es_reference',
        'sd_amount_lakh',
        'ts_date',
        'tender_date',
        'acceptance_date',
        'award_date',
        'time_allowed_days',
        'pdc_agreement',
        'pdc_revised',
        'completion_date_actual',
        'firm_name',
        'physical_progress_percent',
        'expenditure_previous_fy',
        'expenditure_current_fy',
        'expenditure_total',
        'expenditure_percent',
        'current_status',
        'remarks'
    ]
    
    # Read the Excel file
    try:
        excel_file = pd.ExcelFile(input_file, engine='openpyxl')
    except:
        try:
            excel_file = pd.ExcelFile(input_file, engine='xlrd')
        except Exception as e:
            print(f"Error reading Excel file: {e}")
            return None
    
    print(f"Found {len(excel_file.sheet_names)} sheets: {excel_file.sheet_names}")
    
    # List to store all dataframes
    all_sheets_data = []
    
    # Process each sheet
    for sheet_name in excel_file.sheet_names:
        print(f"Processing sheet: {sheet_name}")
        
        try:
            # Read the sheet
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            
            # Skip empty sheets
            if df.empty or len(df) == 0:
                print(f"  Skipping {sheet_name} - empty sheet")
                continue
            
            # Remove completely empty rows
            df = df.dropna(how='all')
            
            # If the sheet has different column names, try to map them
            # This assumes your sheets might have these exact column names or similar ones
            if len(df.columns) >= len(column_names):
                # If there are more columns, take only the first N columns matching our structure
                df = df.iloc[:, :len(column_names)]
                df.columns = column_names
            elif len(df.columns) < len(column_names):
                # If there are fewer columns, assign what we have and add empty columns for the rest
                current_cols = list(df.columns)
                for i in range(len(current_cols), len(column_names)):
                    df[f'temp_col_{i}'] = ''
                df.columns = column_names
            else:
                # Exact match - just rename
                df.columns = column_names
            
            # Add source sheet column to track where data came from
            df['source_sheet'] = sheet_name
            
            # Add to list
            all_sheets_data.append(df)
            print(f"  Added {len(df)} rows from {sheet_name}")
            
        except Exception as e:
            print(f"  Error processing sheet {sheet_name}: {str(e)}")
            continue
    
    # Check if we have any data
    if not all_sheets_data:
        print("No data found in any sheet!")
        return None
    
    # Merge all dataframes into one
    print(f"\nMerging {len(all_sheets_data)} sheets...")
    merged_df = pd.concat(all_sheets_data, ignore_index=True, sort=False)
    
    # Reorder columns to put source_sheet at the beginning
    final_columns = ['source_sheet'] + column_names
    merged_df = merged_df[final_columns]
    
    # Clean up data types for dates (convert to string format)
    date_columns = ['ts_date', 'tender_date', 'acceptance_date', 'award_date',
                   'pdc_agreement', 'pdc_revised', 'completion_date_actual']
    
    for col in date_columns:
        if col in merged_df.columns:
            merged_df[col] = pd.to_datetime(merged_df[col], errors='coerce').dt.strftime('%Y-%m-%d')
            merged_df[col] = merged_df[col].fillna('')
    
    # Clean up numeric columns
    numeric_columns = ['sd_amount_lakh', 'time_allowed_days', 'physical_progress_percent',
                      'expenditure_previous_fy', 'expenditure_current_fy', 
                      'expenditure_total', 'expenditure_percent']
    
    for col in numeric_columns:
        if col in merged_df.columns:
            merged_df[col] = pd.to_numeric(merged_df[col], errors='coerce')
            merged_df[col] = merged_df[col].fillna('')
    
    # Save to CSV
    print(f"\nSaving merged data to: {output_csv}")
    merged_df.to_csv(output_csv, index=False, encoding='utf-8-sig')
    
    print(f"\n✅ SUCCESS! Merged {len(merged_df)} total rows from {len(all_sheets_data)} sheets")
    print(f"📁 Output saved to: {output_csv}")
    print(f"📊 Total columns: {len(merged_df.columns)}")
    
    return merged_df

# Simple function to merge with automatic column mapping
def simple_merge(input_file, output_csv='merged_output.csv'):
    """
    Even simpler version - just read all sheets and merge them as-is
    """
    print(f"Reading Excel file: {input_file}")
    
    # Read all sheets
    excel_file = pd.ExcelFile(input_file)
    
    all_data = []
    
    for sheet_name in excel_file.sheet_names:
        df = pd.read_excel(excel_file, sheet_name=sheet_name)
        df['source_sheet'] = sheet_name  # Add sheet name as a column
        all_data.append(df)
        print(f"Read {len(df)} rows from sheet: {sheet_name}")
    
    # Combine all sheets
    merged = pd.concat(all_data, ignore_index=True, sort=False)
    
    # Save to CSV
    merged.to_csv(output_csv, index=False, encoding='utf-8-sig')
    print(f"\nSaved {len(merged)} total rows to: {output_csv}")
    
    return merged

# Main execution
if __name__ == "__main__":
    # Your input Excel file
    input_file = "engineering.xls"
    
    # Output CSV file name
    output_csv = "engineering_merged.csv"
    
    # Method 1: Merge with exact column mapping
    merged_data = merge_excel_to_csv(input_file, output_csv)
    
    # Method 2: If you want to keep original column names from Excel
    # Uncomment the line below to use simple merge instead
    # merged_data = simple_merge(input_file, "engineering_simple_merge.csv")