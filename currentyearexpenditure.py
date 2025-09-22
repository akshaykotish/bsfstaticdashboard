import pandas as pd

# Read the Excel file
df = pd.read_excel('CURRENT YEAR EXPENDITURE.xlsx')

# Save as CSV
df.to_csv('CURRENT_YEAR_EXPENDITURE.csv', index=False)

print("Conversion complete!")