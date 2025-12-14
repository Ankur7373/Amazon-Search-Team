import React from 'react';
import { ProductData, DealType } from '../types';
import { ExternalLink, Tag, Zap, AlertCircle, CheckCircle } from 'lucide-react';

interface ResultsTableProps {
  products: ProductData[];
  onDelete?: (id: string) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ products }) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Tag className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No products analyzed yet</h3>
        <p className="text-gray-500 mt-1">Enter ASINs or upload a CSV to start tracking discounts.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Info</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discounts</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Price</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img className="h-10 w-10 rounded-md object-cover bg-gray-100" src={product.imageUrl} alt="" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={product.title}>
                        {product.title}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        {product.asin}
                        <a href={`https://www.amazon.in/dp/${product.asin}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                            <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">
                    {product.currency}{product.currentPrice.toLocaleString()}
                  </div>
                  {product.mrp > product.currentPrice && (
                    <div className="text-xs text-gray-500 line-through">
                      MRP: {product.currency}{product.mrp.toLocaleString()}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    {product.dealType !== DealType.NONE && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 w-fit">
                        <Zap className="w-3 h-3 mr-1" /> {product.dealType}
                      </span>
                    )}
                    {product.hasCoupon && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 w-fit">
                        <Tag className="w-3 h-3 mr-1" /> Coupon: {product.couponValue}
                      </span>
                    )}
                    {!product.hasCoupon && product.dealType === DealType.NONE && (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.status === 'active_discount' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" /> Active
                    </span>
                  ) : product.status === 'error' ? (
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertCircle className="w-3 h-3 mr-1" /> Error
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      No Deal
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-gray-900">
                        {product.currency}{product.finalPrice.toLocaleString()}
                    </div>
                     {(product.mrp - product.finalPrice) > 0 && (
                        <div className="text-xs text-green-600 font-medium">
                            Save {product.currency}{(product.mrp - product.finalPrice).toLocaleString()}
                        </div>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;