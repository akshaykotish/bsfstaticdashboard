import pandas as pd
import numpy as np
import re

def clean_text_remove_commas(text):
    if pd.isna(text):
        return ''
    text = str(text)
    if text == 'nan':
        return ''
    text = text.replace('\r\n', ' ')
    text = text.replace('\n', ' ')
    text = text.replace('\r', ' ')
    text = text.replace(',', ';')
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    return text

def process_excel_to_csv(excel_file_path, output_csv_path):
    excel_file = pd.ExcelFile(excel_file_path)
    sheet_names = excel_file.sheet_names
    
    all_dataframes = []
    
    for sheet_name in sheet_names:
        df = pd.read_excel(excel_file_path, sheet_name=sheet_name)
        
        if df.empty:
            continue
        
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].apply(clean_text_remove_commas)
        
        new_columns = []
        for col in df.columns:
            new_col = str(col).replace('\n', ' ').replace('\r', ' ').replace(',', ';')
            new_col = re.sub(r'\s+', ' ', new_col).strip()
            new_columns.append(new_col)
        df.columns = new_columns
        
        column_mapping = {
            'S/No.': 'S_No',
            'NAME OF BOP': 'NAME_OF_WORK',
            'PARTICULAR': 'NAME_OF_WORK',
            'FTR': 'FRONTIER',
            'SHQ': 'SECTOR_HQ',
            'LENGTH (IN KM)': 'LENGTH_KM',
            'UNITS AOR': 'UNITS_AOR',
            'UNIT': 'UNITS_AOR',
            'HLEC/YEAR': 'HLEC_YEAR',
            'SANCTIONED AMOUNT (in Cr)': 'SANCTIONED_AMOUNT_CR',
            'APPROVED AMOUNT': 'SANCTIONED_AMOUNT_CR',
            'SDC': 'SDC',
            'PDC': 'PDC',
            'COMPLETED IN %': 'COMPLETED_PERCENTAGE',
            'COMPLETED %': 'COMPLETED_PERCENTAGE',
            'REMARKS': 'REMARKS',
            'PROGRESS': 'REMARKS'
        }
        
        df = df.rename(columns=column_mapping)
        
        df['SOURCE_SHEET'] = sheet_name.strip().replace(',', ';')
        df['WORK_TYPE'] = sheet_name.strip().upper().replace(',', ';')
        
        if 'S_No' in df.columns:
            df['S_No'] = df['S_No'].ffill()
        
        all_dataframes.append(df)
    
    merged_df = pd.concat(all_dataframes, ignore_index=True, sort=False)
    
    priority_columns = [
        'S_No', 'WORK_TYPE', 'SOURCE_SHEET', 'NAME_OF_WORK',
        'FRONTIER', 'SECTOR_HQ', 'LENGTH_KM', 'UNITS_AOR',
        'HLEC_YEAR', 'SANCTIONED_AMOUNT_CR', 'SDC', 'PDC',
        'COMPLETED_PERCENTAGE', 'REMARKS'
    ]
    
    existing_priority_cols = [col for col in priority_columns if col in merged_df.columns]
    other_cols = [col for col in merged_df.columns if col not in existing_priority_cols]
    merged_df = merged_df[existing_priority_cols + other_cols]
    
    numeric_columns = ['S_No', 'LENGTH_KM', 'SANCTIONED_AMOUNT_CR', 'COMPLETED_PERCENTAGE']
    for col in numeric_columns:
        if col in merged_df.columns:
            merged_df[col] = pd.to_numeric(merged_df[col], errors='coerce')
    
    merged_df.to_csv(output_csv_path, index=False, encoding='utf-8')

# Input file: oops.xlsx or oops.xls
# Output file: oops.csv

import os

if os.path.exists('oops.xlsx'):
    input_file = 'oops.xlsx'
elif os.path.exists('oops.xls'):
    input_file = 'oops.xls'
else:
    print("Input file not found. Please ensure oops.xlsx or oops.xls exists.")
    exit()

output_file = 'oops.csv'

process_excel_to_csv(input_file, output_file)