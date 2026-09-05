import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Filter } from 'lucide-react';

const SearchableMultiSelect = ({
  options = [],
  selectedValues,
  selectedOptions,
  onChange,
  placeholder = 'All Sources',
  allLabel = '',
  label = '',
  icon: IconComponent = Filter,
  className = '',
  dropdownClassName = '',
  size = 'md', // 'sm', 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const activeSelected = selectedValues !== undefined ? selectedValues : selectedOptions;

  // Normalize selectedValues to an array of strings
  const currentSelected = useMemo(() => {
    if (!activeSelected) return [];
    if (Array.isArray(activeSelected)) return activeSelected;
    if (typeof activeSelected === 'string' && activeSelected.trim()) {
      return activeSelected.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [activeSelected]);

  // Normalize options to [{ value, label }]
  const normalizedOptions = useMemo(() => {
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

  // Auto focus search when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(option =>
      option.label.toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchQuery]);

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
      return `All Selected (${normalizedOptions.length})`;
    }
    return `${currentSelected.length} Selected`;
  };

  const hasSelection = currentSelected.length > 0;

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1 select-none">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 border rounded-xl transition cursor-pointer select-none group ${
          size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
        } ${
          hasSelection
            ? 'bg-emerald-50/50 border-emerald-600/30 hover:border-emerald-600/60 shadow-xs'
            : 'bg-gray-50/90 hover:bg-gray-100/90 border-gray-200 hover:border-gray-300 shadow-xs'
        } ${isOpen ? 'ring-2 ring-[#0e623a]/20 border-[#0e623a]' : ''}`}
      >
        {IconComponent && (
          <IconComponent
            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              hasSelection ? 'text-[#0e623a]' : 'text-gray-400 group-hover:text-gray-600'
            }`}
          />
        )}

        <div className="flex-1 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span
              className={`font-bold truncate ${
                hasSelection ? 'text-[#0e623a]' : 'text-gray-700'
              }`}
            >
              {getDisplayText()}
            </span>
            {hasSelection && currentSelected.length > 1 && (
              <span className="text-[9px] font-bold bg-[#0e623a] text-white px-1.5 py-0.2 rounded-full shrink-0">
                {currentSelected.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1.5">
            {hasSelection && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-0.5 rounded-full hover:bg-emerald-100 text-emerald-600 hover:text-red-600 transition"
                title="Clear all"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#0e623a]' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 z-50 w-full min-w-[240px] max-w-[340px] mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col ${dropdownClassName}`}
        >
          {/* Header Search Box */}
          <div className="p-2 bg-gray-50/95 border-b border-gray-150 shrink-0 space-y-1.5">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#0e623a] focus:ring-1 focus:ring-[#0e623a] text-gray-800 font-semibold placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between text-[10px] font-bold px-1 pt-0.5">
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
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto py-1 divide-y divide-gray-50">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-xs text-gray-400 italic text-center">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isChecked = currentSelected.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer select-none transition ${
                      isChecked
                        ? 'bg-[#0e623a]/10 text-[#0e623a] font-bold border-l-3 border-[#0e623a]'
                        : 'text-gray-700 hover:bg-gray-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition ${
                          isChecked
                            ? 'bg-[#0e623a] border-[#0e623a] text-white shadow-xs'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{option.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Done Action */}
          <div className="p-2 bg-gray-50/90 border-t border-gray-150 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-gray-400 font-semibold px-1">
              Click items to toggle
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1 bg-[#0e623a] hover:bg-[#0b4d2d] text-white text-xs font-bold rounded-lg transition shadow-xs"
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
