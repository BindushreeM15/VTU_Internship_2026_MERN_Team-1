const Project = require("../models/Project");

// Projects

exports.createProject = async (req, res) => {
    try {
        const { projectName, location, description } = req.body;
        const builderId = req.user.id;

        if (!projectName || !location || !description) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const project = new Project({
            projectName,
            location,
            description,
            builderId,
        });

        await project.save();

        res.status(201).json({
            message: "Project created successfully",
            project,
        });
    } catch (error) {
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
        const { projectId, projectName, location, description, status } =
            req.body;
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
        if (description !== undefined) project.description = description;
        if (status !== undefined) project.status = status;

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
        const { projectId, plotNumber, size, price } = req.body;
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
        const { projectId, plotId, plotNumber, size, price, status } = req.body;
        const builderId = req.user.id;

        const project = await Project.findOne({ _id: projectId, builderId });

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        const plot = project.plots.id(plotId);

        if (!plot) {
            return res.status(404).json({ error: "Plot not found" });
        }

        if (plotNumber) plot.plotNumber = plotNumber;
        if (size) plot.size = size;
        if (price) plot.price = price;
        if (status) plot.status = status;

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
