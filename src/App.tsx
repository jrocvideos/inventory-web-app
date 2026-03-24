import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import axios from 'axios'

interface ProcessingResult {
  success: boolean
  message: string
  downloadUrl?: string
}

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [columnConfig, setColumnConfig] = useState({
    quantity: 'Quantity',
    code: 'Code'
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0]
    if (uploadedFile?.name.match(/\.(xlsx|xls)$/)) {
      setFile(uploadedFile)
      setError(null)
      setResult(null)
    } else {
      setError('Please upload a valid Excel file (.xlsx or .xls)')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  })

  const processFile = async () => {
    if (!file) return
    
    setLoading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('quantity_col', columnConfig.quantity)
    formData.append('code_col', columnConfig.code)

    try {
      const response = await axios.post('/api/process', formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', file.name.replace('.xlsx', '_Processed.xlsx'))
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setResult({
        success: true,
        message: 'File processed successfully! Download started.'
      })
    } catch (err: any) {
      if (err.response?.data) {
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string)
            setError(errorData.detail || 'Processing failed')
          } catch {
            setError('Processing failed')
          }
        }
        reader.readAsText(err.response.data)
      } else {
        setError(err.message || 'Network error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Inventory Processor
          </h1>
          <p className="text-slate-400 text-lg">
            Clean, summarize & validate Excel inventory files instantly
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6 md:p-8 shadow-2xl">
          
          {/* Column Configuration */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Quantity Column Name
              </label>
              <input
                type="text"
                value={columnConfig.quantity}
                onChange={(e) => setColumnConfig(prev => ({ ...prev, quantity: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g., Qty, Amount"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Code Column Name
              </label>
              <input
                type="text"
                value={columnConfig.code}
                onChange={(e) => setColumnConfig(prev => ({ ...prev, code: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g., SKU, Item Code"
              />
            </div>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragActive 
                ? 'border-emerald-500 bg-emerald-500/10' 
                : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            {isDragActive ? (
              <p className="text-emerald-400 font-medium">Drop the file here...</p>
            ) : (
              <div>
                <p className="text-slate-300 font-medium mb-1">
                  Drag & drop your Excel file here
                </p>
                <p className="text-slate-500 text-sm">
                  or click to browse (.xlsx, .xls)
                </p>
              </div>
            )}
          </div>

          {/* File Preview */}
          {file && (
            <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="font-medium text-slate-200">{file.name}</p>
                  <p className="text-sm text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-slate-400 hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            </div>
          )}

          {/* Process Button */}
          {file && (
            <button
              onClick={processFile}
              disabled={loading}
              className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Inventory...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Process & Download
                </>
              )}
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {result?.success && (
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-lg flex items-center gap-3 text-emerald-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p>{result.message}</p>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-emerald-400 font-bold">1</span>
            </div>
            <h3 className="font-semibold text-slate-200 mb-1">Clean Data</h3>
            <p className="text-sm text-slate-500">Auto-convert quantities & strip whitespace</p>
          </div>
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-cyan-400 font-bold">2</span>
            </div>
            <h3 className="font-semibold text-slate-200 mb-1">Summarize</h3>
            <p className="text-sm text-slate-500">Sum quantities by unique code</p>
          </div>
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-400 font-bold">3</span>
            </div>
            <h3 className="font-semibold text-slate-200 mb-1">Detect Duplicates</h3>
            <p className="text-sm text-slate-500">Identify repeated code entries</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 mt-8 text-sm">
          Optimized for Vercel Edge • Processes files in-memory securely
        </p>
      </div>
    </div>
  )
}

export default App
