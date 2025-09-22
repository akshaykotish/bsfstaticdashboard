import pandas as pd
import numpy as np
from datetime import datetime
import re
import warnings
warnings.filterwarnings('ignore')

def parse_date(date_value):
    """
    Parse various date formats into a standard format
    """
    if pd.isna(date_value) or date_value == '' or date_value == 'NA' or date_value == '-':
        return None
    
    # Convert to string if not already
    date_str = str(date_value).strip()
    
    # List of common unwanted values
    unwanted_values = ['nil', 'na', 'n/a', 'not applicable', 'pending', 'awaited', 
                       'under process', 'to be', '-', '--', '---', 'xxx', 'tbd']
    if date_str.lower() in unwanted_values:
        return None
    
    # Try different date formats
    date_formats = [
        '%d.%m.%Y',     # 28.07.2023
        '%d.%m.%y',     # 28.07.23
        '%d/%m/%Y',     # 28/07/2023
        '%d/%m/%y',     # 28/07/23
        '%d-%m-%Y',     # 28-07-2023
        '%d-%m-%y',     # 28-07-23
        '%Y-%m-%d',     # 2023-07-28
        '%Y/%m/%d',     # 2023/07/28
        '%d %b %Y',     # 28 Jul 2023
        '%d %B %Y',     # 28 July 2023
        '%b %d, %Y',    # Jul 28, 2023
        '%B %d, %Y',    # July 28, 2023
    ]
    
    for fmt in date_formats:
        try:
            return pd.to_datetime(date_str, format=fmt)
        except:
            continue
    
    # Try pandas general date parser
    try:
        # Remove any timezone info or extra text
        date_str = re.sub(r'GMT[+-]\d{4}.*', '', date_str).strip()
        date_str = re.sub(r'\s+\d{2}:\d{2}:\d{2}', '', date_str).strip()
        
        # Handle dates like "Mon Sep 23 2024"
        if re.match(r'^[A-Za-z]{3} [A-Za-z]{3} \d{1,2} \d{4}', date_str):
            date_str = ' '.join(date_str.split()[1:])
        
        return pd.to_datetime(date_str, dayfirst=True, errors='coerce')
    except:
        return None

def clean_numeric(value):
    """
    Clean numeric values and convert to float
    """
    if pd.isna(value) or value == '' or value == '-':
        return None
    
    # Convert to string
    value_str = str(value).strip()
    
    # Remove common unwanted values
    unwanted_values = ['nil', 'na', 'n/a', 'not applicable', 'pending', '-', '--', '---']
    if value_str.lower() in unwanted_values:
        return None
    
    # Remove % sign if present
    value_str = value_str.replace('%', '').strip()
    
    # Remove commas
    value_str = value_str.replace(',', '')
    
    try:
        return float(value_str)
    except:
        return None

def clean_text(value):
    """
    Clean text values
    """
    if pd.isna(value):
        return ''
    
    value_str = str(value).strip()
    
    # Replace common unwanted values with empty string
    unwanted_values = ['nil', 'na', 'n/a', '-', '--', '---', 'null', 'none']
    if value_str.lower() in unwanted_values:
        return ''
    
    return value_str

def handle_duplicate_columns(df):
    """
    Handle duplicate column names by making them unique
    """
    cols = pd.Series(df.columns)
    for dup in cols[cols.duplicated()].unique():
        cols[cols[cols == dup].index.values.tolist()] = [dup + '_' + str(i) if i != 0 else dup 
                                                           for i in range(sum(cols == dup))]
    df.columns = cols
    return df

def standardize_column_names(df):
    """
    Standardize column names across all sheets
    """
    # First, handle any duplicate columns
    df = handle_duplicate_columns(df)
    
    # Dictionary for column name mapping
    column_mapping = {
        's no': 'serial_no',
        's/no': 'serial_no',
        'S No': 'serial_no',
        'budget head': 'budget_head',
        'Budget head': 'budget_head',
        'name of scheme': 'scheme_name',
        'Name of scheme': 'scheme_name',
        'name of ftr hq': 'ftr_hq',
        'Name of Ftr HQ': 'ftr_hq',
        'name of ftr': 'ftr_hq',
        'name of shq': 'shq',
        'Name of SHQ': 'shq',
        'name of work/site': 'work_site',
        'Name of work/site': 'work_site',
        'executive agency': 'executive_agency',
        'Executive agency ': 'executive_agency',
        'ref of aa/es': 'aa_es_ref',
        'Ref of AA/ES': 'aa_es_ref',
        'sd amount': 'sanctioned_amount',
        'sd amount\n(in lakh)': 'sanctioned_amount',
        'Sd Amount\n(In Lakh)': 'sanctioned_amount',
        'date of ts': 'date_ts',
        'Date of TS': 'date_ts',
        'date of tender': 'date_tender',
        'Date of Tender': 'date_tender',
        'date of acceptance': 'date_acceptance',
        'Date of acceptance': 'date_acceptance',
        'date of award': 'date_award',
        'Date of award': 'date_award',
        'time allowed (in days)': 'time_allowed_days',
        'time allowed (in days': 'time_allowed_days',
        'Time allowed (in days)': 'time_allowed_days',
        'pdc as per agreement': 'pdc_agreement',
        'PDC as per agreement ': 'pdc_agreement',
        'revised pdc, if date of original pdc lapsed': 'revised_pdc',
        'Revised PDC, if date of original PDC lapsed ': 'revised_pdc',
        'actual date of completion': 'actual_completion_date',
        'Actual date of completion ': 'actual_completion_date',
        'name of firm': 'firm_name',
        'physical progress (%)': 'physical_progress',
        'Physical progress (%)': 'physical_progress',
        'whether progress is one time of slow': 'progress_status',
        'Whether progress is one time of slow': 'progress_status',
        'expdr booked upto 31.03.25': 'expdr_upto_31mar25',
        'Expdr booked upto 31.03.25': 'expdr_upto_31mar25',
        'expdr booked during cfy': 'expdr_cfy',
        'Expdr booked during CFY ': 'expdr_cfy',
        'total expd booked': 'total_expdr',
        'Total expd booked ': 'total_expdr',
        '%age of expdr': 'percent_expdr',
        '%age of expdr': 'percent_expdr',
        'remarks': 'remarks',
        'Remarks': 'remarks',
        'if aa&es  not issued then, pending with hq (shq/ftr/ command/ fhq)': 'aa_es_pending_with',
        'If AA&Es  not issued then, pending with HQ (SHQ/Ftr/ Command/ FHQ)': 'aa_es_pending_with'
    }
    
    # Clean column names
    df.columns = df.columns.str.lower().str.strip()
    
    # Create a new columns list to avoid duplicate issues
    new_columns = []
    used_names = set()
    
    for col in df.columns:
        new_name = None
        # Try to find a mapping
        for old_name, mapped_name in column_mapping.items():
            if old_name in col.lower():
                new_name = mapped_name
                break
        
        # If no mapping found, use cleaned original name
        if new_name is None:
            new_name = col.replace('\n', '_').replace(' ', '_').replace('/', '_').lower()
        
        # Make sure the name is unique
        if new_name in used_names:
            counter = 1
            original_name = new_name
            while new_name in used_names:
                new_name = f"{original_name}_{counter}"
                counter += 1
        
        used_names.add(new_name)
        new_columns.append(new_name)
    
    df.columns = new_columns
    return df

def process_excel_file(file_path, output_path='consolidated_data.xlsx'):
    """
    Main function to process all sheets from Excel file
    """
    print(f"Reading Excel file: {file_path}")
    
    # Read all sheets
    try:
        excel_file = pd.ExcelFile(file_path, engine='openpyxl')
    except:
        try:
            excel_file = pd.ExcelFile(file_path, engine='xlrd')
        except Exception as e:
            print(f"Error reading Excel file: {e}")
            return None
    
    all_data = []
    
    print(f"Found {len(excel_file.sheet_names)} sheets")
    
    for sheet_name in excel_file.sheet_names:
        print(f"\nProcessing sheet: {sheet_name}")
        
        try:
            # Read the sheet
            df = pd.read_excel(excel_file, sheet_name=sheet_name, header=0)
            
            # Skip if empty or too small
            if df.shape[0] < 2 or df.shape[1] < 5:
                print(f"  Skipping {sheet_name} - insufficient data")
                continue
            
            # Remove completely empty rows first
            df = df.dropna(how='all')
            
            # Add sheet name as a column
            df['source_sheet'] = sheet_name
            
            # Standardize column names (this now handles duplicates)
            df = standardize_column_names(df)
            
            # Process date columns
            date_columns = ['date_ts', 'date_tender', 'date_acceptance', 'date_award',
                          'pdc_agreement', 'revised_pdc', 'actual_completion_date']
            
            for col in date_columns:
                if col in df.columns:
                    print(f"  Processing date column: {col}")
                    df[col] = df[col].apply(parse_date)
                    # Convert to standard format
                    df[col] = pd.to_datetime(df[col], errors='coerce')
            
            # Process numeric columns
            numeric_columns = ['sanctioned_amount', 'time_allowed_days', 'physical_progress',
                             'expdr_upto_31mar25', 'expdr_cfy', 'total_expdr', 'percent_expdr']
            
            for col in numeric_columns:
                if col in df.columns:
                    df[col] = df[col].apply(clean_numeric)
            
            # Process text columns
            text_columns = ['budget_head', 'scheme_name', 'ftr_hq', 'shq', 'work_site',
                          'executive_agency', 'aa_es_ref', 'firm_name', 'progress_status', 'remarks']
            
            for col in text_columns:
                if col in df.columns:
                    df[col] = df[col].apply(clean_text)
            
            # Remove rows where all important columns are empty
            important_cols = ['scheme_name', 'work_site', 'sanctioned_amount']
            important_cols = [col for col in important_cols if col in df.columns]
            
            if important_cols:
                # At least one of the important columns should have data
                mask = pd.Series([False] * len(df))
                for col in important_cols:
                    if col in df.columns:
                        mask = mask | df[col].notna()
                df = df[mask]
            
            print(f"  Retained {len(df)} rows after cleaning")
            
            if len(df) > 0:
                # Reset index before appending
                df = df.reset_index(drop=True)
                all_data.append(df)
                
        except Exception as e:
            print(f"  Error processing sheet {sheet_name}: {str(e)}")
            continue
    
    if not all_data:
        print("\nNo valid data found in any sheet!")
        return None
    
    # Combine all dataframes
    print(f"\nConsolidating {len(all_data)} sheets...")
    
    # Concatenate with more error handling
    try:
        consolidated_df = pd.concat(all_data, ignore_index=True, sort=False, axis=0)
    except Exception as e:
        print(f"Error during concatenation: {e}")
        print("Attempting alternative concatenation method...")
        
        # Alternative method: ensure all dataframes have same columns
        all_columns = set()
        for df in all_data:
            all_columns.update(df.columns)
        
        # Add missing columns to each dataframe
        for i, df in enumerate(all_data):
            for col in all_columns:
                if col not in df.columns:
                    df[col] = np.nan
            all_data[i] = df[list(all_columns)]
        
        # Try concatenation again
        consolidated_df = pd.concat(all_data, ignore_index=True, sort=False)
    
    # Ensure consistent column order
    column_order = ['source_sheet', 'serial_no', 'budget_head', 'scheme_name', 'ftr_hq', 'shq',
                   'work_site', 'executive_agency', 'aa_es_ref', 'sanctioned_amount',
                   'date_ts', 'date_tender', 'date_acceptance', 'date_award',
                   'time_allowed_days', 'pdc_agreement', 'revised_pdc', 'actual_completion_date',
                   'firm_name', 'physical_progress', 'progress_status',
                   'expdr_upto_31mar25', 'expdr_cfy', 'total_expdr', 'percent_expdr', 'remarks']
    
    # Only include columns that exist
    column_order = [col for col in column_order if col in consolidated_df.columns]
    
    # Add any remaining columns not in the order list
    remaining_cols = [col for col in consolidated_df.columns if col not in column_order]
    column_order.extend(remaining_cols)
    
    consolidated_df = consolidated_df[column_order]
    
    # Format dates for output (as strings in consistent format)
    date_columns = ['date_ts', 'date_tender', 'date_acceptance', 'date_award',
                   'pdc_agreement', 'revised_pdc', 'actual_completion_date']
    
    for col in date_columns:
        if col in consolidated_df.columns:
            # Handle NaT values
            consolidated_df[col] = consolidated_df[col].apply(
                lambda x: x.strftime('%Y-%m-%d') if pd.notna(x) else ''
            )
    
    # Save to Excel with multiple output options
    print(f"\nSaving consolidated data...")
    
    try:
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            # Main consolidated sheet
            consolidated_df.to_excel(writer, sheet_name='Consolidated_Data', index=False)
            
            # Summary statistics sheet
            summary_stats = create_summary_stats(consolidated_df)
            summary_stats.to_excel(writer, sheet_name='Summary', index=False)
            
            # Sheet-wise summary
            sheet_summary = create_sheet_summary(consolidated_df)
            sheet_summary.to_excel(writer, sheet_name='Sheet_Summary')
        
        print(f"Data successfully consolidated and saved to {output_path}")
        print(f"Total records: {len(consolidated_df)}")
        print(f"Total columns: {len(consolidated_df.columns)}")
        
    except Exception as e:
        print(f"Error saving Excel file: {e}")
        print("Attempting to save as CSV instead...")
        consolidated_df.to_csv(output_path.replace('.xlsx', '.csv'), index=False)
        print(f"Data saved as CSV: {output_path.replace('.xlsx', '.csv')}")
    
    return consolidated_df

def create_summary_stats(df):
    """
    Create summary statistics dataframe
    """
    stats = []
    
    stats.append(('Total Records', len(df)))
    stats.append(('Total Sheets Processed', df['source_sheet'].nunique() if 'source_sheet' in df.columns else 0))
    
    if 'sanctioned_amount' in df.columns:
        stats.append(('Total Sanctioned Amount (Lakhs)', f"{df['sanctioned_amount'].sum():.2f}"))
        stats.append(('Average Sanctioned Amount (Lakhs)', f"{df['sanctioned_amount'].mean():.2f}"))
    
    if 'physical_progress' in df.columns:
        stats.append(('Average Physical Progress (%)', f"{df['physical_progress'].mean():.2f}"))
        stats.append(('Projects 100% Complete', len(df[df['physical_progress'] == 100])))
    
    if 'actual_completion_date' in df.columns:
        # Count non-empty completion dates
        completed = df[df['actual_completion_date'] != '']
        stats.append(('Total Works Completed', len(completed)))
        stats.append(('Total Works In Progress', len(df) - len(completed)))
    
    return pd.DataFrame(stats, columns=['Metric', 'Value'])

def create_sheet_summary(df):
    """
    Create sheet-wise summary
    """
    summary_dict = {}
    
    for sheet in df['source_sheet'].unique():
        sheet_df = df[df['source_sheet'] == sheet]
        
        summary_dict[sheet] = {
            'Record_Count': len(sheet_df),
            'Total_Sanctioned_Amount': sheet_df['sanctioned_amount'].sum() if 'sanctioned_amount' in df.columns else 0,
            'Avg_Physical_Progress': sheet_df['physical_progress'].mean() if 'physical_progress' in df.columns else 0
        }
    
    summary_df = pd.DataFrame.from_dict(summary_dict, orient='index')
    summary_df.index.name = 'Sheet_Name'
    
    # Round numeric columns
    numeric_cols = ['Total_Sanctioned_Amount', 'Avg_Physical_Progress']
    for col in numeric_cols:
        if col in summary_df.columns:
            summary_df[col] = summary_df[col].round(2)
    
    return summary_df

def analyze_consolidated_data(df):
    """
    Perform basic analysis on consolidated data
    """
    print("\n" + "="*50)
    print("DATA ANALYSIS SUMMARY")
    print("="*50)
    
    # Basic statistics
    print(f"\nTotal Records: {len(df)}")
    print(f"Total Unique Schemes: {df['scheme_name'].nunique() if 'scheme_name' in df.columns else 'N/A'}")
    print(f"Total Unique Work Sites: {df['work_site'].nunique() if 'work_site' in df.columns else 'N/A'}")
    
    # Financial summary
    if 'sanctioned_amount' in df.columns:
        print(f"\nFinancial Summary:")
        print(f"  Total Sanctioned Amount: ₹{df['sanctioned_amount'].sum():.2f} Lakhs")
        print(f"  Average Sanctioned Amount: ₹{df['sanctioned_amount'].mean():.2f} Lakhs")
        
        non_zero = df[df['sanctioned_amount'] > 0]['sanctioned_amount']
        if len(non_zero) > 0:
            print(f"  Max Sanctioned Amount: ₹{non_zero.max():.2f} Lakhs")
            print(f"  Min Sanctioned Amount: ₹{non_zero.min():.2f} Lakhs")
    
    # Progress summary
    if 'physical_progress' in df.columns:
        valid_progress = df[df['physical_progress'].notna()]
        if len(valid_progress) > 0:
            print(f"\nProgress Summary:")
            print(f"  Average Physical Progress: {valid_progress['physical_progress'].mean():.2f}%")
            print(f"  Projects 100% Complete: {len(df[df['physical_progress'] == 100])}")
            print(f"  Projects In Progress: {len(df[(df['physical_progress'] < 100) & (df['physical_progress'] > 0)])}")
            print(f"  Projects Not Started: {len(df[df['physical_progress'] == 0])}")
    
    # Date analysis
    if 'actual_completion_date' in df.columns:
        completed = df[(df['actual_completion_date'].notna()) & (df['actual_completion_date'] != '')]
        print(f"\nCompletion Status:")
        print(f"  Completed Projects: {len(completed)}")
        print(f"  Ongoing Projects: {len(df) - len(completed)}")
    
    # Budget head summary
    if 'budget_head' in df.columns:
        print(f"\nBudget Head Distribution:")
        budget_counts = df['budget_head'].value_counts().head(5)
        for budget, count in budget_counts.items():
            if budget:  # Only show non-empty budget heads
                print(f"  {budget}: {count} projects")
    
    print("\n" + "="*50)

# Example usage
if __name__ == "__main__":
    # Specify your input file path
    input_file = "engineering.xls"
    output_file = "engineering.xlsx"
    
    # Process the file
    consolidated_data = process_excel_file(input_file, output_file)
    
    if consolidated_data is not None:
        # Perform analysis
        analyze_consolidated_data(consolidated_data)
        
        # Optional: Save as CSV for easier viewing
        try:
            consolidated_data.to_csv("engineering.csv", index=False)
            print(f"\nAlso saved as CSV: engineering.csv")
        except Exception as e:
            print(f"Could not save CSV: {e}")