"use client";

import { usePathname } from "next/navigation";
import React from "react";

export default function PromptsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	let pageTitle = "프롬프트";

	if (pathname.includes("/prompts/image")) {
		pageTitle = "이미지 프롬프트 목록";
	} else if (pathname.includes("/prompts/persona")) {
		pageTitle = "페르소나 프롬프트 목록";
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
				<div className="flex-1 lg:max-w-full">
					<div className="mb-6">
						<h1 className="text-3xl font-bold tracking-tight mb-4">
							{pageTitle}
						</h1>
						<p className="text-muted-foreground">
							프롬프트를 관리하고 버전을 추적합니다.
						</p>
					</div>

					{children}
				</div>
			</div>
		</div>
	);
}
