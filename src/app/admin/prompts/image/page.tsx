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
import { MoreHorizontal, CheckCircle, GitCommit, Trash2 } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { PaginationControls } from "@/components/pagination-controls";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PromptPageHeader } from "@/components/admin/prompt-page-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { CreateImagePromptDialog } from "@/components/admin/prompts/image/create-image-prompt-dialog";

// 프롬프트 버전 타입 정의
interface PromptVersion {
	id?: string | number; // DB에서 생성될 수도 있으므로 optional
	version_number?: number;
	content: string;
	is_active: boolean;
	created_at?: string;
}

// 이미지 프롬프트 타입 정의 (DB 스키마와 유사하게)
interface ImagePrompt {
	id: number;
	name: string;
	image_prompt: string;
	tags: string[] | null;
	created_at: string;
	updated_at: string;
	created_by: number | null;
	versions: {
		id: number;
		version: number;
		content: string;
		created_at: string;
		is_active: boolean;
		created_by: number | null;
	}[];
}

interface PaginatedImagePrompts {
	total_items: number;
	items: ImagePrompt[];
}

const ITEMS_PER_PAGE = 10; // 페이지당 항목 수 (필요시 페이지네이션 구현)

export default function ImagePromptsPage() {
	const [prompts, setPrompts] = useState<ImagePrompt[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [totalPrompts, setTotalPrompts] = useState(0);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [versionHistoryDialogOpen, setVersionHistoryDialogOpen] =
		useState(false);
	const [selectedPromptForHistory, setSelectedPromptForHistory] =
		useState<ImagePrompt | null>(null);
	const [selectedPrompts, setSelectedPrompts] = useState<number[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// 페이지네이션 상태
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = ITEMS_PER_PAGE; // This is the correct constant to use

	// 검색어 상태
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

	// Debounce search term
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500); // 500ms delay
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
						: searchTerm;
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
		[searchTerm, itemsPerPage]
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

	const handleCreatePrompt = async (
		name: string,
		image_prompt: string,
		tagsAsString: string,
		content: string
	) => {
		setIsSubmitting(true);
		try {
			const token = localStorage.getItem("access_token");
			if (!token) throw new Error("Access token not found.");

			const newPromptData = {
				name: name,
				image_prompt: image_prompt,
				versions: [{ content: content || image_prompt, is_active: true }],
				tags: tagsAsString
					.split(",")
					.map((tag: string) => tag.trim())
					.filter((tag: string) => tag.length > 0),
			};

			const response = await fetch("/api/v1/prompts/image/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(newPromptData),
			});

			if (!response.ok) {
				const errData = await response.json().catch(() => ({}));
				throw new Error(errData.detail || "Failed to create prompt.");
			}
			const createdPrompt: ImagePrompt = await response.json();
			toast.success(`'${createdPrompt.name}' 프롬프트가 생성되었습니다.`);
			setIsCreateDialogOpen(false);
			fetchImagePrompts(1, "");
			setCurrentPage(1);
			setSearchTerm("");
		} catch (err) {
			console.error("Error creating image prompt:", err);
			toast.error(
				err instanceof Error ? err.message : "프롬프트 생성 중 오류 발생"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	// 날짜 포맷팅 함수 (필요시 utils로 분리)
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

	const handleOpenVersionHistoryDialog = (prompt: ImagePrompt) => {
		setSelectedPromptForHistory(prompt);
		setVersionHistoryDialogOpen(true);
	};

	const handleSetActiveVersion = async (
		promptId: number,
		versionId: number
	) => {
		if (!selectedPromptForHistory) return;

		try {
			const token = localStorage.getItem("access_token");
			if (!token) throw new Error("Access token not found.");

			const response = await fetch(
				`/api/v1/prompts/image/${promptId}/versions/${versionId}/activate`,
				{
					method: "PUT",
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (!response.ok) {
				const errData = await response.json().catch(() => ({}));
				throw new Error(errData.detail || "Failed to set active version.");
			}
			const updatedPrompt: ImagePrompt = await response.json();

			setPrompts((prevPrompts) =>
				prevPrompts.map((p) => (p.id === updatedPrompt.id ? updatedPrompt : p))
			);
			if (
				selectedPromptForHistory &&
				selectedPromptForHistory.id === updatedPrompt.id
			) {
				setSelectedPromptForHistory(updatedPrompt);
			}

			toast.success(`버전 ${versionId}이(가) 활성 버전으로 설정되었습니다.`);
		} catch (err) {
			console.error("Error setting active version:", err);
			toast.error(
				err instanceof Error ? err.message : "활성 버전 설정 중 오류 발생"
			);
		}
	};

	const handleDeletePrompt = async (promptId: number) => {
		if (
			!window.confirm(
				"정말로 이 프롬프트를 삭제하시겠습니까? 모든 버전이 함께 삭제됩니다."
			)
		) {
			return;
		}
		try {
			const response = await fetch(`/api/admin/prompts/image/${promptId}`, {
				method: "DELETE",
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.detail || "Failed to delete prompt");
			}
			toast.success("프롬프트가 삭제되었습니다.");
			// Refresh the list
			fetchImagePrompts(currentPage, debouncedSearchTerm);
			setSelectedPrompts(selectedPrompts.filter((id) => id !== promptId));
		} catch (error: any) {
			console.error("Error deleting prompt:", error);
			toast.error(error.message || "프롬프트 삭제 중 오류가 발생했습니다.");
		}
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
							<TableHead className="w-[40px]">
								<Checkbox
									checked={
										prompts.length > 0 &&
										selectedPrompts.length === prompts.length
									}
									onCheckedChange={(checked) => {
										if (checked) {
											setSelectedPrompts(prompts.map((p) => p.id));
										} else {
											setSelectedPrompts([]);
										}
									}}
								/>
							</TableHead>
							<TableHead className="min-w-[150px]">이름</TableHead>
							<TableHead className="min-w-[200px] max-w-[300px] truncate">
								설명
							</TableHead>
							<TableHead className="min-w-[150px]">태그</TableHead>
							<TableHead className="min-w-[100px]">현재 버전</TableHead>
							<TableHead className="min-w-[120px]">생성자</TableHead>
							<TableHead className="min-w-[150px]">최종 수정일</TableHead>
							<TableHead className="text-right w-[100px]">액션</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={9} className="h-24 text-center">
									<div className="flex justify-center items-center">
										<Loader2 className="mr-2 h-8 w-8 animate-spin" />
										<span>데이터를 불러오는 중입니다...</span>
									</div>
								</TableCell>
							</TableRow>
						) : error ? (
							<TableRow>
								<TableCell
									colSpan={9}
									className="h-24 text-center text-red-500"
								>
									{error}
								</TableCell>
							</TableRow>
						) : prompts.length === 0 ? (
							<TableRow>
								<TableCell colSpan={9} className="h-24 text-center">
									표시할 프롬프트가 없습니다.
								</TableCell>
							</TableRow>
						) : (
							prompts.slice(startIndex, endIndex).map((prompt) => {
								const activeVersion = prompt.versions.find((v) => v.is_active);
								const currentVersionDisplay = activeVersion
									? `V.${activeVersion.version}`
									: "N/A";

								return (
									<TableRow key={prompt.id}>
										<TableCell>
											<Checkbox
												checked={selectedPrompts.includes(prompt.id)}
												onCheckedChange={(checked) => {
													if (checked) {
														setSelectedPrompts([...selectedPrompts, prompt.id]);
													} else {
														setSelectedPrompts(
															selectedPrompts.filter((id) => id !== prompt.id)
														);
													}
												}}
											/>
										</TableCell>
										<TableCell className="font-medium">{prompt.name}</TableCell>
										<TableCell className="truncate max-w-[300px]">
											{prompt.image_prompt || "N/A"}
										</TableCell>
										<TableCell>
											{prompt.tags && prompt.tags.length > 0
												? prompt.tags.map((tag: string) => (
														<Badge key={tag} variant="outline" className="mr-1">
															{tag}
														</Badge>
												  ))
												: "N/A"}
										</TableCell>
										<TableCell>{currentVersionDisplay}</TableCell>
										<TableCell>
											{prompt.created_by ? `ID:${prompt.created_by}` : "N/A"}
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
														onSelect={() =>
															handleOpenVersionHistoryDialog(prompt)
														}
													>
														수정
													</DropdownMenuItem>
													<DropdownMenuItem
														onSelect={() => handleDeletePrompt(prompt.id)}
														className="text-red-600"
													>
														삭제
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

			{totalPrompts > 1 && (
				<PaginationControls
					currentPage={currentPage}
					totalPages={Math.ceil(totalPrompts / itemsPerPage)}
					onPageChange={handlePageChange}
				/>
			)}

			{selectedPromptForHistory && (
				<Dialog
					open={versionHistoryDialogOpen}
					onOpenChange={setVersionHistoryDialogOpen}
				>
					<DialogContent className="sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px]">
						<DialogHeader>
							<DialogTitle>
								프롬프트 버전 관리: {selectedPromptForHistory?.name}
							</DialogTitle>
							<DialogDescription>
								프롬프트 '{selectedPromptForHistory.name}'의 모든 버전
								목록입니다.
							</DialogDescription>
						</DialogHeader>
						<ScrollArea className="max-h-[60vh] p-1">
							<Table className="mt-4">
								<TableHeader>
									<TableRow>
										<TableHead className="w-[10%]">상태</TableHead>
										<TableHead className="w-[15%]">버전 ID</TableHead>
										<TableHead className="w-[50%]">내용 (일부)</TableHead>
										<TableHead className="w-[20%]">생성일</TableHead>
										<TableHead className="text-right w-[5%]">작업</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{selectedPromptForHistory.versions
										.slice()
										.sort(
											(a, b) =>
												new Date(b.created_at!).getTime() -
												new Date(a.created_at!).getTime()
										)
										.map((version, index) => (
											<TableRow key={version.id || `version-${index}`}>
												<TableCell>
													{version.is_active ? (
														<Badge variant="default">
															<CheckCircle className="mr-1 h-3 w-3 inline-block" />
															현재 활성
														</Badge>
													) : (
														<Badge variant="outline">이전 버전</Badge>
													)}
												</TableCell>
												<TableCell className="text-xs">
													{version.id || "N/A"}
												</TableCell>
												<TableCell
													className="text-xs max-w-md truncate"
													title={version.content}
												>
													{version.content}
												</TableCell>
												<TableCell className="text-xs">
													{formatDate(version.created_at)}
												</TableCell>
												<TableCell className="text-right">
													{!version.is_active && (
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																handleSetActiveVersion(
																	selectedPromptForHistory!.id,
																	version.id!
																)
															}
														>
															활성으로 설정
														</Button>
													)}
												</TableCell>
											</TableRow>
										))}
								</TableBody>
							</Table>
						</ScrollArea>
						<DialogFooter className="mt-4">
							<DialogClose asChild>
								<Button type="button" variant="outline">
									닫기
								</Button>
							</DialogClose>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
