import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  FileText, 
  ArrowLeft, 
  Printer, 
  Edit3, 
  Building, 
  Phone, 
  User, 
  MapPin, 
  CreditCard,
  AlertCircle 
} from 'lucide-react';

const QuotationView = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuotation();
  }, [id, token]);

  const fetchQuotation = async () => {
    try {
      const res = await fetch(`${API_URL}/quotations/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuotation(data);
      } else {
        setError('Failed to fetch quotation details');
      }
    } catch (err) {
      setError('Connection error loading quotation details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Convert numbers to currency formatted string
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Printable CSS style tags to inject for clean printing */}
      <style>{`
        @media print {
          /* Hide everything except printable invoice container */
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Action Header controls */}
      <div className="flex items-center justify-between bg-white border border-gray-150 p-4 rounded-3xl shadow-sm no-print">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-500 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2">
          <Link
            to={`/quotations/${id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Quote</span>
          </Link>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e623a] text-white hover:bg-[#0b4d2d] rounded-xl text-xs font-bold transition shadow cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Quotation</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400">Loading estimate valuation sheet...</div>
      ) : quotation ? (
        /* Printable invoice card */
        <div 
          id="print-area" 
          className="bg-white border border-gray-150 rounded-3xl p-8 shadow-sm space-y-8"
        >
          {/* Brand Header */}
          <div className="flex justify-between items-start border-b pb-6">
            <div>
              <h1 className="text-2xl font-black text-[#0e623a] tracking-tight">JOHN BUILDWELL CONSTRUCTIONS</h1>
              <p className="text-xs text-gray-400 mt-1">Premium Builders & Real Estate Developers</p>
              <div className="text-[11px] text-gray-500 mt-2 space-y-0.5">
                <div>Corporate Office: Bypass Road, Vannarpettai</div>
                <div>Tirunelveli, Tamil Nadu - 627003</div>
                <div>Contact: +91 94432 83634 | info@johnbuildwell.com</div>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-700">VALUATION ESTIMATE</h2>
              <div className="text-xs text-gray-500 mt-2 space-y-1">
                <div><strong>Quote Ref:</strong> JB/QTN/{quotation._id.substring(18).toUpperCase()}</div>
                <div><strong>Date:</strong> {new Date(quotation.createdAt).toLocaleDateString()}</div>
                <div><strong>Valid Until:</strong> {new Date(new Date(quotation.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()} (30 Days)</div>
              </div>
            </div>
          </div>

          {/* Client Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-6">
            <div>
              <h3 className="text-xs font-bold text-[#0e623a] uppercase tracking-wider block mb-2">Prepared For:</h3>
              <div className="space-y-1.5">
                <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{quotation.customerName}</span>
                </div>
                <div className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{quotation.customerPhone}</span>
                </div>
                {quotation.customerAddress && (
                  <div className="text-xs text-gray-500 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <span>{quotation.customerAddress}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[#0e623a] uppercase tracking-wider block mb-2">Project Association:</h3>
              <div className="space-y-1.5">
                <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{quotation.project?.name || 'Project Reference'}</span>
                </div>
                <div className="text-xs text-gray-600">
                  <strong>Project Code:</strong> {quotation.project?.code || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                  <strong>Project Type:</strong> {quotation.projectType}
                </div>
              </div>
            </div>
          </div>

          {/* Quotation Valuation Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#0e623a] uppercase tracking-wider">Itemized Valuation Estimate:</h3>
            <table className="w-full text-left border border-gray-150 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-500">
                  <th className="p-4">Description</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Units Selected</th>
                  <th className="p-4 text-right">Area (Sq.Ft)</th>
                  <th className="p-4 text-right">Rate / Sq.Ft</th>
                  <th className="p-4 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-700 divide-y divide-gray-100">
                <tr>
                  <td className="p-4 font-semibold text-gray-800">
                    Proposed Layout Booking Valuation
                  </td>
                  <td className="p-4">{quotation.projectType}</td>
                  <td className="p-4 text-right font-bold">{quotation.selectedUnits.join(', ')}</td>
                  <td className="p-4 text-right">{quotation.totalArea} Sq.Ft</td>
                  <td className="p-4 text-right">{formatCurrency(quotation.pricePerSqFt)}</td>
                  <td className="p-4 text-right font-bold text-gray-800">{formatCurrency(quotation.totalValue)}</td>
                </tr>
                {/* Total Cost summary Row */}
                <tr className="bg-emerald-50/20 font-bold border-t border-gray-200">
                  <td colSpan="5" className="p-4 text-right text-[#0e623a]">Estimated Project Valuation Cost:</td>
                  <td className="p-4 text-right text-base text-[#0e623a]">{formatCurrency(quotation.totalValue)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Customer ID & Bank Loan Info */}
          {(quotation.alternativePhone || quotation.aadharNumber || quotation.panNumber || quotation.bankLoanRequired === 'Yes') && (
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
              <h3 className="text-[11px] font-bold text-[#0e623a] uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#0e623a]/75" />
                <span>Financial details & Credentials</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {quotation.alternativePhone && (
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Alt Phone</span>
                    <span className="font-semibold text-gray-700">{quotation.alternativePhone}</span>
                  </div>
                )}
                {quotation.aadharNumber && (
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Aadhar Card</span>
                    <span className="font-semibold text-gray-700">{quotation.aadharNumber}</span>
                  </div>
                )}
                {quotation.panNumber && (
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">PAN Card</span>
                    <span className="font-semibold text-gray-700">{quotation.panNumber}</span>
                  </div>
                )}
              </div>

              {quotation.bankLoanRequired === 'Yes' && (
                <div className="border-t pt-3 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Required Bank Loan</span>
                    <span className="font-semibold text-gray-700">Yes</span>
                  </div>
                  {quotation.loanAmount > 0 && (
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Loan amount / preferred bank</span>
                      <span className="font-semibold text-gray-700">{formatCurrency(quotation.loanAmount)} ({quotation.preferredBank || 'Any Bank'})</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Terms and Signature Footer */}
          <div className="pt-12 grid grid-cols-2 gap-8 text-xs border-t">
            <div>
              <h4 className="font-bold text-[#0e623a]">Terms & Conditions:</h4>
              <ul className="list-disc pl-4 mt-2 space-y-1 text-gray-400 text-[11px]">
                <li>This is an estimate quotation copy valid for 30 days from date of issue.</li>
                <li>Final pricing depends on plot dimensions at physical site registration.</li>
                <li>Installment schedules must follow project payment milestone policies.</li>
              </ul>
            </div>
            <div className="text-right flex flex-col justify-end items-end space-y-12">
              <div className="text-[11px] text-gray-400">Authorized Signature, John Buildwell ERP</div>
              <div className="border-t border-gray-300 w-48 pt-1 text-xs text-gray-700 font-bold">John Buildwell Developers</div>
            </div>
          </div>

        </div>
      ) : (
        <div className="p-8 text-center text-xs text-gray-400">Quotation details not available.</div>
      )}
    </div>
  );
};

export default QuotationView;
