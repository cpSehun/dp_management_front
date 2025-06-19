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
import {
	fetchSummaryPrompt,
	fetchTagsPrompt,
	formatPrompt,
} from "@/utils/prompt-api";

export function SummaryAndTagsStep() {
	const { data, updateData, setCurrentStep } = usePersonaCreation();

	const [summary, setSummary] = useState(data.step3.summary || "");
	const [tags, setTags] = useState<string[]>(data.step3.tags || []);
	const [newTag, setNewTag] = useState("");
	const [isLoadingSummary, setIsLoadingSummary] = useState(false);
	const [isLoadingTags, setIsLoadingTags] = useState(false);

	// 페르소나 요약 자동 생성
	const handleGenerateSummary = async () => {
		const { model } = data.step1;
		const { personaInfo } = data.step2;

		if (!personaInfo.trim()) {
			throw new Error("2단계에서 페르소나 정보를 먼저 생성해주세요.");
		}

		setIsLoadingSummary(true);
		try {
			// DB에서 최신 요약 생성 프롬프트 가져오기
			const basePrompt = await fetchSummaryPrompt();
			if (!basePrompt) {
				throw new Error("요약 생성 프롬프트를 가져올 수 없습니다.");
			}

			// 페르소나 정보를 프롬프트에 삽입
			const prompt = formatPrompt(basePrompt, { personaInfo });

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
		} finally {
			setIsLoadingSummary(false);
		}
	};

	// 페르소나 태그 자동 생성
	const handleGenerateTags = async () => {
		const { model } = data.step1;
		const { personaInfo } = data.step2;

		if (!personaInfo.trim()) {
			throw new Error("2단계에서 페르소나 정보를 먼저 생성해주세요.");
		}

		setIsLoadingTags(true);
		try {
			// DB에서 최신 태그 생성 프롬프트 가져오기
			const basePrompt = await fetchTagsPrompt();
			if (!basePrompt) {
				throw new Error("태그 생성 프롬프트를 가져올 수 없습니다.");
			}

			// 페르소나 정보를 프롬프트에 삽입
			const prompt = formatPrompt(basePrompt, { personaInfo });

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
				// JSON 형태로 태그가 응답될 것으로 예상
				try {
					// "tags": ["태그1", "태그2", ...] 형태에서 태그 배열 추출
					const content = result.content.trim();
					const tagsMatch = content.match(/"tags":\s*\[([^\]]+)\]/);

					if (tagsMatch) {
						const tagsString = tagsMatch[1];
						const parsedTags = tagsString
							.split(",")
							.map((tag) => tag.replace(/"/g, "").trim())
							.filter((tag) => tag.length > 0);

						setTags(parsedTags);
					} else {
						// JSON 파싱이 실패한 경우 전체 응답을 쉼표로 분리하여 태그로 사용
						const fallbackTags = content
							.split(",")
							.map((tag) => tag.replace(/["\[\]]/g, "").trim())
							.filter((tag) => tag.length > 0)
							.slice(0, 10); // 최대 10개

						setTags(fallbackTags);
					}
				} catch (parseError) {
					console.error("태그 파싱 오류:", parseError);
					throw new Error("태그 형식을 파싱할 수 없습니다.");
				}
			} else {
				throw new Error(result.error || "태그 생성에 실패했습니다.");
			}
		} finally {
			setIsLoadingTags(false);
		}
	};

	// 태그 추가
	const addTag = () => {
		if (newTag.trim() && !tags.includes(newTag.trim())) {
			setTags([...tags, newTag.trim()]);
			setNewTag("");
		}
	};

	// 태그 제거
	const removeTag = (tagToRemove: string) => {
		setTags(tags.filter((tag) => tag !== tagToRemove));
	};

	// Enter 키로 태그 추가
	const handleTagKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addTag();
		}
	};

	// 3단계 완료
	const handleComplete = () => {
		if (!summary.trim()) {
			alert("요약을 생성해주세요.");
			return;
		}

		if (tags.length === 0) {
			alert("태그를 생성해주세요.");
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
			{/* 2단계에서 생성된 페르소나 정보 표시 */}
			<Card className="border-blue-200 bg-blue-50">
				<CardHeader>
					<CardTitle className="text-lg text-blue-800">
						2단계에서 생성된 페르소나 정보
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="p-3 bg-white rounded-md border max-h-40 overflow-y-auto">
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
						페르소나 요약
						<LLMGenerationButton
							onGenerate={handleGenerateSummary}
							disabled={!data.step2.personaInfo.trim() || isLoadingSummary}
							variant="outline"
							size="sm"
						>
							{isLoadingSummary ? "생성 중..." : "자동생성"}
						</LLMGenerationButton>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						value={summary}
						onChange={(e) => setSummary(e.target.value)}
						className="min-h-[80px]"
						placeholder="페르소나 요약이 여기에 생성됩니다..."
					/>
					{!summary && (
						<div className="mt-2 text-xs text-gray-500">
							💡 DB에서 최신 요약 생성 프롬프트를 사용합니다.
						</div>
					)}
				</CardContent>
			</Card>

			{/* 페르소나 태그 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center justify-between">
						페르소나 태그
						<LLMGenerationButton
							onGenerate={handleGenerateTags}
							disabled={!data.step2.personaInfo.trim() || isLoadingTags}
							variant="outline"
							size="sm"
						>
							{isLoadingTags ? "생성 중..." : "자동생성"}
						</LLMGenerationButton>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* 생성된 태그 표시 */}
					{tags.length > 0 && (
						<div>
							<Label className="text-sm font-medium">생성된 태그</Label>
							<div className="flex flex-wrap gap-2 mt-2">
								{tags.map((tag, index) => (
									<Badge
										key={index}
										variant="secondary"
										className="flex items-center gap-1"
									>
										{tag}
										<X
											className="h-3 w-3 cursor-pointer hover:text-red-500"
											onClick={() => removeTag(tag)}
										/>
									</Badge>
								))}
							</div>
						</div>
					)}

					{/* 수동 태그 추가 */}
					<div>
						<Label className="text-sm font-medium">태그 추가</Label>
						<div className="flex gap-2 mt-2">
							<Input
								value={newTag}
								onChange={(e) => setNewTag(e.target.value)}
								onKeyPress={handleTagKeyPress}
								placeholder="태그 입력 후 Enter"
								className="flex-1"
							/>
							<Button
								onClick={addTag}
								variant="outline"
								size="sm"
								disabled={!newTag.trim()}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{tags.length === 0 && (
						<div className="text-xs text-gray-500">
							💡 DB에서 최신 태그 생성 프롬프트를 사용합니다.
						</div>
					)}
				</CardContent>
			</Card>

			{/* 완료 버튼 */}
			<div className="flex justify-end">
				<Button
					onClick={handleComplete}
					disabled={!summary.trim() || tags.length === 0}
					className="bg-green-600 hover:bg-green-700"
				>
					<Check className="h-4 w-4 mr-2" />
					다음 단계
				</Button>
			</div>
		</div>
	);
}
