"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit } from "lucide-react";
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
import { CreatePersonaPromptDialog } from "@/components/admin/prompts/persona/create-persona-prompt-dialog";

// 타입 정의
interface PersonaPromptVersion {
	id: number;
	version: number;
	llm_prompt: string;
	created_at: string;
	created_by: number | null;
}

interface PersonaPrompt {
	id: number;
	name: string;
	llm_prompt: string;
	version: number;
	created_at: string;
	updated_at: string;
	created_by: number | null;
	versions: PersonaPromptVersion[];
}

interface PaginatedPersonaPrompts {
	total_items: number;
	items: PersonaPrompt[];
}

const ITEMS_PER_PAGE = 10;

export default function PersonaPromptsPage() {
	const [prompts, setPrompts] = useState<PersonaPrompt[]>([]);
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
		useState<PersonaPrompt | null>(null);
	const [editFormData, setEditFormData] = useState({
		name: "",
		llm_prompt: "",
	});
	const [originalLlmPrompt, setOriginalLlmPrompt] = useState("");
	const [promptVersions, setPromptVersions] = useState<PersonaPromptVersion[]>(
		[]
	);
	const [isLoadingVersions, setIsLoadingVersions] = useState(false);

	// 상세보기 모달 관련 상태
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
	const [selectedPromptForDetail, setSelectedPromptForDetail] =
		useState<PersonaPrompt | null>(null);

	// Debounce search term
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500);
		return () => {
			clearTimeout(handler);
		};
	}, [searchTerm]);

	const fetchPersonaPrompts = useCallback(
		async (page: number, currentSearchTerm?: string) => {
			setIsLoading(true);
			setError(null);
			try {
				const token = localStorage.getItem("access_token");
				if (!token) throw new Error("Access token not found.");

				const skip = (page - 1) * itemsPerPage;
				let url = `/api/v1/prompts/persona?skip=${skip}&limit=${itemsPerPage}`;
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
						errData.detail ||
							`Failed to fetch persona prompts: ${response.statusText}`
					);
				}
				const data: PaginatedPersonaPrompts = await response.json();
				setPrompts(data.items);
				setTotalPrompts(data.total_items);
			} catch (err) {
				console.error("Error fetching persona prompts:", err);
				const message =
					err instanceof Error
						? err.message
						: "페르소나 프롬프트 목록 로딩 중 오류 발생";
				setError(message);
				toast.error(message);
				setPrompts([]);
				setTotalPrompts(0);
			} finally {
				setIsLoading(false);
			}
		},
		[debouncedSearchTerm, itemsPerPage]
	);

	useEffect(() => {
		fetchPersonaPrompts(currentPage, debouncedSearchTerm);
	}, [currentPage, debouncedSearchTerm, fetchPersonaPrompts]);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleSearchTermChange = (term: string) => {
		setSearchTerm(term);
		setCurrentPage(1);
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

			const response = await fetch("/api/v1/prompts/persona/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(newPromptData),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({
					detail: "Unknown error occurred during persona prompt creation",
				}));
				const errorMessage = Array.isArray(errorData.detail)
					? errorData.detail
							.map((err: any) => `${err.loc.join(".")} - ${err.msg}`)
							.join(", ")
					: errorData.detail || "Failed to create persona prompt";
				throw new Error(errorMessage);
			}

			const createdPrompt: PersonaPrompt = await response.json();
			toast.success(
				`페르소나 프롬프트 "${createdPrompt.name}"이(가) 성공적으로 생성되었습니다.`
			);
			setIsCreateDialogOpen(false);
			fetchPersonaPrompts(1, "");
			setCurrentPage(1);
			setSearchTerm("");
		} catch (err: any) {
			console.error("Error creating persona prompt:", err);
			toast.error(
				err.message || "페르소나 프롬프트 생성 중 오류가 발생했습니다."
			);
			setError(err.message || "페르소나 프롬프트 생성 중 오류가 발생했습니다.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// 상세보기 다이얼로그 열기
	const handleOpenDetailDialog = (prompt: PersonaPrompt) => {
		setSelectedPromptForDetail(prompt);
		setIsDetailDialogOpen(true);
	};

	// 수정 다이얼로그 열기
	const handleOpenEditDialog = async (prompt: PersonaPrompt) => {
		setSelectedPromptForEdit(prompt);
		setEditFormData({
			name: prompt.name,
			llm_prompt: prompt.llm_prompt,
		});
		setOriginalLlmPrompt(prompt.llm_prompt);

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
				`/api/v1/prompts/persona/${promptId}/versions`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (!response.ok) {
				throw new Error("Failed to fetch prompt versions");
			}

			const versions: PersonaPromptVersion[] = await response.json();
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
	const handleVersionClick = (version: PersonaPromptVersion) => {
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
				`/api/v1/prompts/persona/${selectedPromptForEdit.id}`,
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
			fetchPersonaPrompts(currentPage, searchTerm);
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
				`/api/v1/prompts/persona/${selectedPromptForEdit.id}/rollback/${version}`,
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
			fetchPersonaPrompts(currentPage, searchTerm);
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

	function formatDate(dateString?: string) {
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
	}

	// 각 프롬프트의 액션 메뉴 생성
	const getPromptActions = (prompt: PersonaPrompt): ActionItem[] => [
		{
			label: "상세보기",
			icon: <Eye className="h-4 w-4" />,
			onClick: () => handleOpenDetailDialog(prompt),
		},
		{
			label: "수정",
			icon: <Edit className="h-4 w-4" />,
			onClick: () => handleOpenEditDialog(prompt),
		},
	];

	if (isLoading && prompts.length === 0 && !searchTerm) {
		return (
			<AdminPageLayout>
				<div className="flex justify-center items-center h-64">
					<AdminTableLoadingRow colSpan={1} />
				</div>
			</AdminPageLayout>
		);
	}

	if (error && prompts.length === 0) {
		return (
			<AdminPageLayout>
				<div className="text-red-500 text-center p-6">Error: {error}</div>
			</AdminPageLayout>
		);
	}

	return (
		<AdminPageLayout>
			<AdminPageHeader
				title="페르소나 프롬프트 목록"
				searchPlaceholder="페르소나 프롬프트 검색..."
				searchValue={searchTerm}
				onSearchChange={handleSearchTermChange}
				onCreateClick={() => setIsCreateDialogOpen(true)}
				createButtonText="프롬프트 생성"
			/>

			<CreatePersonaPromptDialog
				isOpen={isCreateDialogOpen}
				onClose={() => setIsCreateDialogOpen(false)}
				onCreate={handleCreatePrompt}
				isSubmitting={isSubmitting}
			/>

			<AdminTable>
				<AdminTableHeader>
					<AdminTableHeaderCell className="min-w-[150px]">
						이름
					</AdminTableHeaderCell>
					<AdminTableHeaderCell className="min-w-[200px] max-w-[300px]">
						LLM 프롬프트
					</AdminTableHeaderCell>
					<AdminTableHeaderCell className="min-w-[100px]">
						현재 버전
					</AdminTableHeaderCell>
					<AdminTableHeaderCell className="min-w-[120px]">
						생성자
					</AdminTableHeaderCell>
					<AdminTableHeaderCell className="min-w-[150px]">
						최종 수정일
					</AdminTableHeaderCell>
					<AdminTableHeaderCell className="text-right w-[100px]">
						액션
					</AdminTableHeaderCell>
				</AdminTableHeader>
				<AdminTableBody>
					{isLoading ? (
						<AdminTableLoadingRow colSpan={6} />
					) : error ? (
						<AdminTableRow>
							<AdminTableCell
								colSpan={6}
								className="h-24 text-center text-red-500"
							>
								{error}
							</AdminTableCell>
						</AdminTableRow>
					) : prompts.length === 0 ? (
						<AdminTableEmptyRow
							colSpan={6}
							message={
								searchTerm
									? "검색 결과가 없습니다."
									: "표시할 프롬프트가 없습니다."
							}
						/>
					) : (
						prompts.map((prompt) => (
							<AdminTableRow key={prompt.id}>
								<AdminTableCell className="font-medium">
									{prompt.name}
								</AdminTableCell>
								<AdminTableCell className="max-w-[300px]">
									<div className="truncate" title={prompt.llm_prompt}>
										{prompt.llm_prompt || "N/A"}
									</div>
								</AdminTableCell>
								<AdminTableCell>
									<Badge variant="outline">v{prompt.version}</Badge>
								</AdminTableCell>
								<AdminTableCell>{prompt.created_by || "N/A"}</AdminTableCell>
								<AdminTableCell>{formatDate(prompt.updated_at)}</AdminTableCell>
								<AdminTableCell className="text-right">
									<ActionDropdown actions={getPromptActions(prompt)} />
								</AdminTableCell>
							</AdminTableRow>
						))
					)}
				</AdminTableBody>
			</AdminTable>

			{totalPrompts > ITEMS_PER_PAGE && (
				<AdminPagination
					currentPage={currentPage}
					totalPages={Math.ceil(totalPrompts / ITEMS_PER_PAGE)}
					totalItems={totalPrompts}
					itemsPerPage={ITEMS_PER_PAGE}
					onPageChange={handlePageChange}
				/>
			)}

			{/* 상세보기 모달 */}
			{selectedPromptForDetail && (
				<Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
					<DialogContent className="sm:max-w-[600px]">
						<DialogHeader>
							<DialogTitle>페르소나 프롬프트 상세보기</DialogTitle>
							<DialogDescription>
								페르소나 프롬프트의 상세 정보를 확인할 수 있습니다.
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
							<DialogTitle>페르소나 프롬프트 수정</DialogTitle>
							<DialogDescription>
								페르소나 프롬프트 내용을 수정하거나 이전 버전으로 롤백할 수
								있습니다.
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
																by {version.created_by || "N/A"}
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
		</AdminPageLayout>
	);
}
