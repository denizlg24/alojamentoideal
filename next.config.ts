import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [new URL('https://img.hostify.com/**'), new URL('https://bokun.s3.amazonaws.com/**'), new URL('http://bokun.s3.amazonaws.com/**')],
    },
    reactStrictMode: false,
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);