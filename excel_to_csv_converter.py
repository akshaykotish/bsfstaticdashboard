#!/usr/bin/env python3
"""
Comprehensive Excel to CSV Converter
Handles multiple sheets, various date formats, numeric cleaning, and column standardization
Designed for real-world Excel data with all its complexities
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import re
import warnings
import os
import sys
import xlrd
from pathlib import Path

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

class ExcelProcessor:
    """Main class for processing Excel files"""
    
    def __init__(self, input_file, output_csv=None, output_excel=None):
        self.input_file = input_file
        self.output_csv = output_csv or input_file.replace('.xls', '_consolidated.csv').replace('.xlsx', '_consolidated.csv')
        self.output_excel = output_excel or input_file.replace('.xls', '_consolidated.xlsx').replace('.xlsx', '_consolidated.xlsx')
        self.all_data = []
        self.consolidated_df = None
        
    def parse_date(self, date_value, workbook_datemode=0):
        """
        Parse various date formats into a standard format
        Handles Excel serial dates, string dates, and various formats
        """
        if pd.isna(date_value) or date_value == '' or date_value == 'NA':
            return None
            
        # Convert to string if not already
        date_str = str(date_value).strip()
        
        # List of values that indicate no date
        unwanted_values = [
            'nil', 'na', 'n/a', 'not applicable', 'pending', 'awaited',
            'under process', 'to be', '-', '--', '---', 'xxx', 'tbd',
            'null', 'none', '0', '0.0', 'not available', 'n.a.'
        ]
        if date_str.lower() in unwanted_values:
            return None
        
        # Check if it's a numeric value (potential Excel serial date)
        try:
            date_num = float(date_str)
            # Excel dates start from 1900-01-01 (serial number 1)
            # Serial number 25569 corresponds to 1970-01-01
            if 1 <= date_num <= 60000:  # Reasonable date range (1900 to 2064)
                try:
                    # Excel epoch starts at 1899-12-30
                    base_date = datetime(1899, 12, 30)
                    # Handle Excel's leap year bug for dates before March 1, 1900
                    if date_num < 61:
                        if date_num < 1:
                            return None
                        elif date_num < 60:
                            return base_date + timedelta(days=date_num)
                        else:  # date_num == 60 (Feb 29, 1900 - doesn't exist)
                            return base_date + timedelta(days=59)
                    else:
                        return base_date + timedelta(days=date_num - 1)
                except:
                    pass
        except:
            pass
        
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
            '%m/%d/%Y',     # 07/28/2023 (US format)
            '%m-%d-%Y',     # 07-28-2023 (US format)
            '%Y.%m.%d',     # 2023.07.28
            '%d.%b.%Y',     # 28.Jul.2023
            '%d-%b-%Y',     # 28-Jul-2023
            '%d/%b/%Y',     # 28/Jul/2023
            '%Y%m%d',       # 20230728
            '%d%m%Y',       # 28072023
        ]
        
        for fmt in date_formats:
            try:
                return pd.to_datetime(date_str, format=fmt)
            except:
                continue
        
        # Try pandas general date parser
        try:
            # Clean up the string first
            date_str = re.sub(r'GMT[+-]\d{4}.*', '', date_str).strip()
            date_str = re.sub(r'\s+\d{2}:\d{2}:\d{2}', '', date_str).strip()
            date_str = re.sub(r'[,\s]+', ' ', date_str).strip()
            
            # Handle dates like "Mon Sep 23 2024"
            if re.match(r'^[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{4}', date_str):
                date_str = ' '.join(date_str.split()[1:])
            
            # Try with dayfirst=True (most common in non-US formats)
            parsed = pd.to_datetime(date_str, dayfirst=True, errors='coerce')
            if pd.notna(parsed):
                return parsed
                
            # Try without dayfirst
            parsed = pd.to_datetime(date_str, dayfirst=False, errors='coerce')
            if pd.notna(parsed):
                return parsed
                
        except:
            pass
            
        return None
    
    def clean_numeric(self, value):
        """
        Clean numeric values and convert to float
        Handles currency symbols, percentages, and various formats
        """
        if pd.isna(value) or value == '':
            return None
            
        # Convert to string
        value_str = str(value).strip()
        
        # Check for unwanted values
        unwanted_values = [
            'nil', 'na', 'n/a', 'not applicable', 'pending',
            '-', '--', '---', 'xxx', 'null', 'none', 'n.a.'
        ]
        if value_str.lower() in unwanted_values:
            return None
        
        # Remove currency symbols and text
        value_str = re.sub(r'[₹$€£¥]', '', value_str)
        value_str = re.sub(r'(?i)\s*(rs\.?|inr|usd|eur|gbp)\s*', '', value_str)
        
        # Remove percentage sign
        value_str = value_str.replace('%', '').strip()
        
        # Remove commas (thousand separators)
        value_str = value_str.replace(',', '')
        
        # Handle Indian numbering system (lakhs and crores)
        if 'lakh' in value_str.lower():
            value_str = re.sub(r'(?i)\s*lakhs?\s*', '', value_str).strip()
            try:
                return float(value_str)
            except:
                pass
                
        if 'crore' in value_str.lower():
            value_str = re.sub(r'(?i)\s*crores?\s*', '', value_str).strip()
            try:
                return float(value_str) * 100  # Convert crore to lakh
            except:
                pass
        
        # Handle parentheses (negative numbers)
        if value_str.startswith('(') and value_str.endswith(')'):
            value_str = '-' + value_str[1:-1]
        
        # Try to convert to float
        try:
            return float(value_str)
        except:
            # Try to extract number from string
            match = re.search(r'[-+]?\d*\.?\d+', value_str)
            if match:
                try:
                    return float(match.group())
                except:
                    pass
                    
        return None
    
    def clean_text(self, value):
        """
        Clean text values
        Remove unwanted characters and standardize
        """
        if pd.isna(value):
            return ''
            
        value_str = str(value).strip()
        
        # Replace common unwanted values
        unwanted_values = [
            'nil', 'na', 'n/a', '-', '--', '---', 'null', 'none',
            '0', '0.0', 'not applicable', 'n.a.', 'nan'
        ]
        if value_str.lower() in unwanted_values:
            return ''
        
        # Clean up whitespace
        value_str = re.sub(r'\s+', ' ', value_str)
        
        # Remove leading/trailing special characters
        value_str = re.sub(r'^[^\w]+|[^\w]+$', '', value_str)
        
        return value_str
    
    def standardize_column_names(self, df):
        """
        Standardize column names across all sheets
        Handles variations and duplicates
        """
        # Comprehensive column mapping
        column_mapping = {
            # Serial number variations
            's no': 'serial_no',
            's/no': 'serial_no',
            's.no': 'serial_no',
            'sr no': 'serial_no',
            'sr.no': 'serial_no',
            'sl no': 'serial_no',
            'sl.no': 'serial_no',
            'serial no': 'serial_no',
            'serial number': 'serial_no',
            'sno': 'serial_no',
            
            # Budget head variations
            'budget head': 'budget_head',
            'budget_head': 'budget_head',
            'budgethead': 'budget_head',
            'budget': 'budget_head',
            
            # Scheme name variations
            'name of scheme': 'scheme_name',
            'scheme name': 'scheme_name',
            'name_of_scheme': 'scheme_name',
            'schemename': 'scheme_name',
            'scheme': 'scheme_name',
            
            # FTR HQ variations
            'name of ftr hq': 'ftr_hq',
            'name of ftr': 'ftr_hq',
            'ftr hq': 'ftr_hq',
            'ftrhq': 'ftr_hq',
            'name_of_ftr_hq': 'ftr_hq',
            'name_of_ftr': 'ftr_hq',
            
            # SHQ variations
            'name of shq': 'shq',
            'shq': 'shq',
            'name_of_shq': 'shq',
            's.h.q': 'shq',
            
            # Work site variations
            'name of work/site': 'work_site',
            'name of work site': 'work_site',
            'work site': 'work_site',
            'work/site': 'work_site',
            'name_of_work_site': 'work_site',
            'name_of_work/site': 'work_site',
            'worksite': 'work_site',
            'work': 'work_site',
            
            # Executive agency variations
            'executive agency': 'executive_agency',
            'exec agency': 'executive_agency',
            'executive_agency': 'executive_agency',
            'executiveagency': 'executive_agency',
            'executing agency': 'executive_agency',
            
            # AA/ES reference variations
            'ref of aa/es': 'aa_es_ref',
            'ref of aa&es': 'aa_es_ref',
            'aa/es ref': 'aa_es_ref',
            'aa&es ref': 'aa_es_ref',
            'ref_of_aa/es': 'aa_es_ref',
            'ref_of_aa&es': 'aa_es_ref',
            'reference of aa/es': 'aa_es_ref',
            'aa/es': 'aa_es_ref',
            'aa&es': 'aa_es_ref',
            
            # Sanctioned amount variations
            'sd amount': 'sanctioned_amount',
            'sd amount (in lakh)': 'sanctioned_amount',
            'sd amount\n(in lakh)': 'sanctioned_amount',
            'sanctioned amount': 'sanctioned_amount',
            'sanction amount': 'sanctioned_amount',
            'sd_amount': 'sanctioned_amount',
            'sd_amount_(in_lakh)': 'sanctioned_amount',
            'sdamount': 'sanctioned_amount',
            'amount': 'sanctioned_amount',
            
            # AA&ES pending variations
            'if aa&es not issued then, pending with hq (shq/ftr/ command/ fhq)': 'aa_es_pending_with',
            'if aa&es  not issued then, pending with hq (shq/ftr/ command/ fhq)': 'aa_es_pending_with',
            'if aa&es not issued then pending with hq': 'aa_es_pending_with',
            'aa&es pending with': 'aa_es_pending_with',
            'pending with hq': 'aa_es_pending_with',
            'pending with': 'aa_es_pending_with',
            
            # Date variations
            'date of ts': 'date_ts',
            'date_of_ts': 'date_ts',
            'ts date': 'date_ts',
            'dt of ts': 'date_ts',
            
            'date of tender': 'date_tender',
            'date_of_tender': 'date_tender',
            'tender date': 'date_tender',
            'dt of tender': 'date_tender',
            
            'date of acceptance': 'date_acceptance',
            'date_of_acceptance': 'date_acceptance',
            'acceptance date': 'date_acceptance',
            'dt of acceptance': 'date_acceptance',
            
            'date of award': 'date_award',
            'date_of_award': 'date_award',
            'award date': 'date_award',
            'dt of award': 'date_award',
            
            # Time allowed variations
            'time allowed (in days)': 'time_allowed_days',
            'time allowed (in days': 'time_allowed_days',
            'time allowed': 'time_allowed_days',
            'time_allowed_(in_days)': 'time_allowed_days',
            'time_allowed': 'time_allowed_days',
            'timeallowed': 'time_allowed_days',
            'days allowed': 'time_allowed_days',
            
            # PDC variations
            'pdc as per agreement': 'pdc_agreement',
            'pdc per agreement': 'pdc_agreement',
            'pdc_as_per_agreement': 'pdc_agreement',
            'pdc agreement': 'pdc_agreement',
            'pdc': 'pdc_agreement',
            
            'revised pdc, if date of original pdc lapsed': 'revised_pdc',
            'revised pdc if date of original pdc lapsed': 'revised_pdc',
            'revised pdc': 'revised_pdc',
            'revised_pdc': 'revised_pdc',
            'rev pdc': 'revised_pdc',
            
            'actual date of completion': 'actual_completion_date',
            'actual_date_of_completion': 'actual_completion_date',
            'actual completion date': 'actual_completion_date',
            'completion date': 'actual_completion_date',
            'date of completion': 'actual_completion_date',
            
            # Firm name variations
            'name of firm': 'firm_name',
            'firm name': 'firm_name',
            'name_of_firm': 'firm_name',
            'firmname': 'firm_name',
            'contractor': 'firm_name',
            'contractor name': 'firm_name',
            'agency': 'firm_name',
            
            # Physical progress variations
            'physical progress (%)': 'physical_progress',
            'physical progress': 'physical_progress',
            'physical_progress_(%)': 'physical_progress',
            'physical_progress': 'physical_progress',
            'progress (%)': 'physical_progress',
            'progress %': 'physical_progress',
            'progress': 'physical_progress',
            '% progress': 'physical_progress',
            
            # Progress status variations
            'whether progress is one time of slow': 'progress_status',
            'whether progress is on time of slow': 'progress_status',
            'progress status': 'progress_status',
            'whether_progress_is_one_time_of_slow': 'progress_status',
            'status': 'progress_status',
            
            # Expenditure variations
            'expdr booked upto 31.03.25': 'expdr_upto_31mar25',
            'expdr booked upto 31.03.24': 'expdr_upto_31mar25',
            'expdr booked upto 31 03 25': 'expdr_upto_31mar25',
            'expdr_booked_upto_31.03.25': 'expdr_upto_31mar25',
            'expenditure booked upto 31.03.25': 'expdr_upto_31mar25',
            'expdr upto 31.03.25': 'expdr_upto_31mar25',
            
            'expdr booked during cfy': 'expdr_cfy',
            'expdr_booked_during_cfy': 'expdr_cfy',
            'expenditure booked during cfy': 'expdr_cfy',
            'expdr during cfy': 'expdr_cfy',
            'cfy expdr': 'expdr_cfy',
            
            'total expd booked': 'total_expdr',
            'total expdr booked': 'total_expdr',
            'total_expd_booked': 'total_expdr',
            'total expenditure': 'total_expdr',
            'total expdr': 'total_expdr',
            
            '%age of expdr': 'percent_expdr',
            'percentage of expdr': 'percent_expdr',
            '%age_of_expdr': 'percent_expdr',
            '% of expdr': 'percent_expdr',
            'expdr %': 'percent_expdr',
            'expdr percentage': 'percent_expdr',
            
            # Remarks variations
            'remarks': 'remarks',
            'remark': 'remarks',
            'comments': 'remarks',
            'notes': 'remarks',
            'observation': 'remarks',
        }
        
        # Clean column names
        df.columns = df.columns.astype(str).str.strip().str.lower()
        df.columns = df.columns.str.replace('\n', ' ').str.replace('\r', ' ')
        df.columns = [re.sub(r'\s+', ' ', col) for col in df.columns]
        
        # Apply mapping
        new_columns = []
        seen_columns = {}
        
        for col in df.columns:
            col_clean = col.strip().lower()
            mapped_name = None
            
            # First try exact match
            if col_clean in column_mapping:
                mapped_name = column_mapping[col_clean]
            else:
                # Try partial matches
                for key, value in column_mapping.items():
                    if key in col_clean or col_clean in key:
                        mapped_name = value
                        break
            
            # If no mapping found, clean the original name
            if mapped_name is None:
                mapped_name = re.sub(r'[^\w\s]', '_', col_clean)
                mapped_name = re.sub(r'\s+', '_', mapped_name)
                mapped_name = re.sub(r'_+', '_', mapped_name).strip('_')
            
            # Handle duplicates
            if mapped_name in seen_columns:
                seen_columns[mapped_name] += 1
                final_name = f"{mapped_name}_{seen_columns[mapped_name]}"
            else:
                seen_columns[mapped_name] = 0
                final_name = mapped_name
            
            new_columns.append(final_name)
        
        df.columns = new_columns
        return df
    
    def process_sheet_data(self, sheet_data, sheet_name, headers=None):
        """
        Process raw sheet data into a cleaned DataFrame
        """
        if not sheet_data or len(sheet_data) < 2:
            return None
        
        # Find header row (usually first row with meaningful text)
        header_idx = 0
        if headers is None:
            for idx, row in enumerate(sheet_data[:5]):
                row_str = ' '.join(str(cell).lower() for cell in row if cell)
                if any(keyword in row_str for keyword in ['name', 'date', 'amount', 'scheme', 'budget']):
                    header_idx = idx
                    break
            headers = sheet_data[header_idx]
        
        # Create DataFrame
        data_rows = sheet_data[header_idx + 1:]
        if not data_rows:
            return None
        
        df = pd.DataFrame(data_rows, columns=headers)
        
        # Add source sheet
        df['source_sheet'] = sheet_name
        
        # Standardize column names
        df = self.standardize_column_names(df)
        
        # Process each column based on its type
        date_columns = [
            'date_ts', 'date_tender', 'date_acceptance', 'date_award',
            'pdc_agreement', 'revised_pdc', 'actual_completion_date'
        ]
        
        numeric_columns = [
            'sanctioned_amount', 'time_allowed_days', 'physical_progress',
            'expdr_upto_31mar25', 'expdr_cfy', 'total_expdr', 'percent_expdr'
        ]
        
        text_columns = [
            'serial_no', 'budget_head', 'scheme_name', 'ftr_hq', 'shq',
            'work_site', 'executive_agency', 'aa_es_ref', 'firm_name',
            'progress_status', 'remarks', 'aa_es_pending_with'
        ]
        
        # Process date columns
        for col in date_columns:
            if col in df.columns:
                df[col] = df[col].apply(self.parse_date)
        
        # Process numeric columns
        for col in numeric_columns:
            if col in df.columns:
                df[col] = df[col].apply(self.clean_numeric)
        
        # Process text columns
        for col in text_columns:
            if col in df.columns:
                df[col] = df[col].apply(self.clean_text)
        
        # Remove completely empty rows
        important_cols = ['scheme_name', 'work_site', 'sanctioned_amount', 'budget_head']
        existing_cols = [col for col in important_cols if col in df.columns]
        
        if existing_cols:
            # Keep rows where at least one important column has data
            mask = pd.Series([False] * len(df))
            for col in existing_cols:
                if col in ['sanctioned_amount']:
                    mask = mask | df[col].notna()
                else:
                    mask = mask | ((df[col] != '') & df[col].notna())
            df = df[mask]
        
        return df if len(df) > 0 else None
    
    def read_excel_file(self):
        """
        Read Excel file using multiple methods for compatibility
        """
        print(f"Reading: {self.input_file}")
        print("=" * 70)
        
        # Try xlrd for .xls files
        if self.input_file.lower().endswith('.xls'):
            try:
                workbook = xlrd.open_workbook(self.input_file, formatting_info=False)
                print(f"Successfully opened with xlrd: {workbook.nsheets} sheets")
                
                for sheet_idx in range(workbook.nsheets):
                    sheet = workbook.sheet_by_index(sheet_idx)
                    sheet_name = sheet.name
                    print(f"\nProcessing sheet: {sheet_name}")
                    print(f"  Dimensions: {sheet.nrows} rows × {sheet.ncols} columns")
                    
                    if sheet.nrows < 2 or sheet.ncols < 3:
                        print(f"  Skipping - insufficient data")
                        continue
                    
                    # Extract data
                    sheet_data = []
                    for row_idx in range(sheet.nrows):
                        row_data = []
                        for col_idx in range(sheet.ncols):
                            cell = sheet.cell(row_idx, col_idx)
                            value = cell.value
                            
                            # Handle dates
                            if cell.ctype == xlrd.XL_CELL_DATE:
                                date_tuple = xlrd.xldate_as_tuple(value, workbook.datemode)
                                value = datetime(*date_tuple)
                            
                            row_data.append(value)
                        sheet_data.append(row_data)
                    
                    # Process sheet
                    df = self.process_sheet_data(sheet_data, sheet_name)
                    if df is not None:
                        self.all_data.append(df)
                        print(f"  Extracted {len(df)} valid rows")
                    else:
                        print(f"  No valid data found")
                        
                return True
                
            except Exception as e:
                print(f"xlrd failed: {e}")
        
        # Try pandas with different engines
        engines = ['openpyxl', 'xlrd', None]
        for engine in engines:
            try:
                engine_str = engine or 'default'
                print(f"\nTrying pandas with {engine_str} engine...")
                
                excel_file = pd.ExcelFile(self.input_file, engine=engine)
                print(f"Successfully opened: {len(excel_file.sheet_names)} sheets")
                
                for sheet_name in excel_file.sheet_names:
                    print(f"\nProcessing sheet: {sheet_name}")
                    
                    try:
                        df = pd.read_excel(excel_file, sheet_name=sheet_name, header=0)
                        
                        if df.shape[0] < 1 or df.shape[1] < 3:
                            print(f"  Skipping - insufficient data")
                            continue
                        
                        # Add source sheet
                        df['source_sheet'] = sheet_name
                        
                        # Standardize columns
                        df = self.standardize_column_names(df)
                        
                        # Process columns
                        processed_df = self.process_dataframe(df)
                        
                        if processed_df is not None and len(processed_df) > 0:
                            self.all_data.append(processed_df)
                            print(f"  Extracted {len(processed_df)} valid rows")
                        else:
                            print(f"  No valid data found")
                            
                    except Exception as e:
                        print(f"  Error processing sheet: {e}")
                        continue
                
                return True
                
            except Exception as e:
                print(f"Engine {engine} failed: {e}")
                continue
        
        return False
    
    def process_dataframe(self, df):
        """
        Process a pandas DataFrame
        """
        # Remove empty rows
        df = df.dropna(how='all')
        
        # Process date columns
        date_columns = [
            'date_ts', 'date_tender', 'date_acceptance', 'date_award',
            'pdc_agreement', 'revised_pdc', 'actual_completion_date'
        ]
        
        for col in date_columns:
            if col in df.columns:
                df[col] = df[col].apply(self.parse_date)
        
        # Process numeric columns
        numeric_columns = [
            'sanctioned_amount', 'time_allowed_days', 'physical_progress',
            'expdr_upto_31mar25', 'expdr_cfy', 'total_expdr', 'percent_expdr'
        ]
        
        for col in numeric_columns:
            if col in df.columns:
                df[col] = df[col].apply(self.clean_numeric)
        
        # Process text columns
        text_columns = [
            'serial_no', 'budget_head', 'scheme_name', 'ftr_hq', 'shq',
            'work_site', 'executive_agency', 'aa_es_ref', 'firm_name',
            'progress_status', 'remarks', 'aa_es_pending_with'
        ]
        
        for col in text_columns:
            if col in df.columns:
                df[col] = df[col].apply(self.clean_text)
        
        # Filter valid rows
        important_cols = ['scheme_name', 'work_site', 'sanctioned_amount']
        existing_cols = [col for col in important_cols if col in df.columns]
        
        if existing_cols:
            mask = pd.Series([False] * len(df))
            for col in existing_cols:
                if col == 'sanctioned_amount':
                    mask = mask | df[col].notna()
                else:
                    mask = mask | ((df[col] != '') & df[col].notna())
            df = df[mask]
        
        return df if len(df) > 0 else None
    
    def consolidate_data(self):
        """
        Consolidate all processed sheets into a single DataFrame
        """
        if not self.all_data:
            print("\nNo valid data to consolidate!")
            return False
        
        print(f"\n{'=' * 70}")
        print(f"Consolidating {len(self.all_data)} sheets...")
        
        # Get all unique columns
        all_columns = set()
        for df in self.all_data:
            all_columns.update(df.columns)
        
        # Ensure all DataFrames have the same columns
        for i, df in enumerate(self.all_data):
            for col in all_columns:
                if col not in df.columns:
                    df[col] = np.nan
            self.all_data[i] = df
        
        # Concatenate all data
        self.consolidated_df = pd.concat(self.all_data, ignore_index=True, sort=False)
        
        # Define column order
        primary_columns = [
            'source_sheet', 'serial_no', 'budget_head', 'scheme_name',
            'ftr_hq', 'shq', 'work_site', 'executive_agency',
            'aa_es_ref', 'sanctioned_amount', 'aa_es_pending_with',
            'date_ts', 'date_tender', 'date_acceptance', 'date_award',
            'time_allowed_days', 'pdc_agreement', 'revised_pdc',
            'actual_completion_date', 'firm_name', 'physical_progress',
            'progress_status', 'expdr_upto_31mar25', 'expdr_cfy',
            'total_expdr', 'percent_expdr', 'remarks'
        ]
        
        # Reorder columns
        ordered_columns = [col for col in primary_columns if col in self.consolidated_df.columns]
        remaining_columns = [col for col in self.consolidated_df.columns if col not in ordered_columns]
        self.consolidated_df = self.consolidated_df[ordered_columns + remaining_columns]
        
        print(f"Consolidation complete: {len(self.consolidated_df)} total records")
        return True
    
    def save_output(self):
        """
        Save consolidated data to CSV and Excel formats
        """
        if self.consolidated_df is None or len(self.consolidated_df) == 0:
            print("No data to save!")
            return False
        
        # Create output directory if needed
        output_dir = os.path.dirname(self.output_csv)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        # Format dates for output
        date_columns = [
            'date_ts', 'date_tender', 'date_acceptance', 'date_award',
            'pdc_agreement', 'revised_pdc', 'actual_completion_date'
        ]
        
        for col in date_columns:
            if col in self.consolidated_df.columns:
                self.consolidated_df[col] = pd.to_datetime(self.consolidated_df[col], errors='coerce')
                self.consolidated_df[col] = self.consolidated_df[col].apply(
                    lambda x: x.strftime('%d-%m-%Y') if pd.notna(x) else ''
                )
        
        # Save to CSV
        print(f"\nSaving CSV to: {self.output_csv}")
        self.consolidated_df.to_csv(self.output_csv, index=False, encoding='utf-8-sig')
        
        # Save to Excel with formatting
        try:
            print(f"Saving Excel to: {self.output_excel}")
            with pd.ExcelWriter(self.output_excel, engine='openpyxl') as writer:
                # Main data sheet
                self.consolidated_df.to_excel(writer, sheet_name='Consolidated_Data', index=False)
                
                # Create summary sheet
                summary_df = self.create_summary()
                summary_df.to_excel(writer, sheet_name='Summary', index=False)
                
                # Create sheet-wise summary
                sheet_summary = self.create_sheet_summary()
                sheet_summary.to_excel(writer, sheet_name='Sheet_Summary', index=False)
                
            print("Excel file saved successfully")
        except Exception as e:
            print(f"Could not save Excel file: {e}")
        
        return True
    
    def create_summary(self):
        """
        Create summary statistics
        """
        summary_data = []
        df = self.consolidated_df
        
        summary_data.append(['Total Records', len(df)])
        summary_data.append(['Total Sheets', df['source_sheet'].nunique() if 'source_sheet' in df.columns else 0])
        
        # Unique counts
        for col in ['scheme_name', 'work_site', 'firm_name']:
            if col in df.columns:
                unique_count = df[df[col] != ''][col].nunique() if col in df.columns else 0
                summary_data.append([f'Unique {col.replace("_", " ").title()}', unique_count])
        
        # Financial summary
        if 'sanctioned_amount' in df.columns:
            amounts = pd.to_numeric(df['sanctioned_amount'], errors='coerce')
            amounts = amounts[amounts > 0]
            if len(amounts) > 0:
                summary_data.append(['Total Sanctioned Amount (Lakhs)', f"{amounts.sum():,.2f}"])
                summary_data.append(['Average Sanctioned Amount (Lakhs)', f"{amounts.mean():,.2f}"])
                summary_data.append(['Max Sanctioned Amount (Lakhs)', f"{amounts.max():,.2f}"])
                summary_data.append(['Min Sanctioned Amount (Lakhs)', f"{amounts.min():,.2f}"])
        
        # Progress summary
        if 'physical_progress' in df.columns:
            progress = pd.to_numeric(df['physical_progress'], errors='coerce')
            progress = progress[progress.notna()]
            if len(progress) > 0:
                summary_data.append(['Average Physical Progress (%)', f"{progress.mean():,.2f}"])
                summary_data.append(['Projects 100% Complete', len(progress[progress == 100])])
                summary_data.append(['Projects In Progress', len(progress[(progress > 0) & (progress < 100)])])
                summary_data.append(['Projects Not Started', len(progress[progress == 0])])
        
        return pd.DataFrame(summary_data, columns=['Metric', 'Value'])
    
    def create_sheet_summary(self):
        """
        Create sheet-wise summary
        """
        df = self.consolidated_df
        summary_data = []
        
        if 'source_sheet' in df.columns:
            for sheet in df['source_sheet'].unique():
                sheet_df = df[df['source_sheet'] == sheet]
                
                # Calculate metrics
                record_count = len(sheet_df)
                
                total_amount = 0
                if 'sanctioned_amount' in df.columns:
                    amounts = pd.to_numeric(sheet_df['sanctioned_amount'], errors='coerce')
                    total_amount = amounts.sum() if len(amounts) > 0 else 0
                
                avg_progress = 0
                if 'physical_progress' in df.columns:
                    progress = pd.to_numeric(sheet_df['physical_progress'], errors='coerce')
                    avg_progress = progress.mean() if len(progress) > 0 else 0
                
                summary_data.append({
                    'Sheet Name': sheet,
                    'Record Count': record_count,
                    'Total Sanctioned Amount': f"{total_amount:,.2f}",
                    'Avg Physical Progress': f"{avg_progress:,.2f}"
                })
        
        return pd.DataFrame(summary_data)
    
    def print_analysis(self):
        """
        Print detailed analysis of the consolidated data
        """
        df = self.consolidated_df
        
        print("\n" + "=" * 70)
        print("DATA ANALYSIS SUMMARY")
        print("=" * 70)
        
        # Basic statistics
        print(f"\n📊 Basic Statistics:")
        print(f"  • Total Records: {len(df):,}")
        print(f"  • Total Columns: {len(df.columns)}")
        print(f"  • Sheets Processed: {df['source_sheet'].nunique() if 'source_sheet' in df.columns else 0}")
        
        # Data quality
        print(f"\n📋 Data Quality Report:")
        key_columns = ['scheme_name', 'work_site', 'sanctioned_amount', 'physical_progress']
        for col in key_columns:
            if col in df.columns:
                if col in ['sanctioned_amount', 'physical_progress']:
                    non_empty = pd.to_numeric(df[col], errors='coerce').notna().sum()
                else:
                    non_empty = df[(df[col] != '') & df[col].notna()][col].count()
                percent = (non_empty / len(df)) * 100 if len(df) > 0 else 0
                print(f"  • {col.replace('_', ' ').title():30s}: {non_empty:5,} records ({percent:5.1f}% filled)")
        
        # Financial summary
        if 'sanctioned_amount' in df.columns:
            amounts = pd.to_numeric(df['sanctioned_amount'], errors='coerce')
            amounts = amounts[amounts > 0]
            if len(amounts) > 0:
                print(f"\n💰 Financial Summary:")
                print(f"  • Total Sanctioned: ₹{amounts.sum():,.2f} Lakhs")
                print(f"  • Average Amount: ₹{amounts.mean():,.2f} Lakhs")
                print(f"  • Maximum Amount: ₹{amounts.max():,.2f} Lakhs")
                print(f"  • Minimum Amount: ₹{amounts.min():,.2f} Lakhs")
        
        # Progress summary
        if 'physical_progress' in df.columns:
            progress = pd.to_numeric(df['physical_progress'], errors='coerce')
            progress = progress[progress.notna()]
            if len(progress) > 0:
                print(f"\n📈 Progress Summary:")
                print(f"  • Average Progress: {progress.mean():,.2f}%")
                print(f"  • Completed (100%): {len(progress[progress == 100]):,} projects")
                print(f"  • In Progress: {len(progress[(progress > 0) & (progress < 100)]):,} projects")
                print(f"  • Not Started (0%): {len(progress[progress == 0]):,} projects")
        
        print("\n" + "=" * 70)
    
    def process(self):
        """
        Main processing function
        """
        print(f"\n🚀 Starting Excel to CSV Conversion")
        print(f"   Input: {self.input_file}")
        
        # Check if input file exists
        if not os.path.exists(self.input_file):
            print(f"❌ Error: Input file not found: {self.input_file}")
            return False
        
        # Read Excel file
        if not self.read_excel_file():
            print("❌ Failed to read Excel file")
            return False
        
        # Consolidate data
        if not self.consolidate_data():
            print("❌ Failed to consolidate data")
            return False
        
        # Save output
        if not self.save_output():
            print("❌ Failed to save output files")
            return False
        
        # Print analysis
        self.print_analysis()
        
        print(f"\n✅ Conversion completed successfully!")
        print(f"   CSV Output: {self.output_csv}")
        print(f"   Excel Output: {self.output_excel}")
        
        return True


def main():
    """
    Main execution function
    """
    # Default file paths
    input_file = './engineering.xls'
    output_csv = './engineering_consolidated.csv'
    output_excel = './engineering_consolidated.xlsx'
    
    # Allow command-line arguments
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    if len(sys.argv) > 2:
        output_csv = sys.argv[2]
    if len(sys.argv) > 3:
        output_excel = sys.argv[3]
    
    # Create processor and run
    processor = ExcelProcessor(input_file, output_csv, output_excel)
    success = processor.process()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
