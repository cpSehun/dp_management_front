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
import { PaginationControls } from "@/components/pagination-controls";

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
}

// 샘플 데이터
const samplePrompts: Prompt[] = [
	{
		id: 1,
		name: "비즈니스 프로페셔널",
		description: "전문적인 비즈니스 인물 이미지 생성 프롬프트",
		versions: [
			{
				id: 1,
				content:
					"30대 남성, 정장 차림, 깔끔한 헤어스타일, 사무실 배경, 전문적인 표정, 고품질 사진, 자연스러운 조명",
				createdAt: "2023-07-15T09:30:00Z",
				isActive: false,
			},
			{
				id: 2,
				content:
					"30대 남성, 정장 차림, 깔끔한 헤어스타일, 현대적인 사무실 배경, 자신감 있는 표정, 프로페셔널한 분위기, 고품질 초상화, 소프트 스튜디오 조명",
				createdAt: "2023-08-20T14:15:00Z",
				isActive: true,
			},
		],
		currentVersion: 2,
		tags: ["비즈니스", "전문가", "남성", "정장"],
		createdAt: "2023-07-15T09:30:00Z",
		updatedAt: "2023-08-20T14:15:00Z",
	},
	{
		id: 2,
		name: "크리에이티브 디자이너",
		description: "창의적인 디자이너 페르소나 이미지 생성",
		versions: [
			{
				id: 1,
				content:
					"20대 여성, 캐주얼하고 트렌디한 의상, 창의적인 작업 공간, 컬러풀한 배경, 태블릿으로 작업 중, 예술적인 분위기, 자연광",
				createdAt: "2023-07-20T11:45:00Z",
				isActive: true,
			},
		],
		currentVersion: 1,
		tags: ["디자이너", "창의적", "캐주얼", "여성"],
		createdAt: "2023-07-20T11:45:00Z",
		updatedAt: "2023-07-20T11:45:00Z",
	},
	{
		id: 3,
		name: "의료 전문가",
		description: "의사 또는 간호사 페르소나 이미지 생성",
		versions: [
			{
				id: 1,
				content:
					"40대 여성, 흰색 의사 가운, 청진기, 병원 배경, 진지한 표정, 고해상도 사진",
				createdAt: "2023-08-05T17:20:00Z",
				isActive: false,
			},
			{
				id: 2,
				content:
					"40대 여성, 흰색 의사 가운, 청진기, 현대적인 의료 시설 배경, 따뜻하고 신뢰감 있는 표정, 전문적인 분위기, 부드러운 조명으로 촬영된 초상화",
				createdAt: "2023-09-10T13:10:00Z",
				isActive: true,
			},
		],
		currentVersion: 2,
		tags: ["의사", "의료", "여성", "전문가"],
		createdAt: "2023-08-05T17:20:00Z",
		updatedAt: "2023-09-10T13:10:00Z",
	},
	{
		id: 4,
		name: "판타지 캐릭터",
		description: "판타지 세계관의 캐릭터 일러스트",
		versions: [
			{
				id: 1,
				content:
					"판타지 세계의 마법사, 화려한 로브, 마법 지팡이, 빛나는 마법 효과, 디지털 페인팅, 상세한 배경",
				createdAt: "2023-10-05T15:25:00Z",
				isActive: true,
			},
		],
		currentVersion: 1,
		tags: ["캐릭터", "판타지", "마법사", "일러스트"],
		createdAt: "2023-10-05T15:25:00Z",
		updatedAt: "2023-10-05T15:25:00Z",
	},
	{
		id: 5,
		name: "스포츠 코치",
		description: "스포츠 트레이너/코치 페르소나 이미지",
		versions: [
			{
				id: 1,
				content:
					"30대 남성, 운동복 차림, 근육질 체형, 체육관 배경, 스포츠 장비, 활기찬 표정, 동적인 포즈, 강한 조명",
				createdAt: "2023-11-12T10:40:00Z",
				isActive: true,
			},
		],
		currentVersion: 1,
		tags: ["스포츠", "코치", "트레이너", "남성"],
		createdAt: "2023-11-12T10:40:00Z",
		updatedAt: "2023-11-12T10:40:00Z",
	},
];

// 페이지당 표시할 항목 수
const ITEMS_PER_PAGE = 5;

export default function ImagePromptsPage() {
	const [prompts, setPrompts] = useState<Prompt[]>(samplePrompts);
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>(prompts);
	const [currentPage, setCurrentPage] = useState(1);
	const [paginatedPrompts, setPaginatedPrompts] = useState<Prompt[]>([]);

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
	});

	// 검색 기능
	const handleSearch = (term: string) => {
		setSearchTerm(term);
		if (!term.trim()) {
			setFilteredPrompts(prompts);
		} else {
			const lowerTerm = term.toLowerCase();
			const filtered = prompts.filter(
				(prompt) =>
					prompt.name.toLowerCase().includes(lowerTerm) ||
					prompt.description.toLowerCase().includes(lowerTerm) ||
					prompt.versions.some((v) =>
						v.content.toLowerCase().includes(lowerTerm)
					) ||
					prompt.tags.some((tag) => tag.toLowerCase().includes(lowerTerm))
			);
			setFilteredPrompts(filtered);
		}
		// 페이지 초기화
		setCurrentPage(1);
	};

	// 페이지네이션 처리
	useEffect(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		const endIndex = startIndex + ITEMS_PER_PAGE;
		setPaginatedPrompts(filteredPrompts.slice(startIndex, endIndex));
	}, [filteredPrompts, currentPage]);

	// 페이지 변경 핸들러
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	// 총 페이지 수 계산
	const totalPages = Math.ceil(filteredPrompts.length / ITEMS_PER_PAGE);

	// 생성 대화상자 열기
	const handleOpenCreate = () => {
		setFormData({
			name: "",
			description: "",
			content: "",
			tags: "",
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
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">이미지 프롬프트 관리</h1>
				<Button onClick={handleOpenCreate}>새 프롬프트 생성</Button>
			</div>

			{/* 검색 */}
			<div className="flex w-full max-w-sm items-center space-x-2">
				<Input
					type="text"
					placeholder="프롬프트 이름, 내용, 태그 검색..."
					value={searchTerm}
					onChange={(e) => handleSearch(e.target.value)}
				/>
				<Button type="submit" size="icon">
					<Search className="h-4 w-4" />
					<span className="sr-only">검색</span>
				</Button>
			</div>

			{/* 프롬프트 테이블 */}
			<Table>
				<TableCaption>
					이미지 프롬프트 목록 ({filteredPrompts.length}개 중{" "}
					{paginatedPrompts.length}개 표시)
				</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead>이름</TableHead>
						<TableHead>설명</TableHead>
						<TableHead>현재 버전</TableHead>
						<TableHead>태그</TableHead>
						<TableHead>마지막 수정일</TableHead>
						<TableHead className="text-right">관리</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{paginatedPrompts.map((prompt) => (
						<TableRow key={prompt.id}>
							<TableCell className="font-medium">{prompt.name}</TableCell>
							<TableCell>{prompt.description}</TableCell>
							<TableCell>
								<Badge variant="secondary">V{prompt.currentVersion}</Badge>
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
					))}
				</TableBody>
			</Table>

			{/* 페이지네이션 */}
			<PaginationControls
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={handlePageChange}
			/>

			{/* 생성 대화상자 */}
			<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>새 이미지 프롬프트 생성</DialogTitle>
						<DialogDescription>
							이미지 생성을 위한 새 프롬프트를 작성하세요.
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
								placeholder="쉼표로 구분 (예: 풍경, 자연, 산)"
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
								placeholder="쉼표로 구분 (예: 풍경, 자연, 산)"
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
