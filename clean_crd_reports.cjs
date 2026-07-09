const fs = require('fs');

let content = fs.readFileSync('client/src/pages/CRDReports.jsx', 'utf8');

const mainReturnRegex = /return \(\s*<div className="space-y-8 w-full mx-auto text-left animate-fadeIn">[\s\S]*$/;

const newReturn = `return (
    <div className="space-y-8 w-full mx-auto text-left animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-[#0e623a]" />
            <span>CRD Reports</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Download specific CRD reports directly.
          </p>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-gray-150 shadow-xs">
          {/* Month Picker */}
          <div className="flex items-center gap-2 px-2">
            <Calendar className="w-3.5 h-3.5 text-[#0e623a]" />
            <span className="text-xs font-bold text-gray-700">Range:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs font-bold text-gray-700 bg-transparent border-b border-gray-300 focus:outline-none focus:border-[#0e623a] px-1"
            />
            <span className="text-xs font-bold text-gray-500">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs font-bold text-gray-700 bg-transparent border-b border-gray-300 focus:outline-none focus:border-[#0e623a] px-1"
            />
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        
        {/* Registration Report */}
        <div 
          onClick={handleExportRegistrationReport}
          className="bg-purple-50 border border-purple-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-purple-800 uppercase tracking-wide">Registration Report</h3>
          <p className="text-[10px] text-purple-500 font-semibold">Registered units and values.</p>
        </div>

        {/* Key Handover Report */}
        <div 
          onClick={handleExportKeyHandoverReport}
          className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl">
            <Key className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-indigo-800 uppercase tracking-wide">Key Handover Report</h3>
          <p className="text-[10px] text-indigo-500 font-semibold">Handed over keys and status.</p>
        </div>

        {/* Collection Report */}
        <div 
          onClick={handleExportCollectionReport}
          className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
            <DollarSign className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wide">Collection Report</h3>
          <p className="text-[10px] text-emerald-500 font-semibold">Payment tracking and collections.</p>
        </div>

        {/* Bank Loan Report */}
        <div 
          onClick={() => {
              if (typeof handleExportBankLoanReport !== 'undefined') handleExportBankLoanReport();
              else if (typeof handleExportBankLoansExcel !== 'undefined') handleExportBankLoansExcel();
          }}
          className="bg-blue-50 border border-blue-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-blue-800 uppercase tracking-wide">Bank Loan Report</h3>
          <p className="text-[10px] text-blue-500 font-semibold">Bank loans associated with units.</p>
        </div>

        {/* Extra Works Report */}
        <div 
          onClick={handleExportExtraWorksReport}
          className="bg-amber-50 border border-amber-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-amber-800 uppercase tracking-wide">Extra Works</h3>
          <p className="text-[10px] text-amber-500 font-semibold">Extra works requests and value.</p>
        </div>

        {/* Complaints Report */}
        <div 
          onClick={handleExportComplaintsReport}
          className="bg-rose-50 border border-rose-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 duration-200"
        >
          <div className="p-4 bg-rose-100 text-rose-600 rounded-2xl">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-rose-800 uppercase tracking-wide">Complaints</h3>
          <p className="text-[10px] text-rose-500 font-semibold">User complaints and statuses.</p>
        </div>

      </div>
    </div>
  );
};

export default KPIInsights;
`;

content = content.replace(mainReturnRegex, newReturn);
fs.writeFileSync('client/src/pages/CRDReports.jsx', content);
console.log('CRDReports cleaned successfully!');
