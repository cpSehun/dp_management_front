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

	// 컨셉 생성 API 호출
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
				<LLMGenerationButton
					onGenerate={handleGenerateConcept}
					disabled={!conceptPrompt.trim()}
					className="px-8 py-2"
				>
					생성
				</LLMGenerationButton>
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
