import path from "path";
import fs from "fs";

export const serveImage = async (req, res) => {
  try {
    const { folder, filename } = req.params;

    // Absolute path to uploads directory
    const imagePath = path.join(
      process.cwd(),
      "uploads",
      folder,
      filename
    );

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Send image
    return res.sendFile(imagePath);

  } catch (err) {
    console.error("IMAGE SERVE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
