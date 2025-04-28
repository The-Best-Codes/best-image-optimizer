/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["sharp"],
  /* Uncomment when using webpack:
  webpack: (cfg, options = {}) => {
    cfg.externals.push("sharp");
    const { webpack } = options;
    const regex = /^sharp$/;
    cfg.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: regex,
      }),
    );
  },
  */
};

export default nextConfig;
