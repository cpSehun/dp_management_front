"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import React from "react";

// 모델 타입 정의
interface Model {
	name: string;
	description: string;
}

// 프롬프트 타입 정의
interface PromptVersion {
	id: number;
	content: string;
	createdAt: string;
	isActive: boolean;
}

interface Prompt {
	id: number;
	name: string;
	description: string;
	versions: PromptVersion[];
	currentVersion: number;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

// 생성된 이미지 타입 정의
interface GeneratedImage {
	url: string;
	filename: string;
	original_url?: string;
	selected: boolean;
	seed?: number;
	steps?: number;
}

// 샘플 이미지 프롬프트
const sampleImagePrompts: Prompt[] = [
	{
		id: 1,
		name: "비즈니스 프로페셔널",
		description: "전문적인 비즈니스 인물 이미지 생성 프롬프트",
		versions: [
			{
				id: 1,
				content:
					"30대 남성, 정장 차림, 깔끔한 헤어스타일, 사무실 배경, 전문적인 표정, 고품질 사진, 자연스러운 조명",
				createdAt: "2023-07-15T09:30:00Z",
				isActive: false,
			},
			{
				id: 2,
				content:
					"30대 남성, 정장 차림, 깔끔한 헤어스타일, 현대적인 사무실 배경, 자신감 있는 표정, 프로페셔널한 분위기, 고품질 초상화, 소프트 스튜디오 조명",
				createdAt: "2023-08-20T14:15:00Z",
				isActive: true,
			},
		],
		currentVersion: 2,
		tags: ["비즈니스", "전문가", "남성", "정장"],
		createdAt: "2023-07-15T09:30:00Z",
		updatedAt: "2023-08-20T14:15:00Z",
	},
	{
		id: 2,
		name: "크리에이티브 디자이너",
		description: "창의적인 디자이너 페르소나 이미지 생성",
		versions: [
			{
				id: 1,
				content:
					"20대 여성, 캐주얼하고 트렌디한 의상, 창의적인 작업 공간, 컬러풀한 배경, 태블릿으로 작업 중, 예술적인 분위기, 자연광",
				createdAt: "2023-07-20T11:45:00Z",
				isActive: true,
			},
		],
		currentVersion: 1,
		tags: ["디자이너", "창의적", "캐주얼", "여성"],
		createdAt: "2023-07-20T11:45:00Z",
		updatedAt: "2023-07-20T11:45:00Z",
	},
	{
		id: 3,
		name: "의료 전문가",
		description: "의사 또는 간호사 페르소나 이미지 생성",
		versions: [
			{
				id: 1,
				content:
					"40대 여성, 흰색 의사 가운, 청진기, 병원 배경, 진지한 표정, 고해상도 사진",
				createdAt: "2023-08-05T17:20:00Z",
				isActive: false,
			},
			{
				id: 2,
				content:
					"40대 여성, 흰색 의사 가운, 청진기, 현대적인 의료 시설 배경, 따뜻하고 신뢰감 있는 표정, 전문적인 분위기, 부드러운 조명으로 촬영된 초상화",
				createdAt: "2023-09-10T13:10:00Z",
				isActive: true,
			},
		],
		currentVersion: 2,
		tags: ["의사", "의료", "여성", "전문가"],
		createdAt: "2023-08-05T17:20:00Z",
		updatedAt: "2023-09-10T13:10:00Z",
	},
];

export default function ImageGeneratorPage() {
	const [prompt, setPrompt] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [seed, setSeed] = useState<number | null>(() => {
		// 초기 시드값 생성 (랜덤)
		return Math.floor(Math.random() * 4294967295);
	});
	const [useSpecificSeed, setUseSpecificSeed] = useState(false);
	const [steps, setSteps] = useState(40);
	const [useSpecificSteps, setUseSpecificSteps] = useState(false);
	const [batchSize, setBatchSize] = useState(1);
	const [models, setModels] = useState<Model[]>([]);
	const [selectedModel, setSelectedModel] = useState<string>("flux-dev");
	const [isLoadingModels, setIsLoadingModels] = useState(false);

	// 프롬프트 관련 상태 추가
	const [imagePrompts, setImagePrompts] =
		useState<Prompt[]>(sampleImagePrompts);
	const [filteredImagePrompts, setFilteredImagePrompts] =
		useState<Prompt[]>(sampleImagePrompts);
	const [imagePromptSearch, setImagePromptSearch] = useState("");
	const [selectedImagePrompt, setSelectedImagePrompt] = useState<Prompt | null>(
		null
	);
	const [useCustomPrompt, setUseCustomPrompt] = useState(false);

	// 선택된 이미지 저장 관련 상태
	const [isSaving, setIsSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);

	// 모델에 따라 일부 옵션이 지원되는지 확인하는 함수
	const isOptionSupported = (option: string): boolean => {
		if (selectedModel === "gpt-image-1") {
			// gpt-image-1 모델은 시드와 스텝 옵션을 지원하지 않음
			if (option === "seed" || option === "steps") {
				return false;
			}
		}
		return true;
	};

	// 모델 목록 가져오기
	useEffect(() => {
		const fetchModels = async () => {
			setIsLoadingModels(true);
			try {
				const response = await fetch("/api/v1/image-generator/models", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("access_token")}`,
					},
				});

				if (response.ok) {
					const data = await response.json();
					setModels(data);
					console.log("사용 가능한 모델:", data);
				} else {
					console.error("모델 목록을 가져오는데 실패했습니다");
				}
			} catch (error) {
				console.error("모델 목록 가져오기 오류:", error);
			} finally {
				setIsLoadingModels(false);
			}
		};

		fetchModels();
	}, []);

	// 이미지 프롬프트 필터링
	useEffect(() => {
		if (!imagePromptSearch || imagePromptSearch.trim() === "") {
			// 검색어가 없으면 모든 프롬프트 표시
			setFilteredImagePrompts([...imagePrompts]);
		} else {
			const lowercasedSearch = imagePromptSearch.toLowerCase();
			const filtered = imagePrompts.filter((prompt) => {
				const nameMatch = prompt.name.toLowerCase().includes(lowercasedSearch);
				const descMatch = prompt.description
					.toLowerCase()
					.includes(lowercasedSearch);
				const tagMatch = prompt.tags.some((tag) =>
					tag.toLowerCase().includes(lowercasedSearch)
				);
				const contentMatch = prompt.versions.some((version) =>
					version.content.toLowerCase().includes(lowercasedSearch)
				);

				return nameMatch || descMatch || tagMatch || contentMatch;
			});
			setFilteredImagePrompts(filtered);
		}
	}, [imagePromptSearch, imagePrompts]);

	const handleRandomSeed = () => {
		// 랜덤 시드 생성 (0 ~ 2^32-1 사이)
		setSeed(Math.floor(Math.random() * 4294967295));
	};

	// 이미지 프롬프트 선택 처리
	const handleSelectImagePrompt = (promptName: string) => {
		const prompt = imagePrompts.find((p) => p.name === promptName);
		if (!prompt) return;

		setSelectedImagePrompt(prompt);
		// 선택한 프롬프트의 활성 버전 찾기
		const activeVersion = prompt.versions.find((v) => v.isActive);
		if (activeVersion) {
			setPrompt(activeVersion.content);
		}
	};

	// 이미지 선택 토글
	const toggleImageSelection = (index: number) => {
		setGeneratedImages((prev) =>
			prev.map((img, i) =>
				i === index ? { ...img, selected: !img.selected } : img
			)
		);
	};

	// 시드값 클립보드에 복사
	const copySeedToClipboard = (seed: number | undefined) => {
		if (seed !== undefined) {
			navigator.clipboard
				.writeText(seed.toString())
				.then(() => {
					// 복사 성공 피드백을 위한 임시 상태 설정 가능
					console.log("시드값이 클립보드에 복사되었습니다:", seed);
				})
				.catch((err) => {
					console.error("클립보드 복사 실패:", err);
				});
		}
	};

	// 선택된 이미지 저장
	const saveSelectedImages = async () => {
		const selectedImages = generatedImages.filter((img) => img.selected);

		if (selectedImages.length === 0) {
			setError("저장할 이미지를 선택해주세요.");
			return;
		}

		setIsSaving(true);
		setSaveSuccess(false);
		setError(null);

		try {
			// 선택된 이미지를 백엔드에 저장하는 API 호출
			const response = await fetch("/api/v1/images/save", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("access_token")}`,
				},
				body: JSON.stringify({
					images: selectedImages,
					prompt: prompt,
					model: selectedModel,
				}),
			});

			if (!response.ok) {
				throw new Error("이미지 저장에 실패했습니다.");
			}

			const data = await response.json();
			console.log("저장 결과:", data);
			setSaveSuccess(true);
		} catch (error) {
			console.error("이미지 저장 오류:", error);
			setError(
				error instanceof Error
					? error.message
					: "이미지 저장 중 오류가 발생했습니다."
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!prompt.trim()) return;

		setIsGenerating(true);
		setError(null);
		setGeneratedImages([]);
		setSaveSuccess(false);

		try {
			// 타임아웃을 5분(300초)으로 설정하는 AbortController
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 300000);

			// Flux-dev 모델에서만 시드 처리 추가
			if (selectedModel === "flux-dev") {
				// 사용할 스텝 값 결정 (특정 스텝 사용 체크되지 않으면 기본값 40 사용)
				const stepsToUse = useSpecificSteps ? steps : 40;

				if (useSpecificSeed) {
					// 특정 시드를 사용하는 경우
					// 요청 데이터 준비
					const requestData: any = {
						prompt: prompt,
						batch_size: batchSize,
						model: selectedModel,
						steps: stepsToUse,
						seed: seed,
						save_to_backend: false, // 백엔드에 즉시 저장하지 않음
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

					clearTimeout(timeoutId); // 응답이 왔으면 타임아웃 취소

					const data = await response.json();

					if (!response.ok) {
						throw new Error(data.detail || "이미지 생성 요청이 실패했습니다.");
					}

					if (data.success) {
						// 생성된 모든 이미지에 시드값과 스텝값 추가
						const imagesWithMetadata = (data.images || []).map((img: any) => ({
							...img,
							selected: false,
							seed: seed,
							steps: stepsToUse,
						}));
						setGeneratedImages(imagesWithMetadata);
					} else {
						throw new Error(data.error || "알 수 없는 오류가 발생했습니다.");
					}
				} else {
					// 랜덤 시드를 사용하는 경우, 각 이미지마다 다른 시드 사용
					// 각 이미지 별로 다른 API 호출 (batchSize 만큼 반복)
					const apiCalls: Promise<any>[] = [];
					const seedValues: number[] = [];

					for (let i = 0; i < batchSize; i++) {
						// 각 이미지마다 새로운 랜덤 시드 생성
						const randomSeed = Math.floor(Math.random() * 4294967295);
						seedValues.push(randomSeed);

						const requestData: any = {
							prompt: prompt,
							batch_size: 1, // 한 번에 하나만 생성
							model: selectedModel,
							steps: stepsToUse,
							seed: randomSeed,
							save_to_backend: false, // 백엔드에 즉시 저장하지 않음
						};

						apiCalls.push(
							fetch("/api/v1/image-generator/generate", {
								method: "POST",
								headers: {
									"Content-Type": "application/json",
									Authorization: `Bearer ${localStorage.getItem(
										"access_token"
									)}`,
								},
								body: JSON.stringify(requestData),
								signal: controller.signal,
							}).then((response) => response.json())
						);
					}

					const results = await Promise.all(apiCalls);
					clearTimeout(timeoutId);

					// 각 결과를 처리하여 이미지 데이터에 추가
					const generatedImagesData: GeneratedImage[] = [];
					for (let i = 0; i < results.length; i++) {
						const result = results[i];
						if (result.success && result.images && result.images.length > 0) {
							const img = result.images[0];
							generatedImagesData.push({
								...img,
								selected: false,
								seed: seedValues[i], // 각 이미지의 시드값 저장
								steps: stepsToUse, // 사용된 스텝값 저장
							});
						}
					}

					setGeneratedImages(generatedImagesData);
				}
			} else {
				// 다른 모델(예: GPT-Image-1)의 경우 기존 로직 유지하되 저장 옵션 추가
				const requestData: any = {
					prompt: prompt,
					batch_size: batchSize,
					model: selectedModel,
					save_to_backend: false, // 백엔드에 즉시 저장하지 않음
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

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.detail || "이미지 생성 요청이 실패했습니다.");
				}

				if (data.success) {
					const imagesWithSelection = (data.images || []).map((img: any) => ({
						...img,
						selected: false,
					}));
					setGeneratedImages(imagesWithSelection);
				} else {
					throw new Error(data.error || "알 수 없는 오류가 발생했습니다.");
				}
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
								{/* 모델 선택 UI 추가 */}
								<div className="space-y-2">
									<label className="text-sm font-medium">생성 모델</label>
									<div className="flex flex-wrap gap-2">
										{isLoadingModels ? (
											<div className="text-sm text-gray-500">
												모델 목록 로딩 중...
											</div>
										) : (
											models.map((model) => (
												<Button
													key={model.name}
													type="button"
													variant={
														selectedModel === model.name ? "default" : "outline"
													}
													onClick={() => setSelectedModel(model.name)}
													className="flex-grow-0"
													title={model.description}
												>
													{model.name}
												</Button>
											))
										)}
									</div>
								</div>

								{/* 프롬프트 입력 부분에 프롬프트 선택 UI 추가 */}
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<label className="text-sm font-medium">프롬프트</label>
										<div className="flex items-center gap-2">
											<Checkbox
												id="useCustomPrompt"
												checked={useCustomPrompt}
												onCheckedChange={(checked) =>
													setUseCustomPrompt(!!checked)
												}
											/>
											<Label htmlFor="useCustomPrompt" className="text-sm">
												직접 입력
											</Label>
										</div>
									</div>

									{useCustomPrompt ? (
										<textarea
											placeholder="생성하고 싶은 이미지를 자세히 설명해주세요..."
											value={prompt}
											onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
												setPrompt(e.target.value)
											}
											className="min-h-[120px] w-full border border-gray-300 rounded-md px-3 py-2"
										/>
									) : (
										<div className="space-y-4">
											<Popover>
												<PopoverTrigger asChild>
													<Button
														variant="outline"
														role="combobox"
														className="w-full justify-between"
													>
														{selectedImagePrompt
															? selectedImagePrompt.name
															: `이미지 프롬프트 선택... (${filteredImagePrompts.length})`}
														<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
													</Button>
												</PopoverTrigger>
												<PopoverContent className="w-[400px] p-0">
													<Command>
														<CommandInput
															placeholder="프롬프트 검색..."
															value={imagePromptSearch}
															onValueChange={setImagePromptSearch}
														/>
														{filteredImagePrompts.length === 0 ? (
															<CommandEmpty>검색 결과가 없습니다</CommandEmpty>
														) : (
															<CommandGroup>
																<CommandList className="max-h-[300px] overflow-y-auto">
																	{filteredImagePrompts.map((promptItem) => (
																		<CommandItem
																			key={promptItem.id}
																			value={promptItem.name}
																			onSelect={handleSelectImagePrompt}
																		>
																			<Check
																				className={cn(
																					"mr-2 h-4 w-4",
																					selectedImagePrompt?.id ===
																						promptItem.id
																						? "opacity-100"
																						: "opacity-0"
																				)}
																			/>
																			<div className="flex flex-col">
																				<span>{promptItem.name}</span>
																				<span className="text-xs text-muted-foreground">
																					{promptItem.description}
																				</span>
																			</div>
																		</CommandItem>
																	))}
																</CommandList>
															</CommandGroup>
														)}
													</Command>
												</PopoverContent>
											</Popover>

											{selectedImagePrompt && (
												<div className="border rounded-md p-3 bg-muted/30">
													<div className="text-sm mb-1 font-medium">
														{selectedImagePrompt.name}
													</div>
													<div className="text-xs text-muted-foreground mb-2">
														{
															selectedImagePrompt.versions.find(
																(v) => v.isActive
															)?.content
														}
													</div>
												</div>
											)}
										</div>
									)}
								</div>

								{/* 스텝과 시드는 해당 모델이 지원할 때만 표시 */}
								{isOptionSupported("steps") && isOptionSupported("seed") && (
									<div className="space-y-3">
										{/* 스텝 설정 UI */}
										<div className="flex items-center space-x-2">
											<Checkbox
												id="useSpecificSteps"
												checked={useSpecificSteps}
												onCheckedChange={(checked) =>
													setUseSpecificSteps(!!checked)
												}
											/>
											<Label
												htmlFor="useSpecificSteps"
												className="text-sm font-medium"
											>
												Step 지정하기
											</Label>
											<span className="text-xs text-gray-500 ml-2"></span>
										</div>

										{useSpecificSteps ? (
											<div>
												<label className="text-sm font-medium">스텝 값</label>
												<input
													type="number"
													min="1"
													max="100"
													value={steps}
													onChange={(e) => setSteps(parseInt(e.target.value))}
													className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
												/>
											</div>
										) : (
											<div className="text-xs text-gray-500 pl-6">
												Default:40 으로 생성됩니다.
											</div>
										)}

										{/* 시드 설정 UI */}
										<div className="flex items-center space-x-2">
											<Checkbox
												id="useSpecificSeed"
												checked={useSpecificSeed}
												onCheckedChange={(checked) =>
													setUseSpecificSeed(!!checked)
												}
											/>
											<Label
												htmlFor="useSpecificSeed"
												className="text-sm font-medium"
											>
												Seed 지정하기
											</Label>
										</div>

										{useSpecificSeed ? (
											<div>
												<label className="text-sm font-medium">시드 값</label>
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
														placeholder="시드 값 입력"
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
										) : (
											<div className="text-xs text-gray-500 pl-6">
												Random 시드값으로 생성됩니다.
											</div>
										)}
									</div>
								)}

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
						<CardTitle className="flex justify-between items-center">
							<span>생성된 이미지</span>
							{generatedImages.length > 0 && (
								<Button
									onClick={saveSelectedImages}
									disabled={
										isSaving || !generatedImages.some((img) => img.selected)
									}
									size="sm"
									variant="outline"
								>
									{isSaving ? "저장 중..." : "선택 이미지 저장"}
								</Button>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col items-center min-h-[300px] bg-muted/20 rounded-md">
						{isGenerating ? (
							<div className="text-center">
								<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
								<p className="text-gray-500">이미지 생성 중...</p>
							</div>
						) : generatedImages.length > 0 ? (
							<div className="flex flex-col items-center w-full">
								{saveSuccess && (
									<div className="w-full mb-4 p-2 bg-green-50 text-green-700 border border-green-200 rounded text-sm text-center">
										선택한 이미지가 성공적으로 저장되었습니다.
									</div>
								)}
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
											<div className="relative min-h-[200px] flex items-center justify-center group">
												<div
													className="absolute top-2 left-2 z-10"
													onClick={() => toggleImageSelection(index)}
												>
													<Checkbox
														checked={image.selected}
														className="h-5 w-5 border-2 bg-white data-[state=checked]:bg-blue-500"
													/>
												</div>
												<img
													src={image.url}
													alt={`생성된 이미지 ${index + 1}`}
													className={`max-w-full max-h-[300px] rounded-md shadow-md cursor-pointer transition-all ${
														image.selected ? "ring-2 ring-blue-500" : ""
													}`}
													onClick={() => toggleImageSelection(index)}
												/>
											</div>

											{/* 시드값 표시 */}
											{image.seed !== undefined && (
												<div
													className="mt-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200"
													onClick={() => copySeedToClipboard(image.seed)}
													title="클릭하여 시드값 복사"
												>
													Seed: {image.seed}
												</div>
											)}

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
						<li>
							<strong>Flux-dev</strong>: Flux + ComfyUI 기반 이미지 생성 - 스텝,
							시드 조절 가능
						</li>
						<li>
							<strong>GPT-Image-1</strong>: OpenAI의 이미지 생성 모델 - 이미지
							수만 조절 가능
						</li>
						<li>자세한 설명을 추가할수록 더 정확한 이미지가 생성됩니다.</li>
						<li>색상, 스타일, 분위기 등을 구체적으로 명시하세요.</li>
						<li>배경, 시점, 조명 등의 요소도 고려하여 작성하면 좋습니다.</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
