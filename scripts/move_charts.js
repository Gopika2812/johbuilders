const fs = require('fs');
const dashboardPath = 'e:/builders/client/src/pages/Dashboard.jsx';
const kpiPath = 'e:/builders/client/src/pages/KPIInsights.jsx';
let dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
let kpiContent = fs.readFileSync(kpiPath, 'utf-8');

// 1. Extract ObservedPieChart from Dashboard
const pieRegex = /const ObservedPieChart = \(\{.*?\}\);/s; // This won't work well due to nested brackets.

