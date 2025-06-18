import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Save, User, BookOpen } from "lucide-react";

import { usePersonaCreation } from "../common/PersonaCreationContext";

export function FinalReviewStep() {
	const { data } = usePersonaCreation();
	const [isSaving, setIsSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 페르소나 정보에서 이름 추출 함수
	const extractNameFromPersonaInfo = (personaInfo: string): string => {
		const lines = personaInfo.split("\n");
		for (const line of lines) {
			if (line.includes("이름:")) {
				return line.replace("이름:", "").trim();
			}
		}
		return "Unknown";
	};

	// 페르소나 정보에서 첫 대사 및 지문 부분 추출 함수
	const extractChatOpening = (personaInfo: string): string => {
		const sections = personaInfo.split("#");
		for (const section of sections) {
			if (section.includes("첫 대사 및 지문")) {
				return section.replace("첫 대사 및 지문", "").trim();
			}
		}
		return "";
	};

	// 페르소나 정보에서 배경설정 부분 추출 함수
	const extractBackground = (personaInfo: string): string => {
		const sections = personaInfo.split("#");
		for (const section of sections) {
			if (section.includes("배경 설정") || section.includes("배경설정")) {
				return section.replace(/배경\s*설정/, "").trim();
			}
		}
		return "";
	};

	// 첫 대사 및 지문 부분을 제외한 페르소나 정보 생성
	const extractLLMPrompt = (personaInfo: string): string => {
		const sections = personaInfo.split("#");
		const filteredSections = sections.filter(
			(section) => !section.includes("첫 대사 및 지문")
		);
		return filteredSections.join("#").trim();
	};

	// DB에 저장 (선택된 이미지의 job_id 사용)
	const handleSaveToDatabase = async () => {
		setIsSaving(true);
		setError(null);
		setSaveSuccess(false);

		try {
			// 선택된 이미지의 job_id 가져오기
			const selectedImageJobId = data.step4.selectedImageJobId;

			// job_id가 없는 경우 에러
			if (!selectedImageJobId) {
				throw new Error("선택된 이미지의 ID를 찾을 수 없습니다.");
			}

			console.log("=== 페르소나 생성 완료 데이터 ===");
			console.log("선택된 이미지 Job ID:", selectedImageJobId);
			console.log("1단계 - 컨셉:", data.step1);
			console.log("2단계 - 페르소나 정보:", data.step2);
			console.log("3단계 - 요약/태그:", data.step3);
			console.log("4단계 - 이미지:", data.step4);

			const response = await fetch("/api/v1/personas", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("access_token")}`,
				},
				body: JSON.stringify({
					id: selectedImageJobId, // 선택된 이미지의 job_id를 id로 사용
					type: data.step1.personaType.toUpperCase(), // CHAR or STORY
					name: extractNameFromPersonaInfo(data.step2.personaInfo),
					user_id: null,
					status: "INACTIVE",
					model_id: "google/gemini-2.0-flash-001", // 고정값
					tags: data.step3.tags,
					properties: null,
					summary: data.step3.summary,
					llm_prompt: extractLLMPrompt(data.step2.personaInfo),
					chat_opening: extractChatOpening(data.step2.personaInfo),
					background: extractBackground(data.step2.personaInfo),
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.detail || "페르소나 저장에 실패했습니다.");
			}

			const savedPersona = await response.json();
			setSaveSuccess(true);

			console.log("페르소나 저장 성공:", savedPersona);
		} catch (error) {
			console.error("페르소나 저장 오류:", error);
			setError(
				error instanceof Error
					? error.message
					: "페르소나 저장 중 오류가 발생했습니다."
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="text-center mb-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-2">
					페르소나 생성 완료
				</h2>
				<p className="text-gray-600">
					생성된 페르소나의 모든 정보를 확인하고 저장하세요.
				</p>
			</div>

			{/* 선택된 이미지 Job ID 표시 카드 */}
			{data.step4.selectedImageJobId && (
				<Card className="border-purple-200 bg-purple-50">
					<CardHeader>
						<CardTitle className="text-lg text-purple-800 flex items-center gap-2">
							<div className="flex items-center gap-2">
								<span className="text-purple-600 font-mono">🔑</span>
								선택된 이미지 ID (Job ID)
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="p-3 bg-white rounded-md border">
							<code className="text-sm text-purple-700 font-mono break-all">
								{data.step4.selectedImageJobId}
							</code>
						</div>
						<p className="text-xs text-purple-600 mt-2">
							이 Job ID는 데이터베이스에 저장되며, 이미지 파일명으로도
							사용됩니다.
						</p>
					</CardContent>
				</Card>
			)}

			{/* 1단계: 컨셉 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<div className="flex items-center gap-2">
							{data.step1.personaType === "character" ? (
								<User className="h-5 w-5" />
							) : (
								<BookOpen className="h-5 w-5" />
							)}
							1단계:{" "}
							{data.step1.personaType === "character" ? "캐릭터" : "스토리"}{" "}
							컨셉
						</div>
						<Badge variant="outline">{data.step1.model}</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="p-3 bg-gray-50 rounded-md">
						<p className="text-sm whitespace-pre-wrap">{data.step1.concept}</p>
					</div>
				</CardContent>
			</Card>

			{/* 2단계: 페르소나 정보 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">2단계: 페르소나 정보</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="p-3 bg-gray-50 rounded-md max-h-40 overflow-y-auto">
						<p className="text-sm whitespace-pre-wrap">
							{data.step2.personaInfo}
						</p>
					</div>
					{data.step2.regenerationNotes && (
						<div className="mt-2">
							<span className="text-xs text-gray-500">참고사항:</span>
							<p className="text-xs text-gray-600">
								{data.step2.regenerationNotes}
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* 3단계: 요약/태그 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">3단계: 요약 및 태그</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div>
						<span className="font-medium text-sm">요약:</span>
						<p className="text-sm mt-1 p-2 bg-gray-50 rounded">
							{data.step3.summary}
						</p>
					</div>
					<div>
						<span className="font-medium text-sm">
							태그 ({data.step3.tags.length}개):
						</span>
						<div className="flex flex-wrap gap-1 mt-1">
							{data.step3.tags.map((tag, index) => (
								<Badge key={index} variant="secondary" className="text-xs">
									{tag}
								</Badge>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 4단계: 선택된 이미지 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">4단계: 선택된 이미지</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div>
						<span className="font-medium text-sm">이미지 설명:</span>
						<p className="text-sm mt-1 p-2 bg-gray-50 rounded max-h-20 overflow-y-auto">
							{data.step4.imageDescription}
						</p>
					</div>
					<div>
						<span className="font-medium text-sm">이미지 프롬프트:</span>
						<p className="text-sm mt-1 p-2 bg-gray-50 rounded max-h-20 overflow-y-auto">
							{data.step4.imagePrompt}
						</p>
					</div>
					{data.step4.selectedImage && (
						<div className="flex justify-center">
							<div className="border-2 border-green-500 rounded-lg p-2">
								<img
									src={data.step4.selectedImage}
									alt="선택된 페르소나 이미지"
									className="max-w-xs max-h-64 rounded-md"
								/>
								<p className="text-center text-sm text-green-600 mt-2 font-medium">
									선택된 이미지
								</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* 오류 메시지 */}
			{error && (
				<div className="text-red-500 text-sm p-3 bg-red-50 rounded border border-red-200">
					{error}
				</div>
			)}

			{/* 성공 메시지 */}
			{saveSuccess && (
				<div className="text-green-500 text-sm p-3 bg-green-50 rounded border border-green-200">
					페르소나가 성공적으로 저장되었습니다!
				</div>
			)}

			{/* 저장 버튼 */}
			<div className="flex justify-center pt-4">
				<Button
					onClick={handleSaveToDatabase}
					disabled={isSaving || saveSuccess || !data.step4.selectedImageJobId}
					className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700"
					size="lg"
				>
					{isSaving ? (
						<>
							<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
							저장 중...
						</>
					) : saveSuccess ? (
						<>
							<Check className="h-5 w-5 mr-2" />
							저장 완료
						</>
					) : (
						<>
							<Save className="h-5 w-5 mr-2" />
							페르소나 저장
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
