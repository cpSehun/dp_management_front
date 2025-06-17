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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// 모델 타입 정의
interface Model {
	name: string;
	description: string;
}

// 프롬프트 타입 정의
interface PromptVersion {
	id: number;
	content: string;
	created_at: string;
	version: number;
}

interface Prompt {
	id: number;
	name: string;
	image_prompt: string;
	version: number; // 메인 프롬프트의 현재 활성 버전
	versions: PromptVersion[];
	tags: string[];
	created_at: string;
	updated_at: string;
	created_by: number | null;
}

// PaginatedPromptsResponse 인터페이스 추가
interface PaginatedPromptsResponse {
	total_items: number;
	items: Prompt[];
}

// 생성된 이미지 타입 정의
interface GeneratedImage {
	url: string; // 이 URL은 생성 후 백엔드에서 받은 ComfyUI/OpenAI URL 또는 S3 저장 후의 URL이 될 수 있음
	filename?: string; // 로컬 다운로드용 파일명이었으나, S3 저장 후에는 S3가 반환하는 객체 키나 파일명이 될 수 있음. 선택적 필드로 변경.
	original_url?: string; // ComfyUI 또는 OpenAI의 원본 이미지 URL (S3 저장 시 이 URL 사용)
	selected: boolean;
	seed?: number;
	steps?: number;
	prompt: string; // 이미지 생성 시 사용된 프롬프트
	modelName: string; // 이미지 생성 시 사용된 모델명
	is_base64: boolean; // URL이 base64 데이터인지 여부
}

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
	const [selectedModel, setSelectedModel] = useState<
		"flux-dev" | "gpt-image-1" | string
	>("flux-dev");
	const [isLoadingModels, setIsLoadingModels] = useState(false);
	const [isLoadingImagePrompts, setIsLoadingImagePrompts] = useState(false); // 프롬프트 로딩 상태 추가

	// 프롬프트 관련 상태 추가
	const [imagePrompts, setImagePrompts] = useState<Prompt[]>([]); // API로부터 받을 프롬프트 목록 (초기값 빈 배열)
	const [filteredImagePrompts, setFilteredImagePrompts] = useState<Prompt[]>(
		[]
	); // 필터링된 프롬프트 목록 (초기값 빈 배열)
	const [imagePromptSearch, setImagePromptSearch] = useState("");
	const [selectedImagePrompt, setSelectedImagePrompt] = useState<Prompt | null>(
		null
	);
	const [useCustomPrompt, setUseCustomPrompt] = useState(false);

	// 선택된 이미지 저장 관련 상태
	const [isSaving, setIsSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);

	// S3 저장 확인 다이얼로그 관련 상태
	const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
	const [imageToConfirm, setImageToConfirm] = useState<GeneratedImage | null>(
		null
	);
	const [confirmImageName, setConfirmImageName] = useState("");
	const [confirmImageTags, setConfirmImageTags] = useState(""); // 쉼표로 구분된 태그 문자열

	// 모델에 따라 일부 옵션이 지원되는지 확인하는 함수
	const isOptionSupported = (option: string): boolean => {
		// 특정 모델에서 특정 옵션이 지원되지 않는 경우 처리
		if (
			selectedModel === "gpt-image-1" &&
			(option === "seed" || option === "steps")
		) {
			return false;
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

	// 이미지 프롬프트 목록 가져오기 (DB 연동 후)
	useEffect(() => {
		const fetchImagePrompts = async () => {
			setIsLoadingImagePrompts(true);
			setImagePrompts([]); // 기존 목록 초기화
			setFilteredImagePrompts([]);
			try {
				const token = localStorage.getItem("access_token");
				if (!token) {
					console.error("Access token not found. Cannot fetch image prompts.");
					return;
				}

				// 모든 프롬프트를 가져오기 위해 limit=1000 추가
				const response = await fetch("/api/v1/prompts/image?limit=1000", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					console.error("Failed to fetch image prompts:", errorData);
					throw new Error(errorData.detail || "Failed to fetch image prompts");
				}

				const responseData: PaginatedPromptsResponse = await response.json();

				if (
					!responseData ||
					!responseData.items ||
					!Array.isArray(responseData.items)
				) {
					console.error(
						"API responseData.items is not an array or responseData is invalid:",
						responseData
					);
					setImagePrompts([]);
					setFilteredImagePrompts([]);
					return;
				}

				const fetchedPrompts: Prompt[] = responseData.items.map((item: any) => {
					console.log("Raw API item:", item); // 실제 데이터 구조 확인
					return {
						id: item.id,
						name: item.name,
						image_prompt: item.llm_prompt, // llm_prompt를 image_prompt로 매핑
						version: item.version, // 메인 프롬프트의 현재 활성 버전
						versions: Array.isArray(item.versions)
							? item.versions.map((v: any) => ({
									id: v.id,
									version: v.version,
									content: v.llm_prompt, // llm_prompt를 content로 매핑
									created_at: v.created_at,
							  }))
							: [],
						tags: Array.isArray(item.tags) ? item.tags : [],
						created_at: item.created_at,
						updated_at: item.updated_at,
						created_by: item.created_by,
					};
				});

				setImagePrompts(fetchedPrompts);
				setFilteredImagePrompts(fetchedPrompts);
			} catch (error) {
				console.error("Error fetching image prompts:", error);
				// 에러 발생 시 빈 배열로 설정
				setImagePrompts([]);
				setFilteredImagePrompts([]);
			} finally {
				setIsLoadingImagePrompts(false);
			}
		};

		fetchImagePrompts();
	}, []);

	// 이미지 프롬프트 필터링
	useEffect(() => {
		if (!imagePromptSearch || imagePromptSearch.trim() === "") {
			// 검색어가 없으면 모든 프롬프트 표시
			setFilteredImagePrompts([...imagePrompts]);
		} else {
			const lowercasedSearch = imagePromptSearch.toLowerCase();
			const filtered = imagePrompts.filter((prompt) => {
				const nameMatch =
					prompt.name?.toLowerCase().includes(lowercasedSearch) || false;
				const descMatch =
					prompt.image_prompt?.toLowerCase().includes(lowercasedSearch) ||
					false;
				const tagMatch =
					prompt.tags && Array.isArray(prompt.tags)
						? prompt.tags.some((tag) =>
								tag?.toLowerCase().includes(lowercasedSearch)
						  )
						: false;
				const contentMatch =
					prompt.versions && Array.isArray(prompt.versions)
						? prompt.versions.some((version) =>
								version.content?.toLowerCase().includes(lowercasedSearch)
						  )
						: false;

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
		console.log("프롬프트 선택:", promptName);
		const prompt = imagePrompts.find((p) => p.name === promptName);
		if (!prompt) {
			console.log("프롬프트를 찾을 수 없음:", promptName);
			return;
		}

		console.log("선택된 프롬프트 전체:", prompt);
		console.log("선택된 프롬프트 현재 버전:", prompt.version);

		setSelectedImagePrompt(prompt);

		// 현재 버전에 해당하는 버전 찾기
		const currentVersionData = prompt.versions.find(
			(v) => v.version === prompt.version
		);
		console.log("현재 버전 데이터:", currentVersionData);

		if (currentVersionData && currentVersionData.content) {
			setPrompt(currentVersionData.content);
			console.log("현재 버전 콘텐츠 설정:", currentVersionData.content);
		} else if (prompt.image_prompt) {
			// 현재 버전 데이터가 없으면 메인 프롬프트 사용
			setPrompt(prompt.image_prompt);
			console.log("메인 프롬프트 설정:", prompt.image_prompt);
		}

		// 직접 입력 모드 해제
		setUseCustomPrompt(false);
		console.log("직접 입력 모드 해제");
	};

	// 직접 입력 체크박스 변경 처리
	const handleUseCustomPromptChange = (checked: boolean) => {
		setUseCustomPrompt(checked);
		if (checked) {
			// 직접 입력 모드 활성화 시 프롬프트 내용 초기화
			setPrompt("");
			setSelectedImagePrompt(null);
			console.log("직접 입력 모드 활성화 - 내용 초기화");
		}
	};

	// 이미지 선택 토글 - 한 번에 하나의 이미지만 선택 가능하도록 수정
	const toggleImageSelection = (index: number) => {
		setGeneratedImages((prev) =>
			prev.map((img, i) => {
				if (i === index) {
					return { ...img, selected: !img.selected }; // 선택된 이미지를 다시 클릭하면 선택 해제
				} else {
					return { ...img, selected: false }; // 다른 이미지는 선택 해제
				}
			})
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

	// 선택된 이미지 저장 준비 (확인 다이얼로그 열기)
	const handleOpenSaveConfirmDialog = () => {
		const selectedImage = generatedImages.find((img) => img.selected);

		if (!selectedImage) {
			setError("저장할 이미지를 선택해주세요.");
			return;
		}

		setImageToConfirm(selectedImage);
		// 기본 이미지 이름 설정 (예: 프롬프트의 일부 또는 랜덤 생성)
		// 여기서는 간단히 'generated_image'로 하지만, 필요시 더 복잡한 로직 추가 가능
		setConfirmImageName(
			selectedImage.filename ||
				`generated_image_${new Date().getTime()}`.substring(0, 50)
		);
		setConfirmImageTags(""); // 태그 초기화
		setIsConfirmDialogOpen(true);
		setError(null);
		setSaveSuccess(false);
	};

	// 최종 S3 저장 및 DB 메타데이터 저장 로직

	const handleConfirmAndSaveToS3 = async () => {
		if (!imageToConfirm || !confirmImageName.trim()) {
			setError(
				!confirmImageName.trim()
					? "이미지 이름을 입력해주세요."
					: "저장할 이미지가 없습니다."
			);
			return;
		}

		setIsSaving(true);
		setError(null);
		setSaveSuccess(false);

		try {
			// 1단계: S3에 이미지 업로드
			const imageUrlToSave = imageToConfirm.original_url || imageToConfirm.url;
			if (!imageUrlToSave) {
				throw new Error("유효한 이미지 URL이 없습니다.");
			}

			const s3SaveResponse = await fetch(
				"/api/v1/image-generator/s3/save-images",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("access_token")}`,
					},
					body: JSON.stringify({
						image_urls: [imageUrlToSave],
					}),
				}
			);

			if (!s3SaveResponse.ok) {
				const errorData = await s3SaveResponse.json();
				throw new Error(errorData.detail || "이미지 S3 저장에 실패했습니다.");
			}

			const s3SaveResult = await s3SaveResponse.json();
			const s3Url =
				s3SaveResult.success &&
				Array.isArray(s3SaveResult.saved_s3_urls) &&
				s3SaveResult.saved_s3_urls.length > 0
					? s3SaveResult.saved_s3_urls[0]
					: null;

			if (!s3Url) {
				throw new Error(
					s3SaveResult.message ||
						"S3 URL을 받지 못했습니다. 응답 형식을 확인하세요."
				);
			}

			console.log("S3 저장 성공:", s3Url);

			// 2단계: DB에 메타데이터 저장
			const metadataToSave = {
				name: confirmImageName,
				prompt: imageToConfirm.prompt,
				model: imageToConfirm.modelName,
				s3_url: s3Url,
				tags: confirmImageTags
					.split(",")
					.map((tag) => tag.trim())
					.filter((tag) => tag)
					.join(","),
				steps:
					imageToConfirm.modelName === "flux-dev" ? imageToConfirm.steps : null,
				seed:
					imageToConfirm.modelName === "flux-dev" ? imageToConfirm.seed : null,
			};

			const dbSaveResponse = await fetch("/api/v1/images/metadata/save", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("access_token")}`,
				},
				body: JSON.stringify(metadataToSave),
			});

			if (!dbSaveResponse.ok) {
				const errorData = await dbSaveResponse.json();
				throw new Error(
					errorData.detail || "이미지 메타데이터 DB 저장에 실패했습니다."
				);
			}

			const dbSaveResult = await dbSaveResponse.json();
			console.log("DB 메타데이터 저장 성공:", dbSaveResult);

			setSaveSuccess(true);
			setIsConfirmDialogOpen(false);
			setImageToConfirm(null);
			// 저장된 이미지는 generatedImages 목록에서 선택 해제
			setGeneratedImages((prev) =>
				prev.map((img) =>
					img.url === (imageToConfirm.original_url || imageToConfirm.url)
						? { ...img, selected: false }
						: img
				)
			);
		} catch (error) {
			console.error("이미지 저장 오류:", error);
			setError(
				error instanceof Error
					? error.message
					: "이미지 저장 중 알 수 없는 오류가 발생했습니다."
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
							prompt: prompt,
							modelName: selectedModel,
							steps: stepsToUse,
							seed: seed,
							is_base64:
								selectedModel === "gpt-image-1" &&
								img.url?.startsWith("data:image"),
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
								prompt: prompt,
								modelName: selectedModel,
								seed: seedValues[i],
								steps: stepsToUse,
								is_base64:
									selectedModel === "gpt-image-1" &&
									img.url?.startsWith("data:image"),
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
						prompt: prompt,
						modelName: selectedModel,
						steps: undefined,
						seed: undefined,
						is_base64:
							selectedModel === "gpt-image-1" &&
							img.url?.startsWith("data:image"),
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
												onCheckedChange={handleUseCustomPromptChange}
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
																		<div
																			key={promptItem.id}
																			className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground"
																			onClick={() => {
																				console.log(
																					"div onClick 호출됨:",
																					promptItem.name
																				);
																				handleSelectImagePrompt(
																					promptItem.name
																				);
																			}}
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
																					{promptItem.image_prompt?.substring(
																						0,
																						100
																					)}
																					{promptItem.image_prompt?.length > 100
																						? "..."
																						: ""}
																				</span>
																			</div>
																		</div>
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
														선택된 프롬프트: {selectedImagePrompt.name}
													</div>
													<div className="text-xs text-muted-foreground mb-2">
														{selectedImagePrompt.image_prompt}
													</div>
													<div className="text-xs text-gray-500">
														현재 버전: v{selectedImagePrompt.version || "1"}
													</div>
												</div>
											)}
										</div>
									)}
								</div>

								{/* 스텝과 시드는 해당 모델이 지원할 때만 표시 */}
								{(isOptionSupported("steps") || isOptionSupported("seed")) && (
									<div className="space-y-3">
										{/* 스텝 설정 UI (isOptionSupported로 감싸기) */}
										{isOptionSupported("steps") && (
											<>
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
														<label className="text-sm font-medium">
															스텝 값
														</label>
														<input
															type="number"
															min="1"
															max="100"
															value={steps}
															onChange={(e) =>
																setSteps(parseInt(e.target.value))
															}
															className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
														/>
													</div>
												) : (
													<div className="text-xs text-gray-500 pl-6">
														Default:40 으로 생성됩니다.
													</div>
												)}
											</>
										)}

										{/* 시드 설정 UI (isOptionSupported로 감싸기) */}
										{isOptionSupported("seed") && (
											<>
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
														<label className="text-sm font-medium">
															시드 값
														</label>
														<div className="flex mt-1">
															<input
																type="number"
																value={seed !== null ? seed : ""}
																onChange={(e) =>
																	setSeed(
																		e.target.value
																			? parseInt(e.target.value)
																			: null
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
											</>
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
									onClick={handleOpenSaveConfirmDialog}
									disabled={
										// 정확히 하나의 이미지만 선택되었을 때 활성화
										isSaving ||
										generatedImages.filter((img) => img.selected).length !== 1
									}
									size="sm"
									variant="outline"
								>
									{isSaving ? "처리 중..." : "선택 이미지 저장"}
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

											{/* 시드값 표시 (gpt-image-1) */}
											{image.seed !== undefined &&
												selectedModel !== "gpt-image-1" && (
													<div
														className="mt-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200"
														onClick={() => copySeedToClipboard(image.seed)}
														title="클릭하여 시드값 복사"
													>
														Seed: {image.seed}
													</div>
												)}
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

			{/* S3 저장 확인 다이얼로그 */}
			{imageToConfirm && (
				<Dialog
					open={isConfirmDialogOpen}
					onOpenChange={setIsConfirmDialogOpen}
				>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>이미지 정보 확인 및 저장</DialogTitle>
							<DialogDescription>
								선택한 이미지의 세부 정보를 확인하고 저장하세요.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="flex justify-center mb-4">
								<img
									src={imageToConfirm.url}
									alt="저장할 이미지"
									className="max-w-xs max-h-[200px] rounded-md shadow-md"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="imageName" className="text-right col-span-1">
									이미지 이름
								</Label>
								<Input
									id="imageName"
									// value={confirmImageName}
									onChange={(e) => setConfirmImageName(e.target.value)}
									className="col-span-3"
									placeholder="예: 강건우1"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="imageTags" className="text-right col-span-1">
									태그 (쉼표 구분)
								</Label>
								<Input
									id="imageTags"
									// value={confirmImageTags}
									onChange={(e) => setConfirmImageTags(e.target.value)}
									className="col-span-3"
									placeholder="예: 질투심, 조용한, 절제된욕망"
								/>
							</div>
							{/* 메타데이터 표시 부분 UI 개선 */}
							<div className="text-sm mt-3 p-3 bg-slate-50 rounded-md space-y-2">
								<div>
									<span className="font-semibold">원본 프롬프트:</span>
									<p className="text-xs text-gray-700 break-all whitespace-pre-wrap mt-1">
										{imageToConfirm.prompt}
									</p>
								</div>
								<div className="grid grid-cols-2 gap-x-2 gap-y-1">
									<div>
										<span className="font-semibold">모델:</span>
										<span className="ml-1 text-gray-700">
											{imageToConfirm.modelName}
										</span>
									</div>
									{imageToConfirm.steps !== undefined && (
										<div>
											<span className="font-semibold">스텝:</span>
											<span className="ml-1 text-gray-700">
												{imageToConfirm.steps}
											</span>
										</div>
									)}
									{imageToConfirm.seed !== undefined &&
										imageToConfirm.modelName !== "gpt-image-1" && (
											<div>
												<span className="font-semibold">시드:</span>
												<span className="ml-1 text-gray-700">
													{imageToConfirm.seed}
												</span>
											</div>
										)}
								</div>
							</div>
						</div>
						<DialogFooter>
							<DialogClose asChild>
								<Button type="button" variant="outline">
									취소
								</Button>
							</DialogClose>
							<Button
								type="button"
								onClick={handleConfirmAndSaveToS3}
								disabled={isSaving || !confirmImageName.trim()}
							>
								{isSaving ? "저장 중..." : "저장"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

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
