import express from "express";
const router = express.Router();

/**
 * GET /api/places?loc=Mumbai
 */
router.get("/", async (req, res) => {
  const { loc } = req.query;

  if (!loc) {
    return res.status(400).json({
      success: false,
      message: "Location is required",
    });
  }

  // TEMP DATA (replace with DB later)
  const places = [];

  res.status(200).json({
    success: true,
    location: loc,
    results: places,
  });
});

export default router;
