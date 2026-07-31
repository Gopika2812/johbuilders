export const formatUnitWithLabel = (unitId, projectType) => {
  if (!unitId || unitId === 'N/A') return 'N/A';
  
  const unitStr = String(unitId).trim();
  if (!unitStr) return 'N/A';

  // If unitStr already starts with Flat, Villa, Plot, or Unit, return as is
  if (/^(flat|villa|plot)\b/i.test(unitStr)) {
    return unitStr;
  }
  
  const typeStr = Array.isArray(projectType) 
    ? projectType.join(' ') 
    : String(projectType || '');

  if (/villa/i.test(typeStr)) {
    return `Villa ${unitStr}`;
  } else if (/flat|apartment|building/i.test(typeStr)) {
    return `Flat ${unitStr}`;
  } else if (/plot|land/i.test(typeStr)) {
    return `Plot ${unitStr}`;
  }
  return `Unit ${unitStr}`;
};
