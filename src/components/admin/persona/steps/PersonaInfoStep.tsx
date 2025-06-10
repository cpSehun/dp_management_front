// src/components/admin/persona/steps/PersonaInfoStep.tsx

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, RefreshCw } from "lucide-react";

import { usePersonaCreation } from "../common/PersonaCreationContext";
import { LLMGenerationButton } from "../common/LLMGenerationButton";
import {
	PERSONA_PROMPTS,
	formatPrompt,
	addNotes,
} from "@/constants/persona-prompts";

export function PersonaInfoStep() {
	const { data, updateData, setCurrentStep } = usePersonaCreation();

	const [personaInfo, setPersonaInfo] = useState(data.step2.personaInfo || "");
	const [regenerationNotes, setRegenerationNotes] = useState(
		data.step2.regenerationNotes || ""
	);

	// 페르소나 정보 자동 생성
	const handleGeneratePersonaInfo = async () => {
		const { personaType, model, concept } = data.step1;

		if (!concept.trim()) {
			throw new Error("1단계에서 컨셉을 먼저 생성해주세요.");
		}

		// 프롬프트 선택 (캐릭터/스토리에 따라)
		const basePrompt = PERSONA_PROMPTS.PERSONA_INFO_GENERATION[personaType];

		// 컨셉을 프롬프트에 삽입
		const formattedPrompt = formatPrompt(basePrompt, { concept });

		// 참고사항이 있으면 추가
		const finalPrompt = addNotes(formattedPrompt, regenerationNotes);

		const response = await fetch("/api/v1/llm/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("access_token")}`,
			},
			body: JSON.stringify({
				model: model,
				prompt: finalPrompt,
				max_tokens: 1000,
				temperature: 0.7,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.detail || "API 요청이 실패했습니다.");
		}

		const result = await response.json();

		if (result.success && result.content) {
			setPersonaInfo(result.content);
		} else {
			throw new Error(result.error || "페르소나 정보 생성에 실패했습니다.");
		}
	};

	// 재생성 (참고사항 포함)
	const handleRegeneratePersonaInfo = async () => {
		await handleGeneratePersonaInfo();
	};

	// 2단계 완료
	const handleComplete = () => {
		if (!personaInfo.trim()) {
			return;
		}

		// 2단계 데이터 저장
		updateData("step2", {
			personaInfo,
			regenerationNotes,
		});

		// 3단계로 이동
		setCurrentStep(3);
	};

	return (
		<div className="space-y-6">
			{/* 1단계에서 생성된 컨셉 표시 */}
			<Card className="border-blue-200 bg-blue-50">
				<CardHeader>
					<CardTitle className="text-lg text-blue-800">
						1단계에서 생성된 컨셉
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="p-3 bg-white rounded-md border">
						<p className="text-sm whitespace-pre-wrap">{data.step1.concept}</p>
					</div>
					<div className="mt-2 text-xs text-blue-600">
						타입: {data.step1.personaType === "character" ? "캐릭터" : "스토리"}{" "}
						| 모델: {data.step1.model}
					</div>
				</CardContent>
			</Card>

			{/* 페르소나 정보 자동생성 */}
			<div className="flex justify-center">
				<LLMGenerationButton
					onGenerate={handleGeneratePersonaInfo}
					disabled={!data.step1.concept.trim()}
					className="px-8 py-2"
				>
					페르소나 정보 자동생성
				</LLMGenerationButton>
			</div>

			{/* 생성된 페르소나 정보 */}
			{personaInfo && (
				<Card className="border-green-200 bg-green-50">
					<CardHeader>
						<CardTitle className="text-lg text-green-800 flex items-center gap-2">
							<Check className="h-5 w-5" />
							생성된 페르소나 정보
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Textarea
							value={personaInfo}
							onChange={(e) => setPersonaInfo(e.target.value)}
							className="min-h-[300px] bg-white border-green-200"
							placeholder="생성된 페르소나 정보가 여기에 표시됩니다..."
						/>
					</CardContent>
				</Card>
			)}

			{/* 재생성 참고사항 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">재생성 참고사항</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor="regenerationNotes" className="text-sm font-medium">
							참고사항 (선택사항)
						</Label>
						<Textarea
							id="regenerationNotes"
							value={regenerationNotes}
							onChange={(e) => setRegenerationNotes(e.target.value)}
							className="mt-1 min-h-[80px]"
							placeholder="재생성 시 참고할 사항을 입력하세요. 예: '더 밝은 성격으로', '직업을 교사로 변경' 등"
						/>
					</div>

					<div className="flex justify-center">
						<LLMGenerationButton
							onGenerate={handleRegeneratePersonaInfo}
							disabled={!data.step1.concept.trim()}
							variant="outline"
							className="px-6 py-2"
						>
							<RefreshCw className="h-4 w-4 mr-2" />
							재생성
						</LLMGenerationButton>
					</div>
				</CardContent>
			</Card>

			{/* 완료 버튼 */}
			<div className="flex justify-end">
				<Button
					onClick={handleComplete}
					disabled={!personaInfo.trim()}
					className="bg-green-600 hover:bg-green-700"
				>
					<Check className="h-4 w-4 mr-2" />
					정보 입력 완료
				</Button>
			</div>
		</div>
	);
}
