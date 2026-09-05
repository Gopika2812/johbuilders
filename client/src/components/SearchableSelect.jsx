import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Filter } from 'lucide-react';

const roleBadgeColor = (role = '') => {
  const r = role.toLowerCase();
  if (r.includes('superadmin') || r.includes('admin')) {
    return 'bg-purple-50 text-purple-700 border-purple-200';
  }
  if (r.includes('crd')) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  if (r.includes('sales')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (r.includes('committee') || r.includes('ed')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (r.includes('consultant')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }
  if (r.includes('ped')) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  label = '',
  icon: IconComponent = null,
  disabled = false,
  clearable = true,
  showSearch = true,
  searchPlaceholder = 'Search...',
  className = '',
  dropdownClassName = '',
  size = 'md', // 'sm', 'md', 'lg'
  variant = 'default', // 'default', 'compact', 'filter'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

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

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Normalize options to { value, label, subLabel, badge, icon }
  const normalizedOptions = useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt.value ?? '',
          label: opt.label ?? String(opt.value ?? ''),
          subLabel: opt.subLabel ?? opt.subtitle ?? '',
          badge: opt.badge ?? '',
          icon: opt.icon ?? null,
          disabled: !!opt.disabled
        };
      }
      return {
        value: String(opt),
        label: String(opt),
        subLabel: '',
        badge: '',
        icon: null,
        disabled: false
      };
    });
  }, [options]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const query = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(option =>
      option.label.toLowerCase().includes(query) ||
      (option.subLabel && option.subLabel.toLowerCase().includes(query)) ||
      (option.badge && option.badge.toLowerCase().includes(query))
    );
  }, [normalizedOptions, searchQuery]);

  const selectedOption = useMemo(() => {
    return normalizedOptions.find(opt => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const isSelectedActive = value !== undefined && value !== null && value !== '';

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1 select-none">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-2 border rounded-xl transition cursor-pointer select-none group ${
          size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
        } ${
          disabled
            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
            : isSelectedActive
            ? 'bg-emerald-50/50 border-emerald-600/30 hover:border-emerald-600/60 shadow-xs'
            : 'bg-gray-50/90 hover:bg-gray-100/90 border-gray-200 hover:border-gray-300 shadow-xs'
        } ${isOpen ? 'ring-2 ring-[#0e623a]/20 border-[#0e623a]' : ''}`}
      >
        {IconComponent && (
          <IconComponent
            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              isSelectedActive
                ? 'text-[#0e623a]'
                : 'text-gray-400 group-hover:text-gray-600'
            }`}
          />
        )}

        <div className="flex-1 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span
              className={`font-bold truncate ${
                isSelectedActive ? 'text-[#0e623a]' : 'text-gray-700'
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.badge && (
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md border shrink-0 hidden sm:inline-block ${roleBadgeColor(
                  selectedOption.badge
                )}`}
              >
                {selectedOption.badge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1.5">
            {clearable && isSelectedActive && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 rounded-full hover:bg-emerald-100 text-emerald-600 hover:text-red-600 transition"
                title="Clear selection"
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
          className={`absolute left-0 z-50 w-full min-w-[220px] max-w-[340px] mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col ${dropdownClassName}`}
        >
          {/* Search Box */}
          {showSearch && normalizedOptions.length > 5 && (
            <div className="p-2 bg-gray-50/95 border-b border-gray-150 shrink-0">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
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
              <div className="flex items-center justify-between text-[10px] font-semibold text-gray-400 px-1 pt-1.5">
                <span>{filteredOptions.length} available</span>
                {isSelectedActive && (
                  <button
                    type="button"
                    onClick={() => handleSelect('')}
                    className="text-[#0e623a] hover:underline font-bold"
                  >
                    Reset to All
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto py-1 divide-y divide-gray-50">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-gray-400 italic">
                No matching results
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = String(option.value) === String(value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition select-none ${
                      option.disabled
                        ? 'opacity-40 cursor-not-allowed bg-gray-50'
                        : isSelected
                        ? 'bg-[#0e623a]/10 text-[#0e623a] font-bold border-l-3 border-[#0e623a]'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {option.icon && (
                        <option.icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{option.label}</span>
                        {option.subLabel && (
                          <span className="text-[10px] text-gray-400 font-normal truncate">
                            {option.subLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {option.badge && (
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border ${roleBadgeColor(
                            option.badge
                          )}`}
                        >
                          {option.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#0e623a] stroke-[2.5]" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
