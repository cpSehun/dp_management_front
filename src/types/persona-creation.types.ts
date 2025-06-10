export type PersonaType = "character" | "story";

export interface Step1Data {
	personaType: PersonaType;
	model: string;
	concept: string;
}

export interface Step2Data {
	personaInfo: string; // LLM 응답 전체 텍스트
	regenerationNotes: string; // 재생성 참고사항
}

export interface Step3Data {
	summary: string;
	tags: string[];
}

export interface Step4Data {
	imageDescription: string;
	imagePrompt: string;
	generatedImages: string[];
	selectedImage: string;
}

export interface PersonaCreationData {
	step1: Step1Data;
	step2: Step2Data;
	step3: Step3Data;
	step4: Step4Data;
}

export interface PersonaCreationContextType {
	data: PersonaCreationData;
	updateData: (step: keyof PersonaCreationData, newData: any) => void;
	currentStep: number;
	setCurrentStep: (step: number) => void;
}

// LLM 모델 정의
export interface LLMModel {
	id: string;
	name: string;
	provider: string;
}

// API 응답 타입
export interface LLMGenerateResponse {
	success: boolean;
	content?: string;
	error?: string;
	model_used?: string;
}
