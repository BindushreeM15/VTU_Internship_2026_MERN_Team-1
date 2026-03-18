const Project = require("../models/Project");

// Projects

exports.createProject = async (req, res) => {
    try {
        console.log('Create project request:', req.body, req.files);
        const { projectName, location, latitude, longitude, description, amenities } = req.body;
        const builderId = req.user.id;

        if (!projectName || !location || !description) {
            return res.status(400).json({ error: "Project name, location, and description are required" });
        }

        // Handle uploaded images
        const images = req.files ? req.files.map(file => file.path) : [];
        console.log('Images:', images);

        const project = new Project({
            projectName,
            location,
            latitude: latitude && latitude.trim() ? parseFloat(latitude) : undefined,
            longitude: longitude && longitude.trim() ? parseFloat(longitude) : undefined,
            description,
            amenities: amenities ? JSON.parse(amenities) : [],
            images,
            builderId,
        });

        console.log('Saving project:', project);
        await project.save();

        res.status(201).json({
            message: "Project created successfully",
            project,
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getBuilderProjects = async (req, res) => {
    try {
        const builderId = req.user.id;

        const projects = await Project.find({ builderId });

        res.json({
            projects,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const { projectId, projectName, location, latitude, longitude, description, amenities, status } = req.body;
        const builderId = req.user.id;

        if (!projectId) {
            return res.status(400).json({ error: "Project ID is required" });
        }

        const project = await Project.findOne({ _id: projectId, builderId });
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        if (projectName !== undefined) project.projectName = projectName;
        if (location !== undefined) project.location = location;
        if (latitude !== undefined) project.latitude = latitude && latitude.trim() ? parseFloat(latitude) : undefined;
        if (longitude !== undefined) project.longitude = longitude && longitude.trim() ? parseFloat(longitude) : undefined;
        if (description !== undefined) project.description = description;
        if (amenities !== undefined) project.amenities = JSON.parse(amenities);
        if (status !== undefined) project.status = status;

        // Handle new uploaded images
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.path);
            project.images = [...(project.images || []), ...newImages];
        }

        await project.save();

        res.json({
            message: "Project updated successfully",
            project,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { projectId } = req.body;
        const builderId = req.user.id;

        if (!projectId) {
            return res.status(400).json({ error: "Project ID is required" });
        }

        const project = await Project.findOneAndDelete({
            _id: projectId,
            builderId,
        });
        if (!project) {
            return res
                .status(404)
                .json({ error: "Project not found or not owned by builder" });
        }

        res.json({
            message: "Project deleted successfully",
            project,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Plots

exports.getAllBuildersPlots = async (req, res) => {
    try {
        const builderId = req.user.id;

        const projects = await Project.find({ builderId });
        const plots = projects.flatMap((project) =>
            project.plots.map((plot) => ({
                projectId: project._id,
                projectName: project.projectName,
                plotId: plot._id,
                plotNumber: plot.plotNumber,
                size: plot.size,
                price: plot.price,
                status: plot.status,
                facingDirection: plot.facingDirection,
                roadWidth: plot.roadWidth,
            })),
        );

        res.json({
            plots,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addPlot = async (req, res) => {
    try {
        const { projectId, plotNumber, size, price, facingDirection, roadWidth } = req.body;
        const builderId = req.user.id;

        const project = await Project.findOne({ _id: projectId, builderId });

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        const existingPlot = project.plots.find(
            (p) => p.plotNumber === plotNumber,
        );

        if (existingPlot) {
            return res.status(400).json({
                error: "Plot number already exists in this project",
            });
        }

        project.plots.push({
            plotNumber,
            size,
            price,
            facingDirection,
            roadWidth,
        });

        await project.save();

        res.json({
            message: "Plot added successfully",
            project,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updatePlot = async (req, res) => {
    try {
        const { projectId, plotId, plotNumber, size, price, status, facingDirection, roadWidth } = req.body;
        const builderId = req.user.id;

        const project = await Project.findOne({ _id: projectId, builderId });

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        const plot = project.plots.id(plotId);

        if (!plot) {
            return res.status(404).json({ error: "Plot not found" });
        }

        if (plotNumber !== undefined) plot.plotNumber = plotNumber;
        if (size !== undefined) plot.size = size;
        if (price !== undefined) plot.price = price;
        if (status !== undefined) plot.status = status;
        if (facingDirection !== undefined) plot.facingDirection = facingDirection;
        if (roadWidth !== undefined) plot.roadWidth = roadWidth;

        await project.save();

        res.json({
            message: "Plot updated successfully",
            plot,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deletePlot = async (req, res) => {
    try {
        const { projectId, plotId } = req.body;
        const builderId = req.user.id;

        const project = await Project.findOne({ _id: projectId, builderId });

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        project.plots.pull(plotId);

        await project.save();

        res.json({
            message: "Plot deleted successfully",
            project,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
