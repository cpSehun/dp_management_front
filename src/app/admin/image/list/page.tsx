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
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
	AdminTable,
	AdminTableHeader,
	AdminTableHeaderCell,
	AdminTableBody,
	AdminTableRow,
	AdminTableCell,
	AdminTableLoadingRow,
	AdminTableEmptyRow,
} from "@/components/admin/AdminTable";
import { ActionDropdown, ActionItem } from "@/components/admin/ActionDropdown";
import { AdminPagination } from "@/components/admin/AdminPagination";

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

	// 현재 사용자 정보 상태 추가
	const [currentUser, setCurrentUser] = useState<any>(null);
	const [isCurrentUserSuperuser, setIsCurrentUserSuperuser] = useState(false);

	// Debounce search term
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500);
		return () => {
			clearTimeout(handler);
		};
	}, [searchTerm]);

	// 현재 사용자 정보 확인
	useEffect(() => {
		const checkCurrentUser = async () => {
			try {
				const token = localStorage.getItem("access_token");
				if (!token) return;

				const response = await fetch("/api/v1/users/me", {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (response.ok) {
					const userData = await response.json();
					setCurrentUser(userData);
					setIsCurrentUserSuperuser(userData.is_superuser || false);
				}
			} catch (error) {
				console.error("현재 사용자 정보 조회 실패:", error);
			}
		};

		checkCurrentUser();
	}, []);

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
		if (!isCurrentUserSuperuser) {
			toast.error("최고관리자만 이미지를 삭제할 수 있습니다.");
			return;
		}
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
	const getImageActions = (image: GeneratedImage): ActionItem[] => {
		const actions: ActionItem[] = [
			{
				label: "상세보기",
				icon: <Eye className="h-4 w-4" />,
				onClick: () => handleOpenPreview(image),
			},
		];

		// 최고관리자만 삭제 기능 사용 가능
		if (isCurrentUserSuperuser) {
			actions.push({
				label: "삭제",
				icon: <Trash2 className="h-4 w-4" />,
				variant: "destructive",
				onClick: () => handleOpenDelete(image),
			});
		}

		return actions;
	};

	// 초기 로딩 상태
	if (isLoading && images.length === 0 && !searchTerm) {
		return (
			<AdminPageLayout>
				<AdminPageHeader
					title="이미지 목록"
					searchPlaceholder="프롬프트, 모델, 태그 검색..."
					searchValue={searchTerm}
					onSearchChange={handleSearchTermChange}
					onCreateClick={handleCreateImage}
					createButtonText="새 이미지 생성"
				/>
				<AdminTable>
					<AdminTableHeader>
						<AdminTableHeaderCell>미리보기</AdminTableHeaderCell>
						<AdminTableHeaderCell className="min-w-[200px] max-w-[300px]">
							프롬프트
						</AdminTableHeaderCell>
						<AdminTableHeaderCell>모델</AdminTableHeaderCell>
						<AdminTableHeaderCell>태그</AdminTableHeaderCell>
						<AdminTableHeaderCell>생성자</AdminTableHeaderCell>
						<AdminTableHeaderCell>생성일</AdminTableHeaderCell>
						<AdminTableHeaderCell className="text-right">
							관리
						</AdminTableHeaderCell>
					</AdminTableHeader>
					<AdminTableBody>
						<AdminTableLoadingRow colSpan={7} />
					</AdminTableBody>
				</AdminTable>
			</AdminPageLayout>
		);
	}

	// 에러 상태
	if (error && images.length === 0) {
		return (
			<AdminPageLayout>
				<AdminPageHeader
					title="이미지 목록"
					searchPlaceholder="프롬프트, 모델, 태그 검색..."
					searchValue={searchTerm}
					onSearchChange={handleSearchTermChange}
					onCreateClick={handleCreateImage}
					createButtonText="새 이미지 생성"
				/>
				<div className="text-red-500 text-center p-6">Error: {error}</div>
			</AdminPageLayout>
		);
	}

	return (
		<AdminPageLayout>
			<AdminPageHeader
				title="이미지 목록"
				searchPlaceholder="프롬프트, 모델, 태그 검색..."
				searchValue={searchTerm}
				onSearchChange={handleSearchTermChange}
				onCreateClick={handleCreateImage}
				createButtonText="새 이미지 생성"
			/>

			<AdminTable>
				<AdminTableHeader>
					<AdminTableHeaderCell>미리보기</AdminTableHeaderCell>
					<AdminTableHeaderCell className="min-w-[200px] max-w-[300px]">
						프롬프트
					</AdminTableHeaderCell>
					<AdminTableHeaderCell>모델</AdminTableHeaderCell>
					<AdminTableHeaderCell>태그</AdminTableHeaderCell>
					<AdminTableHeaderCell>생성자</AdminTableHeaderCell>
					<AdminTableHeaderCell>생성일</AdminTableHeaderCell>
					<AdminTableHeaderCell className="text-right">
						관리
					</AdminTableHeaderCell>
				</AdminTableHeader>
				<AdminTableBody>
					{isLoading ? (
						<AdminTableLoadingRow colSpan={7} />
					) : error ? (
						<AdminTableRow>
							<AdminTableCell
								colSpan={7}
								className="h-24 text-center text-red-500"
							>
								{error}
							</AdminTableCell>
						</AdminTableRow>
					) : images.length === 0 ? (
						<AdminTableEmptyRow
							colSpan={7}
							message={
								searchTerm
									? "검색 결과가 없습니다."
									: "등록된 이미지가 없습니다."
							}
						/>
					) : (
						images.map((image) => (
							<AdminTableRow key={image.id}>
								<AdminTableCell>
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
								</AdminTableCell>
								<AdminTableCell className="max-w-[300px]">
									<div className="truncate" title={image.prompt}>
										{truncatePrompt(image.prompt, 50)}
									</div>
								</AdminTableCell>
								<AdminTableCell>
									<Badge variant="outline">{image.model}</Badge>
								</AdminTableCell>
								<AdminTableCell>
									<div className="flex flex-wrap gap-1">
										{getTagsArray(image.tags)
											.slice(0, 2)
											.map((tag) => (
												<Badge
													key={tag}
													variant="secondary"
													className="text-xs"
												>
													{tag}
												</Badge>
											))}
										{getTagsArray(image.tags).length > 2 && (
											<Badge variant="outline" className="text-xs">
												+{getTagsArray(image.tags).length - 2}
											</Badge>
										)}
									</div>
								</AdminTableCell>
								<AdminTableCell>{image.created_by || "N/A"}</AdminTableCell>
								<AdminTableCell>{formatDate(image.created_at)}</AdminTableCell>
								<AdminTableCell className="text-right">
									<ActionDropdown actions={getImageActions(image)} />
								</AdminTableCell>
							</AdminTableRow>
						))
					)}
				</AdminTableBody>
			</AdminTable>

			{totalImages > ITEMS_PER_PAGE && (
				<AdminPagination
					currentPage={currentPage}
					totalPages={Math.ceil(totalImages / ITEMS_PER_PAGE)}
					totalItems={totalImages}
					itemsPerPage={ITEMS_PER_PAGE}
					onPageChange={handlePageChange}
				/>
			)}

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
									<Badge variant="outline">{currentImage.model}</Badge>
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
											<Badge key={tag} variant="outline" className="text-xs">
												{tag}
											</Badge>
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
		</AdminPageLayout>
	);
}
