"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";

interface PromptPageHeaderProps {
	// title: string; // title prop 제거
	searchPlaceholder: string;
	searchTerm: string;
	onSearchTermChange: (term: string) => void;
	onCreateClick: () => void;
	createButtonText: string;
}

export function PromptPageHeader({
	// title, // title prop 제거
	searchPlaceholder,
	searchTerm,
	onSearchTermChange,
	onCreateClick,
	createButtonText,
}: PromptPageHeaderProps) {
	return (
		<div className="flex items-center justify-between mb-4">
			{" "}
			{/* 제목과 검색/버튼 그룹을 한 줄에 배치하거나, 필요시 구조 변경 */}
			<div className="flex items-center space-x-2 flex-grow">
				<Input
					placeholder={searchPlaceholder}
					value={searchTerm}
					onChange={(e) => onSearchTermChange(e.target.value)}
					className="max-w-sm lg:max-w-md xl:max-w-lg" // 반응형 너비 조정
				/>
				{/* <Button onClick={() => onSearchTermChange(searchTerm)}>검색</Button> */}
			</div>
			<Button onClick={onCreateClick} className="ml-auto">
				<PlusCircle className="mr-2 h-5 w-5" /> {createButtonText}
			</Button>
		</div>
	);
}
