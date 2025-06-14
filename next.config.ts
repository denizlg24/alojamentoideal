import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [new URL('https://img.hostify.com/**')],
    },
    reactStrictMode: false,
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);