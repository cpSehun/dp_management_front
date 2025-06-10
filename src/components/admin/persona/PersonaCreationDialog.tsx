import React, { useState, createContext, useContext } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, BookOpen, Wand2, Check, ArrowRight } from "lucide-react";

// Context 타입 정의
interface PersonaCreationData {
	step1: {
		personaType: "character" | "story";
		model: string;
		concept: string;
	};
	step2: {
		personaInfo: string;
		regenerationNotes: string;
	};
	step3: {
		summary: string;
		tags: string[];
	};
	step4: {
		imageDescription: string;
		imagePrompt: string;
		generatedImages: string[];
		selectedImage: string;
	};
}

interface PersonaCreationContextType {
	data: PersonaCreationData;
	updateData: (step: keyof PersonaCreationData, newData: any) => void;
	currentStep: number;
	setCurrentStep: (step: number) => void;
}

// Context 생성
const PersonaCreationContext = createContext<PersonaCreationContextType | null>(
	null
);

// Context Hook
const usePersonaCreation = () => {
	const context = useContext(PersonaCreationContext);
	if (!context) {
		throw new Error(
			"usePersonaCreation must be used within PersonaCreationProvider"
		);
	}
	return context;
};

// 디폴트 프롬프트 (실제로는 DB에서 가져올 예정)
const DEFAULT_PROMPTS = {
	character: `생성형 llm을 이용해서 ai 캐릭터챗 서비스를 만들고있어. 
'페르소나' 라는 각 컨셉을 가지는 캐릭터를 생성할 예정인데, 그 전에 다양한 컨셉들을 생성하려해.
캐릭터성을 강조하고 개성을 가질 수 있는 한 두줄짜리 컨셉을 만들어줘. 

컨셉에는 캐릭터의 나이대, 성격, 직업, 성향이 잘 표현될 수 있으면 좋아.
다양한 분야와 다양한 컨셉을 가진 페르소나가 잘 나올 수 있도록 랜덤하게 생성해줘.

너무 역할극 같이 어려운 컨셉을 피해주고, 사용자가 다양한 성격의 캐릭터와 채팅을 통해 대화를 연습할 수 있는 목적이면좋아.`,

	story: `생성형 llm을 이용해서 ai 캐릭터챗 서비스를 만들고있어. 
'페르소나' 라는 각 컨셉을 가지는 캐릭터를 생성할 예정인데, 그 전에 다양한 컨셉들을 생성하려해.
캐릭터성을 강조하고 개성을 가질 수 있는 한 두줄짜리 컨셉을 만들어줘. 

컨셉에는 캐릭터와 사용자간의 상황이나 스토리가 나타날 수 있으면 좋아.
자극적이고 현실에서는 일어나기 어려운 상황이면 사용자의 이목을 더 끌 수 있어.
다양한 상황과 다양한 역할, 여러 예상치 못한 스토리가 나올 수 있도록 자극적이게 만들어줘. 
스토리의 주인공은 캐릭터 1명과 사용자니까 등장인물이 많이 필요한 스토리는 피해줘.

역할극 기반의 대화가 잘 이루어질 수 있는 컨셉으로 해주고 대화가 길게 이어질 수 있는 스토리면 좋아. 
분야는 로맨스, 위험한 관계, 판타지, 스릴러, 미스테리, 일상, 공포 등 상관없고 컨셉만 보고 사용자의 이목을 끌 수 있도록 자극적이면 좋아.

사용자는 남녀 가리지 않고 서비스는 성인 서비스니까 연령 제한없이 만들어줘.`,
};

// 지원 모델 목록
const LLM_MODELS = [
	{
		id: "gemini-2.0-flash",
		name: "Google Gemini 2.0 Flash",
		provider: "Google",
	},
	{ id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
];

// Step 1 컴포넌트
function Step1Component() {
	const { data, updateData, setCurrentStep } = usePersonaCreation();
	const [personaType, setPersonaType] = useState<"character" | "story">(
		data.step1.personaType || "character"
	);
	const [useCustomPrompt, setUseCustomPrompt] = useState(false);
	const [selectedModel, setSelectedModel] = useState(
		data.step1.model || "gemini-2.0-flash"
	);
	const [conceptPrompt, setConceptPrompt] = useState("");
	const [generatedConcept, setGeneratedConcept] = useState(
		data.step1.concept || ""
	);
	const [isGenerating, setIsGenerating] = useState(false);

	// 타입 변경 시나 프롬프트 모드 변경 시 디폴트 프롬프트 설정
	React.useEffect(() => {
		if (!useCustomPrompt) {
			setConceptPrompt(DEFAULT_PROMPTS[personaType]);
		}
	}, [personaType, useCustomPrompt]);

	// 직접 입력 체크박스 변경 처리
	const handleUseCustomPromptChange = (checked: boolean) => {
		setUseCustomPrompt(checked);
		if (checked) {
			// 직접 입력 모드 활성화 시 프롬프트 내용 초기화
			setConceptPrompt("");
		} else {
			// 디폴트 모드로 돌아갈 때 디폴트 프롬프트 설정
			setConceptPrompt(DEFAULT_PROMPTS[personaType]);
		}
	};

	// 컨셉 생성 API 호출 (실제 LLM API 연동)
	const handleGenerateConcept = async () => {
		if (!conceptPrompt.trim()) {
			return;
		}

		setIsGenerating(true);

		try {
			// 실제 LLM API 호출
			const response = await fetch("/api/v1/llm/generate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("access_token")}`,
				},
				body: JSON.stringify({
					model: selectedModel,
					prompt: conceptPrompt,
					max_tokens: 500,
					temperature: 0.8,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.detail || "API 요청이 실패했습니다.");
			}

			const data = await response.json();

			if (data.success && data.content) {
				setGeneratedConcept(data.content);
			} else {
				throw new Error(data.error || "컨셉 생성에 실패했습니다.");
			}
		} catch (error) {
			console.error("컨셉 생성 오류:", error);
			alert("컨셉 생성 중 오류가 발생했습니다.");
		} finally {
			setIsGenerating(false);
		}
	};

	// 1단계 완료
	const handleComplete = () => {
		if (!generatedConcept.trim()) {
			return;
		}

		// 1단계 데이터 저장
		updateData("step1", {
			personaType,
			model: selectedModel,
			concept: generatedConcept,
		});

		// 2단계로 이동
		setCurrentStep(2);
	};

	return (
		<div className="space-y-6">
			{/* 페르소나 타입 선택 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">페르소나 타입 선택</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4">
						<div
							className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
								personaType === "character" ? "border-blue-500 bg-blue-50" : ""
							}`}
							onClick={() => setPersonaType("character")}
						>
							<input
								type="radio"
								id="character"
								name="personaType"
								value="character"
								checked={personaType === "character"}
								onChange={() => setPersonaType("character")}
								className="mr-2"
							/>
							<div className="flex items-center gap-2">
								<User className="h-4 w-4" />
								<Label htmlFor="character" className="cursor-pointer">
									캐릭터 페르소나
								</Label>
							</div>
						</div>
						<div
							className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
								personaType === "story" ? "border-blue-500 bg-blue-50" : ""
							}`}
							onClick={() => setPersonaType("story")}
						>
							<input
								type="radio"
								id="story"
								name="personaType"
								value="story"
								checked={personaType === "story"}
								onChange={() => setPersonaType("story")}
								className="mr-2"
							/>
							<div className="flex items-center gap-2">
								<BookOpen className="h-4 w-4" />
								<Label htmlFor="story" className="cursor-pointer">
									스토리 페르소나
								</Label>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* LLM 모델 선택 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">LLM 모델 선택</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						{LLM_MODELS.map((model) => (
							<Button
								key={model.id}
								type="button"
								variant={selectedModel === model.id ? "default" : "outline"}
								onClick={() => setSelectedModel(model.id)}
								className="flex-grow-0"
							>
								{model.name}
							</Button>
						))}
					</div>
				</CardContent>
			</Card>

			{/* 컨셉 프롬프트 입력 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center justify-between">
						프롬프트
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="useCustomPrompt"
								checked={useCustomPrompt}
								onChange={(e) => handleUseCustomPromptChange(e.target.checked)}
								className="rounded"
							/>
							<Label htmlFor="useCustomPrompt" className="text-sm font-normal">
								직접 입력
							</Label>
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						value={conceptPrompt}
						onChange={(e) => setConceptPrompt(e.target.value)}
						className="min-h-[120px]"
						placeholder={
							useCustomPrompt
								? "원하는 페르소나 컨셉을 생성하기 위한 프롬프트를 직접 입력하세요..."
								: "프롬프트를 입력하세요..."
						}
					/>
				</CardContent>
			</Card>

			{/* 생성 버튼 */}
			<div className="flex justify-center">
				<Button
					onClick={handleGenerateConcept}
					disabled={isGenerating || !conceptPrompt.trim()}
					className="px-8 py-2"
				>
					{isGenerating ? (
						<>
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							생성 중...
						</>
					) : (
						<>
							<Wand2 className="h-4 w-4 mr-2" />
							생성
						</>
					)}
				</Button>
			</div>

			{/* 생성된 컨셉 */}
			{generatedConcept && (
				<Card className="border-green-200 bg-green-50">
					<CardHeader>
						<CardTitle className="text-lg text-green-800 flex items-center gap-2">
							<Check className="h-5 w-5" />
							생성된 컨셉
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Textarea
							value={generatedConcept}
							onChange={(e) => setGeneratedConcept(e.target.value)}
							className="min-h-[100px] bg-white border-green-200"
							placeholder="생성된 컨셉이 여기에 표시됩니다..."
						/>
					</CardContent>
				</Card>
			)}

			{/* 완료 버튼 */}
			<div className="flex justify-end">
				<Button
					onClick={handleComplete}
					disabled={!generatedConcept.trim()}
					className="bg-green-600 hover:bg-green-700"
				>
					<Check className="h-4 w-4 mr-2" />
					생성 완료
				</Button>
			</div>
		</div>
	);
}

// Step 2 컴포넌트 (임시)
function Step2Component() {
	const { data, setCurrentStep } = usePersonaCreation();

	return (
		<div className="space-y-6">
			<div className="text-center space-y-4">
				<h3 className="text-xl font-semibold">
					2단계: 페르소나 정보 입력/수정
				</h3>
				<p className="text-gray-600">1단계에서 생성된 컨셉:</p>
				<div className="p-4 bg-blue-50 rounded-lg">
					<p className="font-medium">{data.step1.concept}</p>
				</div>
				<p className="text-gray-500">2단계 구현 예정...</p>
			</div>

			{/* 단계 완료 버튼 */}
			<div className="flex justify-end">
				<Button
					onClick={() => setCurrentStep(3)}
					className="bg-green-600 hover:bg-green-700"
				>
					<Check className="h-4 w-4 mr-2" />
					다음 단계
				</Button>
			</div>
		</div>
	);
}

// Step 3 컴포넌트 (임시)
function Step3Component() {
	const { data, setCurrentStep } = usePersonaCreation();

	return (
		<div className="space-y-6">
			<div className="text-center space-y-4">
				<h3 className="text-xl font-semibold">
					3단계: 페르소나 요약, 태그 입력/수정
				</h3>
				<p className="text-gray-600">이전 단계 데이터:</p>
				<div className="p-4 bg-blue-50 rounded-lg text-left">
					<p className="font-medium mb-2">컨셉: {data.step1.concept}</p>
					<p className="text-sm text-gray-600">모델: {data.step1.model}</p>
					<p className="text-sm text-gray-600">
						타입: {data.step1.personaType === "character" ? "캐릭터" : "스토리"}
					</p>
				</div>
				<p className="text-gray-500">3단계 구현 예정...</p>
			</div>

			{/* 단계 완료 버튼 */}
			<div className="flex justify-end">
				<Button
					onClick={() => setCurrentStep(4)}
					className="bg-green-600 hover:bg-green-700"
				>
					<Check className="h-4 w-4 mr-2" />
					다음 단계
				</Button>
			</div>
		</div>
	);
}

// Step 4 컴포넌트 (임시)
function Step4Component() {
	const { data } = usePersonaCreation();

	return (
		<div className="space-y-6">
			<div className="text-center space-y-4">
				<h3 className="text-xl font-semibold">
					4단계: 페르소나 프로필 이미지 생성
				</h3>
				<p className="text-gray-600">모든 단계 데이터:</p>
				<div className="p-4 bg-blue-50 rounded-lg text-left">
					<p className="font-medium mb-2">컨셉: {data.step1.concept}</p>
					<p className="text-sm text-gray-600">모델: {data.step1.model}</p>
					<p className="text-sm text-gray-600">
						타입: {data.step1.personaType === "character" ? "캐릭터" : "스토리"}
					</p>
				</div>
				<p className="text-gray-500">4단계 구현 예정...</p>
			</div>

			{/* 최종 완료 버튼 */}
			<div className="flex justify-end">
				<Button
					onClick={() => console.log("페르소나 생성 완료 (구현 예정)")}
					className="bg-green-600 hover:bg-green-700"
				>
					<Check className="h-4 w-4 mr-2" />
					페르소나 생성 완료
				</Button>
			</div>
		</div>
	);
}

// 페르소나 생성 다이얼로그 Props
interface PersonaCreationDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onPersonaCreated?: (persona: any) => void;
}

// 메인 다이얼로그 컴포넌트
export function PersonaCreationDialog({
	isOpen,
	onClose,
	onPersonaCreated,
}: PersonaCreationDialogProps) {
	const [data, setData] = useState<PersonaCreationData>({
		step1: { personaType: "character", model: "", concept: "" },
		step2: { personaInfo: "", regenerationNotes: "" },
		step3: { summary: "", tags: [] },
		step4: {
			imageDescription: "",
			imagePrompt: "",
			generatedImages: [],
			selectedImage: "",
		},
	});
	const [currentStep, setCurrentStep] = useState(1);

	// 다이얼로그가 열릴 때마다 초기화
	React.useEffect(() => {
		if (isOpen) {
			setData({
				step1: { personaType: "character", model: "", concept: "" },
				step2: { personaInfo: "", regenerationNotes: "" },
				step3: { summary: "", tags: [] },
				step4: {
					imageDescription: "",
					imagePrompt: "",
					generatedImages: [],
					selectedImage: "",
				},
			});
			setCurrentStep(1);
		}
	}, [isOpen]);

	const updateData = (step: keyof PersonaCreationData, newData: any) => {
		setData((prev) => ({
			...prev,
			[step]: { ...prev[step], ...newData },
		}));
	};

	// 취소 핸들러 - 초기화 포함
	const handleClose = () => {
		setData({
			step1: { personaType: "character", model: "", concept: "" },
			step2: { personaInfo: "", regenerationNotes: "" },
			step3: { summary: "", tags: [] },
			step4: {
				imageDescription: "",
				imagePrompt: "",
				generatedImages: [],
				selectedImage: "",
			},
		});
		setCurrentStep(1);
		onClose();
	};

	const contextValue: PersonaCreationContextType = {
		data,
		updateData,
		currentStep,
		setCurrentStep,
	};

	const renderCurrentStep = () => {
		switch (currentStep) {
			case 1:
				return <Step1Component />;
			case 2:
				return <Step2Component />;
			case 3:
				return <Step3Component />;
			case 4:
				return <Step4Component />;
			default:
				return <Step1Component />;
		}
	};

	return (
		<PersonaCreationContext.Provider value={contextValue}>
			<Dialog open={isOpen} onOpenChange={handleClose}>
				<DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							페르소나 생성 - {currentStep}단계
						</DialogTitle>
						<DialogDescription>
							총 4단계로 구성된 페르소나 생성 과정입니다.
						</DialogDescription>
					</DialogHeader>

					<div className="py-4">
						{/* 진행 단계 표시 */}
						<div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
							<Badge
								variant={
									currentStep === 1
										? "default"
										: currentStep > 1
										? "secondary"
										: "outline"
								}
							>
								1단계
							</Badge>
							<span className={currentStep === 1 ? "font-medium" : ""}>
								컨셉 입력
							</span>
							<ArrowRight className="h-4 w-4" />
							<Badge
								variant={
									currentStep === 2
										? "default"
										: currentStep > 2
										? "secondary"
										: "outline"
								}
							>
								2단계
							</Badge>
							<span className={currentStep === 2 ? "font-medium" : ""}>
								정보 입력
							</span>
							<ArrowRight className="h-4 w-4" />
							<Badge
								variant={
									currentStep === 3
										? "default"
										: currentStep > 3
										? "secondary"
										: "outline"
								}
							>
								3단계
							</Badge>
							<span className={currentStep === 3 ? "font-medium" : ""}>
								요약/태그
							</span>
							<ArrowRight className="h-4 w-4" />
							<Badge variant={currentStep === 4 ? "default" : "outline"}>
								4단계
							</Badge>
							<span className={currentStep === 4 ? "font-medium" : ""}>
								이미지 생성
							</span>
						</div>

						{/* 현재 단계 렌더링 */}
						{renderCurrentStep()}
					</div>

					<DialogFooter className="flex justify-between">
						<div className="flex gap-2">
							{currentStep > 1 && (
								<Button
									variant="outline"
									onClick={() => setCurrentStep(currentStep - 1)}
								>
									이전 단계
								</Button>
							)}
						</div>
						<Button variant="outline" onClick={handleClose}>
							취소
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PersonaCreationContext.Provider>
	);
}
