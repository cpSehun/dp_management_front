import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Save, User, BookOpen, Database, Copy } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

import { usePersonaCreation } from "../common/PersonaCreationContext";

export function FinalReviewStep() {
	const { data } = usePersonaCreation();
	const [isSaving, setIsSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showDbQuery, setShowDbQuery] = useState(false);
	const [dbQuery, setDbQuery] = useState<string>("");

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
		// # 첫 대사 및 지문 섹션 찾기
		const sections = personaInfo.split("#");
		for (const section of sections) {
			if (section.includes("첫 대사 및 지문")) {
				// "# 첫 대사 및 지문" 헤더 제거하고 내용만 추출
				let content = section.replace(/첫\s*대사\s*및\s*지문/, "").trim();

				// 첫 번째 줄이 비어있다면 제거
				const lines = content.split("\n");
				const nonEmptyLines = lines.filter((line) => line.trim() !== "");

				return nonEmptyLines.join(" ").trim();
			}
		}

		// 만약 "# 첫 대사 및 지문" 섹션이 없다면, 대화 형태를 찾아서 추출
		const lines = personaInfo.split("\n");
		const dialogLines = [];

		for (const line of lines) {
			// "대파:", "아현:" 등 대화 형태의 라인 찾기
			if (
				line.includes(":") &&
				(line.includes("대파") ||
					line.includes("아현") ||
					line.match(/[가-힣A-Za-z]+:\s*\(/))
			) {
				dialogLines.push(line.trim());
			}
		}

		return dialogLines.join(" ").trim();
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

	// 첫 대사 및 지문 부분을 제외한 페르소나 정보 생성 (## 페르소나 정보 헤더도 제외)
	const extractLLMPrompt = (personaInfo: string): string => {
		let content = personaInfo;

		// "## 페르소나 정보" 헤더 제거
		content = content.replace(/^##\s*페르소나\s*정보\s*\n?/m, "").trim();

		// "# 첫 대사 및 지문" 섹션을 찾아서 제거
		const firstDialogIndex = content.indexOf("# 첫 대사 및 지문");
		if (firstDialogIndex !== -1) {
			// "# 첫 대사 및 지문" 이전 부분만 반환
			content = content.substring(0, firstDialogIndex).trim();
		} else {
			// 만약 헤더가 없다면 대화 라인들을 찾아서 제거
			const lines = content.split("\n");
			const filteredLines = lines.filter((line) => {
				// 대화 형태의 라인 제거 ("대파:", "아현:" 등)
				return !(
					line.includes(":") &&
					(line.includes("대파") ||
						line.includes("아현") ||
						line.match(/[가-힣A-Za-z]+:\s*\(/))
				);
			});
			content = filteredLines.join("\n").trim();
		}

		return content;
	};

	// 최신 user_id 가져오기 (자기 자신 참조)
	const getNextUserId = async (): Promise<number> => {
		try {
			// 실제 API 호출로 최신 user_id 조회
			const response = await fetch("/api/v1/persona/max-user-id", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("access_token")}`,
				},
			});

			if (!response.ok) {
				throw new Error("최신 user_id 조회에 실패했습니다.");
			}

			const result = await response.json();
			const maxUserId = result.max_user_id || 0;
			return maxUserId + 1;
		} catch (error) {
			console.error("최신 user_id 조회 실패:", error);
			// API 호출 실패 시 기본값으로 1 반환
			return 1;
		}
	};

	// DB INSERT 쿼리 생성 함수
	const generateDbInsertQuery = async (): Promise<string> => {
		const selectedImageJobId =
			data.step4.selectedImageJobId || "uuid-example-12345";
		const personaName = extractNameFromPersonaInfo(data.step2.personaInfo);
		const personaType =
			data.step1.personaType === "character" ? "CHAR" : "STORY";
		const nextUserId = await getNextUserId(); // 실제 API 호출로 다음 user_id 조회
		const llmPrompt = extractLLMPrompt(data.step2.personaInfo);
		const chatOpening = extractChatOpening(data.step2.personaInfo);
		const background = extractBackground(data.step2.personaInfo);
		const tagsJson = JSON.stringify(data.step3.tags);

		// SQL 이스케이프 처리 함수
		const escapeSql = (str: string): string => {
			return str.replace(/'/g, "''").replace(/\\/g, "\\\\");
		};

		const query = `-- t_persona 테이블 INSERT 쿼리
INSERT INTO daepa_agent.t_persona (
    id,
    type,
    name,
    user_id,
    status,
    model_id,
    tags,
    properties,
    summary,
    llm_prompt,
    chat_opening,
    background
) VALUES (
    '${selectedImageJobId}',
    '${personaType}',
    '${escapeSql(personaName)}',
    ${nextUserId},
    'INACTIVE',
    'google/gemini-2.0-flash-001',
    '${escapeSql(tagsJson)}',
    NULL,
    '${escapeSql(data.step3.summary)}',
    '${escapeSql(llmPrompt)}',
    '${escapeSql(chatOpening)}',
    '${escapeSql(background)}'
);

-- 생성될 데이터 미리보기:
-- seq: (자동할당)
-- id: ${selectedImageJobId}
-- type: ${personaType}
-- name: ${personaName}
-- user_id: ${nextUserId} (현재 최신 번호 + 1)
-- status: INACTIVE
-- model_id: google/gemini-2.0-flash-001
-- tags: ${tagsJson}
-- properties: NULL (JSON 타입에서 가장 비어있는 상태)
-- summary: ${data.step3.summary}
-- llm_prompt: (${llmPrompt.length}자)
-- chat_opening: (${chatOpening.length}자)
-- background: (${background.length}자)
-- created_at: (자동할당)
-- updated_at: (자동할당)`;

		return query;
	};

	// DB 쿼리 미리보기 생성
	const handleShowDbQuery = async () => {
		try {
			const query = await generateDbInsertQuery();
			setDbQuery(query);
			setShowDbQuery(true);

			// 추출된 데이터 미리보기 (디버깅용)
			console.log("=== 추출된 데이터 미리보기 ===");
			console.log("이름:", extractNameFromPersonaInfo(data.step2.personaInfo));
			console.log(
				"LLM 프롬프트:",
				extractLLMPrompt(data.step2.personaInfo).substring(0, 100) + "..."
			);
			console.log("채팅 오프닝:", extractChatOpening(data.step2.personaInfo));
			console.log(
				"배경:",
				extractBackground(data.step2.personaInfo).substring(0, 100) + "..."
			);
		} catch (error) {
			console.error("DB 쿼리 생성 오류:", error);
			setError("DB 쿼리 생성 중 오류가 발생했습니다.");
		}
	};

	// 쿼리 복사
	const handleCopyQuery = async () => {
		try {
			await navigator.clipboard.writeText(dbQuery);
			// 간단한 토스트 알림 (실제로는 toast 라이브러리 사용 권장)
			alert("쿼리가 클립보드에 복사되었습니다!");
		} catch (error) {
			console.error("클립보드 복사 실패:", error);
			alert("클립보드 복사에 실패했습니다.");
		}
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

			const response = await fetch("/api/v1/persona", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("access_token")}`,
				},
				body: JSON.stringify({
					id: selectedImageJobId, // 선택된 이미지의 job_id를 id로 사용
					type: data.step1.personaType === "character" ? "CHAR" : "STORY", // CHAR or STORY
					name: extractNameFromPersonaInfo(data.step2.personaInfo),
					user_id: null, // 백엔드에서 자동으로 최신 user_id + 1로 설정
					status: "INACTIVE",
					model_id: "google/gemini-2.0-flash-001", // 고정값
					tags: data.step3.tags,
					properties: null, // JSON 타입에서 가장 "비어있음"에 가까운 NULL
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
							페르소나 컨셉
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="p-3 bg-gray-50 rounded-md border">
						<p className="text-sm whitespace-pre-wrap">{data.step1.concept}</p>
					</div>
					<div className="mt-2 text-xs text-gray-500">
						모델: {data.step1.model}
					</div>
				</CardContent>
			</Card>

			{/* 2단계: 페르소나 정보 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">2단계: 페르소나 정보</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="p-3 bg-gray-50 rounded-md border max-h-60 overflow-y-auto">
						<p className="text-sm whitespace-pre-wrap">
							{data.step2.personaInfo}
						</p>
					</div>
				</CardContent>
			</Card>

			{/* 3단계: 요약 및 태그 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">3단계: 요약 및 태그</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						<div>
							<span className="font-medium text-sm">요약:</span>
							<p className="text-sm mt-1 p-2 bg-gray-50 rounded">
								{data.step3.summary}
							</p>
						</div>
						<div>
							<span className="font-medium text-sm">태그:</span>
							<div className="flex flex-wrap gap-1 mt-1">
								{data.step3.tags.map((tag, index) => (
									<Badge key={index} variant="secondary">
										{tag}
									</Badge>
								))}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 4단계: 이미지 정보 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">4단계: 이미지 정보</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
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
					</div>
				</CardContent>
			</Card>

			{/* DB INSERT 쿼리 미리보기 */}
			{!showDbQuery ? (
				<Card className="border-orange-200 bg-orange-50">
					<CardHeader>
						<CardTitle className="text-lg text-orange-800 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Database className="h-5 w-5" />
								데이터베이스 저장 미리보기
							</div>
							<Button
								onClick={handleShowDbQuery}
								variant="outline"
								size="sm"
								className="border-orange-300 text-orange-700 hover:bg-orange-100"
							>
								DB 쿼리 생성
							</Button>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-orange-700">
							"페르소나 저장" 버튼을 누르기 전에 실제로 실행될 DB INSERT 쿼리를
							미리 확인할 수 있습니다.
						</p>
					</CardContent>
				</Card>
			) : (
				<Card className="border-blue-200 bg-blue-50">
					<CardHeader>
						<CardTitle className="text-lg text-blue-800 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Database className="h-5 w-5" />
								DB INSERT 쿼리 미리보기
							</div>
							<Button
								onClick={handleCopyQuery}
								variant="outline"
								size="sm"
								className="border-blue-300 text-blue-700 hover:bg-blue-100"
							>
								<Copy className="h-4 w-4 mr-2" />
								쿼리 복사
							</Button>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Textarea
							value={dbQuery}
							readOnly
							className="font-mono text-xs bg-white border min-h-[300px]"
							placeholder="DB 쿼리가 여기에 표시됩니다..."
						/>
						<p className="text-xs text-blue-600 mt-2">
							💡 이 쿼리는 "페르소나 저장" 버튼을 클릭했을 때 실행됩니다.
							실제로는 API를 통해 안전하게 처리됩니다.
						</p>
					</CardContent>
				</Card>
			)}

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

			{/* 개발자용 데이터 확인 및 추출 테스트 */}
			<details className="mt-6">
				<summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
					개발자용: 데이터 추출 테스트
				</summary>
				<div className="mt-2 p-3 bg-gray-100 rounded text-xs">
					<div className="space-y-2">
						<div>
							<strong>이름 추출:</strong>
							<pre className="bg-white p-2 rounded mt-1">
								{extractNameFromPersonaInfo(data.step2.personaInfo)}
							</pre>
						</div>
						<div>
							<strong>채팅 오프닝 추출:</strong>
							<pre className="bg-white p-2 rounded mt-1 max-h-20 overflow-y-auto">
								{extractChatOpening(data.step2.personaInfo)}
							</pre>
						</div>
						<div>
							<strong>배경 추출:</strong>
							<pre className="bg-white p-2 rounded mt-1 max-h-20 overflow-y-auto">
								{extractBackground(data.step2.personaInfo)}
							</pre>
						</div>
						<div>
							<strong>LLM 프롬프트 추출 (처음 200자):</strong>
							<pre className="bg-white p-2 rounded mt-1 max-h-20 overflow-y-auto">
								{extractLLMPrompt(data.step2.personaInfo).substring(0, 200)}...
							</pre>
						</div>
					</div>
				</div>
			</details>

			{/* 전체 데이터 확인 */}
			<details className="mt-2">
				<summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
					개발자용: 전체 데이터 확인
				</summary>
				<pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-60">
					{JSON.stringify(data, null, 2)}
				</pre>
			</details>
		</div>
	);
}
