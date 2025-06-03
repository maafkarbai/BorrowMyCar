// middleware/multer.js

import multer from "multer";
import { storage } from "../utils/cloudinary.js"; // CloudinaryStorage config

const upload = multer({ storage });
export default upload;
