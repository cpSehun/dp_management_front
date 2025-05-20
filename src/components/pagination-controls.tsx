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

interface PaginationControlsProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	siblingCount?: number;
}

export function PaginationControls({
	currentPage,
	totalPages,
	onPageChange,
	siblingCount = 1,
}: PaginationControlsProps) {
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
						<PaginationEllipsis />
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
					>
						{pageNumber}
					</PaginationLink>
				</PaginationItem>
			);
		});
	};

	// 페이지가 1페이지만 있으면 페이지네이션 표시하지 않음
	if (totalPages <= 1) {
		return null;
	}

	return (
		<Pagination className="mt-4">
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						href="#"
						onClick={(e) => {
							e.preventDefault();
							goToPage(currentPage - 1);
						}}
						className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
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
						className={
							currentPage >= totalPages ? "pointer-events-none opacity-50" : ""
						}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
