import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: ['http://localhost:3000', 'http://<TU_IP_LOCAL>:3000'],
  },
};
module.exports = nextConfig;
