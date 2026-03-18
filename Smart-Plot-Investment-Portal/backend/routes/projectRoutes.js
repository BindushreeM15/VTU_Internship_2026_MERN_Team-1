const express = require('express');
const router = express.Router();
const multer = require('multer');
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

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Builder routes
router.post('/create', authenticate, authorize('builder'), upload.array('images', 10), createProject);
router.get('/my-projects', authenticate, authorize('builder'), getBuilderProjects);
router.get('/all-plots', authenticate, authorize('builder'), getAllBuildersPlots);
router.post('/add-plot', authenticate, authorize('builder'), addPlot);
router.put('/update-plot', authenticate, authorize('builder'), updatePlot);
router.put('/update-project', authenticate, authorize('builder'), upload.array('images', 10), updateProject);
router.delete('/delete-plot', authenticate, authorize('builder'), deletePlot);
router.delete('/delete-project', authenticate, authorize('builder'), deleteProject);

module.exports = router;