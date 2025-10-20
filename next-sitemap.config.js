/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://www.alojamentoideal.pt",
  generateRobotsTxt: true, // Generates robots.txt automatically
  sitemapSize: 5000, // Split if you have many listings
  exclude: ["*/admin/*", "/api/*"],
  changefreq: "weekly",
  priority: 0.7,
  autoLastmod: true,
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: path.startsWith("/") ? "daily" : "monthly",
      priority:config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
