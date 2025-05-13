/**
 * 클라이언트 사이드에서 사용자 로그인 상태를 확인하는 함수
 * @returns {boolean} 로그인 여부
 */
export const isLoggedIn = (): boolean => {
	if (typeof window === "undefined") {
		return false; // 서버 사이드에서는 항상 로그아웃 상태로 간주
	}

	const token = localStorage.getItem("access_token");
	return !!token; // token이 존재하면 true, 없으면 false
};
