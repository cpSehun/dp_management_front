"use client";

import React from "react";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	PaginationEllipsis,
} from "@/components/ui/pagination";

interface AdminPaginationProps {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
	onPageChange: (page: number) => void;
	siblingCount?: number;
}

export function AdminPagination({
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	onPageChange,
	siblingCount = 1,
}: AdminPaginationProps) {
	// 페이지가 1페이지만 있으면 페이지네이션 표시하지 않음
	if (totalPages <= 1) {
		return null;
	}

	const startItem = (currentPage - 1) * itemsPerPage + 1;
	const endItem = Math.min(currentPage * itemsPerPage, totalItems);

	// 특정 페이지로 이동하는 함수
	const goToPage = (page: number) => {
		if (page > 0 && page <= totalPages) {
			onPageChange(page);
		}
	};

	// 페이지 번호 렌더링 로직
	const renderPageNumbers = () => {
		const pageNumbers: (number | "ellipsis")[] = [];

		// 항상 첫 페이지 추가
		pageNumbers.push(1);

		// 현재 페이지 주변 페이지 추가
		const leftSibling = Math.max(2, currentPage - siblingCount);
		const rightSibling = Math.min(totalPages - 1, currentPage + siblingCount);

		// 왼쪽 생략 부호 추가
		if (leftSibling > 2) {
			pageNumbers.push("ellipsis");
		}

		// 양쪽 형제 페이지 추가
		for (let i = leftSibling; i <= rightSibling; i++) {
			if (i !== 1 && i !== totalPages) {
				pageNumbers.push(i);
			}
		}

		// 오른쪽 생략 부호 추가
		if (rightSibling < totalPages - 1) {
			pageNumbers.push("ellipsis");
		}

		// 마지막 페이지가 1이 아니면 추가
		if (totalPages > 1) {
			pageNumbers.push(totalPages);
		}

		return pageNumbers.map((pageNumber, index) => {
			if (pageNumber === "ellipsis") {
				return (
					<PaginationItem key={`ellipsis-${index}`}>
						<PaginationEllipsis className="text-slate-500" />
					</PaginationItem>
				);
			}

			return (
				<PaginationItem key={pageNumber}>
					<PaginationLink
						href="#"
						onClick={(e) => {
							e.preventDefault();
							goToPage(pageNumber as number);
						}}
						isActive={pageNumber === currentPage}
						className={
							pageNumber === currentPage
								? "bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
								: "text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-300"
						}
					>
						{pageNumber}
					</PaginationLink>
				</PaginationItem>
			);
		});
	};

	return (
		<div className="flex items-center justify-between bg-white px-4 py-6 sm:px-6 border-t border-slate-200">
			{/* 모바일 버전 */}
			<div className="flex flex-1 justify-between sm:hidden">
				<button
					onClick={() => goToPage(currentPage - 1)}
					disabled={currentPage <= 1}
					className="relative inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
				>
					이전
				</button>
				<button
					onClick={() => goToPage(currentPage + 1)}
					disabled={currentPage >= totalPages}
					className="relative ml-3 inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
				>
					다음
				</button>
			</div>

			{/* 데스크톱 버전 */}
			<div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
				<div>
					<p className="text-sm text-slate-700">
						<span className="font-medium text-slate-900">{totalItems}개</span>{" "}
						중 <span className="font-medium text-slate-900">{startItem}</span>-
						<span className="font-medium text-slate-900">{endItem}</span>개 표시
					</p>
				</div>

				<Pagination className="mx-0 w-auto">
					<PaginationContent className="gap-1">
						<PaginationItem>
							<PaginationPrevious
								href="#"
								onClick={(e) => {
									e.preventDefault();
									goToPage(currentPage - 1);
								}}
								className={cn(
									"text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-300",
									currentPage <= 1 &&
										"pointer-events-none opacity-50 hover:bg-white"
								)}
							/>
						</PaginationItem>

						{renderPageNumbers()}

						<PaginationItem>
							<PaginationNext
								href="#"
								onClick={(e) => {
									e.preventDefault();
									goToPage(currentPage + 1);
								}}
								className={cn(
									"text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-300",
									currentPage >= totalPages &&
										"pointer-events-none opacity-50 hover:bg-white"
								)}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</div>
		</div>
	);
}

// cn 함수 추가 (누락된 import 대체)
function cn(...classes: (string | undefined | null | false)[]): string {
	return classes.filter(Boolean).join(" ");
}
