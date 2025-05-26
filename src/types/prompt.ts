// === 공통 프롬프트 관련 인터페이스 ===
export interface BasePromptVersion {
	id: number;
	version: number;
	llm_prompt: string; // content에서 llm_prompt로 통일
	is_active: boolean;
	created_at: string;
	created_by: number | null;
}

export interface BasePrompt {
	id: number;
	name: string;
	llm_prompt: string; // 모든 프롬프트 타입에서 통일된 필드명
	created_at: string;
	updated_at: string;
	created_by: number | null;
	versions: BasePromptVersion[];
}

// === Image Prompt 인터페이스 ===
export interface ImagePromptVersion extends BasePromptVersion {
	prompt_id: number;
}

export interface ImagePrompt extends BasePrompt {
	versions: ImagePromptVersion[];
}

export interface PaginatedImagePrompts {
	total_items: number;
	items: ImagePrompt[];
}

// === Persona Prompt 인터페이스 ===
export interface PersonaPromptVersion extends BasePromptVersion {
	prompt_id: number;
}

export interface PersonaPrompt extends BasePrompt {
	versions: PersonaPromptVersion[];
}

export interface PaginatedPersonaPrompts {
	total_items: number;
	items: PersonaPrompt[];
}

// === API 요청/응답 인터페이스 ===
export interface CreatePromptRequest {
	name: string;
	llm_prompt: string; // 통일된 필드명
	versions: Array<{
		llm_prompt: string; // content에서 llm_prompt로 변경
		is_active: boolean;
	}>;
}

export interface UpdatePromptRequest {
	name?: string;
	llm_prompt?: string; // 통일된 필드명
}

export interface CreateVersionRequest {
	llm_prompt: string; // content에서 llm_prompt로 변경
	is_active: boolean;
}

// === 페르소나 페이지용 레거시 인터페이스 (호환성 유지) ===
export interface LegacyPromptVersion {
	id?: string | number;
	version?: number;
	llm_prompt: string; // content에서 llm_prompt로 변경
	is_active: boolean;
	created_at?: string;
}

export interface LegacyPrompt {
	id: number;
	name: string;
	description: string;
	versions: LegacyPromptVersion[];
	currentVersion: number;
	tags: string[];
	createdAt: string;
	updatedAt: string;
	category?: string;
}
