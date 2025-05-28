"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";

interface AdminPageHeaderProps {
	title: string;
	searchPlaceholder?: string;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	onCreateClick?: () => void;
	createButtonText?: string;
	showCreateButton?: boolean;
}

export function AdminPageHeader({
	title,
	searchPlaceholder = "검색...",
	searchValue = "",
	onSearchChange,
	onCreateClick,
	createButtonText = "생성",
	showCreateButton = true,
}: AdminPageHeaderProps) {
	return (
		<div className="space-y-6">
			{/* 제목과 생성 버튼 */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0 flex-1">
					<h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
						{title}
					</h1>
					<p className="mt-2 text-sm text-slate-600">
						데이터를 관리하고 검색할 수 있습니다.
					</p>
				</div>
				{showCreateButton && (
					<div className="flex-shrink-0">
						<Button
							onClick={onCreateClick}
							className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-colors"
						>
							<Plus className="-ml-0.5 mr-2 h-4 w-4" />
							{createButtonText}
						</Button>
					</div>
				)}
			</div>

			{/* 검색바 */}
			<div className="flex flex-1 items-center justify-center px-2 lg:ml-0 lg:justify-start">
				<div className="w-full max-w-lg lg:max-w-xs">
					<label htmlFor="search" className="sr-only">
						검색
					</label>
					<div className="relative">
						<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
							<Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
						</div>
						<Input
							id="search"
							name="search"
							type="search"
							placeholder={searchPlaceholder}
							value={searchValue}
							onChange={(e) => onSearchChange?.(e.target.value)}
							className="block w-full rounded-lg border-0 bg-white py-2.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
