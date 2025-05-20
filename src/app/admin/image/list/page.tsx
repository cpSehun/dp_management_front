"use client";

import { useState, useEffect } from "react";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Trash2, MoreHorizontal, ExternalLink } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/pagination-controls";

// 이미지 타입 정의
interface SavedImage {
	id: number;
	url: string;
	prompt: string;
	model: string;
	createdAt: string;
	tags: string[];
}

// 페이지당 표시할 항목 수
const ITEMS_PER_PAGE = 5;

// 샘플 이미지 데이터
const sampleImages: SavedImage[] = [
	{
		id: 1,
		url: "https://placehold.co/400x400/png",
		prompt:
			"30대 남성, 정장 차림, 깔끔한 헤어스타일, 현대적인 사무실 배경, 자신감 있는 표정",
		model: "flux-dev",
		createdAt: "2023-08-20T14:15:00Z",
		tags: ["비즈니스", "전문가", "남성", "정장"],
	},
	{
		id: 2,
		url: "https://placehold.co/400x400/png",
		prompt:
			"20대 여성, 캐주얼하고 트렌디한 의상, 창의적인 작업 공간, 컬러풀한 배경, 태블릿으로 작업 중",
		model: "gpt-image-1",
		createdAt: "2023-07-20T11:45:00Z",
		tags: ["디자이너", "창의적", "캐주얼", "여성"],
	},
	{
		id: 3,
		url: "https://placehold.co/400x400/png",
		prompt:
			"40대 여성, 흰색 의사 가운, 청진기, 현대적인 의료 시설 배경, 따뜻하고 신뢰감 있는 표정",
		model: "flux-dev",
		createdAt: "2023-09-10T13:10:00Z",
		tags: ["의사", "의료", "여성", "전문가"],
	},
];

export default function ImageListPage() {
	const [images, setImages] = useState<SavedImage[]>(sampleImages);
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredImages, setFilteredImages] = useState<SavedImage[]>(images);
	const [currentPage, setCurrentPage] = useState(1);
	const [paginatedImages, setPaginatedImages] = useState<SavedImage[]>([]);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [currentImage, setCurrentImage] = useState<SavedImage | null>(null);
	const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

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

	// 이미지 데이터 가져오기 (실제 구현 시 API 호출)
	useEffect(() => {
		const fetchImages = async () => {
			try {
				// 실제 구현에서는 아래 코드를 API 호출로 변경
				/*
				const response = await fetch("/api/v1/images", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("access_token")}`,
					},
				});

				if (response.ok) {
					const data = await response.json();
					setImages(data);
				} else {
					console.error("이미지 목록을 가져오는데 실패했습니다");
				}
				*/
				// 샘플 데이터 사용
				setImages(sampleImages);
			} catch (error) {
				console.error("이미지 목록 가져오기 오류:", error);
			}
		};

		fetchImages();
	}, []);

	// 삭제 대화상자 열기
	const handleOpenDelete = (image: SavedImage) => {
		setCurrentImage(image);
		setIsDeleteDialogOpen(true);
	};

	// 이미지 삭제
	const handleDelete = async () => {
		if (!currentImage) return;

		try {
			// 실제 구현에서는 아래 코드를 API 호출로 변경
			/*
			const response = await fetch(`/api/v1/images/${currentImage.id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("access_token")}`,
				},
			});

			if (!response.ok) {
				throw new Error("이미지 삭제에 실패했습니다.");
			}
			*/

			// 프론트엔드에서 이미지 제거
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

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">이미지 목록</h1>
				<Button
					onClick={() => (window.location.href = "/admin/image/generator")}
				>
					새 이미지 생성
				</Button>
			</div>

			{/* 검색 */}
			<div className="flex w-full max-w-sm items-center space-x-2">
				<Input
					type="text"
					placeholder="프롬프트, 모델, 태그 검색..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
				<Button type="submit" size="icon">
					<Search className="h-4 w-4" />
					<span className="sr-only">검색</span>
				</Button>
			</div>

			{/* 이미지 테이블 */}
			<div className="rounded-md border">
				<Table>
					<TableCaption>
						이미지 목록 ({filteredImages.length}개 중 {paginatedImages.length}개
						표시)
					</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead>미리보기</TableHead>
							<TableHead className="w-[300px]">프롬프트</TableHead>
							<TableHead>모델</TableHead>
							<TableHead>태그</TableHead>
							<TableHead>생성일</TableHead>
							<TableHead className="text-right">관리</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedImages.map((image) => (
							<TableRow key={image.id}>
								<TableCell>
									<div
										className="w-12 h-12 rounded overflow-hidden cursor-pointer"
										onClick={() => handleOpenPreview(image)}
									>
										<img
											src={image.url}
											alt="이미지 미리보기"
											className="w-full h-full object-cover"
										/>
									</div>
								</TableCell>
								<TableCell className="font-medium">
									{truncatePrompt(image.prompt, 50)}
								</TableCell>
								<TableCell>
									<Badge variant="outline">{image.model}</Badge>
								</TableCell>
								<TableCell>
									<div className="flex flex-wrap gap-1">
										{image.tags.map((tag) => (
											<Badge key={tag} variant="secondary">
												{tag}
											</Badge>
										))}
									</div>
								</TableCell>
								<TableCell>{formatDate(image.createdAt)}</TableCell>
								<TableCell className="text-right">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon">
												<MoreHorizontal className="h-4 w-4" />
												<span className="sr-only">메뉴 열기</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuLabel>작업</DropdownMenuLabel>
											<DropdownMenuItem
												onClick={() => handleOpenPreview(image)}
											>
												<ExternalLink className="mr-2 h-4 w-4" />
												상세 보기
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => handleOpenDelete(image)}
												className="text-destructive focus:text-destructive"
											>
												<Trash2 className="mr-2 h-4 w-4" />
												삭제
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* 페이지네이션 */}
			<PaginationControls
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={handlePageChange}
			/>

			{/* 삭제 확인 대화상자 */}
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

			{/* 이미지 상세보기 대화상자 */}
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
									<h4 className="text-sm font-semibold mb-1">프롬프트</h4>
									<p className="text-sm">{currentImage.prompt}</p>
								</div>
								<div>
									<h4 className="text-sm font-semibold mb-1">모델</h4>
									<p className="text-sm">{currentImage.model}</p>
								</div>
								<div>
									<h4 className="text-sm font-semibold mb-1">생성일</h4>
									<p className="text-sm">
										{formatDate(currentImage.createdAt)}
									</p>
								</div>
								<div>
									<h4 className="text-sm font-semibold mb-1">태그</h4>
									<div className="flex flex-wrap gap-1">
										{currentImage.tags.map((tag) => (
											<Badge key={tag} variant="outline">
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
											이미지 다운로드
										</a>
									</Button>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
