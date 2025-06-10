// src/components/admin/persona/steps/SummaryAndTagsStep.tsx

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, X } from "lucide-react";

import { usePersonaCreation } from "../common/PersonaCreationContext";
import { LLMGenerationButton } from "../common/LLMGenerationButton";
import { PERSONA_PROMPTS, formatPrompt } from "@/constants/persona-prompts";

export function SummaryAndTagsStep() {
	const { data, updateData, setCurrentStep } = usePersonaCreation();

	const [summary, setSummary] = useState(data.step3.summary || "");
	const [tags, setTags] = useState<string[]>(data.step3.tags || []);
	const [newTag, setNewTag] = useState("");

	// 페르소나 요약 자동 생성
	const handleGenerateSummary = async () => {
		const { model } = data.step1;
		const { personaInfo } = data.step2;

		if (!personaInfo.trim()) {
			throw new Error("2단계에서 페르소나 정보를 먼저 생성해주세요.");
		}

		// 요약 생성 프롬프트
		const prompt = formatPrompt(PERSONA_PROMPTS.SUMMARY_GENERATION, {
			personaInfo,
		});

		const response = await fetch("/api/v1/llm/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("access_token")}`,
			},
			body: JSON.stringify({
				model: model,
				prompt: prompt,
				max_tokens: 100,
				temperature: 0.5,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.detail || "API 요청이 실패했습니다.");
		}

		const result = await response.json();

		if (result.success && result.content) {
			setSummary(result.content.trim());
		} else {
			throw new Error(result.error || "요약 생성에 실패했습니다.");
		}
	};

	// 페르소나 태그 자동 생성
	const handleGenerateTags = async () => {
		const { model } = data.step1;
		const { personaInfo } = data.step2;

		if (!personaInfo.trim()) {
			throw new Error("2단계에서 페르소나 정보를 먼저 생성해주세요.");
		}

		// 태그 생성 프롬프트
		const prompt = formatPrompt(PERSONA_PROMPTS.TAGS_GENERATION, {
			personaInfo,
		});

		const response = await fetch("/api/v1/llm/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("access_token")}`,
			},
			body: JSON.stringify({
				model: model,
				prompt: prompt,
				max_tokens: 200,
				temperature: 0.6,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.detail || "API 요청이 실패했습니다.");
		}

		const result = await response.json();

		if (result.success && result.content) {
			let generatedTags: string[] = [];

			try {
				// JSON 형태의 응답인지 확인
				if (result.content.includes('"tags"') || result.content.includes("[")) {
					// JSON에서 tags 배열 추출 시도
					const jsonMatch = result.content.match(/"tags"\s*:\s*\[(.*?)\]/s);
					if (jsonMatch) {
						const tagsString = jsonMatch[1];
						generatedTags = tagsString
							.split(",")
							.map((tag) => tag.replace(/["\[\]]/g, "").trim())
							.filter((tag) => tag.length > 0);
					} else {
						// 대괄호로 둘러싸인 배열 형태 추출
						const arrayMatch = result.content.match(/\[(.*?)\]/s);
						if (arrayMatch) {
							const tagsString = arrayMatch[1];
							generatedTags = tagsString
								.split(",")
								.map((tag) => tag.replace(/["\[\]]/g, "").trim())
								.filter((tag) => tag.length > 0);
						}
					}
				} else {
					// 일반 쉼표 구분 텍스트
					generatedTags = result.content
						.split(",")
						.map((tag) => tag.trim())
						.filter((tag) => tag.length > 0);
				}
			} catch (error) {
				// JSON 파싱 실패 시 일반 쉼표 구분으로 처리
				generatedTags = result.content
					.split(",")
					.map((tag) => tag.replace(/["\[\]{}]/g, "").trim())
					.filter((tag) => tag.length > 0);
			}

			setTags(generatedTags);
		} else {
			throw new Error(result.error || "태그 생성에 실패했습니다.");
		}
	};

	// 태그 추가
	const handleAddTag = () => {
		if (newTag.trim() && !tags.includes(newTag.trim())) {
			setTags([...tags, newTag.trim()]);
			setNewTag("");
		}
	};

	// 태그 삭제
	const handleRemoveTag = (tagToRemove: string) => {
		setTags(tags.filter((tag) => tag !== tagToRemove));
	};

	// Enter 키로 태그 추가
	const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAddTag();
		}
	};

	// 3단계 완료
	const handleComplete = () => {
		if (!summary.trim()) {
			alert("요약을 입력해주세요.");
			return;
		}

		// 3단계 데이터 저장
		updateData("step3", {
			summary,
			tags,
		});

		// 4단계로 이동
		setCurrentStep(4);
	};

	return (
		<div className="space-y-6">
			{/* 2단계 페르소나 정보 표시 */}
			<Card className="border-blue-200 bg-blue-50">
				<CardHeader>
					<CardTitle className="text-lg text-blue-800">
						2단계에서 생성된 페르소나 정보
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="p-3 bg-white rounded-md border max-h-32 overflow-y-auto">
						<p className="text-sm whitespace-pre-wrap">
							{data.step2.personaInfo}
						</p>
					</div>
				</CardContent>
			</Card>

			{/* 페르소나 요약 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center justify-between">
						페르소나 요약 (30자 이내)
						<LLMGenerationButton
							onGenerate={handleGenerateSummary}
							disabled={!data.step2.personaInfo.trim()}
							variant="outline"
							size="sm"
						>
							자동생성
						</LLMGenerationButton>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Input
						value={summary}
						onChange={(e) => setSummary(e.target.value)}
						className="w-full"
						placeholder="페르소나의 핵심 특징을 30자 이내로 요약해주세요..."
						maxLength={30}
					/>
					<div className="mt-1 text-xs text-gray-500 text-right">
						{summary.length}/30자
					</div>
				</CardContent>
			</Card>

			{/* 페르소나 태그 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center justify-between">
						페르소나 태그
						<LLMGenerationButton
							onGenerate={handleGenerateTags}
							disabled={!data.step2.personaInfo.trim()}
							variant="outline"
							size="sm"
						>
							자동생성
						</LLMGenerationButton>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* 태그 입력 */}
					<div className="flex gap-2">
						<Input
							value={newTag}
							onChange={(e) => setNewTag(e.target.value)}
							onKeyPress={handleTagInputKeyPress}
							className="flex-1"
							placeholder="태그를 입력하고 Enter를 누르세요..."
						/>
						<Button
							onClick={handleAddTag}
							disabled={!newTag.trim() || tags.includes(newTag.trim())}
							size="sm"
						>
							<Plus className="h-4 w-4" />
						</Button>
					</div>

					{/* 태그 목록 */}
					{tags.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{tags.map((tag, index) => (
								<Badge
									key={index}
									variant="secondary"
									className="flex items-center gap-1 px-2 py-1"
								>
									{tag}
									<button
										onClick={() => handleRemoveTag(tag)}
										className="ml-1 hover:text-red-500"
									>
										<X className="h-3 w-3" />
									</button>
								</Badge>
							))}
						</div>
					)}

					{tags.length === 0 && (
						<div className="text-center text-gray-400 py-4">
							태그가 없습니다. 위에서 태그를 추가하거나 자동생성을 사용해보세요.
						</div>
					)}
				</CardContent>
			</Card>

			{/* 완료 버튼 */}
			<div className="flex justify-end">
				<Button
					onClick={handleComplete}
					disabled={!summary.trim()}
					className="bg-green-600 hover:bg-green-700"
				>
					<Check className="h-4 w-4 mr-2" />
					요약/태그 완료
				</Button>
			</div>
		</div>
	);
}
