import { CheckCircle, AlertCircle, Download } from 'lucide-react'

interface Stats {
  total_rows: number
  valid_rows: number
  unique_codes: number
  duplicate_codes: number
  total_quantity: number
}

interface ResultsTableProps {
  stats: Stats | null
  error: string | null
  filename: string | null
}

export function ResultsTable({ stats, error, filename }: ResultsTableProps) {
  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400">
        <AlertCircle className="w-5 h-5" />
        <p>{error}</p>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-lg flex items-center gap-3 text-emerald-400">
        <CheckCircle className="w-5 h-5" />
        <div>
          <p className="font-medium">Processing Complete!</p>
          <p className="text-sm opacity-80">{filename} downloaded</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Rows" value={stats.total_rows} />
        <StatCard label="Valid Rows" value={stats.valid_rows} />
        <StatCard label="Unique Codes" value={stats.unique_codes} />
        <StatCard label="Total Quantity" value={stats.total_quantity.toFixed(0)} />
      </div>

      {stats.duplicate_codes > 0 && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
          ⚠️ Found {stats.duplicate_codes} duplicate codes - check "Duplicates" sheet
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center">
      <p className="text-2xl font-bold text-emerald-400">{value}</p>
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  )
}
