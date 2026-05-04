/**
 * Compliance Risk Score Calculator
 * Calculates project compliance score based on documents and katha type
 */

const COMPLIANCE_POINTS = {
  reraCertificate: 30,
  dcConversion: 25,
  encumbranceCertificate: 20,
  kathaA: 15,
  approvedLayoutPlan: 10,
};

const MAX_SCORE = 100;

/**
 * Calculate compliance risk score for a project
 * @param {Array} projectDocuments - Array of project documents
 * @param {String} kathaType - Type of Katha (A, B, NA)
 * @returns {Number} Risk score (0-100)
 */
exports.calculateRiskScore = (projectDocuments = [], kathaType = null) => {
  let score = 0;

  // Check for each compliance document
  if (projectDocuments && Array.isArray(projectDocuments)) {
    const docTypes = projectDocuments.map((d) => d.docType);

    if (docTypes.includes("reraCertificate")) score += COMPLIANCE_POINTS.reraCertificate;
    if (docTypes.includes("dcConversion")) score += COMPLIANCE_POINTS.dcConversion;
    if (docTypes.includes("encumbranceCertificate")) score += COMPLIANCE_POINTS.encumbranceCertificate;
    if (docTypes.includes("approvedLayoutPlan")) score += COMPLIANCE_POINTS.approvedLayoutPlan;
  }

  // Katha points
  if (kathaType === "A") {
    score += COMPLIANCE_POINTS.kathaA;
  }

  return Math.min(score, MAX_SCORE);
};

/**
 * Get risk level based on score
 * @param {Number} score - Compliance score (0-100)
 * @returns {String} Risk level: "Low" (80-100), "Medium" (50-79), "High" (<50)
 */
exports.getRiskLevel = (score) => {
  if (score >= 80) return "Low";
  if (score >= 50) return "Medium";
  return "High";
};

/**
 * Get risk color for UI
 * @param {String} riskLevel - Risk level
 * @returns {String} Hex color code
 */
exports.getRiskColor = (riskLevel) => {
  const colors = {
    Low: "#22c55e",      // Green
    Medium: "#eab308",   // Yellow
    High: "#ef4444",     // Red
  };
  return colors[riskLevel] || "#94a3b8";
};

/**
 * Generate legal summary from project documents
 * @param {Object} project - Project document with documents and katha info
 * @returns {Object} Legal summary object
 */
exports.generateLegalSummary = (project) => {
  const docs = project.projectDocuments || [];
  const docTypes = docs.map((d) => d.docType);

  const summary = {
    projectName: project.projectName || "Project",
    compliance: [],
    kathaInfo: project.kathaType ? `Katha Type: ${project.kathaType}` : "Katha: Not Available",
    riskLevel: null,
  };

  // Add compliance items
  if (docTypes.includes("reraCertificate")) {
    summary.compliance.push("✓ RERA Registered");
  }

  if (docTypes.includes("dcConversion")) {
    summary.compliance.push("✓ DC Conversion Approved");
  }

  if (docTypes.includes("encumbranceCertificate")) {
    summary.compliance.push("✓ Encumbrance: Clear");
  }

  if (docTypes.includes("approvedLayoutPlan")) {
    summary.compliance.push("✓ Layout Plan: Approved");
  }

  if (docTypes.includes("landTitle")) {
    summary.compliance.push("✓ Land Title Verified");
  }

  // Calculate and add risk level
  const score = exports.calculateRiskScore(docs, project.kathaType);
  const riskLevel = exports.getRiskLevel(score);
  summary.riskLevel = riskLevel;
  summary.score = score;

  return summary;
};

/**
 * Calculate ROI for a plot or project
 * @param {Number} currentPrice - Current price
 * @param {Number} expectedPrice - Expected future price
 * @returns {Number} ROI percentage
 */
exports.calculateROI = (currentPrice, expectedPrice) => {
  if (!currentPrice || currentPrice === 0) return 0;
  const roi = ((expectedPrice - currentPrice) / currentPrice) * 100;
  return Math.round(roi * 10) / 10; // Round to 1 decimal place
};

/**
 * Get investment recommendation based on ROI and risk score
 * @param {Number} roi - ROI percentage
 * @param {Number} riskScore - Compliance risk score (0-100)
 * @returns {String} Recommendation level
 */
exports.getInvestmentRecommendation = (roi, riskScore) => {
  if (roi > 40 && riskScore > 70) {
    return "Recommended";
  }
  if (roi > 25 && riskScore > 50) {
    return "Moderate";
  }
  return "Risky";
};
