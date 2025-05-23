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
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { PaginationControls } from "@/components/pagination-controls";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PromptPageHeader } from "@/components/admin/prompt-page-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { CreatePersonaPromptDialog } from "@/components/admin/prompts/persona/create-persona-prompt-dialog";

// 타입 정의
interface PromptVersion {
	id?: string | number;
	version?: number;
	content: string;
	is_active: boolean;
	created_at?: string;
}

interface PersonaPrompt {
	id: number;
	name: string;
	llm_prompt: string | null;
	versions: PromptVersion[];
	tags: string[] | null;
	created_at: string;
	updated_at: string;
	created_by: number | null;
}

interface PaginatedPersonaPrompts {
	total_items: number;
	items: PersonaPrompt[];
}

const ITEMS_PER_PAGE = 10;

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

export default function PersonaPromptsPage() {
	const [prompts, setPrompts] = useState<PersonaPrompt[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [currentPage, setCurrentPage] = useState(1);
	const [totalPrompts, setTotalPrompts] = useState(0);
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [isVersionHistoryDialogOpen, setIsVersionHistoryDialogOpen] =
		useState(false);
	const [selectedPromptForHistory, setSelectedPromptForHistory] =
		useState<PersonaPrompt | null>(null);
	const [selectedPrompts, setSelectedPrompts] = useState<number[]>([]);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500);
		return () => clearTimeout(handler);
	}, [searchTerm]);

	const fetchPersonaPrompts = useCallback(
		async (page: number, currentSearchTerm?: string) => {
			setIsLoading(true);
			setError(null);
			try {
				const token = localStorage.getItem("access_token");
				if (!token) throw new Error("Access token not found.");

				const skip = (page - 1) * ITEMS_PER_PAGE;
				let url = `/api/v1/prompts/persona?skip=${skip}&limit=${ITEMS_PER_PAGE}`;
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
		[debouncedSearchTerm]
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

	const handleCreatePrompt = async (
		name: string,
		llm_prompt: string,
		tagsAsString: string,
		content: string
	) => {
		setIsSubmitting(true);
		setError(null);

		try {
			const token = localStorage.getItem("access_token");
			if (!token) {
				throw new Error("Access token not found. Please login again.");
			}

			const newPromptData = {
				name: name,
				llm_prompt: llm_prompt || null,
				versions: [{ content: content || llm_prompt, is_active: true }],
				tags: tagsAsString
					.split(",")
					.map((tag: string) => tag.trim())
					.filter((tag: string) => tag.length > 0),
			};

			console.log(
				"Data being sent to /api/v1/prompts/persona:",
				JSON.stringify(newPromptData, null, 2)
			);

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

	const handleOpenVersionHistoryDialog = (prompt: PersonaPrompt) => {
		setSelectedPromptForHistory(prompt);
		setIsVersionHistoryDialogOpen(true);
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
				`/api/v1/prompts/persona/${promptId}/versions/${versionId}/activate`,
				{
					method: "PUT",
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			if (!response.ok) {
				const errData = await response.json().catch(() => ({}));
				throw new Error(errData.detail || "Failed to set active version.");
			}
			const updatedPrompt: PersonaPrompt = await response.json();
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
		)
			return;
		try {
			const token = localStorage.getItem("access_token");
			if (!token) throw new Error("Access token not found.");
			const response = await fetch(`/api/v1/prompts/persona/${promptId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.detail || "Failed to delete persona prompt.");
			}
			toast.success("페르소나 프롬프트가 삭제되었습니다.");
			fetchPersonaPrompts(currentPage, debouncedSearchTerm);
			setSelectedPrompts(selectedPrompts.filter((id) => id !== promptId));
		} catch (error: any) {
			console.error("Error deleting persona prompt:", error);
			toast.error(
				error.message || "페르소나 프롬프트 삭제 중 오류가 발생했습니다."
			);
		}
	};

	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;

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
				searchPlaceholder="페르소나 프롬프트 검색..."
				searchTerm={searchTerm}
				onSearchTermChange={handleSearchTermChange}
				onCreateClick={() => setIsCreateDialogOpen(true)}
				createButtonText="프롬프트 생성"
			/>

			<CreatePersonaPromptDialog
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
								<TableCell colSpan={8} className="h-24 text-center">
									데이터 로딩 중...
								</TableCell>
							</TableRow>
						) : error ? (
							<TableRow>
								<TableCell
									colSpan={8}
									className="h-24 text-center text-red-500"
								>
									{error}
								</TableCell>
							</TableRow>
						) : prompts.length === 0 ? (
							<TableRow>
								<TableCell colSpan={8} className="h-24 text-center">
									데이터가 없습니다.
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
											{prompt.llm_prompt || "-"}
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
														onClick={() =>
															handleOpenVersionHistoryDialog(prompt)
														}
													>
														수정
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => handleDeletePrompt(prompt.id)}
														className="text-destructive focus:text-destructive"
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

			{totalPrompts > ITEMS_PER_PAGE && (
				<PaginationControls
					currentPage={currentPage}
					totalPages={Math.ceil(totalPrompts / ITEMS_PER_PAGE)}
					onPageChange={handlePageChange}
				/>
			)}

			{selectedPromptForHistory && (
				<Dialog
					open={isVersionHistoryDialogOpen}
					onOpenChange={setIsVersionHistoryDialogOpen}
				>
					<DialogContent className="sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px]">
						<DialogHeader>
							<DialogTitle>
								버전 히스토리: {selectedPromptForHistory.name}
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
																	selectedPromptForHistory!.id as number,
																	version.id! as number
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
