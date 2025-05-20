"use client";

import { useState } from "react";
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
import {
	Search,
	Edit,
	Trash2,
	MoreHorizontal,
	Plus,
	History,
	Clock,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// 프롬프트 타입 정의
interface PromptVersion {
	id: number;
	content: string;
	createdAt: string;
	isActive: boolean;
}

interface Prompt {
	id: number;
	name: string;
	description: string;
	versions: PromptVersion[];
	currentVersion: number;
	tags: string[];
	createdAt: string;
	updatedAt: string;
	category?: string;
}

// 샘플 데이터
const samplePrompts: Prompt[] = [
	{
		id: 1,
		name: "전문가 페르소나",
		description: "특정 분야의 전문가로서 답변하는 프롬프트",
		versions: [
			{
				id: 1,
				content:
					"당신은 [분야]의 전문가입니다. 사용자의 질문에 전문적이고 정확한 정보를 제공해 주세요.",
				createdAt: "2023-07-15T09:30:00Z",
				isActive: false,
			},
			{
				id: 2,
				content:
					"당신은 [분야]의 전문가로서 10년 이상의 경험을 가지고 있습니다. 사용자의 질문에 전문적이고 정확한 정보를 제공하되, 복잡한 내용도 이해하기 쉽게 설명해 주세요.",
				createdAt: "2023-08-20T14:15:00Z",
				isActive: true,
			},
		],
		currentVersion: 2,
		tags: ["전문가", "상담", "교육"],
		category: "직업",
		createdAt: "2023-07-15T09:30:00Z",
		updatedAt: "2023-08-20T14:15:00Z",
	},
	{
		id: 2,
		name: "상담사 페르소나",
		description: "상담사처럼 공감하며 대화하는 프롬프트",
		versions: [
			{
				id: 1,
				content:
					"당신은 경험이 풍부한 심리 상담사입니다. 사용자의 감정을 공감하고 이해하며, 판단하지 않고 도움이 될 수 있는 대화를 제공해 주세요.",
				createdAt: "2023-07-20T11:45:00Z",
				isActive: true,
			},
		],
		currentVersion: 1,
		tags: ["상담", "심리", "공감"],
		category: "심리",
		createdAt: "2023-07-20T11:45:00Z",
		updatedAt: "2023-07-20T11:45:00Z",
	},
	{
		id: 3,
		name: "역사적 인물 페르소나",
		description: "역사적 인물의 말투와 지식으로 답변하는 프롬프트",
		versions: [
			{
				id: 1,
				content:
					"당신은 [역사적 인물]입니다. 해당 인물의 시대 배경, 지식, 가치관, 말투를 반영하여 답변해 주세요.",
				createdAt: "2023-08-05T17:20:00Z",
				isActive: false,
			},
			{
				id: 2,
				content:
					"당신은 [역사적 인물]입니다. 해당 인물의 시대 배경, 지식, 가치관, 말투를 반영하여 답변해 주세요. 또한 그 인물이 현대의 질문에 대해 어떻게 생각했을지 역사적 맥락을 고려하여 답변해 주세요.",
				createdAt: "2023-09-10T13:10:00Z",
				isActive: true,
			},
		],
		currentVersion: 2,
		tags: ["역사", "인물", "롤플레이"],
		category: "역사",
		createdAt: "2023-08-05T17:20:00Z",
		updatedAt: "2023-09-10T13:10:00Z",
	},
];

// 카테고리 목록
const categories = ["직업", "심리", "역사", "가상", "기타"];

export default function PersonaPromptsPage() {
	const [prompts, setPrompts] = useState<Prompt[]>(samplePrompts);
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>(prompts);

	// 대화상자 상태
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
	const [isAddVersionDialogOpen, setIsAddVersionDialogOpen] = useState(false);

	// 현재 선택된 프롬프트와 버전
	const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		content: "",
		tags: "",
		category: "",
	});

	// 검색 기능
	const handleSearch = (term: string) => {
		setSearchTerm(term);
		if (!term.trim()) {
			setFilteredPrompts(prompts);
			return;
		}

		const lowerTerm = term.toLowerCase();
		const filtered = prompts.filter(
			(prompt) =>
				prompt.name.toLowerCase().includes(lowerTerm) ||
				prompt.description.toLowerCase().includes(lowerTerm) ||
				prompt.versions.some((v) =>
					v.content.toLowerCase().includes(lowerTerm)
				) ||
				prompt.tags.some((tag) => tag.toLowerCase().includes(lowerTerm)) ||
				(prompt.category && prompt.category.toLowerCase().includes(lowerTerm))
		);

		setFilteredPrompts(filtered);
	};

	// 생성 대화상자 열기
	const handleOpenCreate = () => {
		setFormData({
			name: "",
			description: "",
			content: "",
			tags: "",
			category: categories[0],
		});
		setIsCreateDialogOpen(true);
	};

	// 수정 대화상자 열기
	const handleOpenEdit = (prompt: Prompt) => {
		setCurrentPrompt(prompt);
		const activeVersion =
			prompt.versions.find((v) => v.isActive)?.content || "";

		setFormData({
			name: prompt.name,
			description: prompt.description,
			content: activeVersion,
			tags: prompt.tags.join(", "),
			category: prompt.category || categories[0],
		});

		setIsEditDialogOpen(true);
	};

	// 삭제 대화상자 열기
	const handleOpenDelete = (prompt: Prompt) => {
		setCurrentPrompt(prompt);
		setIsDeleteDialogOpen(true);
	};

	// 버전 관리 대화상자 열기
	const handleOpenVersions = (prompt: Prompt) => {
		setCurrentPrompt(prompt);
		setIsVersionDialogOpen(true);
	};

	// 새 버전 추가 대화상자 열기
	const handleOpenAddVersion = (prompt: Prompt) => {
		setCurrentPrompt(prompt);
		const activeVersion =
			prompt.versions.find((v) => v.isActive)?.content || "";

		setFormData({
			...formData,
			content: activeVersion,
		});

		setIsAddVersionDialogOpen(true);
	};

	// 새 프롬프트 생성
	const handleCreate = () => {
		const tags = formData.tags
			.split(",")
			.map((tag) => tag.trim())
			.filter((tag) => tag !== "");

		const newPrompt: Prompt = {
			id: Math.max(...prompts.map((p) => p.id), 0) + 1,
			name: formData.name,
			description: formData.description,
			versions: [
				{
					id: 1,
					content: formData.content,
					createdAt: new Date().toISOString(),
					isActive: true,
				},
			],
			currentVersion: 1,
			tags,
			category: formData.category,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		setPrompts([...prompts, newPrompt]);
		setIsCreateDialogOpen(false);
	};

	// 프롬프트 수정
	const handleEdit = () => {
		if (!currentPrompt) return;

		const tags = formData.tags
			.split(",")
			.map((tag) => tag.trim())
			.filter((tag) => tag !== "");

		// 현재 버전의 내용 업데이트
		const updatedVersions = currentPrompt.versions.map((v) => {
			if (v.isActive) {
				return { ...v, content: formData.content };
			}
			return v;
		});

		const updatedPrompts = prompts.map((p) => {
			if (p.id === currentPrompt.id) {
				return {
					...p,
					name: formData.name,
					description: formData.description,
					versions: updatedVersions,
					tags,
					category: formData.category,
					updatedAt: new Date().toISOString(),
				};
			}
			return p;
		});

		setPrompts(updatedPrompts);
		setIsEditDialogOpen(false);
	};

	// 프롬프트 삭제
	const handleDelete = () => {
		if (!currentPrompt) return;

		const updatedPrompts = prompts.filter((p) => p.id !== currentPrompt.id);
		setPrompts(updatedPrompts);
		setIsDeleteDialogOpen(false);
	};

	// 새 버전 추가
	const handleAddVersion = () => {
		if (!currentPrompt) return;

		const newVersionId =
			Math.max(...currentPrompt.versions.map((v) => v.id), 0) + 1;

		// 기존 버전 비활성화, 새 버전 활성화
		const updatedVersions = currentPrompt.versions.map((v) => ({
			...v,
			isActive: false,
		}));

		updatedVersions.push({
			id: newVersionId,
			content: formData.content,
			createdAt: new Date().toISOString(),
			isActive: true,
		});

		const updatedPrompts = prompts.map((p) => {
			if (p.id === currentPrompt.id) {
				return {
					...p,
					versions: updatedVersions,
					currentVersion: newVersionId,
					updatedAt: new Date().toISOString(),
				};
			}
			return p;
		});

		setPrompts(updatedPrompts);
		setIsAddVersionDialogOpen(false);
	};

	// 버전 활성화
	const handleActivateVersion = (versionId: number) => {
		if (!currentPrompt) return;

		const updatedVersions = currentPrompt.versions.map((v) => ({
			...v,
			isActive: v.id === versionId,
		}));

		const updatedPrompts = prompts.map((p) => {
			if (p.id === currentPrompt.id) {
				return {
					...p,
					versions: updatedVersions,
					currentVersion: versionId,
					updatedAt: new Date().toISOString(),
				};
			}
			return p;
		});

		setPrompts(updatedPrompts);
		setIsVersionDialogOpen(false);
	};

	// 날짜 포맷 함수
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("ko-KR", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<div className="flex items-center space-x-2 w-full max-w-sm">
					<Input
						placeholder="이름, 태그, 설명으로 검색..."
						value={searchTerm}
						onChange={(e) => handleSearch(e.target.value)}
					/>
					<Button type="submit" size="icon" variant="ghost">
						<Search className="h-4 w-4" />
						<span className="sr-only">검색</span>
					</Button>
				</div>
				<Button onClick={handleOpenCreate}>
					<Plus className="mr-2 h-4 w-4" />
					프롬프트 생성
				</Button>
			</div>

			<Table>
				<TableCaption>페르소나 프롬프트 목록</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead>이름</TableHead>
						<TableHead>설명</TableHead>
						<TableHead>카테고리</TableHead>
						<TableHead>태그</TableHead>
						<TableHead>버전</TableHead>
						<TableHead>최종 업데이트</TableHead>
						<TableHead className="text-right">관리</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredPrompts.length === 0 ? (
						<TableRow>
							<TableCell colSpan={7} className="text-center py-4 text-gray-500">
								프롬프트가 없습니다
							</TableCell>
						</TableRow>
					) : (
						filteredPrompts.map((prompt) => (
							<TableRow key={prompt.id}>
								<TableCell className="font-medium">{prompt.name}</TableCell>
								<TableCell>{prompt.description}</TableCell>
								<TableCell>
									<Badge variant="secondary">{prompt.category || "기타"}</Badge>
								</TableCell>
								<TableCell>
									<div className="flex flex-wrap gap-1">
										{prompt.tags.map((tag) => (
											<Badge key={tag} variant="outline">
												{tag}
											</Badge>
										))}
									</div>
								</TableCell>
								<TableCell>
									<Badge variant="secondary">V{prompt.currentVersion}</Badge>
								</TableCell>
								<TableCell>{formatDate(prompt.updatedAt)}</TableCell>
								<TableCell className="text-right">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon">
												<MoreHorizontal className="h-4 w-4" />
												<span className="sr-only">관리 메뉴</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuLabel>작업</DropdownMenuLabel>
											<DropdownMenuSeparator />
											<DropdownMenuItem onClick={() => handleOpenEdit(prompt)}>
												<Edit className="mr-2 h-4 w-4" />
												수정
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => handleOpenVersions(prompt)}
											>
												<History className="mr-2 h-4 w-4" />
												버전 관리
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => handleOpenAddVersion(prompt)}
											>
												<Plus className="mr-2 h-4 w-4" />새 버전 추가
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => handleOpenDelete(prompt)}
												className="text-red-600"
											>
												<Trash2 className="mr-2 h-4 w-4" />
												삭제
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>

			{/* 생성 대화상자 */}
			<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>새 페르소나 프롬프트 생성</DialogTitle>
						<DialogDescription>
							AI의 페르소나 설정을 위한 새 프롬프트를 작성하세요.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="name" className="text-right">
								이름
							</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								className="col-span-3"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="description" className="text-right">
								설명
							</Label>
							<Input
								id="description"
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								className="col-span-3"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="category" className="text-right">
								카테고리
							</Label>
							<select
								id="category"
								value={formData.category}
								onChange={(e) =>
									setFormData({ ...formData, category: e.target.value })
								}
								className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{categories.map((category) => (
									<option key={category} value={category}>
										{category}
									</option>
								))}
							</select>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="tags" className="text-right">
								태그
							</Label>
							<Input
								id="tags"
								value={formData.tags}
								onChange={(e) =>
									setFormData({ ...formData, tags: e.target.value })
								}
								className="col-span-3"
								placeholder="쉼표로 구분 (예: 전문가, 상담, 역사)"
							/>
						</div>
						<div className="grid grid-cols-4 items-start gap-4">
							<Label htmlFor="content" className="text-right pt-2">
								프롬프트 내용
							</Label>
							<Textarea
								id="content"
								value={formData.content}
								onChange={(e) =>
									setFormData({ ...formData, content: e.target.value })
								}
								className="col-span-3"
								rows={5}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsCreateDialogOpen(false)}
						>
							취소
						</Button>
						<Button onClick={handleCreate}>생성</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 수정 대화상자 */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>프롬프트 수정</DialogTitle>
						<DialogDescription>프롬프트 정보를 수정하세요.</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="name" className="text-right">
								이름
							</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								className="col-span-3"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="description" className="text-right">
								설명
							</Label>
							<Input
								id="description"
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								className="col-span-3"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="editCategory" className="text-right">
								카테고리
							</Label>
							<select
								id="editCategory"
								value={formData.category}
								onChange={(e) =>
									setFormData({ ...formData, category: e.target.value })
								}
								className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{categories.map((category) => (
									<option key={category} value={category}>
										{category}
									</option>
								))}
							</select>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="tags" className="text-right">
								태그
							</Label>
							<Input
								id="tags"
								value={formData.tags}
								onChange={(e) =>
									setFormData({ ...formData, tags: e.target.value })
								}
								className="col-span-3"
								placeholder="쉼표로 구분 (예: 전문가, 상담, 역사)"
							/>
						</div>
						<div className="grid grid-cols-4 items-start gap-4">
							<Label htmlFor="content" className="text-right pt-2">
								프롬프트 내용
							</Label>
							<Textarea
								id="content"
								value={formData.content}
								onChange={(e) =>
									setFormData({ ...formData, content: e.target.value })
								}
								className="col-span-3"
								rows={5}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsEditDialogOpen(false)}
						>
							취소
						</Button>
						<Button onClick={handleEdit}>저장</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 삭제 확인 대화상자 */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>프롬프트 삭제</DialogTitle>
						<DialogDescription>
							'{currentPrompt?.name}' 프롬프트를 삭제하시겠습니까? 이 작업은
							되돌릴 수 없습니다.
						</DialogDescription>
					</DialogHeader>
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

			{/* 버전 관리 대화상자 */}
			<Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>버전 관리: {currentPrompt?.name}</DialogTitle>
						<DialogDescription>
							각 버전을 확인하고 관리합니다.
						</DialogDescription>
					</DialogHeader>
					<div className="max-h-[400px] overflow-y-auto">
						{currentPrompt?.versions.map((version, index) => (
							<div
								key={version.id}
								className={`p-3 my-2 rounded-md border ${
									version.isActive
										? "border-primary bg-primary/5"
										: "border-gray-200"
								}`}
							>
								<div className="flex justify-between items-center mb-2">
									<div className="flex items-center gap-2">
										<span className="font-medium">버전 {version.id}</span>
										{version.isActive && (
											<Badge variant="default">현재 활성</Badge>
										)}
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs text-gray-500 flex items-center">
											<Clock className="h-3 w-3 mr-1" />
											{formatDate(version.createdAt)}
										</span>
										{!version.isActive && (
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleActivateVersion(version.id)}
											>
												활성화
											</Button>
										)}
									</div>
								</div>
								<div className="bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap">
									{version.content}
								</div>
							</div>
						))}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsVersionDialogOpen(false)}
						>
							닫기
						</Button>
						<Button
							onClick={() => {
								setIsVersionDialogOpen(false);
								handleOpenAddVersion(currentPrompt!);
							}}
						>
							새 버전 추가
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 새 버전 추가 대화상자 */}
			<Dialog
				open={isAddVersionDialogOpen}
				onOpenChange={setIsAddVersionDialogOpen}
			>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>새 버전 추가: {currentPrompt?.name}</DialogTitle>
						<DialogDescription>
							현재 버전을 기반으로 새 버전을 생성합니다.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-start gap-4">
							<Label htmlFor="newVersionContent" className="text-right pt-2">
								프롬프트 내용
							</Label>
							<Textarea
								id="newVersionContent"
								value={formData.content}
								onChange={(e) =>
									setFormData({ ...formData, content: e.target.value })
								}
								className="col-span-3"
								rows={8}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsAddVersionDialogOpen(false)}
						>
							취소
						</Button>
						<Button onClick={handleAddVersion}>저장</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
