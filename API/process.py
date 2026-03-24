
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import io
from typing import Optional

app = FastAPI()

# CORS for Vercel deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/process")
async def process_inventory(
    file: UploadFile = File(...),
    quantity_col: Optional[str] = "Quantity",
    code_col: Optional[str] = "Code"
):
    """
    Process Excel inventory file:
    1. Clean and validate data
    2. Summarize by Code
    3. Identify duplicates
    """
    try:
        # Read uploaded file
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Validate columns
        if quantity_col not in df.columns or code_col not in df.columns:
            available = list(df.columns)
            raise HTTPException(
                status_code=400, 
                detail=f"Columns not found. Available: {available}. Expected: {quantity_col}, {code_col}"
            )
        
        # Data cleaning (from your Kivy app)
        df[quantity_col] = pd.to_numeric(df[quantity_col], errors='coerce')
        df[code_col] = df[code_col].astype(str).str.strip()
        
        # Remove rows with null quantities
        df_clean = df.dropna(subset=[quantity_col]).copy()
        
        # Summary by Code (sum quantities)
        summary = df_clean.groupby(code_col, as_index=False)[quantity_col].sum()
        summary = summary.sort_values(by=quantity_col, ascending=False)
        
        # Find duplicates (same Code appearing multiple times)
        duplicates = df_clean[df_clean.duplicated(subset=[code_col], keep=False)]
        duplicates = duplicates.sort_values(by=[code_col, quantity_col])
        
        # Create Excel output in memory
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df_clean.to_excel(writer, sheet_name="Cleaned Data", index=False)
            summary.to_excel(writer, sheet_name="Summary by Code", index=False)
            duplicates.to_excel(writer, sheet_name="Duplicates", index=False)
            
            # Add formatting info sheet
            info_data = {
                'Metric': ['Total Rows (Original)', 'Valid Rows', 'Unique Codes', 'Duplicate Codes', 'Total Quantity'],
                'Value': [
                    len(df),
                    len(df_clean),
                    df_clean[code_col].nunique(),
                    len(duplicates[code_col].unique()) if not duplicates.empty else 0,
                    df_clean[quantity_col].sum()
                ]
            }
            pd.DataFrame(info_data).to_excel(writer, sheet_name="Summary Stats", index=False)
        
        output.seek(0)
        
        # Return as downloadable file
        filename = file.filename.replace('.xlsx', '_Processed.xlsx').replace('.xls', '_Processed.xlsx')
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health check
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "inventory-processor"}
