/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['10.10.9.166'],
  serverExternalPackages: ['pdfkit', 'fontkit', 'exceljs'],
  devIndicators: false,
};

export default nextConfig;
