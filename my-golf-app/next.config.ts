/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"], // Explicitly allow AVIF
  },
}

module.exports = nextConfig