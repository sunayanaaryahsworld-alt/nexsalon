import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * decoded contains:
     * {
     *   uid,
     *   email,
     *   role,
     *   iat,
     *   exp
     * }
     */

    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token"
    });
  }
};

export const verifyRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "You do not have permission to access this resource"
      });
    }

    next();
  };
};


// export const checkSubscription = async (req, res, next) => {
//   const adminUid = req.params.userId;
//   try {
//     const userSnap = await get(ref(db, `salonandspa/users/${adminUid}`));
//     const userData = userSnap.val();

//     if (userData.role === 'admin' && userData.hasSubscription === true) {
//         next();
//     } else {
//         res.status(403).json({ error: "Access denied. Please buy a subscription first." });
//     }
//   } catch (error) {
//     res.status(500).json({ error: "Internal server error during sub check" });
//   }
// };

const authMiddleware = verifyToken;
export default authMiddleware;
