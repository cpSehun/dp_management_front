"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React from "react";

export default function ImageGeneratorPage() {
	const [prompt, setPrompt] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [generatedImages, setGeneratedImages] = useState<
		{ url: string; filename: string; original_url?: string }[]
	>([]);
	const [error, setError] = useState<string | null>(null);
	const [seed, setSeed] = useState<number | null>(() => {
		// 초기 시드값 생성 (랜덤)
		return Math.floor(Math.random() * 4294967295);
	});
	const [steps, setSteps] = useState(40);
	const [batchSize, setBatchSize] = useState(1);

	const handleRandomSeed = () => {
		// 랜덤 시드 생성 (0 ~ 2^32-1 사이)
		setSeed(Math.floor(Math.random() * 4294967295));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!prompt.trim()) return;

		setIsGenerating(true);
		setError(null);
		setGeneratedImages([]);

		try {
			// 타임아웃을 5분(300초)으로 설정하는 AbortController
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 300000);

			const response = await fetch("/api/v1/image-generator/generate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("access_token")}`,
				},
				body: JSON.stringify({
					prompt: prompt,
					steps: steps,
					seed: seed,
					batch_size: batchSize,
				}),
				signal: controller.signal,
			});

			clearTimeout(timeoutId); // 응답이 왔으면 타임아웃 취소

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.detail || "이미지 생성 요청이 실패했습니다.");
			}

			if (data.success) {
				// 생성된 모든 이미지 설정
				console.log("생성된 이미지 상세 정보:", JSON.stringify(data.images));
				setGeneratedImages(data.images || []);
			} else {
				throw new Error(data.error || "알 수 없는 오류가 발생했습니다.");
			}
		} catch (error) {
			console.error("이미지 생성 오류:", error);

			// AbortError인 경우 타임아웃 메시지 표시
			if (error instanceof DOMException && error.name === "AbortError") {
				setError(
					"이미지 생성 요청이 너무 오래 걸려 취소되었습니다. 다시 시도해 주세요."
				);
			} else {
				setError(
					error instanceof Error
						? error.message
						: "이미지 생성 중 오류가 발생했습니다."
				);
			}
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<h1 className="text-2xl font-bold">이미지 생성</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* 프롬프트 입력 및 제어 부분 */}
				<Card>
					<CardHeader>
						<CardTitle>프롬프트 입력</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit}>
							<div className="space-y-4">
								<div className="space-y-2">
									<label className="text-sm font-medium">프롬프트</label>
									<textarea
										placeholder="생성하고 싶은 이미지를 자세히 설명해주세요..."
										value={prompt}
										onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
											setPrompt(e.target.value)
										}
										className="min-h-[120px] w-full border border-gray-300 rounded-md px-3 py-2"
									/>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="text-sm font-medium">스텝</label>
										<input
											type="number"
											min="1"
											max="100"
											value={steps}
											onChange={(e) => setSteps(parseInt(e.target.value))}
											className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
										/>
									</div>
									<div>
										<label className="text-sm font-medium">시드 (Random)</label>
										<div className="flex mt-1">
											<input
												type="number"
												value={seed !== null ? seed : ""}
												onChange={(e) =>
													setSeed(
														e.target.value ? parseInt(e.target.value) : null
													)
												}
												className="flex-1 border border-gray-300 rounded-l-md px-3 py-2"
												placeholder="랜덤 시드"
											/>
											<button
												type="button"
												onClick={handleRandomSeed}
												className="bg-gray-100 px-2 rounded-r-md border border-l-0 border-gray-300"
												title="랜덤 시드 생성"
											>
												🎲
											</button>
										</div>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-3">
									<div>
										<label className="text-sm font-medium">이미지 수</label>
										<select
											value={batchSize}
											onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
												setBatchSize(parseInt(e.target.value))
											}
											className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
										>
											<option value="1">1개</option>
											<option value="2">2개</option>
											<option value="3">3개</option>
											<option value="4">4개</option>
										</select>
									</div>
								</div>

								{error && (
									<div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-200">
										{error}
									</div>
								)}

								<div className="flex flex-col sm:flex-row sm:justify-between gap-2">
									<Button
										type="submit"
										className="w-full sm:w-auto"
										disabled={isGenerating || !prompt.trim()}
									>
										{isGenerating ? "이미지 생성 중..." : "이미지 생성"}
									</Button>
								</div>
							</div>
						</form>
					</CardContent>
				</Card>

				{/* 이미지 결과 부분 */}
				<Card>
					<CardHeader>
						<CardTitle>생성된 이미지</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col items-center min-h-[300px] bg-muted/20 rounded-md">
						{isGenerating ? (
							<div className="text-center">
								<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
								<p className="text-gray-500">이미지 생성 중...</p>
							</div>
						) : generatedImages.length > 0 ? (
							<div className="flex flex-col items-center w-full">
								<div
									className={
										generatedImages.length >= 3
											? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full"
											: generatedImages.length === 2
											? "grid grid-cols-1 sm:grid-cols-2 gap-4 w-full"
											: "grid grid-cols-1 gap-4 w-full"
									}
								>
									{generatedImages.map((image, index) => (
										<div key={index} className="flex flex-col items-center">
											<div className="relative min-h-[200px] flex items-center justify-center">
												<img
													src={image.url}
													alt={`생성된 이미지 ${index + 1}`}
													className="max-w-full max-h-[300px] rounded-md shadow-md"
												/>
											</div>
											<div className="mt-2 flex space-x-2">
												<a
													href={
														image.original_url ||
														`${window.location.origin}${image.url}`
													}
													target="_blank"
													rel="noopener noreferrer"
													className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm hover:bg-blue-100"
												>
													원본
												</a>
												<a
													href={`${window.location.origin}${image.url}`}
													download={image.filename}
													className="px-3 py-1 bg-green-50 text-green-700 rounded-md text-sm hover:bg-green-100"
												>
													저장
												</a>
											</div>
										</div>
									))}
								</div>
							</div>
						) : (
							<div className="text-center text-gray-400">
								<p>프롬프트를 입력하고 이미지 생성 버튼을 눌러주세요.</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* 도움말 및 안내 */}
			<Card className="mt-4">
				<CardHeader>
					<CardTitle>프롬프트 작성 도움말</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="list-disc pl-5 space-y-2">
						<li>자세한 설명을 추가할수록 더 정확한 이미지가 생성됩니다.</li>
						<li>색상, 스타일, 분위기 등을 구체적으로 명시하세요.</li>
						<li>배경, 시점, 조명 등의 요소도 고려하여 작성하면 좋습니다.</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
