// src/components/admin/persona/steps/PersonaInfoStep.tsx

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, RefreshCw } from "lucide-react";

import { usePersonaCreation } from "../common/PersonaCreationContext";
import { LLMGenerationButton } from "../common/LLMGenerationButton";
import {
	fetchPersonaInfoPrompt,
	formatPrompt,
	addNotes,
} from "@/utils/prompt-api";

export function PersonaInfoStep() {
	const { data, updateData, setCurrentStep } = usePersonaCreation();

	const [personaInfo, setPersonaInfo] = useState(data.step2.personaInfo || "");
	const [regenerationNotes, setRegenerationNotes] = useState(
		data.step2.regenerationNotes || ""
	);
	const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);

	// 페르소나 정보 자동 생성
	const handleGeneratePersonaInfo = async () => {
		const { personaType, model, concept } = data.step1;

		if (!concept.trim()) {
			throw new Error("1단계에서 컨셉을 먼저 생성해주세요.");
		}

		setIsLoadingPrompt(true);
		try {
			// DB에서 최신 페르소나 정보 프롬프트 가져오기
			const basePrompt = await fetchPersonaInfoPrompt(personaType);

			if (!basePrompt) {
				throw new Error("페르소나 정보 생성 프롬프트를 가져올 수 없습니다.");
			}

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
					max_tokens: 2048,
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
		} finally {
			setIsLoadingPrompt(false);
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

			{/* 페르소나 정보 입력 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center justify-between">
						페르소나 정보
						<LLMGenerationButton
							onGenerate={handleGeneratePersonaInfo}
							disabled={!data.step1.concept.trim() || isLoadingPrompt}
							variant="outline"
							size="sm"
						>
							{isLoadingPrompt ? "생성 중..." : "자동생성"}
						</LLMGenerationButton>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						value={personaInfo}
						onChange={(e) => setPersonaInfo(e.target.value)}
						className="min-h-[300px]"
						placeholder="페르소나 정보가 여기에 생성됩니다..."
					/>
					{!personaInfo && (
						<div className="mt-2 text-xs text-gray-500">
							💡 DB에서 최신 페르소나 정보 생성 프롬프트를 사용합니다. 관리자
							페이지에서 프롬프트를 관리할 수 있습니다.
						</div>
					)}
				</CardContent>
			</Card>

			{/* 재생성 참고사항 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">재생성 참고사항 (선택사항)</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						value={regenerationNotes}
						onChange={(e) => setRegenerationNotes(e.target.value)}
						className="min-h-[80px]"
						placeholder="페르소나 정보를 재생성할 때 추가로 고려할 사항이 있다면 입력하세요..."
					/>
					{personaInfo && regenerationNotes && (
						<div className="mt-2">
							<Button
								onClick={handleRegeneratePersonaInfo}
								variant="outline"
								size="sm"
								disabled={isLoadingPrompt}
							>
								<RefreshCw className="h-4 w-4 mr-2" />
								{isLoadingPrompt ? "재생성 중..." : "참고사항 포함하여 재생성"}
							</Button>
						</div>
					)}
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
					다음 단계
				</Button>
			</div>
		</div>
	);
}
