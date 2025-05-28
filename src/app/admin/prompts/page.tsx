"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PromptsRedirectPage() {
	const router = useRouter();

	useEffect(() => {
		// 이미지 프롬프트 페이지로 자동 리다이렉트 (더 깔끔한 구현)
		router.replace("/admin/prompts/image");
	}, [router]);

	// 리다이렉트 중 간단한 로딩 표시
	return (
		<div className="flex items-center justify-center h-40">
			<div className="flex items-center space-x-2">
				<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
				<span className="text-gray-600">프롬프트 페이지로 이동 중...</span>
			</div>
		</div>
	);
}
