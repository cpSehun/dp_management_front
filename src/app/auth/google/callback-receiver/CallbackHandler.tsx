"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CallbackHandler() {
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		const token = searchParams.get("token");

		if (token) {
			localStorage.setItem("access_token", token);
			router.push("/admin/dashboard");
		} else {
			console.error("Google OAuth callback: No token received.");
			router.push("/login");
		}
	}, [router, searchParams]);

	return null; // 로직 처리 후 UI 반환 없음
}
