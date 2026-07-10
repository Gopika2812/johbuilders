const fs = require('fs');
const path = require('path');

// 1. Update CRDFlow.js model
const modelPath = path.join('server', 'models', 'CRDFlow.js');
let modelContent = fs.readFileSync(modelPath, 'utf8');

if (!modelContent.includes('debtorsAmount:')) {
  modelContent = modelContent.replace(
    'totalCurrentValue: { type: Number, required: true },',
    `totalCurrentValue: { type: Number, required: true },
  debtorsAmount: { type: Number, default: 0 },
  targetAmount: { type: Number, default: 0 },`
  );
  fs.writeFileSync(modelPath, modelContent);
  console.log('CRDFlow model updated with editable amounts.');
}

// 2. Update crdFlow.js routes
const routePath = path.join('server', 'routes', 'crdFlow.js');
let routeContent = fs.readFileSync(routePath, 'utf8');

if (!routeContent.includes('/editable-amounts')) {
  const newRoute = `
// @route   PUT /api/crd-flow/:id/editable-amounts
// @desc    Update debtors and target amounts
router.put('/:id/editable-amounts', protect, async (req, res) => {
  const { debtorsAmount, targetAmount } = req.body;
  try {
    const flow = await CRDFlow.findById(req.params.id);
    if (!flow) return res.status(404).json({ message: 'Flow record not found' });

    if (debtorsAmount !== undefined) flow.debtorsAmount = Number(debtorsAmount);
    if (targetAmount !== undefined) flow.targetAmount = Number(targetAmount);

    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
`;
  
  routeContent = routeContent.replace('module.exports = router;', newRoute + '\\nmodule.exports = router;');
  fs.writeFileSync(routePath, routeContent);
  console.log('CRDFlow route updated with /editable-amounts.');
}
