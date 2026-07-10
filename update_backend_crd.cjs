const fs = require('fs');

// 1. Update Project.js Model
let projectModel = fs.readFileSync('server/models/Project.js', 'utf8');
if (!projectModel.includes('crdFlowSheet')) {
  // Insert crdFlowSheet schema field after marketingInfo
  projectModel = projectModel.replace(
    /marketingInfo: \{[\s\S]*?\},/,
    `$&
  crdFlowSheet: {
    name: { type: String, default: '' },
    link: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now }
  },`
  );
  fs.writeFileSync('server/models/Project.js', projectModel);
  console.log('Project.js model updated');
}

// 2. Update routes/projects.js
let routes = fs.readFileSync('server/routes/projects.js', 'utf8');

if (!routes.includes('/crd-flow-sheet')) {
  // Add a new PUT route for crd-flow-sheet
  const newRoute = `
// Update CRD Flow Sheet for a project
router.put('/:id/crd-flow-sheet', protect, checkPermission('projects', 'edit'), async (req, res) => {
  const { name, link } = req.body;
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.crdFlowSheet = {
      name: name || '',
      link: link || '',
      uploadedAt: new Date()
    };

    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error updating CRD Flow Sheet', error: error.message });
  }
});
`;

  routes = routes.replace(
    /module.exports = router;/,
    `${newRoute}\nmodule.exports = router;`
  );
  fs.writeFileSync('server/routes/projects.js', routes);
  console.log('routes/projects.js updated');
}
