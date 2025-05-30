"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CallbackHandler() {
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		const token = searchParams.get("token");

		console.log("CallbackHandler: 받은 토큰:", token);

		if (token === "approval_pending") {
			console.log("CallbackHandler: 승인 대기 페이지로 이동");
			router.push("/auth/approval-pending");
		} else if (token && token !== "approval_pending") {
			console.log("CallbackHandler: 정상 토큰, 대시보드로 이동");
			localStorage.setItem("access_token", token);
			router.replace("/admin/dashboard");
		} else {
			console.error("Google OAuth callback: No token received.");
			router.replace("/login");
		}
	}, [router, searchParams]);

	return (
		<div style={{ padding: "20px", textAlign: "center" }}>
			<h3>처리 중...</h3>
			<p>CallbackHandler 실행 중입니다.</p>
		</div>
	);
}
