import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Filter } from 'lucide-react';

const SearchableMultiSelect = ({
  options = [],
  selectedValues = [],
  onChange,
  placeholder = 'All Sources',
  label = '',
  icon: IconComponent = Filter,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  // Normalize selectedValues to an array of strings
  const currentSelected = React.useMemo(() => {
    if (!selectedValues) return [];
    if (Array.isArray(selectedValues)) return selectedValues;
    if (typeof selectedValues === 'string' && selectedValues.trim()) {
      return selectedValues.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [selectedValues]);

  // Normalize options to [{ value, label }]
  const normalizedOptions = React.useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'object' && opt !== null) {
        return { value: opt.value ?? '', label: opt.label ?? String(opt.value ?? '') };
      }
      return { value: String(opt), label: String(opt) };
    });
  }, [options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleOption = (val) => {
    let updated;
    if (currentSelected.includes(val)) {
      updated = currentSelected.filter(v => v !== val);
    } else {
      updated = [...currentSelected, val];
    }
    onChange(updated);
  };

  const handleSelectAll = () => {
    const allValues = normalizedOptions.map(o => o.value);
    onChange(allValues);
  };

  const handleClearAll = (e) => {
    if (e) e.stopPropagation();
    onChange([]);
  };

  // Determine trigger display text
  const getDisplayText = () => {
    if (currentSelected.length === 0) return placeholder;
    if (currentSelected.length === 1) {
      const match = normalizedOptions.find(o => o.value === currentSelected[0]);
      return match ? match.label : currentSelected[0];
    }
    if (currentSelected.length === normalizedOptions.length && normalizedOptions.length > 0) {
      return `All Sources (${normalizedOptions.length})`;
    }
    return `${currentSelected.length} Sources Selected`;
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div className="flex items-center gap-2 bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200 rounded-xl px-3 py-1.5 transition cursor-pointer group">
        {IconComponent && <IconComponent className="w-4 h-4 text-gray-500 shrink-0 group-hover:text-[#0e623a]" />}
        
        <div
          className="flex-1 flex items-center justify-between min-w-0 select-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={`text-xs font-bold truncate ${currentSelected.length > 0 ? 'text-[#0e623a]' : 'text-gray-700'}`}>
            {getDisplayText()}
          </span>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            {currentSelected.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-600 transition"
                title="Clear selection"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#0e623a]' : ''}`} />
          </div>
        </div>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 z-50 w-full min-w-[260px] max-w-[340px] mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col">
          
          {/* Header Search Box */}
          <div className="p-2.5 bg-gray-50/90 border-b border-gray-150 space-y-2 shrink-0">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#0e623a] focus:ring-1 focus:ring-[#0e623a] text-gray-800 font-semibold placeholder:text-gray-400"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between text-[11px] font-bold px-0.5 pt-0.5">
              <span className="text-gray-500">
                {currentSelected.length} of {normalizedOptions.length} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[#0e623a] hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-gray-500 hover:text-red-600 hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto py-1 divide-y divide-gray-50">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-4 text-xs text-gray-400 italic text-center">
                No matching sources found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isChecked = currentSelected.includes(option.value);
                return (
                  <label
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className={`flex items-center justify-between px-3.5 py-2 text-xs cursor-pointer select-none transition ${
                      isChecked
                        ? 'bg-[#0e623a]/5 text-[#0e623a] font-bold'
                        : 'text-gray-700 hover:bg-gray-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                          isChecked
                            ? 'bg-[#0e623a] border-[#0e623a] text-white'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{option.label}</span>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2 bg-gray-50 border-t border-gray-150 flex justify-end shrink-0">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-xs font-bold rounded-lg transition shadow-xs"
            >
              Done
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default SearchableMultiSelect;
