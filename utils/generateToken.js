import jwt from "jsonwebtoken";

export default function generateToken(userId, role = "patient") {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: userId.toString(),
      role
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    }
  );
}