"use client";

import React from "react";

interface AdminPageLayoutProps {
	children: React.ReactNode;
	className?: string;
}

export function AdminPageLayout({
	children,
	className = "",
}: AdminPageLayoutProps) {
	return (
		<div className={`min-h-screen bg-slate-50/50 ${className}`}>
			{/* 메인 컨테이너 */}
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* 콘텐츠 영역 */}
				<div className="space-y-8">{children}</div>
			</div>
		</div>
	);
}
