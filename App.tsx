import React, { useState, useRef, useCallback } from 'react';
import { 
  Search, 
  Upload, 
  Download, 
  RefreshCw, 
  ShoppingBag, 
  Percent, 
  AlertCircle, 
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import StatsCard from './components/StatsCard';
import ResultsTable from './components/ResultsTable';
import { ProductData, ScrapeStats } from './types';
import { analyzeAsin } from './services/productService';

const App: React.FC = () => {
  const [inputAsins, setInputAsins] = useState<string>('');
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats: ScrapeStats = {
    total: products.length,
    processed: products.length, // Simplified for this demo
    success: products.filter(p => p.status !== 'error').length,
    failed: products.filter(p => p.status === 'error').length,
    discountsFound: products.filter(p => p.status === 'active_discount').length
  };

  const processAsinList = async (list: string[]) => {
    setLoading(true);
    setProgress(0);
    const uniqueAsins = [...new Set(list.filter(a => a.trim().length > 0))];
    const total = uniqueAsins.length;
    
    if (total === 0) {
        setLoading(false);
        return;
    }

    const newProducts: ProductData[] = [];

    // Process in sequence to respect rate limits (simulated)
    for (let i = 0; i < total; i++) {
        const asin = uniqueAsins[i];
        try {
            const data = await analyzeAsin(asin);
            newProducts.push(data);
            // Append immediately to state for better UX
            setProducts(prev => [data, ...prev]); 
        } catch (e) {
            console.error(`Error processing ${asin}`, e);
        }
        setProgress(Math.round(((i + 1) / total) * 100));
    }

    setLoading(false);
  };

  const handleManualSearch = () => {
    const list = inputAsins.split(/[\n,]+/).map(s => s.trim());
    processAsinList(list);
    setInputAsins(''); // Clear input after start
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Assume CSV with single column or simple list
      const list = text.split(/[\r\n,]+/).map(s => s.trim());
      processAsinList(list);
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = (format: 'csv' | 'xls') => {
    if (products.length === 0) return;

    const headers = ["ASIN", "Title", "Current Price", "MRP", "Has Coupon", "Coupon Value", "Deal Type", "Final Price", "Status"];
    const rows = products.map(p => [
        p.asin,
        `"${p.title.replace(/"/g, '""')}"`, // Escape quotes
        p.currentPrice,
        p.mrp,
        p.hasCoupon ? "Yes" : "No",
        p.couponValue || "",
        p.dealType,
        p.finalPrice,
        p.status
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `amazon_discounts_${new Date().toISOString().slice(0,10)}.${format === 'xls' ? 'csv' : 'csv'}`); // Simplified to CSV for browser demo
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ShoppingBag className="w-8 h-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">AmzDiscount<span className="text-indigo-600">Hunter</span></span>
            </div>
            <div className="flex items-center space-x-4">
               <button 
                onClick={() => handleExport('csv')}
                disabled={products.length === 0}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50"
               >
                 <Download className="w-4 h-4 mr-2" />
                 Export CSV
               </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            title="Total Analyzed" 
            value={stats.total} 
            icon={Search} 
            colorClass="bg-blue-500" 
          />
          <StatsCard 
            title="Active Discounts" 
            value={stats.discountsFound} 
            icon={Percent} 
            colorClass="bg-green-500"
            trend={`${stats.total > 0 ? Math.round((stats.discountsFound/stats.total)*100) : 0}% success rate`}
          />
          <StatsCard 
            title="Processing" 
            value={loading ? "Active" : "Idle"} 
            icon={RefreshCw} 
            colorClass={loading ? "bg-amber-500 animate-spin" : "bg-gray-400"} 
          />
          <StatsCard 
            title="Failed/Invalid" 
            value={stats.failed} 
            icon={AlertCircle} 
            colorClass="bg-red-500" 
          />
        </div>

        {/* Action Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Manual Input */}
            <div className="flex-1">
              <label htmlFor="asin-input" className="block text-sm font-medium text-gray-700 mb-2">
                Enter ASINs (one per line or comma separated)
              </label>
              <div className="relative rounded-md shadow-sm">
                <textarea
                  id="asin-input"
                  rows={4}
                  className="block w-full rounded-md border-gray-300 pl-3 pr-3 py-2 border focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm resize-none"
                  placeholder="B08N5XSG8Z, B09G9F5W3J..."
                  value={inputAsins}
                  onChange={(e) => setInputAsins(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleManualSearch}
                  disabled={loading || !inputAsins}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Analyze ASINs'}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center md:flex-col">
              <div className="border-t md:border-l border-gray-200 h-px md:h-full w-full md:w-px mx-4"></div>
              <span className="text-gray-400 text-xs font-medium uppercase px-2 bg-white -mt-2.5 md:-mt-0 md:-ml-2.5">Or</span>
            </div>

            {/* Bulk Upload */}
            <div className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4 flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className={`relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <span>Upload a file</span>
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    accept=".csv,.txt"
                    className="sr-only" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    disabled={loading}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">CSV or TXT containing list of ASINs</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          {loading && (
            <div className="mt-6">
               <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                 <span>Processing...</span>
                 <span>{progress}%</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                    style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Analysis Results</h2>
            {products.length > 0 && (
                <button 
                    onClick={() => setProducts([])}
                    className="text-sm text-red-600 hover:text-red-800"
                >
                    Clear Results
                </button>
            )}
        </div>
        <ResultsTable products={products} />
        
        {/* Footer info */}
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-xs text-gray-400">
           <p>Disclaimer: This tool is for demonstration. In a production environment, results would be fetched from a Python Backend using requests/BeautifulSoup.</p>
        </div>
      </main>
    </div>
  );
};

export default App;