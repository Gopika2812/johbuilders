import React from 'react';
import { ShieldCheck, Check, X, ShieldAlert } from 'lucide-react';

const AccessControl = () => {
  const rolesData = [
    {
      role: 'Admin',
      description: 'System Administrator with unrestricted access to approve accounts, toggle configurations, adjust land sizes, and adjust base pricing.',
      project_master: true,
      edit_units: true,
      approve_bookings: true,
      manage_employees: true,
    },
    {
      role: 'Manager',
      description: 'Enterprise Project Manager authorized to register projects, update inventory, change base pricing, and adjust plot size allocations.',
      project_master: true,
      edit_units: true,
      approve_bookings: true,
      manage_employees: false,
    },
    {
      role: 'Sales Executive',
      description: 'Sales representative authorized to manage clients, track lead sources, and register bookings. Cannot resize land divisions.',
      project_master: false,
      edit_units: true,
      approve_bookings: true,
      manage_employees: false,
    },
    {
      role: 'Site Engineer',
      description: 'On-site technical operator with read-only access to inventory metrics. Can update construction status but cannot sell/allocate land.',
      project_master: false,
      edit_units: true, // Only for construction status updates
      approve_bookings: false,
      manage_employees: false,
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0e623a]" />
            <span>Role-Based Access Control (RBAC) System</span>
          </h3>
          <p className="text-xs text-gray-500">
            System modules restrict read, write, and execute permissions based on active employee role.
          </p>
        </div>
        <div className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
          Status: Active & Enforced
        </div>
      </div>

      {/* Grid cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {rolesData.map((r) => (
          <div key={r.role} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Enterprise Role</span>
                <h4 className="text-lg font-bold text-gray-800 mt-0.5">{r.role}</h4>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-light">{r.description}</p>
            </div>

            <div className="border-t border-gray-50 pt-4 mt-6 space-y-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Privilege Map</span>
              <div className="flex items-center justify-between text-xs font-medium text-gray-600">
                <span>Create Projects</span>
                {r.project_master ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}
              </div>
              <div className="flex items-center justify-between text-xs font-medium text-gray-600">
                <span>Update Units Size</span>
                {r.role === 'Admin' || r.role === 'Manager' ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}
              </div>
              <div className="flex items-center justify-between text-xs font-medium text-gray-600">
                <span>Approve Bookings</span>
                {r.approve_bookings ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}
              </div>
              <div className="flex items-center justify-between text-xs font-medium text-gray-600">
                <span>Approve Employees</span>
                {r.manage_employees ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccessControl;
