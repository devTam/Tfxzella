import type { NextConfig } from "next";
process.env.TZ = "America/New_York";
const nextConfig: NextConfig = { output: "standalone", env: { TZ: "America/New_York" }, images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] } };
export default nextConfig;
