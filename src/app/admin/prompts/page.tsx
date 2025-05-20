"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PromptsRedirectPage() {
	const router = useRouter();

	useEffect(() => {
		// 이미지 프롬프트 페이지로 자동 리다이렉트
		router.push("/admin/prompts/image");
	}, [router]);

	return (
		<div className="flex items-center justify-center h-40">
			<Loader2 className="h-8 w-8 animate-spin text-primary" />
			<span className="ml-2 text-lg">리다이렉트 중...</span>
		</div>
	);
}
