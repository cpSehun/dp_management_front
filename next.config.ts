/** @type {import('next').NextConfig} */
const nextConfig = {
	// 개발 환경에서는 standalone 빌드를 사용하지 않음
	// output: "standalone",
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: "http://backend:8000/api/:path*",
			},
		];
	},
	// 소스맵 활성화
	productionBrowserSourceMaps: true,
	// 개발 환경 특화 설정
	webpack: (
		config: any,
		{ dev, isServer }: { dev: boolean; isServer: boolean }
	) => {
		if (dev && !isServer) {
			// 클라이언트 사이드 개발 환경에서만 적용할 설정
			config.devtool = "eval-source-map";
		}
		return config;
	},
};

export default nextConfig;
