"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionItem {
	label: string;
	icon?: React.ReactNode;
	onClick?: () => void;
	variant?: "default" | "destructive";
	disabled?: boolean;
}

interface ActionDropdownProps {
	actions: ActionItem[];
	label?: string;
	className?: string;
}

export function ActionDropdown({
	actions,
	label = "작업",
	className = "",
}: ActionDropdownProps) {
	if (actions.length === 0) {
		return null;
	}

	// 구분선이 필요한지 확인 (destructive 액션이 있는 경우)
	const hasDestructiveAction = actions.some(
		(action) => action.variant === "destructive"
	);
	const regularActions = actions.filter(
		(action) => action.variant !== "destructive"
	);
	const destructiveActions = actions.filter(
		(action) => action.variant === "destructive"
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className={cn(
						"h-8 w-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900",
						className
					)}
				>
					<span className="sr-only">메뉴 열기</span>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-48 border-slate-200 bg-white shadow-lg"
			>
				<DropdownMenuLabel className="text-slate-900 font-medium">
					{label}
				</DropdownMenuLabel>

				{/* 일반 액션들 */}
				{regularActions.map((action, index) => (
					<DropdownMenuItem
						key={index}
						onClick={action.onClick}
						disabled={action.disabled}
						className="flex items-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900 cursor-pointer"
					>
						{action.icon && (
							<span className="mr-3 h-4 w-4 text-slate-500">{action.icon}</span>
						)}
						<span className="text-sm font-medium">{action.label}</span>
					</DropdownMenuItem>
				))}

				{/* 구분선 */}
				{hasDestructiveAction && regularActions.length > 0 && (
					<DropdownMenuSeparator className="bg-slate-200" />
				)}

				{/* 위험한 액션들 (빨간색) */}
				{destructiveActions.map((action, index) => (
					<DropdownMenuItem
						key={index}
						onClick={action.onClick}
						disabled={action.disabled}
						className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-700 cursor-pointer"
					>
						{action.icon && <span className="mr-3 h-4 w-4">{action.icon}</span>}
						<span className="text-sm font-medium">{action.label}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
