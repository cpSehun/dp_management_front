"use client";

import { usePathname, useRouter } from "next/navigation";

export default function PromptsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-6">
			<div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
				<div className="flex-1 lg:max-w-full">
					<div className="mb-6">
						<h1 className="text-3xl font-bold tracking-tight mb-4">
							프롬프트 관리
						</h1>
						<p className="text-muted-foreground">
							이미지 생성 및 페르소나 프롬프트를 관리하고 버전을 추적합니다.
						</p>
					</div>

					{children}
				</div>
			</div>
		</div>
	);
}
