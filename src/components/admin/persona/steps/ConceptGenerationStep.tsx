// src/components/admin/persona/steps/ConceptGenerationStep.tsx

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, BookOpen, Check } from "lucide-react";

import { usePersonaCreation } from "../common/PersonaCreationContext";
import { LLMGenerationButton } from "../common/LLMGenerationButton";
import { PERSONA_PROMPTS, addNotes } from "@/constants/persona-prompts";
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
	const [useCustomPrompt, setUseCustomPrompt] = useState(false);
	const [selectedModel, setSelectedModel] = useState(
		data.step1.model || "gemini-2.0-flash"
	);
	const [conceptPrompt, setConceptPrompt] = useState("");
	const [generatedConcept, setGeneratedConcept] = useState(
		data.step1.concept || ""
	);
	const [inputMode, setInputMode] = useState<"auto" | "direct">("auto"); // 'auto' 또는 'direct'

	// 타입 변경 시나 프롬프트 모드 변경 시 디폴트 프롬프트 설정
	useEffect(() => {
		if (!useCustomPrompt) {
			setConceptPrompt(PERSONA_PROMPTS.CONCEPT_GENERATION[personaType]);
		}
	}, [personaType, useCustomPrompt]);

	// 직접 입력 체크박스 변경 처리
	const handleUseCustomPromptChange = (checked: boolean) => {
		setUseCustomPrompt(checked);
		if (checked) {
			setConceptPrompt("");
		} else {
			setConceptPrompt(PERSONA_PROMPTS.CONCEPT_GENERATION[personaType]);
		}
	};

	// "컨셉 자동 생성" 모드 선택 핸들러
	const handleAutoMode = () => {
		setInputMode("auto");
		setGeneratedConcept(""); // 이전 컨셉 내용 초기화
		if (!useCustomPrompt) {
			setConceptPrompt(PERSONA_PROMPTS.CONCEPT_GENERATION[personaType]);
		} else {
			// useCustomPrompt가 true일 경우, 사용자가 직접 입력하던 프롬프트를 유지하거나,
			// 혹은 ""로 초기화 할 수 있습니다. 현재는 유지하도록 둡니다.
			// 필요시 setConceptPrompt("") 또는 이전 값 복원 로직 추가.
		}
	};

	// "컨셉 직접 입력" 모드 선택 핸들러
	const handleDirectMode = () => {
		setInputMode("direct");
		setGeneratedConcept(""); // 이전 컨셉 내용 초기화
		setConceptPrompt(""); // 직접 입력 모드에서는 프롬프트가 필요 없음
	};

	// 컨셉 생성 API 호출 (LLMGenerationButton 클릭 시)
	const handleGenerateConcept = async () => {
		if (inputMode !== "auto" || !conceptPrompt.trim()) {
			// 자동 생성 모드가 아니거나 프롬프트가 비어있으면 실행하지 않음
			// (버튼 자체가 비활성화되지만, 안전장치로 추가)
			throw new Error(
				inputMode !== "auto"
					? "자동 생성 모드에서만 사용 가능합니다."
					: "프롬프트를 입력해주세요."
			);
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
				max_tokens: 2048, // 최대 토큰 수를 500에서 1024로 늘림
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

			{/* 컨셉 입력 방식 선택 버튼 */}
			<div className="flex justify-center space-x-4 my-6">
				<Button
					onClick={handleAutoMode}
					variant={inputMode === "auto" ? "default" : "outline"}
					className="px-6 py-2"
				>
					컨셉 자동 생성
				</Button>
				<Button
					onClick={handleDirectMode}
					variant={inputMode === "direct" ? "default" : "outline"}
					className="px-6 py-2"
				>
					컨셉 직접 입력
				</Button>
			</div>

			{/* 컨셉 프롬프트 입력 (자동 생성 모드일 때만 표시) */}
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
									: PERSONA_PROMPTS.CONCEPT_GENERATION[personaType] // 기본 프롬프트 표시
							}
						/>
					</CardContent>
				</Card>
			)}

			{/* "프롬프트로 컨셉 생성하기" 버튼 (자동 생성 모드일 때만 표시) */}
			{inputMode === "auto" && (
				<div className="flex justify-center mt-4">
					<LLMGenerationButton
						onGenerate={handleGenerateConcept}
						disabled={!conceptPrompt.trim()}
						className="px-8 py-2"
					>
						프롬프트로 컨셉 생성하기
					</LLMGenerationButton>
				</div>
			)}

			{/* 생성된 컨셉 또는 직접 입력 영역 */}
			{/* 이 Card는 항상 표시되지만, 내용과 스타일은 inputMode에 따라 달라짐 */}
			<Card
				className={`mt-6 ${
					inputMode === "auto" && generatedConcept
						? "border-green-200 bg-green-50" // 자동 생성 모드이고 컨셉이 있을 때
						: "border-gray-200" // 직접 입력 모드 또는 자동 생성 전
				}`}
			>
				<CardHeader>
					<CardTitle
						className={`text-lg flex items-center gap-2 ${
							inputMode === "auto" && generatedConcept ? "text-green-800" : ""
						}`}
					>
						{inputMode === "auto" && generatedConcept && (
							<Check className="h-5 w-5" />
						)}
						{inputMode === "auto" ? "생성된 컨셉" : "컨셉 직접 입력"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						value={generatedConcept}
						onChange={(e) => setGeneratedConcept(e.target.value)}
						className="min-h-[200px] max-h-[400px] bg-white border-gray-200 resize-y overflow-y-auto"
						placeholder={
							inputMode === "auto"
								? generatedConcept // 자동 생성 모드이고 컨셉이 있으면 보여주고, 없으면 아래 메시지
									? "" 
									: "위에 '프롬프트로 컨셉 생성하기' 버튼을 눌러 컨셉을 생성하세요."
								: "여기에 페르소나 컨셉을 직접 입력하세요..."
						}
						// 자동 생성 모드에서 생성된 컨셉도 수정 가능하도록 readOnly는 설정하지 않음
					/>
				</CardContent>
			</Card>

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
