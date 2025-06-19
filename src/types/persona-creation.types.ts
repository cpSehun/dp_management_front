export type PersonaType = "character" | "story";

export interface Step1Data {
	personaType: PersonaType;
	model: string;
	concept: string;
	// 추가 필드들
	inputMode?: "auto" | "manual"; // 사용한 입력 모드
	generatedConcept?: string; // 자동 생성된 컨셉
	directConcept?: string; // 직접 입력한 컨셉
	conceptPrompt?: string; // 사용한 프롬프트
	useCustomPrompt?: boolean; // 커스텀 프롬프트 사용 여부
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
	selectedImageJobId?: string; // 선택된 이미지의 job_id 추가
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
	resetData: () => void; // 데이터 초기화 함수 타입 추가
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
