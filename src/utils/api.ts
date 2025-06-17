export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
	let baseURL;

	// 서버 사이드에서 실행될 때 (Node.js 환경)
	if (typeof window === "undefined") {
		// 서버 내부 통신용 API URL. Docker 환경 등에서 컨테이너 실행 시 주입.
		baseURL = process.env.INTERNAL_API_URL || "http://backend:8000";

		// 서버 사이드에서만 로그 출력 (docker-compose logs -f로 확인 가능)
		const url = endpoint.startsWith("/")
			? `${baseURL}${endpoint}`
			: `${baseURL}/${endpoint}`;
		try {
			return await fetch(url, {
				...options,
				headers: {
					"Content-Type": "application/json",
					...options.headers,
				},
			});
		} catch (error) {
			throw error;
		}
	}
	// 클라이언트 사이드(브라우저)에서 실행될 때
	else {
		// 클라이언트 사이드 로그는 제거 (브라우저 콘솔에 출력되지 않음)
		baseURL = process.env.NEXT_PUBLIC_FRONTED_URL || window.location.origin;
		const url = endpoint.startsWith("/")
			? `${baseURL}${endpoint}`
			: `${baseURL}/${endpoint}`;

		return await fetch(url, {
			...options,
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
		}).catch((error) => {
			// 오류는 기록하지 않고 상위로 전달만 함
			throw error;
		});
	}
}
