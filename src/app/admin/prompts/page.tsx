// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";

// export default function PromptsRedirectPage() {
// 	const router = useRouter();

// 	useEffect(() => {
// 		// 이미지 프롬프트 페이지로 자동 리다이렉트 (더 깔끔한 구현)
// 		router.replace("/admin/prompts/image");
// 	}, [router]);

// 	// 리다이렉트 중 간단한 로딩 표시
// 	return (
// 		<div className="flex items-center justify-center h-40">
// 			<div className="flex items-center space-x-2">
// 				<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
// 				<span className="text-gray-600">프롬프트 페이지로 이동 중...</span>
// 			</div>
// 		</div>
// 	);
// }

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Edit, Search, Eye, RotateCcw, Save, X } from "lucide-react";
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

// 타입 정의
interface WorkflowPromptVersion {
	id: number;
	version: number;
	llm_prompt: string;
	created_at: string;
	created_by: number | null;
}

interface WorkflowPrompt {
	id: number;
	name: string;
	category: string;
	type: string | null;
	llm_prompt: string;
	version: number;
	created_by: number | null;
	created_at: string;
	updated_at: string;
	versions: WorkflowPromptVersion[];
}

interface PaginatedWorkflowPrompts {
	total_items: number;
	items: WorkflowPrompt[];
}

// 카테고리 맵핑
const CATEGORY_LABELS: Record<string, string> = {
	concept: "컨셉 생성",
	persona_info: "페르소나 정보 생성",
	summary: "요약 생성",
	tags: "태그 생성",
	image: "이미지 생성",
};

const TYPE_LABELS: Record<string, string> = {
	CHAR: "캐릭터",
	STORY: "스토리",
};

export default function AdminPromptsPage() {
	const [prompts, setPrompts] = useState<WorkflowPrompt[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [totalItems, setTotalItems] = useState(0);

	// 수정 다이얼로그 상태
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editingPrompt, setEditingPrompt] = useState<WorkflowPrompt | null>(
		null
	);
	const [editedContent, setEditedContent] = useState("");
	const [editedName, setEditedName] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	// 미리보기 다이얼로그 상태
	const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
	const [previewPrompt, setPreviewPrompt] = useState<WorkflowPrompt | null>(
		null
	);
	const [previewVersion, setPreviewVersion] = useState<number | null>(null);

	// 롤백 다이얼로그 상태
	const [isRollbackDialogOpen, setIsRollbackDialogOpen] = useState(false);
	const [rollbackPrompt, setRollbackPrompt] = useState<WorkflowPrompt | null>(
		null
	);
	const [rollbackVersion, setRollbackVersion] = useState<number | null>(null);

	// 프롬프트 목록 조회
	const fetchPrompts = async () => {
		setIsLoading(true);
		try {
			const token = localStorage.getItem("access_token");
			const params = new URLSearchParams({
				limit: "1000",
			});

			if (searchTerm.trim()) {
				params.append("search", searchTerm);
			}

			const response = await fetch(
				`/api/v1/prompts/workflow?${params.toString()}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) {
				throw new Error("프롬프트를 가져오는데 실패했습니다");
			}

			const data: PaginatedWorkflowPrompts = await response.json();
			setPrompts(data.items);
			setTotalItems(data.total_items);
		} catch (error) {
			console.error("프롬프트 조회 오류:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchPrompts();
	}, [searchTerm]);

	// 프롬프트 수정 다이얼로그 열기
	const handleEdit = (prompt: WorkflowPrompt) => {
		setEditingPrompt(prompt);
		setEditedName(prompt.name);
		setEditedContent(prompt.llm_prompt);
		setIsEditDialogOpen(true);
	};

	// 프롬프트 수정 저장
	const handleSaveEdit = async () => {
		if (!editingPrompt) return;

		setIsSaving(true);
		try {
			const token = localStorage.getItem("access_token");
			const response = await fetch(
				`/api/v1/prompts/workflow/${editingPrompt.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						name: editedName,
						llm_prompt: editedContent,
					}),
				}
			);

			if (!response.ok) {
				throw new Error("프롬프트 수정에 실패했습니다");
			}

			setIsEditDialogOpen(false);
			fetchPrompts(); // 목록 새로고침
		} catch (error) {
			console.error("프롬프트 수정 오류:", error);
		} finally {
			setIsSaving(false);
		}
	};

	// 미리보기 다이얼로그 열기
	const handlePreview = (prompt: WorkflowPrompt) => {
		setPreviewPrompt(prompt);
		setPreviewVersion(prompt.version);
		setIsPreviewDialogOpen(true);
	};

	// 롤백 다이얼로그 열기
	const handleRollback = (prompt: WorkflowPrompt) => {
		setRollbackPrompt(prompt);
		setRollbackVersion(null);
		setIsRollbackDialogOpen(true);
	};

	// 롤백 실행
	const handleConfirmRollback = async () => {
		if (!rollbackPrompt || !rollbackVersion) return;

		try {
			const token = localStorage.getItem("access_token");
			const response = await fetch(
				`/api/v1/prompts/workflow/${rollbackPrompt.id}/rollback/${rollbackVersion}`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) {
				throw new Error("롤백에 실패했습니다");
			}

			setIsRollbackDialogOpen(false);
			fetchPrompts(); // 목록 새로고침
		} catch (error) {
			console.error("롤백 오류:", error);
		}
	};

	// 선택된 버전의 프롬프트 내용 가져오기
	const getVersionContent = (
		prompt: WorkflowPrompt,
		version: number
	): string => {
		if (version === prompt.version) {
			return prompt.llm_prompt;
		}

		const versionData = prompt.versions.find((v) => v.version === version);
		return versionData?.llm_prompt || "";
	};

	// 날짜 포맷팅
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("ko-KR", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">프롬프트 관리</h1>
					<p className="text-muted-foreground">
						페르소나 생성 워크플로우의 모든 프롬프트를 관리합니다.
					</p>
				</div>
			</div>

			{/* 검색 */}
			<Card>
				<CardHeader>
					<CardTitle>프롬프트 검색</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
								<Input
									placeholder="프롬프트 이름, 내용으로 검색..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 프롬프트 목록 */}
			<Card>
				<CardHeader>
					<CardTitle>프롬프트 목록 ({totalItems}개)</CardTitle>
				</CardHeader>
				<CardContent>
					<AdminTable>
						<AdminTableHeader>
							<AdminTableHeaderCell>이름</AdminTableHeaderCell>
							<AdminTableHeaderCell>카테고리</AdminTableHeaderCell>
							<AdminTableHeaderCell>타입</AdminTableHeaderCell>
							<AdminTableHeaderCell>현재 버전</AdminTableHeaderCell>
							<AdminTableHeaderCell>수정일</AdminTableHeaderCell>
							<AdminTableHeaderCell>관리</AdminTableHeaderCell>
						</AdminTableHeader>
						<AdminTableBody>
							{isLoading ? (
								<AdminTableLoadingRow colSpan={6} />
							) : prompts.length === 0 ? (
								<AdminTableEmptyRow colSpan={6} />
							) : (
								prompts.map((prompt) => (
									<AdminTableRow key={prompt.id}>
										<AdminTableCell>
											<div className="font-medium">{prompt.name}</div>
										</AdminTableCell>
										<AdminTableCell>
											<Badge variant="outline">
												{CATEGORY_LABELS[prompt.category] || prompt.category}
											</Badge>
										</AdminTableCell>
										<AdminTableCell>
											{prompt.type ? (
												<Badge variant="secondary">
													{TYPE_LABELS[prompt.type] || prompt.type}
												</Badge>
											) : (
												<span className="text-gray-400">-</span>
											)}
										</AdminTableCell>
										<AdminTableCell>
											<Badge>v{prompt.version}</Badge>
										</AdminTableCell>
										<AdminTableCell>
											{formatDate(prompt.updated_at)}
										</AdminTableCell>
										<AdminTableCell>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => handlePreview(prompt)}
												>
													<Eye className="h-4 w-4" />
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleEdit(prompt)}
												>
													<Edit className="h-4 w-4" />
												</Button>
												{prompt.versions.length > 1 && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleRollback(prompt)}
													>
														<RotateCcw className="h-4 w-4" />
													</Button>
												)}
											</div>
										</AdminTableCell>
									</AdminTableRow>
								))
							)}
						</AdminTableBody>
					</AdminTable>
				</CardContent>
			</Card>

			{/* 수정 다이얼로그 */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>프롬프트 수정</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<label className="text-sm font-medium">프롬프트 이름</label>
							<Input
								value={editedName}
								onChange={(e) => setEditedName(e.target.value)}
								placeholder="프롬프트 이름"
							/>
						</div>
						<div>
							<label className="text-sm font-medium">프롬프트 내용</label>
							<Textarea
								value={editedContent}
								onChange={(e) => setEditedContent(e.target.value)}
								className="min-h-[400px]"
								placeholder="프롬프트 내용"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsEditDialogOpen(false)}
							disabled={isSaving}
						>
							<X className="h-4 w-4 mr-2" />
							취소
						</Button>
						<Button onClick={handleSaveEdit} disabled={isSaving}>
							<Save className="h-4 w-4 mr-2" />
							{isSaving ? "저장 중..." : "저장"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 미리보기 다이얼로그 */}
			<Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
				<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{previewPrompt?.name} - 미리보기</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<label className="text-sm font-medium">버전 선택</label>
							<Select
								value={previewVersion?.toString()}
								onValueChange={(value) => setPreviewVersion(parseInt(value))}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={previewPrompt?.version.toString() || ""}>
										v{previewPrompt?.version} (현재)
									</SelectItem>
									{previewPrompt?.versions
										.filter((v) => v.version !== previewPrompt.version)
										.sort((a, b) => b.version - a.version)
										.map((version) => (
											<SelectItem
												key={version.version}
												value={version.version.toString()}
											>
												v{version.version}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<label className="text-sm font-medium">프롬프트 내용</label>
							<Textarea
								value={
									previewPrompt && previewVersion
										? getVersionContent(previewPrompt, previewVersion)
										: ""
								}
								className="min-h-[400px]"
								readOnly
							/>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* 롤백 다이얼로그 */}
			<Dialog
				open={isRollbackDialogOpen}
				onOpenChange={setIsRollbackDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{rollbackPrompt?.name} - 버전 롤백</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">
							이전 버전으로 롤백합니다. 현재 버전(v{rollbackPrompt?.version})은
							백업됩니다.
						</p>
						<div>
							<label className="text-sm font-medium">롤백할 버전 선택</label>
							<Select
								value={rollbackVersion?.toString() || ""}
								onValueChange={(value) => setRollbackVersion(parseInt(value))}
							>
								<SelectTrigger>
									<SelectValue placeholder="버전 선택" />
								</SelectTrigger>
								<SelectContent>
									{rollbackPrompt?.versions
										.filter((v) => v.version !== rollbackPrompt.version)
										.sort((a, b) => b.version - a.version)
										.map((version) => (
											<SelectItem
												key={version.version}
												value={version.version.toString()}
											>
												v{version.version}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsRollbackDialogOpen(false)}
						>
							취소
						</Button>
						<Button onClick={handleConfirmRollback} disabled={!rollbackVersion}>
							<RotateCcw className="h-4 w-4 mr-2" />
							롤백 실행
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
