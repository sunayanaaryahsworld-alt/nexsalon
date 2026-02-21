import multer from "multer";
import path from "path";
import fs from "fs";

const uploadPath = "uploads/services";

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadPath),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `service-${Date.now()}${ext}`);
  }
});

export const uploadServiceImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(new Error("Only images allowed"), false);
  }
});
