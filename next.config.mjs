/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdfkit', 'fontkit', 'exceljs'],
  devIndicators: false,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
