"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Trash2, Eye } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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

// 이미지 타입 정의
interface SavedImage {
	id: number;
	url: string;
	prompt: string;
	model: string;
	createdAt: string;
	tags: string[];
}

const ITEMS_PER_PAGE = 5;

// 샘플 이미지 데이터
const sampleImages: SavedImage[] = [
	{
		id: 1,
		url: "https://picsum.photos/400/400?random=1",
		prompt:
			"30대 남성, 정장 차림, 깔끔한 헤어스타일, 현대적인 사무실 배경, 자신감 있는 표정",
		model: "flux-dev",
		createdAt: "2023-08-20T14:15:00Z",
		tags: ["비즈니스", "전문가", "남성", "정장"],
	},
	{
		id: 2,
		url: "https://picsum.photos/400/400?random=2",
		prompt:
			"20대 여성, 캐주얼하고 트렌디한 의상, 창의적인 작업 공간, 컬러풀한 배경, 태블릿으로 작업 중",
		model: "gpt-image-1",
		createdAt: "2023-07-20T11:45:00Z",
		tags: ["디자이너", "창의적", "캐주얼", "여성"],
	},
	{
		id: 3,
		url: "https://picsum.photos/400/400?random=3",
		prompt:
			"40대 여성, 흰색 의사 가운, 청진기, 현대적인 의료 시설 배경, 따뜻하고 신뢰감 있는 표정",
		model: "flux-dev",
		createdAt: "2023-09-10T13:10:00Z",
		tags: ["의사", "의료", "여성", "전문가"],
	},
	{
		id: 4,
		url: "https://picsum.photos/400/400?random=4",
		prompt:
			"미래 도시 풍경, 네온사인, 사이버펑크 스타일, 매우 상세한 디지털 아트",
		model: "flux-dev",
		createdAt: "2023-08-15T09:30:00Z",
		tags: ["미래", "도시", "사이버펑크", "디지털아트"],
	},
	{
		id: 5,
		url: "https://picsum.photos/400/400?random=5",
		prompt: "아름다운 산 풍경, 맑은 파란 하늘, 녹색 나무들, 평화로운 분위기",
		model: "gpt-image-1",
		createdAt: "2023-07-05T16:20:00Z",
		tags: ["자연", "산", "풍경", "평화"],
	},
];

export default function ImageListPage() {
	const [images, setImages] = useState<SavedImage[]>(sampleImages);
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredImages, setFilteredImages] = useState<SavedImage[]>(images);
	const [currentPage, setCurrentPage] = useState(1);
	const [paginatedImages, setPaginatedImages] = useState<SavedImage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
	const [currentImage, setCurrentImage] = useState<SavedImage | null>(null);

	// 검색 기능
	useEffect(() => {
		if (!searchTerm || searchTerm.trim() === "") {
			setFilteredImages([...images]);
		} else {
			const lowercasedSearch = searchTerm.toLowerCase();
			const filtered = images.filter((image) => {
				const promptMatch = image.prompt
					.toLowerCase()
					.includes(lowercasedSearch);
				const modelMatch = image.model.toLowerCase().includes(lowercasedSearch);
				const tagMatch = image.tags.some((tag) =>
					tag.toLowerCase().includes(lowercasedSearch)
				);

				return promptMatch || modelMatch || tagMatch;
			});
			setFilteredImages(filtered);
		}
		// 페이지 초기화
		setCurrentPage(1);
	}, [searchTerm, images]);

	// 페이지네이션 처리
	useEffect(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		const endIndex = startIndex + ITEMS_PER_PAGE;
		setPaginatedImages(filteredImages.slice(startIndex, endIndex));
	}, [filteredImages, currentPage]);

	// 페이지 변경 핸들러
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	// 총 페이지 수 계산
	const totalPages = Math.ceil(filteredImages.length / ITEMS_PER_PAGE);

	// 이미지 생성 페이지로 이동
	const handleCreateImage = () => {
		window.location.href = "/admin/image-generator";
	};

	// 삭제 대화상자 열기
	const handleOpenDelete = (image: SavedImage) => {
		setCurrentImage(image);
		setIsDeleteDialogOpen(true);
	};

	// 이미지 삭제
	const handleDelete = async () => {
		if (!currentImage) return;

		try {
			// 실제 구현에서는 API 호출
			setImages((prev) => prev.filter((img) => img.id !== currentImage.id));
			setIsDeleteDialogOpen(false);
			setCurrentImage(null);
		} catch (error) {
			console.error("이미지 삭제 오류:", error);
			alert("이미지 삭제 중 오류가 발생했습니다.");
		}
	};

	// 이미지 미리보기
	const handleOpenPreview = (image: SavedImage) => {
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

	// 이미지 프롬프트 요약 (글자 수 제한)
	const truncatePrompt = (prompt: string, maxLength = 50) => {
		if (prompt.length <= maxLength) return prompt;
		return `${prompt.substring(0, maxLength)}...`;
	};

	// 각 이미지의 액션 메뉴 생성
	const getImageActions = (image: SavedImage): ActionItem[] => [
		{
			label: "상세보기",
			icon: <Eye className="h-4 w-4" />,
			onClick: () => handleOpenPreview(image),
		},
		{
			label: "삭제",
			icon: <Trash2 className="h-4 w-4" />,
			variant: "destructive",
			onClick: () => handleOpenDelete(image),
		},
	];

	return (
		<AdminPageLayout>
			<AdminPageHeader
				title="이미지 목록"
				searchPlaceholder="프롬프트, 모델, 태그 검색..."
				searchValue={searchTerm}
				onSearchChange={setSearchTerm}
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
					<AdminTableHeaderCell>생성일</AdminTableHeaderCell>
					<AdminTableHeaderCell className="text-right">
						관리
					</AdminTableHeaderCell>
				</AdminTableHeader>
				<AdminTableBody>
					{isLoading ? (
						<AdminTableLoadingRow colSpan={6} />
					) : paginatedImages.length === 0 ? (
						<AdminTableEmptyRow
							colSpan={6}
							message={
								searchTerm
									? "검색 결과가 없습니다."
									: "등록된 이미지가 없습니다."
							}
						/>
					) : (
						paginatedImages.map((image) => (
							<AdminTableRow key={image.id}>
								<AdminTableCell>
									<div
										className="w-12 h-12 rounded overflow-hidden cursor-pointer bg-gray-100 hover:opacity-80 transition-opacity"
										onClick={() => handleOpenPreview(image)}
									>
										<img
											src={image.url}
											alt="이미지 미리보기"
											className="w-full h-full object-cover"
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
										{image.tags.slice(0, 2).map((tag) => (
											<Badge key={tag} variant="secondary" className="text-xs">
												{tag}
											</Badge>
										))}
										{image.tags.length > 2 && (
											<Badge variant="outline" className="text-xs">
												+{image.tags.length - 2}
											</Badge>
										)}
									</div>
								</AdminTableCell>
								<AdminTableCell>{formatDate(image.createdAt)}</AdminTableCell>
								<AdminTableCell className="text-right">
									<ActionDropdown actions={getImageActions(image)} />
								</AdminTableCell>
							</AdminTableRow>
						))
					)}
				</AdminTableBody>
			</AdminTable>

			<AdminPagination
				currentPage={currentPage}
				totalPages={totalPages}
				totalItems={filteredImages.length}
				itemsPerPage={ITEMS_PER_PAGE}
				onPageChange={handlePageChange}
			/>

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
								src={currentImage.url}
								alt="삭제할 이미지"
								className="max-w-[200px] max-h-[200px] rounded"
							/>
						)}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDeleteDialogOpen(false)}
						>
							취소
						</Button>
						<Button variant="destructive" onClick={handleDelete}>
							삭제
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
									src={currentImage.url}
									alt="이미지 상세보기"
									className="max-w-full max-h-[400px] rounded"
								/>
							</div>
							<div className="space-y-4">
								<div>
									<h4 className="text-sm font-semibold mb-1 text-gray-700">
										프롬프트
									</h4>
									<p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
										{currentImage.prompt}
									</p>
								</div>
								<div>
									<h4 className="text-sm font-semibold mb-1 text-gray-700">
										모델
									</h4>
									<Badge variant="outline">{currentImage.model}</Badge>
								</div>
								<div>
									<h4 className="text-sm font-semibold mb-1 text-gray-700">
										생성일
									</h4>
									<p className="text-sm text-gray-600">
										{formatDate(currentImage.createdAt)}
									</p>
								</div>
								<div>
									<h4 className="text-sm font-semibold mb-1 text-gray-700">
										태그
									</h4>
									<div className="flex flex-wrap gap-1">
										{currentImage.tags.map((tag) => (
											<Badge key={tag} variant="outline" className="text-xs">
												{tag}
											</Badge>
										))}
									</div>
								</div>
								<div className="pt-2">
									<Button variant="outline" className="w-full" asChild>
										<a
											href={currentImage.url}
											download={`image-${currentImage.id}.jpg`}
											target="_blank"
											rel="noopener noreferrer"
										>
											<ExternalLink className="mr-2 h-4 w-4" />
											이미지 다운로드
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
