"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Trash2, Eye, Image } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// 이미지 타입 정의 (백엔드 스키마와 일치)
interface GeneratedImage {
	id: number;
	name: string;
	prompt: string;
	model: string;
	s3_url: string;
	tags?: string;
	steps?: number;
	seed?: number;
	created_at: string;
	created_by?: string; // username
}

interface PaginatedGeneratedImages {
	total_items: number;
	items: GeneratedImage[];
}

const ITEMS_PER_PAGE = 10;

export default function ImageListPage() {
	const [images, setImages] = useState<GeneratedImage[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalImages, setTotalImages] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
	const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Debounce search term
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500);
		return () => {
			clearTimeout(handler);
		};
	}, [searchTerm]);

	// 이미지 목록 조회 함수
	const fetchImages = useCallback(
		async (page: number, currentSearchTerm?: string) => {
			setIsLoading(true);
			setError(null);
			try {
				const token = localStorage.getItem("access_token");
				if (!token) throw new Error("Access token not found.");

				const skip = (page - 1) * ITEMS_PER_PAGE;
				let url = `/api/v1/images?skip=${skip}&limit=${ITEMS_PER_PAGE}`;
				const termToUse =
					typeof currentSearchTerm === "string"
						? currentSearchTerm
						: debouncedSearchTerm;
				if (termToUse) {
					url += `&searchTerm=${encodeURIComponent(termToUse)}`;
				}

				const response = await fetch(url, {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					throw new Error(
						errData.detail || `Failed to fetch images: ${response.statusText}`
					);
				}
				const data: PaginatedGeneratedImages = await response.json();
				setImages(data.items);
				setTotalImages(data.total_items);
				setCurrentPage(page);
			} catch (err) {
				console.error("Error fetching images:", err);
				setError(
					err instanceof Error ? err.message : "An unknown error occurred"
				);
				toast?.error?.(
					err instanceof Error ? err.message : "이미지 목록 로딩 중 오류 발생"
				);
				setImages([]);
				setTotalImages(0);
			} finally {
				setIsLoading(false);
			}
		},
		[debouncedSearchTerm]
	);

	// 초기 로드 및 검색어 변경 시 데이터 로드
	useEffect(() => {
		fetchImages(currentPage, debouncedSearchTerm);
	}, [currentPage, debouncedSearchTerm, fetchImages]);

	// 페이지 변경 핸들러
	const handlePageChange = (page: number) => {
		fetchImages(page, searchTerm);
	};

	// 검색어 변경 핸들러
	const handleSearchTermChange = (term: string) => {
		setSearchTerm(term);
		setCurrentPage(1); // 검색 시 첫 페이지로 이동
	};

	// 이미지 생성 페이지로 이동
	const handleCreateImage = () => {
		window.location.href = "/admin/image-generator";
	};

	// 삭제 대화상자 열기
	const handleOpenDelete = (image: GeneratedImage) => {
		setCurrentImage(image);
		setIsDeleteDialogOpen(true);
	};

	// 이미지 삭제
	const handleDelete = async () => {
		if (!currentImage) return;

		setIsDeleting(true);
		try {
			const token = localStorage.getItem("access_token");
			if (!token) throw new Error("Access token not found.");

			const response = await fetch(`/api/v1/images/${currentImage.id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.detail || "이미지 삭제에 실패했습니다.");
			}

			toast?.success?.("이미지가 성공적으로 삭제되었습니다.");
			setIsDeleteDialogOpen(false);
			setCurrentImage(null);

			// 목록 새로고침
			fetchImages(currentPage, searchTerm);
		} catch (error) {
			console.error("이미지 삭제 오류:", error);
			toast?.error?.(
				error instanceof Error
					? error.message
					: "이미지 삭제 중 오류가 발생했습니다."
			);
		} finally {
			setIsDeleting(false);
		}
	};

	// 이미지 미리보기
	const handleOpenPreview = (image: GeneratedImage) => {
		setCurrentImage(image);
		setIsPreviewDialogOpen(true);
	};

	// 날짜 포맷팅
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
			2,
			"0"
		)}-${String(date.getDate()).padStart(2, "0")} ${String(
			date.getHours()
		).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
	};

	// 프롬프트 요약 (글자 수 제한)
	const truncatePrompt = (prompt: string, maxLength = 50) => {
		if (prompt.length <= maxLength) return prompt;
		return `${prompt.substring(0, maxLength)}...`;
	};

	// 태그 배열로 변환
	const getTagsArray = (tagsString?: string): string[] => {
		if (!tagsString) return [];
		return tagsString
			.split(",")
			.map((tag) => tag.trim())
			.filter((tag) => tag);
	};

	// 각 이미지의 액션 메뉴 생성
	const getImageActions = (image: GeneratedImage) => [
		{
			label: "상세보기",
			icon: <Eye className="h-4 w-4" />,
			onClick: () => handleOpenPreview(image),
		},
		{
			label: "삭제",
			icon: <Trash2 className="h-4 w-4" />,
			variant: "destructive" as const,
			onClick: () => handleOpenDelete(image),
		},
	];

	// 초기 로딩 상태
	if (isLoading && images.length === 0 && !searchTerm) {
		return (
			<div className="min-h-screen bg-slate-50/50">
				<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
					<div className="space-y-8">
						{/* 헤더 */}
						<div className="space-y-6">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
								<div className="min-w-0 flex-1">
									<h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
										이미지 목록
									</h1>
									<p className="mt-2 text-sm text-slate-600">
										데이터를 관리하고 검색할 수 있습니다.
									</p>
								</div>
								<div className="flex-shrink-0">
									<Button
										onClick={handleCreateImage}
										className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-colors"
									>
										<ExternalLink className="-ml-0.5 mr-2 h-4 w-4" />새 이미지
										생성
									</Button>
								</div>
							</div>
						</div>

						{/* 테이블 */}
						<div className="overflow-hidden bg-white shadow-sm ring-1 ring-slate-200 md:rounded-xl">
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-slate-200">
									<thead className="bg-slate-50/75">
										<tr>
											<th className="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
												미리보기
											</th>
											<th className="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider min-w-[200px] max-w-[300px]">
												프롬프트
											</th>
											<th className="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
												모델
											</th>
											<th className="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
												태그
											</th>
											<th className="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
												생성자
											</th>
											<th className="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
												생성일
											</th>
											<th className="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider text-right">
												관리
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-200 bg-white">
										<tr className="hover:bg-slate-50/50 transition-colors duration-200">
											<td colSpan={7} className="px-6 py-12 text-center">
												<div className="flex items-center justify-center">
													<div className="flex items-center space-x-3">
														<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
														<span className="text-sm text-slate-600 font-medium">
															데이터를 불러오는 중입니다...
														</span>
													</div>
												</div>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// 에러 상태
	if (error && images.length === 0) {
		return (
			<div className="min-h-screen bg-slate-50/50">
				<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
					<div className="text-red-500 text-center p-6">Error: {error}</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50/50">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="space-y-8">
					{/* 헤더 */}
					<div className="space-y-6">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="min-w-0 flex-1">
								<h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
									이미지 목록
								</h1>
								<p className="mt-2 text-sm text-slate-600">
									데이터를 관리하고 검색할 수 있습니다.
								</p>
							</div>
							<div className="flex-shrink-0">
								<Button
									onClick={handleCreateImage}
									className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-colors"
								>
									<ExternalLink className="-ml-0.5 mr-2 h-4 w-4" />새 이미지
									생성
								</Button>
							</div>
						</div>

						{/* 검색바 */}
						<div className="flex flex-1 items-center justify-center px-2 lg:ml-0 lg:justify-start">
							<div className="w-full max-w-lg lg:max-w-xs">
								<label htmlFor="search" className="sr-only">
									검색
								</label>
								<div className="relative">
									<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
										<Eye
											className="h-4 w-4 text-slate-400"
											aria-hidden="true"
										/>
									</div>
									<input
										id="search"
										name="search"
										type="search"
										placeholder="프롬프트, 모델, 태그 검색..."
										value={searchTerm}
										onChange={(e) => handleSearchTermChange(e.target.value)}
										className="block w-full rounded-lg border-0 bg-white py-2.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* 테이블 */}
					<div className="overflow-hidden bg-white shadow-sm ring-1 ring-slate-200 md:rounded-xl">
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-slate-200">
								<thead className="bg-slate-50/75">
									<tr>
										<th className="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
											미리보기
										</th>
										<th className="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider min-w-[200px] max-w-[300px]">
											프롬프트
										</th>
										<th className="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
											모델
										</th>
										<th className="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
											태그
										</th>
										<th className="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
											생성자
										</th>
										<th className="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
											생성일
										</th>
										<th className="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider text-right">
											관리
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-200 bg-white">
									{isLoading ? (
										<tr className="hover:bg-slate-50/50 transition-colors duration-200">
											<td colSpan={7} className="px-6 py-12 text-center">
												<div className="flex items-center justify-center">
													<div className="flex items-center space-x-3">
														<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
														<span className="text-sm text-slate-600 font-medium">
															데이터를 불러오는 중입니다...
														</span>
													</div>
												</div>
											</td>
										</tr>
									) : error ? (
										<tr className="hover:bg-slate-50/50 transition-colors duration-200">
											<td colSpan={7} className="h-24 text-center text-red-500">
												{error}
											</td>
										</tr>
									) : images.length === 0 ? (
										<tr className="hover:bg-slate-50/50 transition-colors duration-200">
											<td colSpan={7} className="px-6 py-16 text-center">
												<div className="flex flex-col items-center justify-center">
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
													<p className="mt-1 text-sm text-slate-500">
														{searchTerm
															? "검색 결과가 없습니다."
															: "등록된 이미지가 없습니다."}
													</p>
												</div>
											</td>
										</tr>
									) : (
										images.map((image) => (
											<tr
												key={image.id}
												className="hover:bg-slate-50/50 transition-colors duration-200"
											>
												<td className="px-6 py-4 text-sm text-slate-900">
													<div
														className="w-12 h-12 rounded overflow-hidden cursor-pointer bg-gray-100 hover:opacity-80 transition-opacity"
														onClick={() => handleOpenPreview(image)}
													>
														<img
															src={image.s3_url}
															alt="이미지 미리보기"
															className="w-full h-full object-cover"
															onError={(e) => {
																e.currentTarget.src =
																	"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNkMxNi42ODYzIDI2IDEzLjk5OTkgMjMuMzEzNyAxMy45OTk5IDIwQzEzLjk5OTkgMTYuNjg2MyAxNi42ODYzIDE0IDIwIDE0QzIzLjMxMzcgMTQgMjYgMTYuNjg2MyAyNiAyMEMyNiAyMy4zMTM3IDIzLjMxMzcgMjYgMjAgMjZaIiBmaWxsPSIjOUM5Q0EzIi8+Cjwvc3ZnPgo=";
															}}
														/>
													</div>
												</td>
												<td className="px-6 py-4 text-sm text-slate-900 max-w-[300px]">
													<div className="truncate" title={image.prompt}>
														{truncatePrompt(image.prompt, 50)}
													</div>
												</td>
												<td className="px-6 py-4 text-sm text-slate-900">
													<span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
														{image.model}
													</span>
												</td>
												<td className="px-6 py-4 text-sm text-slate-900">
													<div className="flex flex-wrap gap-1">
														{getTagsArray(image.tags)
															.slice(0, 2)
															.map((tag) => (
																<span
																	key={tag}
																	className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
																>
																	{tag}
																</span>
															))}
														{getTagsArray(image.tags).length > 2 && (
															<span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
																+{getTagsArray(image.tags).length - 2}
															</span>
														)}
													</div>
												</td>
												<td className="px-6 py-4 text-sm text-slate-900">
													{image.created_by || "N/A"}
												</td>
												<td className="px-6 py-4 text-sm text-slate-900">
													{formatDate(image.created_at)}
												</td>
												<td className="px-6 py-4 text-sm text-slate-900 text-right">
													<div className="relative inline-block">
														<button
															className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 inline-flex items-center justify-center rounded-md transition-colors"
															onClick={(e) => {
																e.preventDefault();
																const actions = getImageActions(image);
																// 간단한 드롭다운 메뉴 구현
																const rect =
																	e.currentTarget.getBoundingClientRect();
																const menu = document.createElement("div");
																menu.className =
																	"fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1";
																menu.style.left = `${rect.right - 120}px`;
																menu.style.top = `${rect.bottom + 5}px`;
																menu.style.minWidth = "120px";

																actions.forEach((action) => {
																	const item = document.createElement("button");
																	item.className = `w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
																		action.variant === "destructive"
																			? "text-red-600 hover:bg-red-50"
																			: "text-gray-700"
																	}`;
																	item.innerHTML = `${
																		action.icon
																			? '<span class="w-4 h-4"></span>'
																			: ""
																	} ${action.label}`;
																	item.onclick = () => {
																		action.onClick();
																		document.body.removeChild(menu);
																	};
																	menu.appendChild(item);
																});

																document.body.appendChild(menu);

																const closeMenu = () => {
																	if (document.body.contains(menu)) {
																		document.body.removeChild(menu);
																	}
																	document.removeEventListener(
																		"click",
																		closeMenu
																	);
																};

																setTimeout(
																	() =>
																		document.addEventListener(
																			"click",
																			closeMenu
																		),
																	100
																);
															}}
														>
															<span className="sr-only">메뉴 열기</span>
															<svg
																className="h-4 w-4"
																fill="currentColor"
																viewBox="0 0 20 20"
															>
																<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
															</svg>
														</button>
													</div>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>

					{/* 페이지네이션 */}
					{totalImages > ITEMS_PER_PAGE && (
						<div className="flex items-center justify-between bg-white px-4 py-6 sm:px-6 border-t border-slate-200">
							<div className="flex flex-1 justify-between sm:hidden">
								<button
									onClick={() => handlePageChange(currentPage - 1)}
									disabled={currentPage <= 1}
									className="relative inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
								>
									이전
								</button>
								<button
									onClick={() => handlePageChange(currentPage + 1)}
									disabled={
										currentPage >= Math.ceil(totalImages / ITEMS_PER_PAGE)
									}
									className="relative ml-3 inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
								>
									다음
								</button>
							</div>

							<div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
								<div>
									<p className="text-sm text-slate-700">
										<span className="font-medium text-slate-900">
											{totalImages}개
										</span>{" "}
										중{" "}
										<span className="font-medium text-slate-900">
											{(currentPage - 1) * ITEMS_PER_PAGE + 1}
										</span>
										-
										<span className="font-medium text-slate-900">
											{Math.min(currentPage * ITEMS_PER_PAGE, totalImages)}
										</span>
										개 표시
									</p>
								</div>

								<div className="flex gap-1">
									<button
										onClick={() => handlePageChange(currentPage - 1)}
										disabled={currentPage <= 1}
										className="text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-300 relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed"
									>
										이전
									</button>

									{Array.from(
										{ length: Math.ceil(totalImages / ITEMS_PER_PAGE) },
										(_, i) => i + 1
									)
										.filter(
											(page) =>
												page === 1 ||
												page === Math.ceil(totalImages / ITEMS_PER_PAGE) ||
												Math.abs(page - currentPage) <= 2
										)
										.map((page, index, filteredPages) => (
											<React.Fragment key={page}>
												{index > 0 && filteredPages[index - 1] < page - 1 && (
													<span className="px-2 py-2 text-slate-500">...</span>
												)}
												<button
													onClick={() => handlePageChange(page)}
													className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border rounded-md ${
														page === currentPage
															? "bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
															: "text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-300"
													}`}
												>
													{page}
												</button>
											</React.Fragment>
										))}

									<button
										onClick={() => handlePageChange(currentPage + 1)}
										disabled={
											currentPage >= Math.ceil(totalImages / ITEMS_PER_PAGE)
										}
										className="text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-300 relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed"
									>
										다음
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* 삭제 확인 다이얼로그 */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>이미지 삭제</DialogTitle>
						<DialogDescription>
							이 이미지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
						</DialogDescription>
					</DialogHeader>
					<div className="py-4 flex justify-center">
						{currentImage && (
							<img
								src={currentImage.s3_url}
								alt="삭제할 이미지"
								className="max-w-[200px] max-h-[200px] rounded"
							/>
						)}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDeleteDialogOpen(false)}
							disabled={isDeleting}
						>
							취소
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-red-600 text-white hover:bg-red-700"
						>
							{isDeleting ? "삭제 중..." : "삭제"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 이미지 상세보기 다이얼로그 */}
			<Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
				<DialogContent className="sm:max-w-[700px]">
					<DialogHeader>
						<DialogTitle>이미지 상세보기</DialogTitle>
					</DialogHeader>
					{currentImage && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex items-center justify-center">
								<img
									src={currentImage.s3_url}
									alt="이미지 상세보기"
									className="max-w-full max-h-[400px] rounded"
								/>
							</div>
							<div className="space-y-4">
								<div>
									<h4 className="text-sm font-semibold mb-1 text-gray-700">
										이미지 이름
									</h4>
									<p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
										{currentImage.name}
									</p>
								</div>
								<div>
									<h4 className="text-sm font-semibold mb-1 text-gray-700">
										프롬프트
									</h4>
									<p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border max-h-32 overflow-y-auto">
										{currentImage.prompt}
									</p>
								</div>
								<div>
									<h4 className="text-sm font-semibold mb-1 text-gray-700">
										모델
									</h4>
									<span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
										{currentImage.model}
									</span>
								</div>
								{currentImage.model === "flux-dev" && (
									<div className="grid grid-cols-2 gap-4">
										{currentImage.steps && (
											<div>
												<h4 className="text-sm font-semibold mb-1 text-gray-700">
													스텝
												</h4>
												<p className="text-sm text-gray-600">
													{currentImage.steps}
												</p>
											</div>
										)}
										{currentImage.seed && (
											<div>
												<h4 className="text-sm font-semibold mb-1 text-gray-700">
													시드
												</h4>
												<p className="text-sm text-gray-600">
													{currentImage.seed}
												</p>
											</div>
										)}
									</div>
								)}
								<div>
									<h4 className="text-sm font-semibold mb-1 text-gray-700">
										생성자
									</h4>
									<p className="text-sm text-gray-600">
										{currentImage.created_by || "N/A"}
									</p>
								</div>
								<div>
									<h4 className="text-sm font-semibold mb-1 text-gray-700">
										생성일
									</h4>
									<p className="text-sm text-gray-600">
										{formatDate(currentImage.created_at)}
									</p>
								</div>
								<div>
									<h4 className="text-sm font-semibold mb-1 text-gray-700">
										태그
									</h4>
									<div className="flex flex-wrap gap-1">
										{getTagsArray(currentImage.tags).map((tag) => (
											<span
												key={tag}
												className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-600"
											>
												{tag}
											</span>
										))}
									</div>
								</div>
								<div className="pt-2">
									<Button variant="outline" className="w-full" asChild>
										<a
											href={currentImage.s3_url}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Image className="mr-2 h-4 w-4" />
											원본 보기
										</a>
									</Button>
								</div>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsPreviewDialogOpen(false)}
						>
							닫기
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
