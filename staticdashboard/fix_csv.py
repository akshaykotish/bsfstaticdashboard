import pandas as pd
import csv
import sys
import os
import chardet

def detect_file_encoding(file_path):
    """Detect the encoding of a file"""
    with open(file_path, 'rb') as f:
        result = chardet.detect(f.read())
    return result['encoding']

def fix_engineering_csv(input_file='public/enggcurrentyear.csv', 
                        output_file='public/enggcurrentyear_fixed.csv'):
    """
    Fix the engineering current year CSV file
    """
    print(f"Processing: {input_file}")
    
    # First check what we're dealing with
    try:
        # Detect encoding
        encoding = detect_file_encoding(input_file)
        print(f"Detected encoding: {encoding}")
        
        with open(input_file, 'r', encoding=encoding or 'utf-8', errors='ignore') as f:
            content = f.read()
            
            # Check if it's HTML
            if '<!DOCTYPE' in content or '<html' in content.lower():
                print("\nERROR: The file is HTML, not CSV!")
                print("This appears to be a webpage saved as .csv")
                print("\nTo fix this:")
                print("1. Open the original data source")
                print("2. Export/Download as actual CSV (not 'Save Page As')")
                print("3. Make sure to select 'CSV' or 'Excel' format when downloading")
                return False
    except Exception as e:
        print(f"Error reading file: {e}")
    
    # Try multiple methods to read the CSV
    df = None
    
    # Method 1: Standard pandas read_csv with various options
    for sep in [',', ';', '\t', '|']:
        for enc in ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252', 'utf-16']:
            try:
                df = pd.read_csv(input_file, 
                               sep=sep, 
                               encoding=enc,
                               on_bad_lines='skip',
                               engine='python')
                
                # Check if we got meaningful data
                if len(df.columns) > 1 and len(df) > 0:
                    print(f"Successfully read with separator='{sep}' and encoding='{enc}'")
                    break
            except:
                continue
        if df is not None and len(df.columns) > 1:
            break
    
    # Method 2: If standard reading failed, try reading as Excel
    if df is None or len(df.columns) <= 1:
        try:
            # Sometimes CSV files are actually Excel files with wrong extension
            df = pd.read_excel(input_file, engine='openpyxl')
            print("Read as Excel file")
        except:
            pass
    
    # Method 3: Manual parsing if all else fails
    if df is None or len(df.columns) <= 1:
        try:
            with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
                
                # Skip any HTML or empty lines at the beginning
                data_lines = []
                for line in lines:
                    line = line.strip()
                    if line and not line.startswith('<') and not line.startswith('<!'):
                        data_lines.append(line)
                
                if data_lines:
                    # Try to parse as CSV
                    import io
                    csv_string = '\n'.join(data_lines)
                    df = pd.read_csv(io.StringIO(csv_string), error_bad_lines=False)
                    print("Manually parsed CSV data")
        except Exception as e:
            print(f"Manual parsing failed: {e}")
    
    if df is None or df.empty:
        print("\nERROR: Could not parse the file as CSV")
        print("\nPlease ensure your enggcurrentyear.csv file contains actual CSV data.")
        print("The file should look like:")
        print("scheme_name,budget_head,current_year_allocation,current_year_released,...")
        print("Project A,Infrastructure,5000000,3000000,...")
        return False
    
    print(f"\nSuccessfully loaded {len(df)} rows and {len(df.columns)} columns")
    print(f"Original columns: {list(df.columns)[:10]}...")  # Show first 10 columns
    
    # Clean column names
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
    df.columns = df.columns.str.replace(r'[^\w\s]', '', regex=True)
    
    # Map common column variations to standard names
    column_mappings = {
        # Scheme variations
        'scheme': 'scheme_name',
        'scheme_name': 'scheme_name',
        'project_name': 'scheme_name',
        'work_name': 'scheme_name',
        
        # Budget head variations
        'budget': 'budget_head',
        'budget_head': 'budget_head',
        'budget_category': 'budget_head',
        'head': 'budget_head',
        
        # Allocation variations
        'allocation': 'current_year_allocation',
        'cy_allocation': 'current_year_allocation',
        'current_year_allocation': 'current_year_allocation',
        'current_allocation': 'current_year_allocation',
        'budget_allocated': 'current_year_allocation',
        'sanctioned_amount': 'current_year_allocation',
        
        # Released variations
        'released': 'current_year_released',
        'cy_released': 'current_year_released',
        'current_year_released': 'current_year_released',
        'current_released': 'current_year_released',
        'fund_released': 'current_year_released',
        'amount_released': 'current_year_released',
        
        # Utilized variations
        'utilized': 'current_year_utilized',
        'cy_utilized': 'current_year_utilized',
        'current_year_utilized': 'current_year_utilized',
        'current_utilized': 'current_year_utilized',
        'expenditure': 'current_year_utilized',
        'spent': 'current_year_utilized',
        'cy_expenditure': 'current_year_utilized',
        
        # Date variations
        'release_date': 'release_date',
        'date_of_release': 'release_date',
        'fund_release_date': 'release_date',
        
        'utilization_date': 'utilization_date',
        'expenditure_date': 'utilization_date',
        'last_updated': 'utilization_date',
        
        # Quarter variations
        'quarter': 'quarter',
        'qtr': 'quarter',
        'period': 'quarter',
        
        # Status variations
        'status': 'status',
        'project_status': 'status',
        'work_status': 'status'
    }
    
    # Apply column mappings
    new_columns = {}
    for old_col in df.columns:
        old_col_clean = old_col.lower().strip()
        if old_col_clean in column_mappings:
            new_columns[old_col] = column_mappings[old_col_clean]
        else:
            new_columns[old_col] = old_col
    
    df.rename(columns=new_columns, inplace=True)
    print(f"\nMapped columns: {list(df.columns)[:10]}...")
    
    # Ensure required columns exist
    required_columns = [
        'scheme_name',
        'budget_head',
        'current_year_allocation',
        'current_year_released', 
        'current_year_utilized'
    ]
    
    optional_columns = [
        'release_date',
        'utilization_date',
        'quarter',
        'status'
    ]
    
    # Check and add missing required columns
    for col in required_columns:
        if col not in df.columns:
            print(f"Warning: Missing required column '{col}'")
            if col == 'scheme_name':
                # Try to use first text column as scheme name
                for c in df.columns:
                    if df[c].dtype == 'object':
                        df['scheme_name'] = df[c]
                        print(f"Using '{c}' as scheme_name")
                        break
                else:
                    df['scheme_name'] = f'Project_{range(len(df))}'
            elif col == 'budget_head':
                df['budget_head'] = 'General'
            else:
                df[col] = 0
    
    # Add optional columns if missing
    for col in optional_columns:
        if col not in df.columns:
            if col == 'status':
                df[col] = 'ACTIVE'
            elif col == 'quarter':
                df[col] = 'Q3'  # Current quarter
            else:
                df[col] = ''
    
    # Clean numeric columns
    numeric_columns = ['current_year_allocation', 'current_year_released', 'current_year_utilized']
    for col in numeric_columns:
        if col in df.columns:
            # Convert to string first, then clean
            df[col] = df[col].astype(str)
            # Remove currency symbols, commas, and other non-numeric characters
            df[col] = df[col].str.replace(r'[₹$,()]', '', regex=True)
            df[col] = df[col].str.replace(r'cr|crore|lakh|lac|l|k|thousand|million', '', regex=True, case=False)
            # Convert to numeric
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            # If values seem too small (less than 1000), multiply by 10000 (assuming lakhs)
            if df[col].max() < 1000 and df[col].max() > 0:
                df[col] = df[col] * 10000
                print(f"Scaled up {col} values (assumed to be in lakhs)")
    
    # Clean text columns
    text_columns = ['scheme_name', 'budget_head', 'status']
    for col in text_columns:
        if col in df.columns:
            df[col] = df[col].fillna('').astype(str).str.strip()
            # Remove any quotes
            df[col] = df[col].str.replace('"', '').str.replace("'", '')
    
    # Ensure status has valid values
    if 'status' in df.columns:
        valid_statuses = ['PENDING', 'SCHEDULED', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'UPCOMING']
        df.loc[~df['status'].isin(valid_statuses), 'status'] = 'ACTIVE'
    
    # Select and reorder columns for output
    output_columns = []
    for col in required_columns + optional_columns:
        if col in df.columns:
            output_columns.append(col)
    
    # Add any remaining columns
    for col in df.columns:
        if col not in output_columns:
            output_columns.append(col)
    
    df_output = df[output_columns]
    
    # Remove any rows where all numeric values are 0
    numeric_cols = ['current_year_allocation', 'current_year_released', 'current_year_utilized']
    mask = (df_output[numeric_cols] != 0).any(axis=1)
    df_output = df_output[mask]
    
    print(f"\nFinal dataset: {len(df_output)} rows")
    
    # Save the cleaned CSV
    df_output.to_csv(output_file, index=False, encoding='utf-8')
    print(f"\nSaved cleaned CSV to: {output_file}")
    
    # Show summary
    print("\nData Summary:")
    print(f"Total Projects: {len(df_output)}")
    print(f"Total Allocation: ₹{df_output['current_year_allocation'].sum()/100:.2f} Cr")
    print(f"Total Released: ₹{df_output['current_year_released'].sum()/100:.2f} Cr")
    print(f"Total Utilized: ₹{df_output['current_year_utilized'].sum()/100:.2f} Cr")
    
    print("\nFirst 3 rows of cleaned data:")
    print(df_output.head(3))
    
    # Create a backup of the original file
    if os.path.exists(input_file):
        backup_file = input_file.replace('.csv', '_backup.csv')
        if not os.path.exists(backup_file):
            os.rename(input_file, backup_file)
            print(f"\nOriginal file backed up to: {backup_file}")
        
        # Replace original with fixed version
        os.rename(output_file, input_file)
        print(f"Fixed file saved as: {input_file}")
    
    return True

if __name__ == "__main__":
    # Run the fix
    success = fix_engineering_csv()
    
    if not success:
        print("\n" + "="*50)
        print("FIX INSTRUCTIONS:")
        print("="*50)
        print("\n1. The current enggcurrentyear.csv file appears to be HTML")
        print("2. You need to download the actual CSV data file")
        print("3. Make sure to use 'Export as CSV' or 'Download CSV' option")
        print("4. Do NOT use 'Save Page As' from browser")
        print("\nOnce you have the correct CSV file, run this script again.")