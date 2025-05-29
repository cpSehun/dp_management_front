"use client";

import React from "react";
import { cn } from "@/lib/utils";

// 메인 테이블 컨테이너
interface AdminTableProps {
	children: React.ReactNode;
	className?: string;
}

export function AdminTable({ children, className = "" }: AdminTableProps) {
	return (
		<div
			className={cn(
				"overflow-hidden bg-white shadow-sm ring-1 ring-slate-200 md:rounded-xl",
				className
			)}
		>
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-slate-200">
					{children}
				</table>
			</div>
		</div>
	);
}

// 테이블 헤더
interface AdminTableHeaderProps {
	children: React.ReactNode;
}

export function AdminTableHeader({ children }: AdminTableHeaderProps) {
	return (
		<thead className="bg-slate-50/75">
			<tr>{children}</tr>
		</thead>
	);
}

// 테이블 헤더 셀
interface AdminTableHeaderCellProps {
	children: React.ReactNode;
	className?: string;
}

export function AdminTableHeaderCell({
	children,
	className = "",
}: AdminTableHeaderCellProps) {
	return (
		<th
			className={cn(
				"px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider",
				className
			)}
		>
			{children}
		</th>
	);
}

// 테이블 바디
interface AdminTableBodyProps {
	children: React.ReactNode;
}

export function AdminTableBody({ children }: AdminTableBodyProps) {
	return (
		<tbody className="divide-y divide-slate-200 bg-white">{children}</tbody>
	);
}

// 테이블 행
interface AdminTableRowProps {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
}

export function AdminTableRow({
	children,
	className = "",
	onClick,
}: AdminTableRowProps) {
	return (
		<tr
			className={cn(
				"hover:bg-slate-50/50 transition-colors duration-200",
				onClick && "cursor-pointer",
				className
			)}
			onClick={onClick}
		>
			{children}
		</tr>
	);
}

// 테이블 셀
interface AdminTableCellProps {
	children: React.ReactNode;
	className?: string;
}

export function AdminTableCell({
	children,
	className = "",
}: AdminTableCellProps) {
	return (
		<td className={cn("px-6 py-4 text-sm text-slate-900", className)}>
			{children}
		</td>
	);
}

// 로딩 상태를 위한 테이블 행 (테이블 구조 내에서 사용)
interface AdminTableLoadingRowProps {
	colSpan: number;
	message?: string;
}

export function AdminTableLoadingRow({
	colSpan,
	message = "데이터를 불러오는 중입니다...",
}: AdminTableLoadingRowProps) {
	return (
		<tr className="hover:bg-slate-50/50 transition-colors duration-200">
			<td colSpan={colSpan} className="px-6 py-12 text-center">
				<div className="flex items-center justify-center">
					<div className="flex items-center space-x-3">
						<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
						<span className="text-sm text-slate-600 font-medium">
							{message}
						</span>
					</div>
				</div>
			</td>
		</tr>
	);
}

// 빈 상태를 위한 테이블 행
interface AdminTableEmptyRowProps {
	colSpan: number;
	message?: string;
}

export function AdminTableEmptyRow({
	colSpan,
	message = "표시할 데이터가 없습니다.",
}: AdminTableEmptyRowProps) {
	return (
		<tr className="hover:bg-slate-50/50 transition-colors duration-200">
			<td colSpan={colSpan} className="px-6 py-16 text-center">
				<div className="flex flex-col items-center justify-center">
					{/* 빈 상태 아이콘 */}
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
						<svg
							className="h-6 w-6 text-slate-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<h3 className="mt-4 text-sm font-semibold text-slate-900">
						데이터 없음
					</h3>
					<p className="mt-1 text-sm text-slate-500">{message}</p>
				</div>
			</td>
		</tr>
	);
}

// 로딩 상태를 위한 독립적인 컴포넌트
interface AdminTableLoadingProps {
	colSpan: number;
	message?: string;
}

export function AdminTableLoading({
	colSpan,
	message = "데이터를 불러오는 중입니다...",
}: AdminTableLoadingProps) {
	return (
		<div className="overflow-hidden bg-white shadow-sm ring-1 ring-slate-200 md:rounded-xl">
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-slate-200">
					<tbody className="divide-y divide-slate-200 bg-white">
						<tr className="hover:bg-slate-50/50 transition-colors duration-200">
							<td colSpan={colSpan} className="px-6 py-12 text-center">
								<div className="flex items-center justify-center">
									<div className="flex items-center space-x-3">
										<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
										<span className="text-sm text-slate-600 font-medium">
											{message}
										</span>
									</div>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
}
