"use client";

import { useEffect, useState, KeyboardEvent } from "react";
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
import { Search, Edit, Trash2, MoreHorizontal } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogClose,
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaginationControls } from "@/components/pagination-controls";

// 페르소나 타입 정의
interface Persona {
	id: number;
	name: string;
	ageGroup: string;
	gender: string;
	personality: string;
	statusMessage: string;
	tags: string[];
	imagePrompt?: string;
	personalityPrompt?: string;
	createdAt: string;
}

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

// 저장된 이미지 타입 정의
interface SavedImage {
	id: number;
	url: string;
	prompt: string;
	model: string;
	createdAt: string;
	tags: string[];
}

// 임시 데이터
const initialPersonas: Persona[] = [
	{
		id: 1,
		name: "김철수",
		ageGroup: "20대 초반",
		gender: "남성",
		personality: "활발함, 사교적",
		statusMessage: "오늘도 열심히 살아보자!",
		tags: ["대학생", "취준생", "운동", "게임"],
		personalityPrompt:
			"당신은 [분야]의 전문가로서 10년 이상의 경험을 가지고 있습니다. 사용자의 질문에 전문적이고 정확한 정보를 제공하되, 복잡한 내용도 이해하기 쉽게 설명해 주세요.",
		createdAt: "2023-08-15T10:30:00Z",
	},
	{
		id: 2,
		name: "이영희",
		ageGroup: "30대 후반",
		gender: "여성",
		personality: "차분함, 논리적",
		statusMessage: "행복은 일상 속에 있어요",
		tags: ["직장인", "여행", "요리", "독서"],
		personalityPrompt:
			"당신은 경험이 풍부한 심리 상담사입니다. 사용자의 감정을 공감하고 이해하며, 판단하지 않고 도움이 될 수 있는 대화를 제공해 주세요.",
		createdAt: "2023-09-05T14:20:00Z",
	},
	{
		id: 3,
		name: "박민준",
		ageGroup: "40대 중반",
		gender: "남성",
		personality: "신중함, 책임감",
		statusMessage: "가족과 함께하는 시간이 행복",
		tags: ["가장", "경영", "골프", "와인"],
		personalityPrompt:
			"당신은 [분야]의 전문가로서 10년 이상의 경험을 가지고 있습니다. 사용자의 질문에 전문적이고 정확한 정보를 제공하되, 복잡한 내용도 이해하기 쉽게 설명해 주세요.",
		createdAt: "2023-07-20T09:15:00Z",
	},
];

// 샘플 이미지 데이터 추가
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

// 샘플 성격 프롬프트 데이터
const samplePersonalityPrompts: Prompt[] = [
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
];

// 날짜 포맷팅 함수 추가
const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
		2,
		"0"
	)}-${String(date.getDate()).padStart(2, "0")}`;
};

// 페이지당 표시할 항목 수
const ITEMS_PER_PAGE = 5;

export default function PersonaPage() {
	const [personas, setPersonas] = useState<Persona[]>(initialPersonas);
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>(personas);
	const [currentPage, setCurrentPage] = useState(1);
	const [paginatedPersonas, setPaginatedPersonas] = useState<Persona[]>([]);

	// 수정 또는 생성을 위한 상태
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
	const [formData, setFormData] = useState<Omit<Persona, "id">>({
		name: "",
		ageGroup: "",
		gender: "",
		personality: "",
		statusMessage: "",
		tags: [],
		imagePrompt: "",
		personalityPrompt: "",
		createdAt: new Date().toISOString(),
	});

	// 멀티스텝 다이얼로그를 위한 상태
	const [currentStep, setCurrentStep] = useState(1);
	const totalSteps = 3;

	// 태그 입력을 위한 상태 추가
	const [tagInput, setTagInput] = useState("");

	// 프롬프트 관련 상태 추가 (불필요해진 상태들 제거)
	const [personalityPrompts, setPersonalityPrompts] = useState<Prompt[]>(
		samplePersonalityPrompts
	);
	const [filteredPersonalityPrompts, setFilteredPersonalityPrompts] = useState<
		Prompt[]
	>(samplePersonalityPrompts);
	const [personalityPromptSearch, setPersonalityPromptSearch] = useState("");
	const [selectedPersonalityPrompt, setSelectedPersonalityPrompt] =
		useState<Prompt | null>(null);
	const [useCustomPersonalityPrompt, setUseCustomPersonalityPrompt] =
		useState(false);

	// 이미지 관련 상태 추가
	const [savedImages, setSavedImages] = useState<SavedImage[]>(sampleImages);
	const [filteredImages, setFilteredImages] =
		useState<SavedImage[]>(sampleImages);
	const [imageSearch, setImageSearch] = useState("");
	const [selectedImage, setSelectedImage] = useState<SavedImage | null>(null);

	// 검색 및 페이지네이션 기능
	useEffect(() => {
		if (searchTerm.trim() === "") {
			setFilteredPersonas(personas);
		} else {
			const lowercasedSearch = searchTerm.toLowerCase();
			const filtered = personas.filter((persona) => {
				return (
					persona.name.toLowerCase().includes(lowercasedSearch) ||
					persona.ageGroup.toLowerCase().includes(lowercasedSearch) ||
					persona.gender.toLowerCase().includes(lowercasedSearch) ||
					persona.personality.toLowerCase().includes(lowercasedSearch) ||
					persona.statusMessage.toLowerCase().includes(lowercasedSearch) ||
					persona.tags.some((tag) =>
						tag.toLowerCase().includes(lowercasedSearch)
					)
				);
			});
			setFilteredPersonas(filtered);
		}
		// 페이지 초기화
		setCurrentPage(1);
	}, [searchTerm, personas]);

	// 페이지네이션 처리
	useEffect(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		const endIndex = startIndex + ITEMS_PER_PAGE;
		setPaginatedPersonas(filteredPersonas.slice(startIndex, endIndex));
	}, [filteredPersonas, currentPage]);

	// 페이지 변경 핸들러
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	// 총 페이지 수 계산
	const totalPages = Math.ceil(filteredPersonas.length / ITEMS_PER_PAGE);

	// 페르소나 생성 대화상자 열기
	const handleOpenCreate = () => {
		setCurrentPersona(null);
		setFormData({
			name: "",
			ageGroup: "",
			gender: "",
			personality: "",
			statusMessage: "",
			tags: [],
			imagePrompt: "",
			personalityPrompt: "",
			createdAt: new Date().toISOString(),
		});
		setTagInput("");
		setCurrentStep(1);
		setSelectedImage(null);
		setUseCustomPersonalityPrompt(false);
		setIsEditDialogOpen(true);
	};

	// 페르소나 수정 대화상자 열기
	const handleOpenEdit = (persona: Persona) => {
		setCurrentPersona(persona);
		setFormData({
			name: persona.name,
			ageGroup: persona.ageGroup,
			gender: persona.gender,
			personality: persona.personality,
			statusMessage: persona.statusMessage,
			tags: persona.tags,
			imagePrompt: persona.imagePrompt || "",
			personalityPrompt: persona.personalityPrompt || "",
			createdAt: persona.createdAt,
		});
		setTagInput("");
		setCurrentStep(1);
		setSelectedImage(null);
		setUseCustomPersonalityPrompt(false);
		setIsEditDialogOpen(true);
	};

	// 페르소나 삭제 대화상자 열기
	const handleOpenDelete = (persona: Persona) => {
		setCurrentPersona(persona);
		setIsDeleteDialogOpen(true);
	};

	// 다음 단계로 이동
	const handleNextStep = () => {
		// 첫 번째 단계에서는 필수 입력 필드 검증
		if (currentStep === 1) {
			if (!formData.name || !formData.ageGroup || !formData.gender) {
				alert("이름, 나이대, 성별은 필수 입력 항목입니다.");
				return;
			}
		}

		if (currentStep < totalSteps) {
			setCurrentStep(currentStep + 1);
		} else {
			handleSave();
		}
	};

	// 이전 단계로 이동
	const handlePrevStep = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	// 페르소나 저장 (생성 또는 수정)
	const handleSave = () => {
		if (currentPersona === null) {
			// 생성
			const newPersona: Persona = {
				id: Math.max(...personas.map((p) => p.id), 0) + 1,
				...formData,
				createdAt: new Date().toISOString(),
			};
			setPersonas([...personas, newPersona]);
		} else {
			// 수정
			const updatedPersonas = personas.map((p) =>
				p.id === currentPersona.id ? { ...p, ...formData } : p
			);
			setPersonas(updatedPersonas);
		}

		setIsEditDialogOpen(false);
		setCurrentStep(1);
	};

	// 페르소나 삭제
	const handleDelete = () => {
		if (currentPersona) {
			const updatedPersonas = personas.filter(
				(p) => p.id !== currentPersona.id
			);
			setPersonas(updatedPersonas);
			setIsDeleteDialogOpen(false);
		}
	};

	// 태그 변경 처리 - 새로운 함수로 수정
	const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTagInput(e.target.value);
	};

	// 태그 추가 버튼 처리
	const handleAddTag = () => {
		// 빈 문자열이면 무시
		if (tagInput.trim() === "") return;

		// 현재 태그 가져오기
		const newTag = tagInput.trim();

		// 중복 확인 후 추가
		if (!formData.tags.includes(newTag)) {
			setFormData((prev) => ({
				...prev,
				tags: [...prev.tags, newTag],
			}));
		}

		// 태그 입력창 비우기
		setTagInput("");
	};

	// 태그 삭제
	const removeTag = (tagToRemove: string) => {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags.filter((tag) => tag !== tagToRemove),
		}));
	};

	// 이미지 선택 핸들러
	const handleSelectImage = (image: SavedImage) => {
		setSelectedImage(image);
		setFormData({
			...formData,
			imagePrompt: image.prompt,
		});
	};

	// Step 3 부분의 UI 수정
	const renderStep3 = () => {
		return (
			<div className="grid gap-6 py-4">
				<div className="grid gap-2">
					<div className="flex items-center justify-between">
						<Label className="text-base font-semibold">이미지</Label>
					</div>

					<div className="space-y-4">
						<div className="flex gap-2">
							<Input
								placeholder="이미지 검색..."
								value={imageSearch}
								onChange={(e) => setImageSearch(e.target.value)}
								className="flex-1"
							/>
							<Button variant="outline" size="icon">
								<Search className="h-4 w-4" />
							</Button>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-2 border rounded-md">
							{filteredImages.length === 0 ? (
								<div className="col-span-2 text-center py-4 text-muted-foreground">
									검색 결과가 없습니다
								</div>
							) : (
								filteredImages.map((image) => (
									<div
										key={image.id}
										className={`border rounded-md p-2 cursor-pointer transition-all ${
											selectedImage?.id === image.id
												? "ring-2 ring-primary border-primary"
												: "hover:bg-accent"
										}`}
										onClick={() => handleSelectImage(image)}
									>
										<div className="flex gap-3">
											<div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden">
												<img
													src={image.url}
													alt="이미지"
													className="w-full h-full object-cover"
												/>
											</div>
											<div className="flex-1 overflow-hidden">
												<div className="text-sm font-medium truncate">
													{image.prompt.length > 50
														? `${image.prompt.substring(0, 50)}...`
														: image.prompt}
												</div>
												<div className="flex flex-wrap gap-1 mt-2">
													{image.tags.map((tag) => (
														<Badge
															key={tag}
															variant="outline"
															className="text-xs"
														>
															{tag}
														</Badge>
													))}
												</div>
											</div>
										</div>
									</div>
								))
							)}
						</div>

						{selectedImage && (
							<div className="border rounded-md p-3 bg-muted/30">
								<div className="flex gap-4">
									<div className="w-24 h-24 flex-shrink-0 rounded overflow-hidden">
										<img
											src={selectedImage.url}
											alt="선택된 이미지"
											className="w-full h-full object-cover"
										/>
									</div>
									<div className="flex-1">
										<div className="text-sm mb-1 font-medium">
											선택된 이미지
										</div>
										<div className="text-xs text-muted-foreground mb-2">
											{selectedImage.prompt}
										</div>
										<div className="flex flex-wrap gap-1">
											{selectedImage.tags.map((tag) => (
												<Badge key={tag} variant="outline" className="text-xs">
													{tag}
												</Badge>
											))}
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="grid gap-2">
					<div className="flex items-center justify-between">
						<Label className="text-base font-semibold">페르소나 프롬프트</Label>
						<div className="flex items-center gap-2">
							<Checkbox
								id="useCustomPersonalityPrompt"
								checked={useCustomPersonalityPrompt}
								onCheckedChange={(checked) =>
									setUseCustomPersonalityPrompt(!!checked)
								}
							/>
							<Label htmlFor="useCustomPersonalityPrompt" className="text-sm">
								직접 입력
							</Label>
						</div>
					</div>

					{useCustomPersonalityPrompt ? (
						<Textarea
							id="personalityPrompt"
							value={formData.personalityPrompt}
							onChange={(e) =>
								setFormData({
									...formData,
									personalityPrompt: e.target.value,
								})
							}
							placeholder="페르소나의 성격, 가치관, 행동 패턴 등 심리적 특성을 자세히 설명하세요"
							rows={4}
						/>
					) : (
						<div className="space-y-4">
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										role="combobox"
										className="w-full justify-between"
									>
										{selectedPersonalityPrompt
											? selectedPersonalityPrompt.name
											: `페르소나 프롬프트 선택... (${filteredPersonalityPrompts.length})`}
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-[400px] p-0">
									<Command>
										<CommandInput
											placeholder="프롬프트 검색..."
											value={personalityPromptSearch}
											onValueChange={setPersonalityPromptSearch}
										/>
										{filteredPersonalityPrompts.length === 0 ? (
											<CommandEmpty>검색 결과가 없습니다</CommandEmpty>
										) : (
											<CommandGroup>
												<CommandList className="max-h-[300px] overflow-y-auto">
													{filteredPersonalityPrompts.map((prompt) => (
														<CommandItem
															key={prompt.id}
															value={prompt.name}
															onSelect={handleSelectPersonalityPrompt}
														>
															<Check
																className={cn(
																	"mr-2 h-4 w-4",
																	selectedPersonalityPrompt?.id === prompt.id
																		? "opacity-100"
																		: "opacity-0"
																)}
															/>
															<div className="flex flex-col">
																<span>{prompt.name}</span>
																<span className="text-xs text-muted-foreground">
																	{prompt.description}
																</span>
															</div>
														</CommandItem>
													))}
												</CommandList>
											</CommandGroup>
										)}
									</Command>
								</PopoverContent>
							</Popover>

							{selectedPersonalityPrompt && (
								<div className="border rounded-md p-3 bg-muted/30">
									<div className="text-sm mb-1 font-medium">
										{selectedPersonalityPrompt.name}
									</div>
									<div className="text-xs text-muted-foreground mb-2">
										{
											selectedPersonalityPrompt.versions.find((v) => v.isActive)
												?.content
										}
									</div>
									<div className="flex flex-wrap gap-1">
										{selectedPersonalityPrompt.tags.map((tag) => (
											<Badge key={tag} variant="outline" className="text-xs">
												{tag}
											</Badge>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		);
	};

	// 성격 프롬프트 선택 처리
	const handleSelectPersonalityPrompt = (promptName: string) => {
		const prompt = personalityPrompts.find((p) => p.name === promptName);
		if (!prompt) return;

		setSelectedPersonalityPrompt(prompt);
		// 선택한 프롬프트의 활성 버전 찾기
		const activeVersion = prompt.versions.find((v) => v.isActive);
		if (activeVersion) {
			setFormData({
				...formData,
				personalityPrompt: activeVersion.content,
			});
		}
	};

	// 대화상자 닫을 때 상태 초기화
	const handleCloseDialog = () => {
		setIsEditDialogOpen(false);
		setCurrentStep(1);
		setSelectedPersonalityPrompt(null);
		setUseCustomPersonalityPrompt(false);
		setPersonalityPromptSearch("");
		setSelectedImage(null);
		setImageSearch("");
	};

	// 이미지 검색 효과
	useEffect(() => {
		if (!imageSearch) {
			setFilteredImages(savedImages);
		} else {
			const lowercasedSearch = imageSearch.toLowerCase();
			const filtered = savedImages.filter((image) => {
				const promptMatch = image.prompt
					.toLowerCase()
					.includes(lowercasedSearch);
				const tagMatch = image.tags.some((tag) =>
					tag.toLowerCase().includes(lowercasedSearch)
				);
				return promptMatch || tagMatch;
			});
			setFilteredImages(filtered);
		}
	}, [imageSearch, savedImages]);

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">페르소나 관리</h1>
				<Button onClick={handleOpenCreate}>페르소나 생성</Button>
			</div>

			{/* 검색 바 */}
			<div className="flex w-full max-w-sm items-center space-x-2">
				<Input
					type="text"
					placeholder="이름, 태그, 특성 등 검색..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
				<Button type="submit" size="icon">
					<Search className="h-4 w-4" />
					<span className="sr-only">검색</span>
				</Button>
			</div>

			{/* 페르소나 테이블 */}
			<Table>
				<TableCaption>
					페르소나 목록 ({filteredPersonas.length}개 중{" "}
					{paginatedPersonas.length}개 표시)
				</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead>이름</TableHead>
						<TableHead>나이대</TableHead>
						<TableHead>성별</TableHead>
						<TableHead>성격</TableHead>
						<TableHead>상태메시지</TableHead>
						<TableHead>태그</TableHead>
						<TableHead>이미지</TableHead>
						<TableHead>페르소나 프롬프트</TableHead>
						<TableHead>생성일</TableHead>
						<TableHead className="text-right">관리</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{paginatedPersonas.map((persona) => (
						<TableRow key={persona.id}>
							<TableCell className="font-medium">{persona.name}</TableCell>
							<TableCell>{persona.ageGroup}</TableCell>
							<TableCell>{persona.gender}</TableCell>
							<TableCell>{persona.personality}</TableCell>
							<TableCell>{persona.statusMessage}</TableCell>
							<TableCell>
								<div className="flex flex-wrap gap-1">
									{persona.tags.map((tag) => (
										<Badge key={tag} variant="outline">
											{tag}
										</Badge>
									))}
								</div>
							</TableCell>
							<TableCell>
								{persona.imagePrompt ? (
									<div className="flex justify-center">
										{(() => {
											// 이미지 프롬프트 찾기
											const matchingImage = sampleImages.find(
												(image) => image.prompt === persona.imagePrompt
											);
											return matchingImage ? (
												<div className="w-12 h-12 rounded overflow-hidden">
													<img
														src={matchingImage.url}
														alt="페르소나 이미지"
														className="w-full h-full object-cover"
													/>
												</div>
											) : (
												<span className="text-muted-foreground text-xs">
													미리보기 없음
												</span>
											);
										})()}
									</div>
								) : (
									<span className="text-muted-foreground text-xs">없음</span>
								)}
							</TableCell>
							<TableCell>
								{persona.personalityPrompt ? (
									<div className="space-y-1">
										<Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
											{(() => {
												// 페르소나 프롬프트 찾기
												const matchingPrompt = samplePersonalityPrompts.find(
													(prompt) =>
														prompt.versions.some(
															(version) =>
																version.content === persona.personalityPrompt
														)
												);
												return matchingPrompt
													? `${matchingPrompt.name} (v${matchingPrompt.currentVersion})`
													: "사용자 정의";
											})()}
										</Badge>
									</div>
								) : (
									<span className="text-muted-foreground text-xs">없음</span>
								)}
							</TableCell>
							<TableCell>{formatDate(persona.createdAt)}</TableCell>
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
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={() => handleOpenEdit(persona)}>
											<Edit className="mr-2 h-4 w-4" />
											수정
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => handleOpenDelete(persona)}>
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

			{/* 편집/생성 멀티스텝 대화상자 */}
			<Dialog open={isEditDialogOpen} onOpenChange={handleCloseDialog}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{currentPersona ? "페르소나 수정" : "새 페르소나 생성"} (단계{" "}
							{currentStep}/{totalSteps})
						</DialogTitle>
						<DialogDescription>
							{currentStep === 1
								? "기본 정보를 입력하세요. 이름, 나이대, 성별은 필수 입력 항목입니다."
								: currentStep === 2
								? "추가 정보를 입력하세요. 성격, 상태메시지, 태그 등을 입력합니다."
								: "프롬프트 정보를 입력하세요. 프롬프트 목록에서 선택하거나 직접 입력할 수 있습니다."}
						</DialogDescription>
					</DialogHeader>

					{/* 1단계: 기본 정보 (이름, 나이대, 성별) */}
					{currentStep === 1 && (
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="name" className="text-right">
									이름 *
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
								<Label htmlFor="ageGroup" className="text-right">
									나이대 *
								</Label>
								<Select
									value={formData.ageGroup}
									onValueChange={(value) =>
										setFormData({ ...formData, ageGroup: value })
									}
								>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="나이대 선택" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="10대 초반">10대 초반</SelectItem>
										<SelectItem value="10대 중반">10대 중반</SelectItem>
										<SelectItem value="10대 후반">10대 후반</SelectItem>
										<SelectItem value="20대 초반">20대 초반</SelectItem>
										<SelectItem value="20대 중반">20대 중반</SelectItem>
										<SelectItem value="20대 후반">20대 후반</SelectItem>
										<SelectItem value="30대 초반">30대 초반</SelectItem>
										<SelectItem value="30대 중반">30대 중반</SelectItem>
										<SelectItem value="30대 후반">30대 후반</SelectItem>
										<SelectItem value="40대 초반">40대 초반</SelectItem>
										<SelectItem value="40대 중반">40대 중반</SelectItem>
										<SelectItem value="40대 후반">40대 후반</SelectItem>
										<SelectItem value="50대 이상">50대 이상</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="gender" className="text-right">
									성별 *
								</Label>
								<Select
									value={formData.gender}
									onValueChange={(value) =>
										setFormData({ ...formData, gender: value })
									}
								>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="성별 선택" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="남성">남성</SelectItem>
										<SelectItem value="여성">여성</SelectItem>
										<SelectItem value="기타">기타</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					)}

					{/* 2단계: 상세 정보 (성격, 상태메시지, 태그) */}
					{currentStep === 2 && (
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="personality" className="text-right">
									성격
								</Label>
								<Input
									id="personality"
									value={formData.personality}
									onChange={(e) =>
										setFormData({ ...formData, personality: e.target.value })
									}
									className="col-span-3"
									placeholder="예: 내향적, 활발함, 사려깊음"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="statusMessage" className="text-right">
									상태메시지
								</Label>
								<Input
									id="statusMessage"
									value={formData.statusMessage}
									onChange={(e) =>
										setFormData({ ...formData, statusMessage: e.target.value })
									}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-start gap-4">
								<Label htmlFor="tags" className="text-right pt-2">
									태그
								</Label>
								<div className="col-span-3">
									<div className="flex flex-wrap gap-2 mb-2">
										{formData.tags.map((tag) => (
											<Badge
												key={tag}
												variant="outline"
												className="flex items-center gap-1"
											>
												{tag}
												<button
													type="button"
													onClick={() => removeTag(tag)}
													className="ml-1 h-4 w-4 rounded-full text-xs flex items-center justify-center hover:bg-muted"
												>
													×
												</button>
											</Badge>
										))}
									</div>
									<div className="flex gap-2">
										<Input
											id="tagInput"
											value={tagInput}
											onChange={handleTagInputChange}
											placeholder="태그를 입력하세요"
											className="flex-grow"
										/>
										<Button type="button" onClick={handleAddTag} size="sm">
											추가
										</Button>
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										태그를 입력하고 '추가' 버튼을 클릭하세요.
									</p>
								</div>
							</div>
						</div>
					)}

					{/* 3단계: 프롬프트 정보 (이미지 프롬프트, 성격 프롬프트) */}
					{currentStep === 3 && renderStep3()}

					<DialogFooter className="flex justify-between">
						{currentStep > 1 ? (
							<Button variant="outline" onClick={handlePrevStep}>
								이전
							</Button>
						) : (
							<div></div> // 빈 div로 레이아웃 유지
						)}

						<Button onClick={handleNextStep}>
							{currentStep === totalSteps ? "저장" : "다음"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 삭제 확인 대화상자 */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>페르소나 삭제</DialogTitle>
						<DialogDescription>
							'{currentPersona?.name}' 페르소나를 삭제하시겠습니까? 이 작업은
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
		</div>
	);
}
