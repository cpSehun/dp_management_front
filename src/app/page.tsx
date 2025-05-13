"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/utils/auth";
import Image from "next/image";

export default function Home() {
	const router = useRouter();

	useEffect(() => {
		// 로그인 상태에 따라 리다이렉트
		if (isLoggedIn()) {
			// 로그인 된 사용자는 대시보드로 리다이렉트
			router.replace("/admin/dashboard");
		} else {
			// 로그인 안 된 사용자는 로그인 페이지로 리다이렉트
			router.replace("/login");
		}
	}, [router]);

	// 리다이렉트 되기 전까지 보여줄 로딩 상태
	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center">
				<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
				<p className="text-gray-500">리다이렉트 중...</p>
			</div>
		</div>
	);
}
