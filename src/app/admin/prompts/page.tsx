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

	// 액션 메뉴 아이템 생성
	const getPromptActions = (prompt: WorkflowPrompt): ActionItem[] => {
		if (!prompt) return [];

		return [
			{
				label: "미리보기",
				icon: <Eye className="h-4 w-4" />,
				onClick: () => handlePreview(prompt),
			},
			{
				label: "수정",
				icon: <Edit className="h-4 w-4" />,
				onClick: () => handleEdit(prompt),
			},
			{
				label: "버전 롤백",
				icon: <RotateCcw className="h-4 w-4" />,
				onClick: () => handleRollback(prompt),
				disabled: !prompt.versions || prompt.versions.length <= 1,
			},
		];
	};

	return (
		<AdminPageLayout>
			<AdminPageHeader
				title="프롬프트 관리"
				description="페르소나 생성 워크플로우의 모든 프롬프트를 관리합니다."
				searchPlaceholder="프롬프트 이름, 내용으로 검색..."
				searchValue={searchTerm}
				onSearchChange={setSearchTerm}
				showCreateButton={false}
			/>

			<AdminTable>
				<AdminTableHeader>
					<AdminTableHeaderCell className="min-w-[200px]">
						이름
					</AdminTableHeaderCell>
					<AdminTableHeaderCell className="min-w-[100px]">
						타입
					</AdminTableHeaderCell>
					<AdminTableHeaderCell className="min-w-[80px]">
						버전
					</AdminTableHeaderCell>
					<AdminTableHeaderCell className="min-w-[120px]">
						수정일
					</AdminTableHeaderCell>
					<AdminTableHeaderCell className="text-right w-[100px]">
						관리
					</AdminTableHeaderCell>
				</AdminTableHeader>
				<AdminTableBody>
					{isLoading ? (
						<AdminTableLoadingRow colSpan={5} />
					) : prompts.length === 0 ? (
						<AdminTableEmptyRow
							colSpan={5}
							message={
								searchTerm
									? "검색 결과가 없습니다."
									: "등록된 프롬프트가 없습니다."
							}
						/>
					) : (
						prompts.map((prompt) => (
							<AdminTableRow key={prompt.id}>
								<AdminTableCell className="font-medium">
									{prompt.name}
								</AdminTableCell>
								<AdminTableCell>
									{prompt.type ? (
										<Badge variant="outline">
											{TYPE_LABELS[prompt.type] || prompt.type}
										</Badge>
									) : (
										<span className="text-muted-foreground">-</span>
									)}
								</AdminTableCell>
								<AdminTableCell>
									<Badge variant="default">v{prompt.version}</Badge>
								</AdminTableCell>
								<AdminTableCell className="text-sm text-muted-foreground">
									{formatDate(prompt.updated_at)}
								</AdminTableCell>
								<AdminTableCell className="text-right">
									<ActionDropdown actions={getPromptActions(prompt)} />
								</AdminTableCell>
							</AdminTableRow>
						))
					)}
				</AdminTableBody>
			</AdminTable>

			{/* 수정 다이얼로그 */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>프롬프트 수정</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<label htmlFor="edit-name" className="text-sm font-medium">
								프롬프트 이름
							</label>
							<Input
								id="edit-name"
								value={editedName}
								onChange={(e) => setEditedName(e.target.value)}
								placeholder="프롬프트 이름을 입력하세요"
							/>
						</div>
						<div className="grid gap-2">
							<label htmlFor="edit-content" className="text-sm font-medium">
								프롬프트 내용
							</label>
							<Textarea
								id="edit-content"
								value={editedContent}
								onChange={(e) => setEditedContent(e.target.value)}
								placeholder="프롬프트 내용을 입력하세요"
								className="min-h-[300px] resize-y"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsEditDialogOpen(false)}
							disabled={isSaving}
						>
							<X className="w-4 h-4 mr-2" />
							취소
						</Button>
						<Button onClick={handleSaveEdit} disabled={isSaving}>
							<Save className="w-4 h-4 mr-2" />
							{isSaving ? "저장 중..." : "저장"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 미리보기 다이얼로그 */}
			<Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
				<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>프롬프트 미리보기</DialogTitle>
					</DialogHeader>
					{previewPrompt && (
						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<label className="text-sm font-medium">프롬프트 이름</label>
								<div className="p-3 bg-muted rounded-md">
									{previewPrompt.name}
								</div>
							</div>
							<div className="grid gap-2">
								<label className="text-sm font-medium">카테고리 / 타입</label>
								<div className="flex gap-2">
									<Badge variant="secondary">
										{CATEGORY_LABELS[previewPrompt.category] ||
											previewPrompt.category}
									</Badge>
									{previewPrompt.type && (
										<Badge variant="outline">
											{TYPE_LABELS[previewPrompt.type] || previewPrompt.type}
										</Badge>
									)}
								</div>
							</div>
							<div className="grid gap-2">
								<label className="text-sm font-medium">버전 선택</label>
								<Select
									value={previewVersion?.toString()}
									onValueChange={(value) => setPreviewVersion(Number(value))}
								>
									<SelectTrigger>
										<SelectValue placeholder="버전을 선택하세요" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={previewPrompt.version.toString()}>
											v{previewPrompt.version} (현재)
										</SelectItem>
										{previewPrompt.versions
											?.filter((v) => v.version !== previewPrompt.version)
											.sort((a, b) => b.version - a.version)
											.map((version) => (
												<SelectItem
													key={version.version}
													value={version.version.toString()}
												>
													v{version.version} ({formatDate(version.created_at)})
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							</div>
							<div className="grid gap-2">
								<label className="text-sm font-medium">프롬프트 내용</label>
								<div className="p-3 bg-muted rounded-md max-h-[300px] overflow-y-auto whitespace-pre-wrap text-sm">
									{previewVersion
										? getVersionContent(previewPrompt, previewVersion)
										: previewPrompt.llm_prompt}
								</div>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button onClick={() => setIsPreviewDialogOpen(false)}>닫기</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 롤백 다이얼로그 */}
			<Dialog
				open={isRollbackDialogOpen}
				onOpenChange={setIsRollbackDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>프롬프트 버전 롤백</DialogTitle>
					</DialogHeader>
					{rollbackPrompt && (
						<div className="grid gap-4 py-4">
							<div className="text-sm text-muted-foreground">
								<strong>{rollbackPrompt.name}</strong> 프롬프트를 이전 버전으로
								되돌립니다.
							</div>
							<div className="grid gap-2">
								<label className="text-sm font-medium">롤백할 버전 선택</label>
								<Select
									value={rollbackVersion?.toString()}
									onValueChange={(value) => setRollbackVersion(Number(value))}
								>
									<SelectTrigger>
										<SelectValue placeholder="롤백할 버전을 선택하세요" />
									</SelectTrigger>
									<SelectContent>
										{rollbackPrompt.versions
											?.filter((v) => v.version !== rollbackPrompt.version)
											.sort((a, b) => b.version - a.version)
											.map((version) => (
												<SelectItem
													key={version.version}
													value={version.version.toString()}
												>
													v{version.version} ({formatDate(version.created_at)})
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							</div>
							{rollbackVersion && (
								<div className="grid gap-2">
									<label className="text-sm font-medium">미리보기</label>
									<div className="p-3 bg-muted rounded-md max-h-[200px] overflow-y-auto text-sm">
										{getVersionContent(rollbackPrompt, rollbackVersion)}
									</div>
								</div>
							)}
						</div>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsRollbackDialogOpen(false)}
						>
							취소
						</Button>
						<Button onClick={handleConfirmRollback} disabled={!rollbackVersion}>
							<RotateCcw className="w-4 h-4 mr-2" />
							롤백 실행
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</AdminPageLayout>
	);
}
