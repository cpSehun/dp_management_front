// src/components/admin/persona/steps/ImageGenerationStep.tsx

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, RefreshCw, ImageIcon } from "lucide-react";

import { usePersonaCreation } from "../common/PersonaCreationContext";
import { LLMGenerationButton } from "../common/LLMGenerationButton";
import { PERSONA_PROMPTS, formatPrompt } from "@/constants/persona-prompts";

// 이미지 데이터 타입 (job_id 포함)
interface GeneratedImageWithJobId {
	url: string;
	filename?: string;
	original_url?: string;
	selected: boolean;
	seed?: number;
	steps?: number;
	prompt: string;
	modelName: string;
	is_base64: boolean;
	job_id?: string; // job_id 추가
}

export function ImageGenerationStep() {
	const { data, updateData, setCurrentStep } = usePersonaCreation();

	const [imageDescription, setImageDescription] = useState(
		data.step4.imageDescription || data.step2.personaInfo || ""
	);
	const [imagePrompt, setImagePrompt] = useState(data.step4.imagePrompt || "");
	const [generatedImages, setGeneratedImages] = useState<
		GeneratedImageWithJobId[]
	>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 이미지 생성 설정
	const [selectedImageModel, setSelectedImageModel] = useState<
		"flux-dev" | "gpt-image-1"
	>("flux-dev");
	const [batchSize, setBatchSize] = useState(1);
	const [seed, setSeed] = useState<number | null>(() =>
		Math.floor(Math.random() * 4294967295)
	);
	const [useSpecificSeed, setUseSpecificSeed] = useState(false);
	const [steps, setSteps] = useState(40);
	const [useSpecificSteps, setUseSpecificSteps] = useState(false);

	// 이미지 프롬프트 자동 생성
	const handleGenerateImagePrompt = async () => {
		const { model } = data.step1;
		const { personaInfo } = data.step2;

		if (!personaInfo.trim()) {
			throw new Error("2단계에서 페르소나 정보를 먼저 생성해주세요.");
		}

		const prompt = formatPrompt(PERSONA_PROMPTS.IMAGE_PROMPT_GENERATION, {
			personaInfo: imageDescription || personaInfo,
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
				temperature: 0.7,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.detail || "API 요청이 실패했습니다.");
		}

		const result = await response.json();

		if (result.success && result.content) {
			setImagePrompt(result.content.trim());
		} else {
			throw new Error(result.error || "이미지 프롬프트 생성에 실패했습니다.");
		}
	};

	// 랜덤 시드 생성
	const handleRandomSeed = () => {
		setSeed(Math.floor(Math.random() * 4294967295));
	};

	// 이미지 선택 토글
	const toggleImageSelection = (index: number) => {
		setGeneratedImages((prev) =>
			prev.map((img, i) => {
				if (i === index) {
					return { ...img, selected: !img.selected };
				} else {
					return { ...img, selected: false }; // 하나만 선택 가능
				}
			})
		);
	};

	// 이미지 다운로드 함수 (job_id 사용)
	const downloadSelectedImage = async () => {
		const selectedImage = generatedImages.find((img) => img.selected);

		if (!selectedImage) return;

		try {
			let imageBlob: Blob;

			if (selectedImage.is_base64) {
				// Base64 이미지 처리 (gpt-image-1)
				const base64Data = selectedImage.url.split(",")[1];
				const byteCharacters = atob(base64Data);
				const byteNumbers = new Array(byteCharacters.length);
				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}
				const byteArray = new Uint8Array(byteNumbers);
				imageBlob = new Blob([byteArray], { type: "image/png" });
			} else {
				// URL 이미지 처리 (flux-dev) - 백엔드 프록시를 통해 다운로드
				const response = await fetch("/api/v1/image-generator/download-image", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("access_token")}`,
					},
					body: JSON.stringify({
						image_url: selectedImage.url,
					}),
				});

				if (!response.ok) {
					throw new Error("이미지 다운로드에 실패했습니다.");
				}

				imageBlob = await response.blob();
			}

			// job_id를 파일명으로 사용
			const filename = selectedImage.job_id
				? `${selectedImage.job_id}.png`
				: `image_${Date.now()}.png`;

			// 다운로드 실행
			const url = window.URL.createObjectURL(imageBlob);
			const link = document.createElement("a");
			link.href = url;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("이미지 다운로드 오류:", error);
			setError("이미지 다운로드 중 오류가 발생했습니다.");
		}
	};

	// 그리드 클래스 동적 생성 함수
	const getGridClass = (imageCount: number) => {
		switch (imageCount) {
			case 1:
				return "grid grid-cols-1 gap-4 justify-items-center";
			case 2:
				return "grid grid-cols-1 sm:grid-cols-2 gap-4";
			case 3:
				return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";
			case 4:
			default:
				return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4";
		}
	};

	// 이미지 생성 (job_id 지원)
	const handleGenerateImages = async () => {
		if (!imagePrompt.trim()) {
			setError("이미지 프롬프트를 입력해주세요.");
			return;
		}

		setIsGenerating(true);
		setError(null);
		setGeneratedImages([]);

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 300000); // 5분 타임아웃

			if (selectedImageModel === "flux-dev") {
				// 각 이미지마다 별도 API 호출 (개별 job_id 생성)
				const apiCalls = [];
				const seedValues = [];

				for (let i = 0; i < batchSize; i++) {
					const randomSeed =
						useSpecificSeed && seed !== null
							? seed
							: Math.floor(Math.random() * 4294967295);
					seedValues.push(randomSeed);

					const requestData = {
						prompt: imagePrompt,
						batch_size: 1, // 개별 생성
						model: selectedImageModel,
						steps: useSpecificSteps ? steps : 40,
						seed: randomSeed,
						save_to_backend: false,
					};

					apiCalls.push(
						fetch("/api/v1/image-generator/generate", {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${localStorage.getItem("access_token")}`,
							},
							body: JSON.stringify(requestData),
							signal: controller.signal,
						}).then((response) => response.json())
					);
				}

				const results = await Promise.all(apiCalls);
				clearTimeout(timeoutId);

				const generatedImagesData: GeneratedImageWithJobId[] = [];
				for (let i = 0; i < results.length; i++) {
					const result = results[i];
					if (result.success && result.images && result.images.length > 0) {
						const img = result.images[0];
						generatedImagesData.push({
							...img,
							selected: false,
							prompt: imagePrompt,
							modelName: selectedImageModel,
							seed: seedValues[i],
							steps: useSpecificSteps ? steps : 40,
							is_base64: false,
							job_id: result.job_id, // job_id 저장
						});
					}
				}
				setGeneratedImages(generatedImagesData);
			} else {
				// GPT-Image-1의 경우
				const requestData = {
					prompt: imagePrompt,
					batch_size: batchSize,
					model: selectedImageModel,
					save_to_backend: false,
				};

				const response = await fetch("/api/v1/image-generator/generate", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("access_token")}`,
					},
					body: JSON.stringify(requestData),
					signal: controller.signal,
				});

				clearTimeout(timeoutId);
				const result = await response.json();

				if (!response.ok) {
					throw new Error(result.detail || "이미지 생성 요청이 실패했습니다.");
				}

				if (result.success) {
					const imagesWithSelection = (result.images || []).map((img: any) => ({
						...img,
						selected: false,
						prompt: imagePrompt,
						modelName: selectedImageModel,
						steps: undefined,
						seed: undefined,
						is_base64:
							selectedImageModel === "gpt-image-1" &&
							img.url?.startsWith("data:image"),
						job_id: result.job_id, // GPT도 job_id 저장
					}));
					setGeneratedImages(imagesWithSelection);
				} else {
					throw new Error(result.error || "알 수 없는 오류가 발생했습니다.");
				}
			}
		} catch (error) {
			console.error("이미지 생성 오류:", error);

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

	// 4단계 완료 (job_id 포함)
	const handleComplete = () => {
		const selectedImage = generatedImages.find((img) => img.selected);

		if (!selectedImage) {
			setError("이미지를 선택해주세요.");
			return;
		}

		// 4단계 데이터 저장 (job_id 포함)
		updateData("step4", {
			imageDescription,
			imagePrompt,
			generatedImages: generatedImages.map((img) => img.url),
			selectedImage: selectedImage.url,
			selectedImageJobId: selectedImage.job_id, // job_id 저장
		});

		// 5단계로 이동
		setCurrentStep(5);
	};

	return (
		<div className="space-y-6">
			{/* 3단계 요약/태그 표시 */}
			<Card className="border-blue-200 bg-blue-50">
				<CardHeader>
					<CardTitle className="text-lg text-blue-800">
						3단계에서 생성된 요약/태그
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<div>
							<span className="font-medium">요약:</span> {data.step3.summary}
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">태그:</span>
							<div className="flex flex-wrap gap-1">
								{data.step3.tags.map((tag, index) => (
									<span
										key={index}
										className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
									>
										{tag}
									</span>
								))}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 이미지 설명 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">이미지에 대한 설명</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						value={imageDescription}
						onChange={(e) => setImageDescription(e.target.value)}
						className="min-h-[120px]"
						placeholder="이미지 생성에 참고할 페르소나의 특징을 설명해주세요..."
					/>
				</CardContent>
			</Card>

			{/* 이미지 프롬프트 생성 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center justify-between">
						이미지 프롬프트
						<LLMGenerationButton
							onGenerate={handleGenerateImagePrompt}
							disabled={!imageDescription.trim()}
							variant="outline"
							size="sm"
						>
							자동생성
						</LLMGenerationButton>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						value={imagePrompt}
						onChange={(e) => setImagePrompt(e.target.value)}
						className="min-h-[120px]"
						placeholder="영어로 된 이미지 생성 프롬프트가 여기에 표시됩니다..."
					/>
				</CardContent>
			</Card>

			{/* 이미지 생성 설정 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">이미지 생성 설정</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* 모델 선택 */}
					<div>
						<Label className="text-sm font-medium mb-3 block">생성 모델</Label>
						<div className="flex gap-2">
							{["flux-dev", "gpt-image-1"].map((model) => (
								<Button
									key={model}
									type="button"
									variant={selectedImageModel === model ? "default" : "outline"}
									onClick={() =>
										setSelectedImageModel(model as "flux-dev" | "gpt-image-1")
									}
									size="sm"
								>
									{model}
								</Button>
							))}
						</div>
					</div>

					{/* 이미지 개수 선택 - 버튼 형태 */}
					<div>
						<Label className="text-sm font-medium mb-3 block">
							생성할 이미지 개수
						</Label>
						<div className="flex gap-2">
							{[1, 2, 3, 4].map((count) => (
								<Button
									key={count}
									type="button"
									variant={batchSize === count ? "default" : "outline"}
									onClick={() => setBatchSize(count)}
									size="sm"
									className="min-w-[2.5rem]"
								>
									{count}
								</Button>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 고급 설정 (flux-dev만) */}
			{selectedImageModel === "flux-dev" && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">고급 설정 (Flux-dev 전용)</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* 스텝 설정 */}
						<div className="flex items-center space-x-2">
							<Checkbox
								id="useSpecificSteps"
								checked={useSpecificSteps}
								onCheckedChange={(checked: boolean) =>
									setUseSpecificSteps(!!checked)
								}
							/>
							<Label htmlFor="useSpecificSteps" className="text-sm font-medium">
								Step 지정하기 (기본: 40)
							</Label>
						</div>
						{useSpecificSteps && (
							<div>
								<Label className="text-sm font-medium">스텝 값</Label>
								<Input
									type="number"
									min="1"
									max="100"
									value={steps}
									onChange={(e) => setSteps(parseInt(e.target.value))}
									className="w-full mt-1"
								/>
							</div>
						)}

						{/* 시드 설정 */}
						<div className="flex items-center space-x-2">
							<Checkbox
								id="useSpecificSeed"
								checked={useSpecificSeed}
								onCheckedChange={(checked: boolean) =>
									setUseSpecificSeed(!!checked)
								}
							/>
							<Label htmlFor="useSpecificSeed" className="text-sm font-medium">
								Seed 지정하기 (체크 해제 시 각각 랜덤)
							</Label>
						</div>
						{useSpecificSeed && (
							<div>
								<Label className="text-sm font-medium">시드 값</Label>
								<div className="flex mt-1">
									<Input
										type="number"
										value={seed !== null ? seed : ""}
										onChange={(e) =>
											setSeed(e.target.value ? parseInt(e.target.value) : null)
										}
										className="flex-1 rounded-r-none"
										placeholder="시드 값 입력"
									/>
									<Button
										type="button"
										onClick={handleRandomSeed}
										variant="outline"
										className="rounded-l-none"
										title="랜덤 시드 생성"
									>
										🎲
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* 이미지 생성 버튼 */}
			<div className="flex justify-center">
				<Button
					onClick={handleGenerateImages}
					disabled={isGenerating || !imagePrompt.trim()}
					className="px-8 py-2"
				>
					{isGenerating ? (
						<>
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
							이미지 생성 중...
						</>
					) : (
						<>
							<ImageIcon className="h-4 w-4 mr-2" />
							이미지 생성
						</>
					)}
				</Button>
			</div>

			{/* 오류 메시지 */}
			{error && (
				<div className="text-red-500 text-sm p-3 bg-red-50 rounded border border-red-200">
					{error}
				</div>
			)}

			{/* 생성된 이미지 표시 */}
			{generatedImages.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">생성된 이미지</CardTitle>
					</CardHeader>
					<CardContent>
						<div className={getGridClass(generatedImages.length)}>
							{generatedImages.map((image, index) => (
								<div key={index} className="relative">
									<div className="relative group">
										<img
											src={image.url}
											alt={`Generated image ${index + 1}`}
											className={`w-full h-auto rounded-lg border-2 cursor-pointer transition-all duration-200 ${
												image.selected
													? "ring-4 ring-blue-500 ring-offset-2"
													: "hover:ring-2 hover:ring-gray-300"
											}`}
											onClick={() => toggleImageSelection(index)}
										/>
									</div>
									{/* 시드값 표시 */}
									{image.seed !== undefined &&
										selectedImageModel === "flux-dev" && (
											<div className="mt-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm">
												Seed: {image.seed}
											</div>
										)}
								</div>
							))}
						</div>

						{/* 이미지 저장 버튼 */}
						{generatedImages.some((img) => img.selected) && (
							<div className="flex justify-center mt-4">
								<Button
									onClick={downloadSelectedImage}
									variant="outline"
									className="px-6 py-2"
								>
									<ImageIcon className="h-4 w-4 mr-2" />
									이미지 저장
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* 완료 버튼 */}
			<div className="flex justify-end">
				<Button
					onClick={handleComplete}
					disabled={!generatedImages.some((img) => img.selected)}
					className="bg-green-600 hover:bg-green-700 px-8 py-2"
					size="lg"
				>
					<Check className="h-4 w-4 mr-2" />
					이미지 선택 완료
				</Button>
			</div>
		</div>
	);
}
