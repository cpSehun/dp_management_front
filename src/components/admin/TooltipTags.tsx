"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface TooltipTagsProps {
	tags: string[];
	maxVisible?: number;
	variant?: "default" | "blue";
}

export function TooltipTags({
	tags,
	maxVisible = 2,
	variant = "default",
}: TooltipTagsProps) {
	const [showTooltip, setShowTooltip] = useState<number | null>(null);
	const visibleTags = tags.slice(0, maxVisible);
	const remainingCount = tags.length - maxVisible;
	const allTagsText = tags.join(", ");

	const variants = {
		default: {
			tag: "inline-flex items-center rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors",
			count:
				"inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors cursor-help",
		},
		blue: {
			tag: "inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors",
			count:
				"inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors cursor-help",
		},
	};

	const styles = variants[variant];

	return (
		<div className="flex flex-wrap gap-1">
			{visibleTags.map((tag, index) => (
				<div key={tag} className="relative inline-block">
					<Badge
						className={styles.tag}
						onMouseEnter={() => setShowTooltip(index)}
						onMouseLeave={() => setShowTooltip(null)}
					>
						{tag}
					</Badge>

					{/* 툴팁 */}
					{showTooltip === index && (
						<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-slate-900 rounded-lg shadow-lg whitespace-nowrap z-50">
							<div className="font-medium mb-1">
								전체 태그 ({tags.length}개)
							</div>
							<div className="max-w-xs break-words">{allTagsText}</div>
							{/* 화살표 */}
							<div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
						</div>
					)}
				</div>
			))}

			{remainingCount > 0 && (
				<div className="relative inline-block">
					<Badge
						className={styles.count}
						onMouseEnter={() => setShowTooltip(999)}
						onMouseLeave={() => setShowTooltip(null)}
					>
						+{remainingCount}
					</Badge>

					{/* +n 툴팁 */}
					{showTooltip === 999 && (
						<div
							className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-slate-900 rounded-lg shadow-lg z-50"
							style={{ minWidth: "200px" }}
						>
							<div className="font-medium mb-1">
								전체 태그 ({tags.length}개)
							</div>
							<div className="break-words">{allTagsText}</div>
							{/* 화살표 */}
							<div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
