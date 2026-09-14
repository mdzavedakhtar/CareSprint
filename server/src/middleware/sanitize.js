/**
 * CareSprint NoSQL Query Sanitizer Middleware
 * Recursively strips MongoDB query operators ($gt, $ne, $where, $regex, etc.) from req.body, req.query, and req.params
 */

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (key.startsWith("$") || key.includes(".")) {
        console.warn(`[NoSQL Sanitizer Warning] Stripping malicious key "${key}" from request payload`);
        delete obj[key];
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        obj[key] = sanitizeObject(obj[key]);
      }
    }
  }

  return obj;
};

const sanitizeNoSQL = (req, res, next) => {
  try {
    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);
    next();
  } catch (err) {
    console.error("[NoSQL Sanitizer Error]:", err);
    next();
  }
};

module.exports = {
  sanitizeNoSQL,
  sanitizeObject,
};
