/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  //serverExternalPackages: ["sharp"],
  webpack: (cfg, options = {}) => {
    cfg.externals.push("sharp");
    const { webpack } = options;
    const regex = /^sharp$/;
    cfg.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: regex,
      }),
    );

    return cfg;
  },
};

export default nextConfig;
