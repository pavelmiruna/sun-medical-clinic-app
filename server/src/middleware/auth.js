import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = { id: payload.sub, role: payload.role };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}  