const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
    createProject,
    getBuilderProjects,
    addPlot,
    updatePlot,
    deletePlot,
    updateProject,
    deleteProject,
    getAllBuildersPlots,
} = require('../controllers/projectController');

// Builder routes
router.post('/create', authenticate, authorize('builder'), createProject);
router.get('/my-projects', authenticate, authorize('builder'), getBuilderProjects);
router.get('/all-plots', authenticate, authorize('builder'), getAllBuildersPlots);
router.post('/add-plot', authenticate, authorize('builder'), addPlot);
router.put('/update-plot', authenticate, authorize('builder'), updatePlot);
router.put('/update-project', authenticate, authorize('builder'), updateProject);
router.delete('/delete-plot', authenticate, authorize('builder'), deletePlot);
router.delete('/delete-project', authenticate, authorize('builder'), deleteProject);

module.exports = router;