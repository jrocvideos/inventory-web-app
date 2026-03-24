import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, X, Loader2 } from 'lucide-react'

interface FileUploaderProps {
  onProcess: (file: File, config: ColumnConfig) => void
  loading: boolean
}

export interface ColumnConfig {
  quantity: string
  code: string
}

export function FileUploader({ onProcess, loading }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [config, setConfig] = useState<ColumnConfig>({
    quantity: 'Quantity',
    code: 'Code'
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploaded = acceptedFiles[0]
    if (uploaded?.name.match(/\.(xlsx|xls)$/)) {
      setFile(uploaded)
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

  const handleProcess = () => {
    if (file) onProcess(file, config)
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Quantity Column
          </label>
          <input
            type="text"
            value={config.quantity}
            onChange={(e) => setConfig(prev => ({ ...prev, quantity: e.target.value }))}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Code Column
          </label>
          <input
            type="text"
            value={config.code}
            onChange={(e) => setConfig(prev => ({ ...prev, code: e.target.value }))}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive 
            ? 'border-emerald-500 bg-emerald-500/10' 
            : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        {isDragActive ? (
          <p className="text-emerald-400 font-medium">Drop here...</p>
        ) : (
          <>
            <p className="text-slate-300 font-medium">Drag & drop Excel file</p>
            <p className="text-slate-500 text-sm">or click to browse</p>
          </>
        )}
      </div>

      {file && (
        <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="font-medium text-slate-200">{file.name}</p>
              <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button 
            onClick={() => setFile(null)}
            className="text-slate-400 hover:text-red-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {file && (
        <button
          onClick={handleProcess}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
          ) : (
            "Process Inventory"
          )}
        </button>
      )}
    </div>
  )
}



