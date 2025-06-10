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

	// 선택된 이미지 찾기
	const selectedImage = data.step4.generatedImages.find(
		(_, index) =>
			index ===
			data.step4.generatedImages.findIndex(
				(url) => url === data.step4.selectedImage
			)
	);

	// DB에 저장 (추후 구현 예정)
	const handleSaveToDatabase = async () => {
		setIsSaving(true);
		setError(null);
		setSaveSuccess(false);

		try {
			// TODO: 실제 DB 저장 API 호출 구현 예정

			// 임시로 콘솔에 데이터 출력
			console.log("=== 페르소나 생성 완료 데이터 ===");
			console.log("1단계 - 컨셉:", data.step1);
			console.log("2단계 - 페르소나 정보:", data.step2);
			console.log("3단계 - 요약/태그:", data.step3);
			console.log("4단계 - 이미지:", data.step4);

			// 임시 지연 (실제 API 호출 시뮬레이션)
			await new Promise((resolve) => setTimeout(resolve, 2000));

			setSaveSuccess(true);

			// TODO: 실제 구현 시에는 아래와 같은 API 호출 예정
			/*
      const response = await fetch("/api/v1/personas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          type: data.step1.personaType.toUpperCase(), // CHAR or STORY
          name: extractNameFromPersonaInfo(data.step2.personaInfo),
          llm_prompt: data.step2.personaInfo,
          summary: data.step3.summary,
          tags: data.step3.tags,
          selectedImageUrl: data.step4.selectedImage,
          // 기타 필요한 필드들...
        }),
      });

      if (!response.ok) {
        throw new Error("페르소나 저장에 실패했습니다.");
      }

      const savedPersona = await response.json();
      setSaveSuccess(true);
      */
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
					disabled={isSaving || saveSuccess}
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
