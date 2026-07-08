const fs = require('fs');

const dashboardPath = 'e:/builders/client/src/pages/Dashboard.jsx';
const kpiPath = 'e:/builders/client/src/pages/KPIInsights.jsx';

let dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
let kpiContent = fs.readFileSync(kpiPath, 'utf-8');

// 1. Extract ObservedPieChart from Dashboard
const pieStartIdx = dashboardContent.indexOf('const ObservedPieChart = ({');
const pieEndStr = '};\n\nconst Dashboard = () => {';
const pieEndIdx = dashboardContent.indexOf(pieEndStr);
if (pieStartIdx === -1 || pieEndIdx === -1) {
  console.error("Could not find ObservedPieChart in Dashboard");
  process.exit(1);
}
const newPieChartCode = dashboardContent.substring(pieStartIdx, pieEndIdx + 2);

// 2. Replace ObservedPieChart in KPIInsights
const kpiPieStartIdx = kpiContent.indexOf('const ObservedPieChart = ({');
const kpiPieEndStr = '};\n\n// 📊 REUSABLE MATTE BAR CHART';
const kpiPieEndIdx = kpiContent.indexOf(kpiPieEndStr);
if (kpiPieStartIdx === -1 || kpiPieEndIdx === -1) {
  console.error("Could not find ObservedPieChart in KPI");
  process.exit(1);
}
kpiContent = kpiContent.substring(0, kpiPieStartIdx) + newPieChartCode + '\n' + kpiContent.substring(kpiPieEndIdx + 4);

// 3. Move the data computation from Dashboard to KPIInsights
const getSourcesCode = `
  const getSourcesData = () => {
    const budgetData = [];
    const spentData = [];
    const networthData = [];

    Object.keys(stats.sourceStats || {}).forEach(src => {
      const s = stats.sourceStats[src];
      if (s.budget > 0) budgetData.push({ source: src, budget: s.budget });
      if (s.spent > 0) spentData.push({ source: src, spent: s.spent });
      if (s.value > 0) networthData.push({ source: src, networth: s.value });
    });

    return { budgetData, spentData, networthData };
  };

  const { budgetData, spentData, networthData } = getSourcesData();
  const primaryColors = [
    '#0e623a', // Brand Green (Dominant Highlight)
    '#3b82f6', // Electric Blue (Secondary Highlight)
    '#94a3b8', // Slate Grey (Muted Accent)
    '#8b5cf6', // Lavender Purple
    '#5c8d70', // Sage Green
    '#f59e0b', // Warm Amber
    '#b0b3c2', // Medium Silver
    '#e2e8f0'  // Light Slate
  ];
`;

// In Dashboard: remove getSourcesData
const dashDataStartIdx = dashboardContent.indexOf('const getSourcesData = () => {');
const dashDataEndIdx = dashboardContent.indexOf('  return (\n    <div className="space-y-8');
if (dashDataStartIdx !== -1 && dashDataEndIdx !== -1) {
  dashboardContent = dashboardContent.substring(0, dashDataStartIdx) + dashboardContent.substring(dashDataEndIdx);
}

// In KPIInsights: Add getSourcesData and primaryColors before return (
const kpiReturnIdx = kpiContent.indexOf('  return (\n    <div className="space-y-8');
if (kpiReturnIdx !== -1) {
  kpiContent = kpiContent.substring(0, kpiReturnIdx) + getSourcesCode + '\n' + kpiContent.substring(kpiReturnIdx);
} else {
  const backupKpiReturnIdx = kpiContent.indexOf('  return (\n    <div className="');
  kpiContent = kpiContent.substring(0, backupKpiReturnIdx) + getSourcesCode + '\n' + kpiContent.substring(backupKpiReturnIdx);
}

// 4. Move the charts JSX from Dashboard to KPIInsights
const chartJsxStartStr = '{/* comparison pie charts */}';
const chartJsxEndStr = '{/* Project Code Wise Matrix Panel */}';
const chartJsxStartIdx = dashboardContent.indexOf(chartJsxStartStr);
const chartJsxEndIdx = dashboardContent.indexOf(chartJsxEndStr);

if (chartJsxStartIdx === -1 || chartJsxEndIdx === -1) {
  console.error("Could not find comparison pie charts JSX in Dashboard");
  process.exit(1);
}

let comparisonChartsCode = dashboardContent.substring(chartJsxStartIdx, chartJsxEndIdx);

// We need to inject a renderPieChart function into KPIInsights since Dashboard has it as a helper
const renderPieChartCode = `
  // Helper to render an SVG solid Pie chart dynamically
  const renderPieChart = (dataArray, valueKey, labelKey, colorPalette, isCount = false, onSegmentClick = null, selectedLabel = null) => {
    return (
      <ObservedPieChart 
        dataArray={dataArray}
        valueKey={valueKey}
        labelKey={labelKey}
        colorPalette={colorPalette}
        isCount={isCount}
        onSegmentClick={onSegmentClick}
        selectedLabel={selectedLabel}
      />
    );
  };
`;

const kpiUseEffectIdx = kpiContent.indexOf('  useEffect(() => {\n    fetchInsightsData();');
if (kpiUseEffectIdx !== -1) {
  kpiContent = kpiContent.substring(0, kpiUseEffectIdx) + renderPieChartCode + '\n' + kpiContent.substring(kpiUseEffectIdx);
} else {
    // just put it before getSourcesCode
    kpiContent = kpiContent.replace('const getSourcesData = () => {', renderPieChartCode + '\n  const getSourcesData = () => {');
}


// Remove from Dashboard
dashboardContent = dashboardContent.substring(0, chartJsxStartIdx) + dashboardContent.substring(chartJsxEndIdx);

// 5. Replace "MARKETING PERFORMANCE: SPEND & REVENUE RETURNS BY GROUP" in KPIInsights with the charts
const kpiMarketingPerfStartStr = '{/* 📊 MARKETING PERFORMANCE: SPEND & REVENUE RETURNS BY GROUP */}';
const kpiMarketingPerfEndStr = '{/* Active Status Panel */}';
const kpiMarketingPerfStartIdx = kpiContent.indexOf(kpiMarketingPerfStartStr);
const kpiMarketingPerfEndIdx = kpiContent.indexOf(kpiMarketingPerfEndStr);

if (kpiMarketingPerfStartIdx === -1 || kpiMarketingPerfEndIdx === -1) {
    console.error("Could not find Marketing Performance block in KPI");
    
    // Fallback: Just insert it after KPI Insights Dashboard title
    const titleIdx = kpiContent.indexOf('<h2 className="text-xl md:text-2xl font-extrabold text-gray-800 flex items-center gap-2">');
    if (titleIdx !== -1) {
        const nextDivIdx = kpiContent.indexOf('</div>', titleIdx);
        kpiContent = kpiContent.substring(0, nextDivIdx + 6) + '\n\n' + comparisonChartsCode + '\n' + kpiContent.substring(nextDivIdx + 6);
    } else {
        process.exit(1);
    }
} else {
    // Replace the block
    kpiContent = kpiContent.substring(0, kpiMarketingPerfStartIdx) + comparisonChartsCode + '\n          ' + kpiContent.substring(kpiMarketingPerfEndIdx);
}

fs.writeFileSync(dashboardPath, dashboardContent);
fs.writeFileSync(kpiPath, kpiContent);

console.log("Successfully moved charts.");
