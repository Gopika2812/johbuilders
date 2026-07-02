const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');
const { protect, authorize, checkPermission } = require('../middleware/auth');

// @route   GET /api/projects
// @desc    Get all projects
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.id || req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/projects
// @desc    Create a new project & auto-generate units
router.post('/', protect, checkPermission('projects', 'edit'), async (req, res) => {
  const {
    name,
    code,
    projectType,
    location,
    totalLandArea,
    pricePerSqFt,
    // Unit generation rule options:
    initialUnitCount, // for Plot / House
    floorCount,       // for Flat
    unitsPerFloor     // for Flat
  } = req.body;

  try {
    const codeExists = await Project.findOne({ code });
    if (codeExists) {
      return res.status(400).json({ message: 'Project Code/Prefix already exists' });
    }

    const area = Number(totalLandArea);
    const price = Number(pricePerSqFt);
    if (!area || isNaN(area) || area <= 0) {
      return res.status(400).json({ message: 'Invalid Total Land Area' });
    }
    if (!price || isNaN(price) || price <= 0) {
      return res.status(400).json({ message: 'Price per sq.ft is mandatory and must be greater than 0' });
    }

    let units = [];

    if (req.body.units && req.body.units.length > 0) {
      units = req.body.units.map(u => ({
        unitId: u.unitId,
        size: Number(u.size) || 0,
        price: (Number(u.size) || 0) * (Number(u.ratePerUom) || price),
        status: u.status || 'New',
        floor: u.floor || '',
        remarks: u.remarks || '',
        isLocked: !!u.isLocked,
        mapCoordinates: u.mapCoordinates,
        unitType: u.unitType || (projectType.includes('Plot') ? 'Plot' : (projectType.includes('House') || projectType.includes('Villa')) ? 'Villa' : 'Flat'),
        ratePerUom: Number(u.ratePerUom) || 0,
        soldRatePerUom: Number(u.soldRatePerUom) || 0,
        soldConsideration: Number(u.soldConsideration) || 0
      }));
    } else {
      const types = Array.isArray(projectType) ? projectType : [projectType];
      types.forEach(type => {
        if (type === 'Plot') {
          const count = Number(req.body.initialPlotCount) || Number(initialUnitCount) || 10;
          const initialSize = area / count;
          for (let i = 1; i <= count; i++) {
            units.push({
              unitId: `${code}P${i}`,
              size: initialSize,
              price: initialSize * price,
              status: 'New',
              isLocked: false,
              unitType: 'Plot'
            });
          }
        } else if (type === 'House' || type === 'Villa') {
          const count = Number(req.body.initialVillaCount) || Number(req.body.initialHouseCount) || Number(initialUnitCount) || 5;
          const initialSize = area / count;
          for (let i = 1; i <= count; i++) {
            units.push({
              unitId: `${code}V${i}`,
              size: initialSize,
              price: initialSize * price,
              status: 'New',
              isLocked: false,
              unitType: 'Villa'
            });
          }
        } else if (type === 'Flat') {
          const floors = Number(floorCount) || 3;
          const flatPerFloor = Number(unitsPerFloor) || 4;
          const totalFlats = floors * flatPerFloor;
          const initialSize = area / totalFlats;
          
          for (let f = 1; f <= floors; f++) {
            for (let r = 1; r <= flatPerFloor; r++) {
              const flatNum = 100 + r; // e.g. 101, 102
              units.push({
                unitId: `${code}-F${f}-${f}${flatNum.toString().slice(1)}`,
                floor: `Floor ${f}`,
                size: initialSize,
                price: initialSize * price,
                status: 'New',
                isLocked: false,
                unitType: 'Flat'
              });
            }
          }
        }
      });
    }

    const project = new Project({
      name,
      code,
      projectType,
      layoutPlanImage: req.body.layoutPlanImage || '',
      location,
      totalLandArea: area,
      pricePerSqFt: price,
      units,
      marketingInfo: req.body.marketingInfo || {}
    });

    await project.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Create Project',
      description: `Created ${projectType} project: ${name} (${code}) with ${units.length} units.`
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/projects/:id/marketing
// @desc    Update project marketing/promotional details
router.put('/:id/marketing', protect, checkPermission('projects', 'edit'), async (req, res) => {
  const { sourceType, videos, posters } = req.body;

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const existingVideos = project.marketingInfo?.videos || [];
    const processedVideos = (Array.isArray(videos) ? videos : []).map((incomingVid) => {
      const match = existingVideos.find(
        (ev) => ev._id?.toString() === incomingVid._id || (ev.name === incomingVid.name && ev.link === incomingVid.link)
      );

      let updatedAt = Date.now();
      if (match) {
        if (match.name === incomingVid.name && match.link === incomingVid.link && match.status === incomingVid.status) {
          updatedAt = match.updatedAt || Date.now();
        }
      }

      const isTemp = !incomingVid._id || incomingVid._id.toString().startsWith('temp_');
      const vidObj = {
        name: incomingVid.name || '',
        link: incomingVid.link || '',
        status: incomingVid.status || 'Active',
        cost: Number(incomingVid.cost) || 0,
        updatedAt
      };
      if (!isTemp) {
        vidObj._id = incomingVid._id;
      }
      return vidObj;
    });

    const existingPosters = project.marketingInfo?.posters || [];
    const processedPosters = (Array.isArray(posters) ? posters : []).map((incomingPos) => {
      const match = existingPosters.find(
        (ep) => ep._id?.toString() === incomingPos._id || (ep.name === incomingPos.name && ep.link === incomingPos.link)
      );

      let updatedAt = Date.now();
      if (match) {
        if (match.name === incomingPos.name && match.link === incomingPos.link && match.status === incomingPos.status) {
          updatedAt = match.updatedAt || Date.now();
        }
      }

      const isTemp = !incomingPos._id || incomingPos._id.toString().startsWith('temp_');
      const posObj = {
        name: incomingPos.name || '',
        link: incomingPos.link || '',
        status: incomingPos.status || 'Active',
        cost: Number(incomingPos.cost) || 0,
        updatedAt
      };
      if (!isTemp) {
        posObj._id = incomingPos._id;
      }
      return posObj;
    });

    project.marketingInfo = {
      sourceType: sourceType || '',
      videos: processedVideos,
      posters: processedPosters
    };

    await project.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Update Marketing Info',
      description: `Updated promotional/marketing details for project: ${project.name} (${project.code})`
    });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/projects/:id/price
// @desc    Update project pricing engine (base price per sq.ft)
router.put('/:id/price', protect, checkPermission('projects', 'edit'), async (req, res) => {
  const { pricePerSqFt } = req.body;

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const newPrice = Number(pricePerSqFt);
    if (isNaN(newPrice) || newPrice <= 0) {
      return res.status(400).json({ message: 'Invalid price value' });
    }

    const oldPrice = project.pricePerSqFt;
    project.pricePerSqFt = newPrice;
    
    // Save hook will automatically re-run prices of all units & valuation
    await project.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Update Pricing Engine',
      description: `Updated price per sq.ft for project: ${project.name} from $${oldPrice} to $${newPrice}`
    });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/projects/:id/resize-plot
// @desc    Dynamic Plot Resizing Engine
router.put('/:id/resize-plot', protect, checkPermission('projects', 'edit'), async (req, res) => {
  const {
    unitId,
    newSize,
    redistributionMode, // 'equal' | 'manual' | 'value-based'
    pricePerSqFt
  } = req.body;

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.projectType || !project.projectType.includes('Plot')) {
      return res.status(400).json({ message: 'Dynamic size adjustment is only supported for Plot projects' });
    }

    const plotIndex = project.units.findIndex(u => u.unitId === unitId);
    if (plotIndex === -1) {
      return res.status(404).json({ message: 'Plot unit not found' });
    }

    const targetSize = Number(newSize);
    if (isNaN(targetSize) || targetSize <= 0) {
      return res.status(400).json({ message: 'Size must be a positive number' });
    }

    // Step 1: Set the target size and Lock the selected plot size
    project.units[plotIndex].size = targetSize;
    project.units[plotIndex].isLocked = true;

    // Step 2: Calculate remaining land
    const lockedPlots = project.units.filter(u => u.isLocked);
    const sumLocked = lockedPlots.reduce((sum, u) => sum + u.size, 0);

    if (sumLocked > project.totalLandArea) {
      return res.status(400).json({
        message: `Requested size (${targetSize} sq.ft) makes sum of locked plots (${sumLocked} sq.ft) exceed total project land area (${project.totalLandArea} sq.ft).`
      });
    }

    const remainingLand = project.totalLandArea - sumLocked;
    const unlockedPlots = project.units.filter(u => !u.isLocked);

    // Step 3: Redistribution modes
    if (unlockedPlots.length > 0) {
      if (redistributionMode === 'equal') {
        const splitSize = remainingLand / unlockedPlots.length;
        project.units.forEach(u => {
          if (!u.isLocked) {
            u.size = splitSize;
          }
        });
      } else if (redistributionMode === 'value-based') {
        const currentUnlockedSum = unlockedPlots.reduce((sum, u) => sum + u.size, 0);
        if (currentUnlockedSum > 0) {
          project.units.forEach(u => {
            if (!u.isLocked) {
              const proportion = u.size / currentUnlockedSum;
              u.size = remainingLand * proportion;
            }
          });
        } else {
          // Fallback to equal if somehow locked / 0
          const splitSize = remainingLand / unlockedPlots.length;
          project.units.forEach(u => {
            if (!u.isLocked) {
              u.size = splitSize;
            }
          });
        }
      } else if (redistributionMode === 'manual') {
        // In manual mode, we just update the locked plot size, no redistribution.
        // We recalculate remainingLand but let other plots remain at their size.
        // Wait, if the user manually updates it, they can adjust other plots individually.
      }
    }

    // Step 4: System asks: Enter current price per sq.ft for updated land
    if (pricePerSqFt) {
      const updatedPrice = Number(pricePerSqFt);
      if (!isNaN(updatedPrice) && updatedPrice > 0) {
        project.pricePerSqFt = updatedPrice;
      }
    }

    // Step 5: Save project (triggering pre-save hook for unit values + total valuation calculation)
    await project.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Resize Plot',
      description: `Resized plot ${unitId} to ${targetSize} sq.ft using mode: ${redistributionMode}. Total valuation updated.`
    });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/projects/:id/unit-status
// @desc    Update specific unit status & customer booking details
router.put('/:id/unit-status', protect, async (req, res) => {
  const { unitId, status, customerName, customerPhone, leadName } = req.body;

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const unit = project.units.find(u => u.unitId === unitId);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    // RBAC: site engineer can only update status to construction related, etc.
    // Sales Executive and manager can approve bookings.
    if (req.user.role === 'Site Engineer' && (status === 'Booked' || status === 'Sold Out')) {
      return res.status(403).json({ message: 'Site Engineers cannot approve bookings or sell units' });
    }

    unit.status = status;
    if (customerName !== undefined) unit.customerName = customerName;
    if (customerPhone !== undefined) unit.customerPhone = customerPhone;
    if (leadName !== undefined) unit.leadName = leadName;

    await project.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Update Unit',
      description: `Updated unit ${unitId} in project ${project.name} to status: ${status}`
    });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project details
router.put('/:id', protect, async (req, res) => {
  const { name, location, totalLandArea, pricePerSqFt, layoutPlanImage } = req.body;
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (name !== undefined) project.name = name;
    if (location !== undefined) project.location = location;
    if (totalLandArea !== undefined) project.totalLandArea = Number(totalLandArea);
    if (pricePerSqFt !== undefined) project.pricePerSqFt = Number(pricePerSqFt);
    if (layoutPlanImage !== undefined) project.layoutPlanImage = layoutPlanImage;

    await project.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Update Project Details',
      description: `Updated project details for ${project.name}`
    });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await Project.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Delete Project',
      description: `Deleted project ${project.name}`
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
