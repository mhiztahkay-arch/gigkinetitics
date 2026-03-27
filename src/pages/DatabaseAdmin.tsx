import { useState, useEffect } from 'react';
import { Database, Table, Play, RefreshCw, ChevronRight, AlertCircle, Search, Download, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';
import { useAuth } from '../lib/AuthContext';
import { Navigate } from 'react-router-dom';

export default function DatabaseAdmin() {
  const { theme } = useTheme();
  const { dbUser } = useAuth();
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<{ columns: any[], rows: any[] } | null>(null);
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/admin/db/tables');
      if (res.ok) {
        setTables(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch tables', err);
    }
  };

  const fetchTableData = async (tableName: string) => {
    setLoading(true);
    setSelectedTable(tableName);
    setError(null);
    try {
      const res = await fetch(`/api/admin/db/tables/${tableName}`);
      if (res.ok) {
        setTableData(await res.json());
      } else {
        const err = await res.json();
        setError(err.error);
      }
    } catch (err) {
      setError('Failed to fetch table data');
    } finally {
      setLoading(false);
    }
  };

  const handleRunQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setQueryResult(null);
    try {
      const res = await fetch('/api/admin/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (res.ok) {
        setQueryResult(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  if (!dbUser?.is_admin) {
    return <Navigate to="/" />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-black text-white' : 'bg-neutral-50 text-neutral-900'} p-4 sm:p-8`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
              <Database size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Database Admin</h1>
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Direct SQLite Access</p>
            </div>
          </div>
          <button 
            onClick={fetchTables}
            className={`p-3 rounded-xl transition-all ${theme === 'dark' ? 'glass hover:bg-white/5' : 'bg-white border shadow-sm hover:bg-neutral-50'}`}
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar: Tables List */}
          <div className="lg:col-span-1 space-y-4">
            <div className={`p-6 rounded-[32px] border ${theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
              <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4">Tables</h3>
              <div className="space-y-1">
                {tables.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => fetchTableData(t.name)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${
                      selectedTable === t.name 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                        : theme === 'dark' ? 'hover:bg-white/5 text-neutral-400' : 'hover:bg-neutral-50 text-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Table size={16} />
                      {t.name}
                    </div>
                    <ChevronRight size={14} className={selectedTable === t.name ? 'opacity-100' : 'opacity-0'} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content: Table Viewer & Query Runner */}
          <div className="lg:col-span-3 space-y-8">
            {/* Query Runner */}
            <div className={`p-6 rounded-[32px] border space-y-4 ${theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">SQL Query Runner</h3>
                <button 
                  onClick={handleRunQuery}
                  disabled={loading || !query.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  <Play size={14} />
                  Run Query
                </button>
              </div>
              <textarea 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SELECT * FROM users WHERE is_admin = 1;"
                className={`w-full h-32 rounded-2xl p-4 font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  theme === 'dark' ? 'bg-black/50 border-white/10 text-emerald-400' : 'bg-neutral-50 border-neutral-200 text-emerald-700'
                }`}
              />
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </div>

            {/* Table/Query Results */}
            <div className={`rounded-[32px] border overflow-hidden ${theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest">
                  {queryResult ? 'Query Results' : selectedTable ? `Table: ${selectedTable}` : 'Select a table or run a query'}
                </h3>
                {tableData && (
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input 
                      type="text" 
                      placeholder="Filter rows..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`pl-9 pr-4 py-1.5 rounded-lg text-[10px] outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                        theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-900'
                      }`}
                    />
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
                      {(queryResult && queryResult.length > 0 ? Object.keys(queryResult[0]) : tableData?.columns.map(c => c.name) || []).map((col) => (
                        <th key={col} className="px-6 py-4 whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(queryResult || tableData?.rows || []).filter(row => 
                      Object.values(row).some(val => String(val).toLowerCase().includes(search.toLowerCase()))
                    ).map((row: any, i: number) => (
                      <tr key={i} className="group hover:bg-white/5 transition-colors">
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} className="px-6 py-4 text-xs font-medium text-neutral-400 max-w-xs truncate">
                            {val === null ? <span className="text-neutral-700 italic">null</span> : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!(queryResult || tableData) && (
                  <div className="py-20 text-center">
                    <Database size={48} className="text-neutral-800 mx-auto mb-4 opacity-20" />
                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No data to display</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
