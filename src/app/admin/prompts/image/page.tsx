"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Loader2, Eye, Edit } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { PaginationControls } from "@/components/pagination-controls";
import { PromptPageHeader } from "@/components/admin/prompt-page-header";
import { CreateImagePromptDialog } from "@/components/admin/prompts/image/create-image-prompt-dialog";

// 타입 정의
interface ImagePromptVersion {
	id: number;
	version: number;
	llm_prompt: string;
	created_at: string;
	created_by: number | null;
}

interface ImagePrompt {
	id: number;
	name: string;
	llm_prompt: string;
	version: number;
	created_at: string;
	updated_at: string;
	created_by: number | null;
	versions: ImagePromptVersion[];
}

interface PaginatedImagePrompts {
	total_items: number;
	items: ImagePrompt[];
}

const ITEMS_PER_PAGE = 10;

export default function ImagePromptsPage() {
	const [prompts, setPrompts] = useState<ImagePrompt[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [totalPrompts, setTotalPrompts] = useState(0);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// 페이지네이션 상태
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = ITEMS_PER_PAGE;

	// 검색어 상태
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

	// 수정 모달 관련 상태
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [selectedPromptForEdit, setSelectedPromptForEdit] =
		useState<ImagePrompt | null>(null);
	const [editFormData, setEditFormData] = useState({
		name: "",
		llm_prompt: "",
	});
	const [originalLlmPrompt, setOriginalLlmPrompt] = useState(""); // 변경 감지용
	const [promptVersions, setPromptVersions] = useState<ImagePromptVersion[]>(
		[]
	);
	const [isLoadingVersions, setIsLoadingVersions] = useState(false);

	// 상세보기 모달 관련 상태
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
	const [selectedPromptForDetail, setSelectedPromptForDetail] =
		useState<ImagePrompt | null>(null);

	// Debounce search term
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500);
		return () => {
			clearTimeout(handler);
		};
	}, [searchTerm]);

	const fetchImagePrompts = useCallback(
		async (page: number, currentSearchTerm?: string) => {
			setIsLoading(true);
			setError(null);
			try {
				const token = localStorage.getItem("access_token");
				if (!token) throw new Error("Access token not found.");

				const skip = (page - 1) * itemsPerPage;
				let url = `/api/v1/prompts/image?skip=${skip}&limit=${itemsPerPage}`;
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
						errData.detail || `Failed to fetch prompts: ${response.statusText}`
					);
				}
				const data: PaginatedImagePrompts = await response.json();
				setPrompts(data.items);
				setTotalPrompts(data.total_items);
				setCurrentPage(page);
			} catch (err) {
				console.error("Error fetching image prompts:", err);
				setError(
					err instanceof Error ? err.message : "An unknown error occurred"
				);
				toast.error(
					err instanceof Error ? err.message : "프롬프트 목록 로딩 중 오류 발생"
				);
				setPrompts([]);
				setTotalPrompts(0);
			} finally {
				setIsLoading(false);
			}
		},
		[debouncedSearchTerm, itemsPerPage]
	);

	useEffect(() => {
		fetchImagePrompts(currentPage, debouncedSearchTerm);
	}, [currentPage, debouncedSearchTerm, fetchImagePrompts]);

	const handlePageChange = (page: number) => {
		fetchImagePrompts(page, searchTerm);
	};

	const handleSearchTermChange = (term: string) => {
		setSearchTerm(term);
	};

	const handleCreatePrompt = async (name: string, llm_prompt: string) => {
		setIsSubmitting(true);
		setError(null);

		try {
			const token = localStorage.getItem("access_token");
			if (!token) {
				throw new Error("Access token not found. Please login again.");
			}

			const newPromptData = {
				name: name,
				llm_prompt: llm_prompt,
			};

			console.log(
				"Data being sent to /api/v1/prompts/image:",
				JSON.stringify(newPromptData, null, 2)
			);

			const response = await fetch("/api/v1/prompts/image/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(newPromptData),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({
					detail: "Unknown error occurred during image prompt creation",
				}));
				const errorMessage = Array.isArray(errorData.detail)
					? errorData.detail
							.map((err: any) => `${err.loc.join(".")} - ${err.msg}`)
							.join(", ")
					: errorData.detail || "Failed to create image prompt";
				throw new Error(errorMessage);
			}

			const createdPrompt: ImagePrompt = await response.json();
			toast.success(
				`이미지 프롬프트 "${createdPrompt.name}"이(가) 성공적으로 생성되었습니다.`
			);
			setIsCreateDialogOpen(false);
			fetchImagePrompts(1, "");
			setCurrentPage(1);
			setSearchTerm("");
		} catch (err: any) {
			console.error("Error creating image prompt:", err);
			toast.error(
				err.message || "이미지 프롬프트 생성 중 오류가 발생했습니다."
			);
			setError(err.message || "이미지 프롬프트 생성 중 오류가 발생했습니다.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// 상세보기 다이얼로그 열기
	const handleOpenDetailDialog = (prompt: ImagePrompt) => {
		setSelectedPromptForDetail(prompt);
		setIsDetailDialogOpen(true);
	};

	// 수정 다이얼로그 열기
	const handleOpenEditDialog = async (prompt: ImagePrompt) => {
		setSelectedPromptForEdit(prompt);
		setEditFormData({
			name: prompt.name,
			llm_prompt: prompt.llm_prompt,
		});
		setOriginalLlmPrompt(prompt.llm_prompt); // 원본 값 저장

		// 버전 히스토리 조회
		await fetchPromptVersions(prompt.id);
		setIsEditDialogOpen(true);
	};

	// 프롬프트 버전 히스토리 조회
	const fetchPromptVersions = async (promptId: number) => {
		setIsLoadingVersions(true);
		try {
			const token = localStorage.getItem("access_token");
			if (!token) throw new Error("Access token not found.");

			const response = await fetch(
				`/api/v1/prompts/image/${promptId}/versions`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (!response.ok) {
				throw new Error("Failed to fetch prompt versions");
			}

			const versions: ImagePromptVersion[] = await response.json();
			setPromptVersions(versions);
		} catch (err) {
			console.error("Error fetching prompt versions:", err);
			toast.error("버전 히스토리 로딩 중 오류가 발생했습니다.");
			setPromptVersions([]);
		} finally {
			setIsLoadingVersions(false);
		}
	};

	// 버전 히스토리에서 버전 클릭 시 해당 내용 로드
	const handleVersionClick = (version: ImagePromptVersion) => {
		setEditFormData({
			...editFormData,
			llm_prompt: version.llm_prompt,
		});
	};

	// 변경사항 확인 (llm_prompt만 체크)
	const hasChanges = editFormData.llm_prompt !== originalLlmPrompt;

	// 프롬프트 수정 저장
	const handleSaveEdit = async () => {
		if (!selectedPromptForEdit) return;

		setIsSubmitting(true);
		try {
			const token = localStorage.getItem("access_token");
			if (!token) throw new Error("Access token not found.");

			const response = await fetch(
				`/api/v1/prompts/image/${selectedPromptForEdit.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ llm_prompt: editFormData.llm_prompt }),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to update prompt");
			}

			toast.success("프롬프트가 성공적으로 수정되었습니다.");
			setIsEditDialogOpen(false);
			fetchImagePrompts(currentPage, searchTerm);
		} catch (err) {
			console.error("Error updating prompt:", err);
			toast.error("프롬프트 수정 중 오류가 발생했습니다.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// 롤백 실행
	const handleRollback = async (version: number) => {
		if (!selectedPromptForEdit) return;

		if (!window.confirm(`v${version}으로 롤백하시겠습니까?`)) return;

		setIsSubmitting(true);
		try {
			const token = localStorage.getItem("access_token");
			if (!token) throw new Error("Access token not found.");

			const response = await fetch(
				`/api/v1/prompts/image/${selectedPromptForEdit.id}/rollback/${version}`,
				{
					method: "PUT",
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (!response.ok) {
				throw new Error("Failed to rollback prompt");
			}

			toast.success(`v${version}으로 롤백되었습니다.`);
			setIsEditDialogOpen(false);
			fetchImagePrompts(currentPage, searchTerm);
		} catch (err) {
			console.error("Error rolling back prompt:", err);
			toast.error("롤백 중 오류가 발생했습니다.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// 다이얼로그 닫기
	const handleCloseEditDialog = () => {
		setIsEditDialogOpen(false);
		setSelectedPromptForEdit(null);
		setEditFormData({ name: "", llm_prompt: "" });
		setOriginalLlmPrompt("");
		setPromptVersions([]);
	};

	// 날짜 포맷팅 함수
	const formatDate = (dateString?: string) => {
		if (!dateString) return "-";
		const date = new Date(dateString);
		return (
			date.toLocaleDateString("ko-KR", {
				year: "numeric",
				month: "short",
				day: "numeric",
			}) +
			" " +
			date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
		);
	};

	// Calculate startIndex and endIndex for pagination
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;

	if (isLoading && prompts.length === 0 && !searchTerm) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
			</div>
		);
	}

	if (error && prompts.length === 0) {
		return <div className="text-red-500 text-center p-6">Error: {error}</div>;
	}

	return (
		<div className="container mx-auto p-2">
			<PromptPageHeader
				searchPlaceholder="이미지 프롬프트 검색..."
				searchTerm={searchTerm}
				onSearchTermChange={handleSearchTermChange}
				onCreateClick={() => setIsCreateDialogOpen(true)}
				createButtonText="프롬프트 생성"
			/>

			<CreateImagePromptDialog
				isOpen={isCreateDialogOpen}
				onClose={() => setIsCreateDialogOpen(false)}
				onCreate={handleCreatePrompt}
				isSubmitting={isSubmitting}
			/>

			<div className="rounded-md border mt-2">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="min-w-[150px]">이름</TableHead>
							<TableHead className="min-w-[200px] max-w-[300px] truncate">
								LLM 프롬프트
							</TableHead>
							<TableHead className="min-w-[100px]">현재 버전</TableHead>
							<TableHead className="min-w-[120px]">생성자</TableHead>
							<TableHead className="min-w-[150px]">최종 수정일</TableHead>
							<TableHead className="text-right w-[100px]">액션</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={6} className="h-24 text-center">
									<div className="flex justify-center items-center">
										<Loader2 className="mr-2 h-8 w-8 animate-spin" />
										<span>데이터를 불러오는 중입니다...</span>
									</div>
								</TableCell>
							</TableRow>
						) : error ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="h-24 text-center text-red-500"
								>
									{error}
								</TableCell>
							</TableRow>
						) : prompts.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="h-24 text-center">
									표시할 프롬프트가 없습니다.
								</TableCell>
							</TableRow>
						) : (
							prompts.slice(startIndex, endIndex).map((prompt) => {
								return (
									<TableRow key={`prompt-${prompt.id}`}>
										<TableCell className="font-medium">{prompt.name}</TableCell>
										<TableCell className="truncate max-w-[300px]">
											{prompt.llm_prompt || "N/A"}
										</TableCell>
										<TableCell>v{prompt.version}</TableCell>
										<TableCell>
											{prompt.created_by || "N/A"}{" "}
											{/* "사용자 X" 대신 바로 username 표시 */}
										</TableCell>
										<TableCell>{formatDate(prompt.updated_at)}</TableCell>
										<TableCell className="text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onSelect={() => handleOpenDetailDialog(prompt)}
													>
														<Eye className="mr-2 h-4 w-4" />
														상세보기
													</DropdownMenuItem>
													<DropdownMenuItem
														onSelect={() => handleOpenEditDialog(prompt)}
													>
														<Edit className="mr-2 h-4 w-4" />
														수정
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>

			{totalPrompts > itemsPerPage && (
				<PaginationControls
					currentPage={currentPage}
					totalPages={Math.ceil(totalPrompts / itemsPerPage)}
					onPageChange={handlePageChange}
				/>
			)}

			{/* 상세보기 모달 */}
			{selectedPromptForDetail && (
				<Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
					<DialogContent className="sm:max-w-[600px]">
						<DialogHeader>
							<DialogTitle>프롬프트 상세보기</DialogTitle>
							<DialogDescription>
								프롬프트의 상세 정보를 확인할 수 있습니다.
							</DialogDescription>
						</DialogHeader>

						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right font-medium">이름</Label>
								<div className="col-span-3 p-2 bg-gray-50 rounded border text-gray-700">
									{selectedPromptForDetail.name}
								</div>
							</div>

							<div className="grid grid-cols-4 items-start gap-4">
								<Label className="text-right pt-2 font-medium">
									LLM 프롬프트
								</Label>
								<div className="col-span-3 p-3 bg-gray-50 rounded border text-gray-700 min-h-[120px] whitespace-pre-wrap">
									{selectedPromptForDetail.llm_prompt}
								</div>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right font-medium">현재 버전</Label>
								<div className="col-span-3 p-2 bg-gray-50 rounded border text-gray-700">
									v{selectedPromptForDetail.version}
								</div>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right font-medium">생성자</Label>
								<div className="col-span-3 p-2 bg-gray-50 rounded border text-gray-700">
									{selectedPromptForDetail.created_by || "N/A"}
								</div>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right font-medium">생성일</Label>
								<div className="col-span-3 p-2 bg-gray-50 rounded border text-gray-700">
									{formatDate(selectedPromptForDetail.created_at)}
								</div>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label className="text-right font-medium">최종 수정일</Label>
								<div className="col-span-3 p-2 bg-gray-50 rounded border text-gray-700">
									{formatDate(selectedPromptForDetail.updated_at)}
								</div>
							</div>
						</div>

						<DialogFooter>
							<DialogClose asChild>
								<Button variant="outline">닫기</Button>
							</DialogClose>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{/* 수정 모달 */}
			{selectedPromptForEdit && (
				<Dialog open={isEditDialogOpen} onOpenChange={handleCloseEditDialog}>
					<DialogContent className="sm:max-w-[800px]">
						<DialogHeader>
							<DialogTitle>프롬프트 수정</DialogTitle>
							<DialogDescription>
								프롬프트 내용을 수정하거나 이전 버전으로 롤백할 수 있습니다.
							</DialogDescription>
						</DialogHeader>

						<div className="grid gap-4 py-4">
							{/* 이름 입력 - 읽기전용 */}
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="edit-name" className="text-right">
									이름
								</Label>
								<Input
									id="edit-name"
									value={editFormData.name}
									readOnly
									className="col-span-3 bg-gray-50 text-gray-600 cursor-not-allowed"
								/>
							</div>

							{/* LLM 프롬프트 입력 */}
							<div className="grid grid-cols-4 items-start gap-4">
								<Label htmlFor="edit-prompt" className="text-right pt-2">
									LLM 프롬프트
								</Label>
								<Textarea
									id="edit-prompt"
									value={editFormData.llm_prompt}
									onChange={(e) =>
										setEditFormData({
											...editFormData,
											llm_prompt: e.target.value,
										})
									}
									className="col-span-3 min-h-[150px]"
								/>
							</div>

							{/* 버전 히스토리 */}
							<div className="grid grid-cols-4 items-start gap-4">
								<Label className="text-right pt-2">버전 히스토리</Label>
								<div className="col-span-3">
									<div className="border rounded-md p-3 max-h-[200px] overflow-y-auto">
										{isLoadingVersions ? (
											<div className="text-center py-2">로딩 중...</div>
										) : promptVersions.length === 0 ? (
											<div className="text-center py-2 text-muted-foreground">
												버전이 없습니다
											</div>
										) : (
											<div className="space-y-2">
												{promptVersions.map((version) => (
													<div
														key={version.id}
														className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-accent ${
															version.version === selectedPromptForEdit?.version
																? "bg-primary/10 border border-primary"
																: "border"
														}`}
														onClick={() => handleVersionClick(version)}
													>
														<div className="flex items-center gap-2">
															<span className="font-medium">
																v{version.version}
																{version.version ===
																	selectedPromptForEdit?.version && " (현재)"}
															</span>
															<span className="text-sm text-muted-foreground">
																{formatDate(version.created_at)}
															</span>
															<span className="text-sm text-muted-foreground">
																by {version.created_by || "N/A"}{" "}
																{/* "사용자 X" 제거 */}
															</span>
														</div>
														{version.version !==
															selectedPromptForEdit?.version && (
															<Button
																variant="outline"
																size="sm"
																onClick={(e) => {
																	e.stopPropagation();
																	handleRollback(version.version);
																}}
															>
																롤백
															</Button>
														)}
													</div>
												))}
											</div>
										)}
									</div>
								</div>
							</div>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={handleCloseEditDialog}>
								취소
							</Button>
							<Button
								onClick={handleSaveEdit}
								disabled={isSubmitting || !hasChanges}
							>
								{isSubmitting ? "저장 중..." : "저장"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
