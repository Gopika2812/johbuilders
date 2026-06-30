import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

const SearchableSelect = ({ options = [], value, onChange, placeholder = 'Select an option' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

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

  // Normalize options to { value, label } structure
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return { value: opt.value ?? '', label: opt.label ?? '' };
    }
    return { value: opt, label: opt };
  });

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery('');
        }}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#f9fafb] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e623a] transition text-left text-sm"
      >
        <span className={selectedOption ? 'text-gray-800 font-semibold' : 'text-gray-400 font-medium'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-150 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-72 flex flex-col">
          {/* Search Input Box */}
          <div className="relative p-2.5 border-b border-gray-100 bg-gray-50 flex items-center shrink-0">
            <Search className="absolute left-5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-250 rounded-lg focus:outline-none focus:border-[#0e623a] focus:ring-1 focus:ring-[#0e623a] transition"
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto py-1 divide-y divide-gray-50/50">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-400 text-center">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition ${
                    value === option.value
                      ? 'bg-[#0e623a]/5 text-[#0e623a] font-bold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {value === option.value && <Check className="w-3.5 h-3.5 text-[#0e623a]" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
