// src/components/admin/persona/steps/ConceptGenerationStep.tsx

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, BookOpen, Check, Wand2, Edit3 } from "lucide-react";

import { usePersonaCreation } from "../common/PersonaCreationContext";
import { LLMGenerationButton } from "../common/LLMGenerationButton";
import { PersonaType, LLMModel } from "@/types/persona-creation.types";

// 지원 모델 목록
const LLM_MODELS: LLMModel[] = [
	{
		id: "gemini-2.0-flash",
		name: "Google Gemini 2.0 Flash",
		provider: "Google",
	},
	{ id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
];

export function ConceptGenerationStep() {
	const { data, updateData, setCurrentStep } = usePersonaCreation();

	const [personaType, setPersonaType] = useState<PersonaType>(
		data.step1.personaType || "character"
	);
	const [selectedModel, setSelectedModel] = useState(
		data.step1.model || "gemini-2.0-flash"
	);
	const [conceptPrompt, setConceptPrompt] = useState("");
	const [generatedConcept, setGeneratedConcept] = useState("");

	// 입력 모드 상태
	const [inputMode, setInputMode] = useState<"none" | "auto" | "manual">(
		"none"
	);
	const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);

	// 프롬프트 관련 상태 (자동 생성용)
	const [useCustomPrompt, setUseCustomPrompt] = useState(false);

	// 컨셉 직접 입력 상태 (직접 입력용)
	const [directConcept, setDirectConcept] = useState("");

	// 마지막으로 사용된 모드 저장
	const [lastUsedMode, setLastUsedMode] = useState<"auto" | "manual" | null>(
		null
	);

	// 컴포넌트 마운트 시 이전 상태 복원
	useEffect(() => {
		const step1Data = data.step1;

		// 이전 상태 복원
		if (step1Data.inputMode) {
			setInputMode(step1Data.inputMode);
			setLastUsedMode(step1Data.inputMode);

			if (step1Data.inputMode === "auto") {
				// 자동 생성 모드 복원
				if (step1Data.generatedConcept) {
					setGeneratedConcept(step1Data.generatedConcept);
				}
				if (step1Data.conceptPrompt) {
					setConceptPrompt(step1Data.conceptPrompt);
				}
				if (step1Data.useCustomPrompt !== undefined) {
					setUseCustomPrompt(step1Data.useCustomPrompt);
				}
			} else if (step1Data.inputMode === "manual") {
				// 직접 입력 모드 복원
				if (step1Data.directConcept) {
					setDirectConcept(step1Data.directConcept);
				}
			}
		}
	}, []);

	// DB에서 최신 프롬프트 가져오기
	const fetchLatestPrompt = async (type: PersonaType) => {
		setIsLoadingPrompt(true);
		try {
			const token = localStorage.getItem("access_token");
			// PersonaType을 DB 타입으로 매핑
			const dbType = type === "character" ? "CHAR" : "STORY";
			const response = await fetch(
				`/api/v1/prompts/workflow/latest?type=${dbType}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.detail || "DB에서 프롬프트를 가져올 수 없습니다"
				);
			}

			const data = await response.json();
			setConceptPrompt(data.llm_prompt);
		} catch (error) {
			console.error("프롬프트 로드 오류:", error);

			// 에러 메시지 표시
			let errorMessage = "프롬프트를 불러올 수 없습니다.";
			if (error instanceof Error) {
				errorMessage = error.message;
			}

			// 사용자에게 에러 알림 (선택사항)
			alert(`프롬프트 로드 실패: ${errorMessage}`);

			// 기본 프롬프트 설정
			const defaultPrompt =
				type === "character"
					? "매력적이고 독특한 캐릭터 페르소나의 핵심 컨셉을 생성해주세요. 캐릭터의 성격, 배경, 목표를 포함해서 작성해주세요."
					: "흥미롭고 독창적인 스토리 페르소나의 핵심 컨셉을 생성해주세요. 스토리의 테마, 설정, 주요 갈등을 포함해서 작성해주세요.";
			setConceptPrompt(defaultPrompt);
		} finally {
			setIsLoadingPrompt(false);
		}
	};

	// 컨셉 자동 생성 버튼 클릭
	const handleAutoGenerate = () => {
		setInputMode("auto");
		setUseCustomPrompt(false); // 자동 생성 시 DB 프롬프트 사용
		fetchLatestPrompt(personaType);
	};

	// 컨셉 직접 입력 버튼 클릭
	const handleManualInput = () => {
		setInputMode("manual");
		setDirectConcept(""); // 직접 입력 초기화
	};

	// 직접입력 체크박스 변경 처리 (자동 생성 모드에서만 사용)
	const handleUseCustomPromptChange = (checked: boolean) => {
		setUseCustomPrompt(checked);
		if (checked) {
			setConceptPrompt(""); // 체크 시 프롬프트 비우기
		} else {
			fetchLatestPrompt(personaType); // 체크 해제 시 DB 프롬프트 다시 로드
		}
	};

	// 컨셉 생성 API 호출 (자동 생성 모드에서만 사용)
	const handleGenerateConcept = async () => {
		if (!conceptPrompt.trim()) {
			throw new Error("프롬프트를 입력해주세요.");
		}

		const response = await fetch("/api/v1/llm/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("access_token")}`,
			},
			body: JSON.stringify({
				model: selectedModel,
				prompt: conceptPrompt,
				max_tokens: 1024,
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
	};

	// 직접 입력 완료 (컨셉 직접 입력 모드에서만 사용)
	const handleDirectInputComplete = () => {
		if (!directConcept.trim()) {
			alert("컨셉을 입력해주세요.");
			return;
		}
		// Context에 모든 상태 저장 (직접 입력 모드)
		updateData("step1", {
			personaType,
			model: selectedModel,
			concept: directConcept,
			inputMode: "manual",
			directConcept: directConcept,
			generatedConcept: "", // 다른 모드 데이터 초기화
			conceptPrompt: "",
			useCustomPrompt: false,
		});
		setCurrentStep(2);
	};

	// 완료 처리 (자동 생성 모드)
	const handleComplete = () => {
		// Context에 모든 상태 저장 (자동 생성 모드)
		updateData("step1", {
			personaType,
			model: selectedModel,
			concept: generatedConcept,
			inputMode: "auto",
			generatedConcept: generatedConcept,
			conceptPrompt: conceptPrompt,
			useCustomPrompt: useCustomPrompt,
			directConcept: "", // 다른 모드 데이터 초기화
		});
		setCurrentStep(2);
	};

	return (
		<div className="space-y-6">
			{/* 페르소나 타입 선택 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<User className="h-5 w-5" />
						페르소나 타입
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4">
						<Button
							variant={personaType === "character" ? "default" : "outline"}
							onClick={() => {
								setPersonaType("character");
								setInputMode("none"); // 타입 변경 시 입력 모드 초기화
							}}
							className="flex-1"
						>
							<User className="h-4 w-4 mr-2" />
							캐릭터
						</Button>
						<Button
							variant={personaType === "story" ? "default" : "outline"}
							onClick={() => {
								setPersonaType("story");
								setInputMode("none"); // 타입 변경 시 입력 모드 초기화
							}}
							className="flex-1"
						>
							<BookOpen className="h-4 w-4 mr-2" />
							스토리
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* 모델 선택 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">AI 모델 선택</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4">
						{LLM_MODELS.map((model) => (
							<Button
								key={model.id}
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

			{/* 컨셉 생성 방법 선택 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">컨셉 생성 방법</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4">
						<Button
							variant={inputMode === "auto" ? "default" : "outline"}
							onClick={handleAutoGenerate}
							disabled={isLoadingPrompt}
							className="flex-1"
						>
							<Wand2 className="h-4 w-4 mr-2" />
							{isLoadingPrompt ? "프롬프트 로딩 중..." : "컨셉 자동 생성"}
						</Button>
						<Button
							variant={inputMode === "manual" ? "default" : "outline"}
							onClick={handleManualInput}
							className="flex-1"
						>
							<Edit3 className="h-4 w-4 mr-2" />
							컨셉 직접 입력
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* 프롬프트 입력 (자동 생성 모드에서만 표시) */}
			{inputMode === "auto" && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg flex items-center justify-between">
							프롬프트
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									id="useCustomPrompt"
									checked={useCustomPrompt}
									onChange={(e) =>
										handleUseCustomPromptChange(e.target.checked)
									}
									className="rounded"
								/>
								<Label
									htmlFor="useCustomPrompt"
									className="text-sm font-normal"
								>
									직접입력
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
								isLoadingPrompt
									? "프롬프트를 불러오는 중..."
									: useCustomPrompt
									? "원하는 페르소나 컨셉을 생성하기 위한 프롬프트를 직접 입력하세요..."
									: "DB에서 최신 프롬프트를 불러옵니다..."
							}
							disabled={isLoadingPrompt}
						/>
						{!useCustomPrompt && (
							<div className="mt-2 text-xs text-gray-500">
								💡 DB에서 최신 프롬프트를 자동으로 불러옵니다. 관리자 페이지에서
								프롬프트를 수정할 수 있습니다.
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* 컨셉 직접 입력 (직접 입력 모드에서만 표시) */}
			{inputMode === "manual" && (
				<Card className="border-blue-200 bg-blue-50">
					<CardHeader>
						<CardTitle className="text-lg text-blue-800 flex items-center gap-2">
							<Edit3 className="h-5 w-5" />
							컨셉 직접 입력
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Textarea
							value={directConcept}
							onChange={(e) => setDirectConcept(e.target.value)}
							className="min-h-[200px] bg-white border-blue-200 resize-y"
							placeholder="완성된 컨셉을 직접 입력하세요..."
						/>
					</CardContent>
				</Card>
			)}

			{/* 생성/완료 버튼 */}
			{inputMode === "auto" && (
				<div className="flex justify-center">
					<LLMGenerationButton
						onGenerate={handleGenerateConcept}
						disabled={!conceptPrompt.trim() || isLoadingPrompt}
						className="px-8 py-2"
					>
						{isLoadingPrompt ? "프롬프트 로딩 중..." : "컨셉 생성"}
					</LLMGenerationButton>
				</div>
			)}

			{inputMode === "manual" && (
				<div className="flex justify-center">
					<Button
						onClick={handleDirectInputComplete}
						disabled={!directConcept.trim()}
						className="px-8 py-2 bg-blue-600 hover:bg-blue-700"
					>
						<Check className="h-4 w-4 mr-2" />
						생성 완료
					</Button>
				</div>
			)}

			{/* 생성된 컨셉 (자동 생성 모드에서만 표시) */}
			{inputMode === "auto" && generatedConcept && (
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
							className="min-h-[200px] bg-white border-green-200 resize-y"
							placeholder="생성된 컨셉이 여기에 표시됩니다..."
						/>
					</CardContent>
				</Card>
			)}

			{/* 생성 완료 버튼 (자동 생성 모드에서 컨셉이 생성된 경우에만 표시) */}
			{inputMode === "auto" && generatedConcept && (
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
			)}
		</div>
	);
}
