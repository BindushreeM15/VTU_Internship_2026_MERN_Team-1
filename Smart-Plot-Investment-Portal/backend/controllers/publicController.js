const Project  = require("../models/Project");
const Plot     = require("../models/Plot");
const Interest = require("../models/Interest");

// ── GET /api/public/projects ──────────────────────────────────────────────────
exports.getPublicProjects = async (req, res) => {
  try {
    const {
      search, location, minPrice, maxPrice, facing,
      sortBy = "trending", page = 1, limit = 12,
    } = req.query;

    const projectFilter = { projectStatus: "active" };
    if (location) projectFilter.location = { $regex: location, $options: "i" };
    if (search) {
      projectFilter.$or = [
        { projectName: { $regex: search, $options: "i" } },
        { location:    { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const pipeline = [
      { $match: projectFilter },
      {
        $lookup: {
          from: "plots", localField: "_id", foreignField: "projectId", as: "plots",
        },
      },
      ...(minPrice || maxPrice || facing ? [
        {
          $addFields: {
            plots: {
              $filter: {
                input: "$plots", as: "p",
                cond: {
                  $and: [
                    ...(minPrice ? [{ $gte: ["$$p.price", Number(minPrice)] }] : []),
                    ...(maxPrice ? [{ $lte: ["$$p.price", Number(maxPrice)] }] : []),
                    ...(facing   ? [{ $eq:  ["$$p.facing", facing] }]          : []),
                  ],
                },
              },
            },
          },
        },
        { $match: { "plots.0": { $exists: true } } },
      ] : []),
      {
        $addFields: {
          plotCount:      { $size: "$plots" },
          availableCount: {
            $size: {
              $filter: { input: "$plots", as: "p", cond: { $eq: ["$$p.status", "available"] } },
            },
          },
          minPlotPrice: { $min: "$plots.price" },
          maxPlotPrice: { $max: "$plots.price" },

          // Collect all plot images for slideshow
          plotImages: {
            $reduce: {
              input: "$plots",
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: { $ifNull: ["$$this.images", []] },
                      as:    "img",
                      in:    { url: "$$img.url" },
                    },
                  },
                ],
              },
            },
          },

          trendingScore: { $add: [{ $multiply: ["$interestCount", 5] }, "$viewCount"] },
        },
      },
      {
        $lookup: {
          from: "users", localField: "builderId", foreignField: "_id", as: "builder",
        },
      },
      { $unwind: { path: "$builder", preserveNullAndEmptyArrays: true } },
      {
        $sort:
          sortBy === "newest"     ? { createdAt: -1 }     :
          sortBy === "price_asc"  ? { minPlotPrice: 1 }   :
          sortBy === "price_desc" ? { minPlotPrice: -1 }  :
          { trendingScore: -1 },
      },
      {
        $facet: {
          total:    [{ $count: "count" }],
          projects: [
            { $skip: skip },
            { $limit: Number(limit) },
            {
              $project: {
                projectName: 1, location: 1, locationLink: 1,
                description: 1, amenities: 1, totalPlots: 1,
                projectStatus: 1,
                // Project images for the slideshow (sketch + gallery)
                sketchImage:   1,
                projectImages: 1,
                plotImages:    { $slice: ["$plotImages", 6] },
                viewCount: 1, interestCount: 1, trendingScore: 1,
                plotCount: 1, availableCount: 1,
                minPlotPrice: 1, maxPlotPrice: 1,
                createdAt: 1,
                "builder._id": 1, "builder.name": 1, "builder.companyName": 1,
              },
            },
          ],
        },
      },
    ];

    const [result] = await Project.aggregate(pipeline);
    res.json({
      projects: result?.projects || [],
      pagination: {
        total:      result?.total?.[0]?.count || 0,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil((result?.total?.[0]?.count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/public/projects/:projectId ───────────────────────────────────────
// Increments viewCount ONCE per request (fixed double-increment bug)
exports.getPublicProjectDetail = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Single atomic findOneAndUpdate — viewCount incremented exactly once
    const project = await Project.findOneAndUpdate(
      { _id: projectId, projectStatus: "active" },
      { $inc: { viewCount: 1 } },
      { returnDocument: "after" }
    ).populate("builderId", "name companyName phone email");

    if (!project) return res.status(404).json({ error: "Project not found" });

    const plots = await Plot.find({ projectId }).sort({ plotNumber: 1 });

    // Check if requesting user has saved this project
    let isSaved = false;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const jwt     = require("jsonwebtoken");
        const payload = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
        if (payload?.role === "investor") {
          isSaved = !!(await Interest.findOne({ investorId: payload.id, projectId }));
        }
      } catch (_) {}
    }

    res.json({ project, plots, isSaved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/public/projects/:projectId/plots/:plotId ─────────────────────────
exports.getPublicPlotDetail = async (req, res) => {
  try {
    const { projectId, plotId } = req.params;
    const project = await Project.findOne({ _id: projectId, projectStatus: "active" })
      .populate("builderId", "name companyName");
    if (!project) return res.status(404).json({ error: "Project not found" });
    const plot = await Plot.findOne({ _id: plotId, projectId });
    if (!plot) return res.status(404).json({ error: "Plot not found" });
    res.json({ plot, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/public/filters ───────────────────────────────────────────────────
exports.getPublicFilters = async (req, res) => {
  try {
    const [locations, priceAgg] = await Promise.all([
      Project.distinct("location", { projectStatus: "active" }),
      Plot.aggregate([
        { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" } },
        { $unwind: "$project" },
        { $match: { "project.projectStatus": "active" } },
        { $group: { _id: null, minPrice: { $min: "$price" }, maxPrice: { $max: "$price" } } },
      ]),
    ]);
    res.json({
      locations:     locations.sort(),
      minPrice:      priceAgg[0]?.minPrice || 0,
      maxPrice:      priceAgg[0]?.maxPrice || 10000000,
      facingOptions: ["North","South","East","West","North-East","North-West","South-East","South-West"],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/public/stats ─────────────────────────────────────────────────────
exports.getPublicStats = async (req, res) => {
  try {
    const [projectCount, plotCount, locations] = await Promise.all([
      Project.countDocuments({ projectStatus: "active" }),
      Plot.countDocuments(),
      Project.distinct("location", { projectStatus: "active" }),
    ]);
    res.json({ projects: projectCount, plots: plotCount, locations: locations.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
