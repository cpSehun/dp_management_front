// src/utils/prompt-api.ts

interface LatestPromptResponse {
	id: number;
	name: string;
	category: string;
	type: string | null;
	llm_prompt: string;
	version: number;
}

/**
 * 최신 워크플로우 프롬프트 조회
 * @param category - 프롬프트 카테고리 (concept, persona_info, summary, tags, image)
 * @param type - 프롬프트 타입 (CHAR, STORY, null)
 * @returns 최신 프롬프트 또는 null
 */
export async function fetchLatestPrompt(
	category: string,
	type?: string | null
): Promise<string | null> {
	try {
		const token = localStorage.getItem("access_token");
		if (!token) {
			throw new Error("인증 토큰이 없습니다.");
		}

		const params = new URLSearchParams({ category });
		if (type) {
			params.append("type", type);
		}

		const response = await fetch(
			`/api/v1/prompts/workflow/latest?${params.toString()}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);

		if (!response.ok) {
			throw new Error(`프롬프트 조회 실패: ${response.status}`);
		}

		const data: LatestPromptResponse = await response.json();
		return data.llm_prompt;
	} catch (error) {
		console.error(
			`프롬프트 조회 오류 (category: ${category}, type: ${type}):`,
			error
		);
		return null;
	}
}

/**
 * 변수가 포함된 프롬프트에 값 삽입
 * @param template - 프롬프트 템플릿 ({변수명} 형태)
 * @param variables - 삽입할 변수들
 * @returns 변수가 삽입된 프롬프트
 */
export function formatPrompt(
	template: string,
	variables: Record<string, string>
): string {
	let result = template;
	Object.entries(variables).forEach(([key, value]) => {
		result = result.replace(new RegExp(`{${key}}`, "g"), value);
	});
	return result;
}

/**
 * 참고사항을 프롬프트에 추가
 * @param prompt - 기본 프롬프트
 * @param notes - 추가 참고사항
 * @returns 참고사항이 추가된 프롬프트
 */
export function addNotes(prompt: string, notes: string): string {
	if (!notes.trim()) return prompt;
	return `${prompt}\n\n추가 참고사항: ${notes}`;
}

/**
 * 페르소나 타입에 따른 컨셉 프롬프트 조회
 * @param personaType - character 또는 story
 * @returns 컨셉 생성 프롬프트
 */
export async function fetchConceptPrompt(
	personaType: "character" | "story"
): Promise<string | null> {
	const type = personaType === "character" ? "CHAR" : "STORY";
	return await fetchLatestPrompt("concept", type);
}

/**
 * 페르소나 타입에 따른 페르소나 정보 프롬프트 조회
 * @param personaType - character 또는 story
 * @returns 페르소나 정보 생성 프롬프트
 */
export async function fetchPersonaInfoPrompt(
	personaType: "character" | "story"
): Promise<string | null> {
	const type = personaType === "character" ? "CHAR" : "STORY";
	return await fetchLatestPrompt("persona_info", type);
}

/**
 * 요약 생성 프롬프트 조회
 * @returns 요약 생성 프롬프트
 */
export async function fetchSummaryPrompt(): Promise<string | null> {
	return await fetchLatestPrompt("summary");
}

/**
 * 태그 생성 프롬프트 조회
 * @returns 태그 생성 프롬프트
 */
export async function fetchTagsPrompt(): Promise<string | null> {
	return await fetchLatestPrompt("tags");
}

/**
 * 이미지 생성 프롬프트 조회
 * @returns 이미지 생성 프롬프트
 */
export async function fetchImagePrompt(): Promise<string | null> {
	return await fetchLatestPrompt("image");
}
