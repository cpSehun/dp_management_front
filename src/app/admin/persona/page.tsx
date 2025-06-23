"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, User, Eye, UserCheck, UserX } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
	AdminTable,
	AdminTableHeader,
	AdminTableHeaderCell,
	AdminTableBody,
	AdminTableRow,
	AdminTableCell,
	AdminTableEmptyRow,
} from "@/components/admin/AdminTable";
import { ActionDropdown, ActionItem } from "@/components/admin/ActionDropdown";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { PersonaCreationDialog } from "@/components/admin/persona/PersonaCreationDialog";

// t_persona 테이블 구조에 맞춘 타입 정의
interface Persona {
	seq: number;
	id: string | null;
	type: string;
	name: string;
	user_id: number | null;
	status: string;
	model_id: string | null;
	tags: any[] | null;
	properties: any | null;
	summary: string | null;
	llm_prompt: string | null;
	chat_opening: string | null;
	background: string | null;
	created_at: string;
	updated_at: string | null;
}

// 타입 라벨 맵핑
const TYPE_LABELS: Record<string, string> = {
	CHAR: "CHAR",
	STORY: "STORY",
};

// 상태 라벨 맵핑
const STATUS_LABELS: Record<string, string> = {
	ACTIVE: "Active",
	INACTIVE: "InActive",
};

const ITEMS_PER_PAGE = 5;

// 날짜 포맷팅 함수
const formatDate = (dateString: string | null) => {
	if (!dateString) return "-";
	const date = new Date(dateString);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
		2,
		"0"
	)}-${String(date.getDate()).padStart(2, "0")}`;
};

export default function PersonaPage() {
	const [personas, setPersonas] = useState<Persona[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>([]);
	const [paginatedPersonas, setPaginatedPersonas] = useState<Persona[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeFilter, setActiveFilter] = useState<
		"all" | "active" | "inactive" | "char" | "story"
	>("all");

	// 다이얼로그 상태
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
	const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);

	// 상태 변경 로딩
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

	// 페르소나 목록 조회
	const fetchPersonas = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const token = localStorage.getItem("access_token");
			if (!token) {
				throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");
			}

			// 통일된 패턴: 슬래시 없음, limit 1000
			const response = await fetch("/api/v1/persona?limit=1000", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			setPersonas(data);
		} catch (error) {
			console.error("Error fetching personas:", error);
			setError(
				error instanceof Error
					? error.message
					: "알 수 없는 오류가 발생했습니다."
			);
			setPersonas([]);
		} finally {
			setIsLoading(false);
		}
	};

	// 컴포넌트 마운트 시 데이터 로드
	useEffect(() => {
		fetchPersonas();
	}, []);

	// 필터링 로직
	useEffect(() => {
		let filtered = [...personas];

		// 검색 필터 적용
		if (searchTerm.trim() !== "") {
			const lowercasedSearch = searchTerm.toLowerCase();
			filtered = filtered.filter((persona) => {
				return (
					persona.name.toLowerCase().includes(lowercasedSearch) ||
					(persona.id && persona.id.toLowerCase().includes(lowercasedSearch)) ||
					persona.type.toLowerCase().includes(lowercasedSearch) ||
					persona.status.toLowerCase().includes(lowercasedSearch) ||
					(persona.user_id &&
						persona.user_id.toString().includes(lowercasedSearch)) ||
					(persona.model_id &&
						persona.model_id.toLowerCase().includes(lowercasedSearch)) ||
					(persona.summary &&
						persona.summary.toLowerCase().includes(lowercasedSearch))
				);
			});
		}

		// 상태 필터 적용
		switch (activeFilter) {
			case "active":
				filtered = filtered.filter((persona) => persona.status === "ACTIVE");
				break;
			case "inactive":
				filtered = filtered.filter((persona) => persona.status === "INACTIVE");
				break;
			case "char":
				filtered = filtered.filter((persona) => persona.type === "CHAR");
				break;
			case "story":
				filtered = filtered.filter((persona) => persona.type === "STORY");
				break;
			default:
				break;
		}

		setFilteredPersonas(filtered);
		setCurrentPage(1);
	}, [searchTerm, personas, activeFilter]);

	// 페이지네이션 처리
	useEffect(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		const endIndex = startIndex + ITEMS_PER_PAGE;
		setPaginatedPersonas(filteredPersonas.slice(startIndex, endIndex));
	}, [filteredPersonas, currentPage]);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const totalPages = Math.ceil(filteredPersonas.length / ITEMS_PER_PAGE);

	// 페르소나 생성 핸들러
	const handleCreatePersona = () => {
		setIsCreateDialogOpen(true);
	};

	// 상세보기 핸들러
	const handleViewPersona = (persona: Persona) => {
		setSelectedPersona(persona);
		setIsDetailDialogOpen(true);
	};

	// 페르소나 수정
	const handleEditPersona = (persona: Persona) => {
		alert(`${persona.name} 수정 기능은 구현 예정입니다.`);
	};

	// 페르소나 삭제 확인
	const handleDeletePersona = (persona: Persona) => {
		setCurrentPersona(persona);
		setIsDeleteDialogOpen(true);
	};

	// 페르소나 삭제 실행
	const handleConfirmDelete = async () => {
		if (!currentPersona) return;

		try {
			const token = localStorage.getItem("access_token");
			if (!token) {
				throw new Error("인증 토큰이 없습니다.");
			}

			const response = await fetch(`/api/v1/persona/${currentPersona.seq}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.detail || "페르소나 삭제에 실패했습니다.");
			}

			// 로컬 상태에서 제거
			setPersonas(personas.filter((p) => p.seq !== currentPersona.seq));
			setIsDeleteDialogOpen(false);
			setCurrentPersona(null);

			alert(`페르소나 '${currentPersona.name}'이 성공적으로 삭제되었습니다.`);
		} catch (error) {
			console.error("페르소나 삭제 오류:", error);
			alert(
				error instanceof Error
					? error.message
					: "페르소나 삭제 중 오류가 발생했습니다."
			);
		}
	};

	// 페르소나 상태 변경 (ACTIVE/INACTIVE 토글)
	const handleUpdatePersonaStatus = async (
		personaSeq: number,
		newStatus: string
	) => {
		setIsUpdatingStatus(true);

		try {
			const token = localStorage.getItem("access_token");
			if (!token) {
				throw new Error("인증 토큰이 없습니다.");
			}

			const response = await fetch(
				`/api/v1/persona/${personaSeq}/status?status=${newStatus}`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.detail || "페르소나 상태 변경에 실패했습니다."
				);
			}

			// 로컬 상태 업데이트
			setPersonas(
				personas.map((persona) =>
					persona.seq === personaSeq
						? {
								...persona,
								status: newStatus,
								updated_at: new Date().toISOString(),
						  }
						: persona
				)
			);

			alert(`페르소나 상태가 ${STATUS_LABELS[newStatus]}로 변경되었습니다.`);
		} catch (error) {
			console.error("페르소나 상태 변경 오류:", error);
			alert(
				error instanceof Error
					? error.message
					: "페르소나 상태 변경 중 오류가 발생했습니다."
			);
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	// 페르소나 생성 완료 핸들러
	const handlePersonaCreated = (newPersona: any) => {
		console.log("새 페르소나 생성됨:", newPersona);
		// 페르소나 목록 새로고침
		fetchPersonas();
		setIsCreateDialogOpen(false);
		alert("페르소나가 성공적으로 생성되었습니다!");
	};

	// 각 페르소나의 액션 메뉴 생성
	const getPersonaActions = (persona: Persona): ActionItem[] => {
		const actions: ActionItem[] = [
			{
				label: "상세보기",
				icon: <Eye className="h-4 w-4" />,
				onClick: () => handleViewPersona(persona),
			},
			{
				label: persona.status === "ACTIVE" ? "비활성화" : "활성화",
				icon:
					persona.status === "ACTIVE" ? (
						<UserX className="h-4 w-4" />
					) : (
						<UserCheck className="h-4 w-4" />
					),
				onClick: () => {
					const newStatus = persona.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
					handleUpdatePersonaStatus(persona.seq, newStatus);
				},
				disabled: isUpdatingStatus,
			},
			{
				label: "수정",
				icon: <Edit className="h-4 w-4" />,
				onClick: () => handleEditPersona(persona),
			},
			{
				label: "삭제",
				icon: <Trash2 className="h-4 w-4" />,
				variant: "destructive",
				onClick: () => handleDeletePersona(persona),
			},
		];

		return actions;
	};

	if (isLoading) {
		return (
			<AdminPageLayout>
				<AdminPageHeader
					title="페르소나 관리"
					searchPlaceholder="페르소나명, ID, 타입 검색..."
					searchValue={searchTerm}
					onSearchChange={setSearchTerm}
					onCreateClick={handleCreatePersona}
					createButtonText="페르소나 생성"
				/>
				<AdminTable>
					<AdminTableHeader>
						<AdminTableHeaderCell>Seq</AdminTableHeaderCell>
						<AdminTableHeaderCell>ID</AdminTableHeaderCell>
						<AdminTableHeaderCell>타입</AdminTableHeaderCell>
						<AdminTableHeaderCell>이름</AdminTableHeaderCell>
						<AdminTableHeaderCell>사용자 ID</AdminTableHeaderCell>
						<AdminTableHeaderCell>상태</AdminTableHeaderCell>
						<AdminTableHeaderCell>Summary</AdminTableHeaderCell>
						<AdminTableHeaderCell>모델 ID</AdminTableHeaderCell>
						<AdminTableHeaderCell>생성일</AdminTableHeaderCell>
						<AdminTableHeaderCell>수정일</AdminTableHeaderCell>
						<AdminTableHeaderCell className="text-right">
							관리
						</AdminTableHeaderCell>
					</AdminTableHeader>
					<AdminTableBody>
						{Array.from({ length: 5 }).map((_, index) => (
							<AdminTableRow key={index}>
								<AdminTableCell>
									<div className="h-4 bg-gray-200 rounded animate-pulse"></div>
								</AdminTableCell>
								<AdminTableCell>
									<div className="h-4 bg-gray-200 rounded animate-pulse"></div>
								</AdminTableCell>
								<AdminTableCell>
									<div className="h-4 bg-gray-200 rounded animate-pulse"></div>
								</AdminTableCell>
								<AdminTableCell>
									<div className="h-4 bg-gray-200 rounded animate-pulse"></div>
								</AdminTableCell>
								<AdminTableCell>
									<div className="h-4 bg-gray-200 rounded animate-pulse"></div>
								</AdminTableCell>
								<AdminTableCell>
									<div className="h-4 bg-gray-200 rounded animate-pulse"></div>
								</AdminTableCell>
								<AdminTableCell>
									<div className="h-4 bg-gray-200 rounded animate-pulse"></div>
								</AdminTableCell>
								<AdminTableCell>
									<div className="h-4 bg-gray-200 rounded animate-pulse"></div>
								</AdminTableCell>
								<AdminTableCell>
									<div className="h-4 bg-gray-200 rounded animate-pulse"></div>
								</AdminTableCell>
								<AdminTableCell>
									<div className="h-4 bg-gray-200 rounded animate-pulse"></div>
								</AdminTableCell>
								<AdminTableCell>
									<div className="h-4 bg-gray-200 rounded animate-pulse"></div>
								</AdminTableCell>
							</AdminTableRow>
						))}
					</AdminTableBody>
				</AdminTable>
			</AdminPageLayout>
		);
	}

	if (error) {
		return (
			<AdminPageLayout>
				<AdminPageHeader
					title="페르소나 관리"
					searchPlaceholder="페르소나명, ID, 타입 검색..."
					searchValue={searchTerm}
					onSearchChange={setSearchTerm}
					onCreateClick={handleCreatePersona}
					createButtonText="페르소나 생성"
				/>
				<div className="text-red-500 text-center p-6">
					오류: {error}
					<div className="mt-4">
						<Button onClick={fetchPersonas} variant="outline">
							다시 시도
						</Button>
					</div>
				</div>
			</AdminPageLayout>
		);
	}

	return (
		<AdminPageLayout>
			<AdminPageHeader
				title="페르소나 관리"
				searchPlaceholder="페르소나명, ID, 타입 검색..."
				searchValue={searchTerm}
				onSearchChange={setSearchTerm}
				onCreateClick={handleCreatePersona}
				createButtonText="페르소나 생성"
			/>

			{/* 필터 탭 */}
			<Tabs
				value={activeFilter}
				onValueChange={(value) => setActiveFilter(value as any)}
				className="w-full mb-6"
			>
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="all">전체 ({personas.length})</TabsTrigger>
					<TabsTrigger value="active" className="text-green-600">
						활성 ({personas.filter((p) => p.status === "ACTIVE").length})
					</TabsTrigger>
					<TabsTrigger value="inactive" className="text-red-600">
						비활성 ({personas.filter((p) => p.status === "INACTIVE").length})
					</TabsTrigger>
					<TabsTrigger value="char" className="text-blue-600">
						캐릭터 ({personas.filter((p) => p.type === "CHAR").length})
					</TabsTrigger>
					<TabsTrigger value="story" className="text-purple-600">
						스토리 ({personas.filter((p) => p.type === "STORY").length})
					</TabsTrigger>
				</TabsList>
			</Tabs>

			<AdminTable>
				<AdminTableHeader>
					<AdminTableHeaderCell>Seq</AdminTableHeaderCell>
					<AdminTableHeaderCell>ID</AdminTableHeaderCell>
					<AdminTableHeaderCell>타입</AdminTableHeaderCell>
					<AdminTableHeaderCell>이름</AdminTableHeaderCell>
					<AdminTableHeaderCell>사용자 ID</AdminTableHeaderCell>
					<AdminTableHeaderCell>상태</AdminTableHeaderCell>
					<AdminTableHeaderCell>Summary</AdminTableHeaderCell>
					<AdminTableHeaderCell>모델 ID</AdminTableHeaderCell>
					<AdminTableHeaderCell>생성일</AdminTableHeaderCell>
					<AdminTableHeaderCell>수정일</AdminTableHeaderCell>
					<AdminTableHeaderCell className="text-right">
						관리
					</AdminTableHeaderCell>
				</AdminTableHeader>
				<AdminTableBody>
					{paginatedPersonas.length === 0 ? (
						<AdminTableEmptyRow
							colSpan={11}
							message={
								searchTerm || activeFilter !== "all"
									? "검색 결과가 없습니다."
									: "페르소나가 없습니다. 새로운 페르소나를 생성해보세요."
							}
						/>
					) : (
						paginatedPersonas.map((persona) => (
							<AdminTableRow key={persona.seq}>
								<AdminTableCell className="font-medium">
									{persona.seq}
								</AdminTableCell>
								<AdminTableCell>
									<div className="min-w-[80px] max-w-[80px]">
										{persona.id ? (
											<code className="text-[9px] bg-gray-100 px-1 rounded break-all leading-tight block">
												{persona.id}
											</code>
										) : (
											"-"
										)}
									</div>
								</AdminTableCell>
								<AdminTableCell>
									<Badge
										variant={persona.type === "CHAR" ? "default" : "secondary"}
										className={
											persona.type === "CHAR"
												? "bg-blue-100 text-blue-800 border-blue-200"
												: "bg-purple-100 text-purple-800 border-purple-200"
										}
									>
										{TYPE_LABELS[persona.type] || persona.type}
									</Badge>
								</AdminTableCell>
								<AdminTableCell>
									<div className="min-w-[80px] max-w-[100px] whitespace-nowrap">
										<span className="font-medium">{persona.name}</span>
									</div>
								</AdminTableCell>
								<AdminTableCell>
									<div className="min-w-[60px] max-w-[80px]">
										<span className="whitespace-nowrap text-sm">
											{persona.user_id ? persona.user_id : "-"}
										</span>
									</div>
								</AdminTableCell>
								<AdminTableCell>
									<Badge
										variant={
											persona.status === "ACTIVE" ? "default" : "secondary"
										}
										className={
											persona.status === "ACTIVE"
												? "bg-green-100 text-green-800 border-green-200"
												: "bg-red-100 text-red-800 border-red-200"
										}
									>
										{STATUS_LABELS[persona.status] || persona.status}
									</Badge>
								</AdminTableCell>
								<AdminTableCell>
									<div
										className="max-w-[180px] truncate"
										title={persona.summary || undefined}
									>
										<span className="text-xs">{persona.summary || "-"}</span>
									</div>
								</AdminTableCell>
								<AdminTableCell>
									<div className="min-w-[140px]">
										{persona.model_id ? (
											<Badge
												variant="outline"
												className="text-[10px] px-1 py-0 whitespace-nowrap"
											>
												{persona.model_id}
											</Badge>
										) : (
											<span className="text-xs text-gray-500">-</span>
										)}
									</div>
								</AdminTableCell>
								<AdminTableCell>
									<span className="text-xs whitespace-nowrap">
										{formatDate(persona.created_at)}
									</span>
								</AdminTableCell>
								<AdminTableCell>
									<span className="text-xs whitespace-nowrap">
										{formatDate(persona.updated_at)}
									</span>
								</AdminTableCell>
								<AdminTableCell className="text-right">
									<ActionDropdown actions={getPersonaActions(persona)} />
								</AdminTableCell>
							</AdminTableRow>
						))
					)}
				</AdminTableBody>
			</AdminTable>

			{/* 페이지네이션 */}
			{totalPages > 1 && (
				<AdminPagination
					currentPage={currentPage}
					totalPages={totalPages}
					totalItems={filteredPersonas.length}
					itemsPerPage={ITEMS_PER_PAGE}
					onPageChange={handlePageChange}
				/>
			)}

			{/* 페르소나 생성 다이얼로그 */}
			<PersonaCreationDialog
				isOpen={isCreateDialogOpen}
				onClose={() => setIsCreateDialogOpen(false)}
				onPersonaCreated={handlePersonaCreated}
			/>

			{/* 상세보기 다이얼로그 */}
			{selectedPersona && (
				<Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
					<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<User className="h-5 w-5" />
								{selectedPersona.name} 상세 정보
							</DialogTitle>
							<DialogDescription>
								페르소나의 상세 정보를 확인할 수 있습니다.
							</DialogDescription>
						</DialogHeader>

						<div className="grid gap-4">
							{/* 기본 정보 */}
							<Card>
								<CardHeader>
									<CardTitle className="text-base">기본 정보</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<Label className="text-sm font-medium">Seq</Label>
											<p className="text-sm">{selectedPersona.seq}</p>
										</div>
										<div>
											<Label className="text-sm font-medium">ID</Label>
											<p className="text-sm font-mono">
												{selectedPersona.id || "-"}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium">이름</Label>
											<p className="text-sm">{selectedPersona.name}</p>
										</div>
										<div>
											<Label className="text-sm font-medium">타입</Label>
											<p className="text-sm">
												{TYPE_LABELS[selectedPersona.type] ||
													selectedPersona.type}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium">상태</Label>
											<Badge
												variant={
													selectedPersona.status === "ACTIVE"
														? "default"
														: "secondary"
												}
												className={
													selectedPersona.status === "ACTIVE"
														? "bg-green-100 text-green-800"
														: "bg-red-100 text-red-800"
												}
											>
												{STATUS_LABELS[selectedPersona.status] ||
													selectedPersona.status}
											</Badge>
										</div>
										<div>
											<Label className="text-sm font-medium">사용자 ID</Label>
											<p className="text-sm">
												{selectedPersona.user_id || "-"}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* 요약 */}
							{selectedPersona.summary && (
								<Card>
									<CardHeader>
										<CardTitle className="text-base">요약</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm">{selectedPersona.summary}</p>
									</CardContent>
								</Card>
							)}

							{/* 태그 */}
							{selectedPersona.tags && selectedPersona.tags.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle className="text-base">태그</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex flex-wrap gap-1">
											{selectedPersona.tags.map((tag, index) => (
												<Badge key={index} variant="outline">
													{tag}
												</Badge>
											))}
										</div>
									</CardContent>
								</Card>
							)}

							{/* LLM 프롬프트 */}
							{selectedPersona.llm_prompt && (
								<Card>
									<CardHeader>
										<CardTitle className="text-base">LLM 프롬프트</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="max-h-40 overflow-y-auto">
											<pre className="text-xs whitespace-pre-wrap">
												{selectedPersona.llm_prompt}
											</pre>
										</div>
									</CardContent>
								</Card>
							)}

							{/* 채팅 오프닝 */}
							{selectedPersona.chat_opening && (
								<Card>
									<CardHeader>
										<CardTitle className="text-base">채팅 오프닝</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm whitespace-pre-wrap">
											{selectedPersona.chat_opening}
										</p>
									</CardContent>
								</Card>
							)}

							{/* 배경 */}
							{selectedPersona.background && (
								<Card>
									<CardHeader>
										<CardTitle className="text-base">배경</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm whitespace-pre-wrap">
											{selectedPersona.background}
										</p>
									</CardContent>
								</Card>
							)}
						</div>

						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsDetailDialogOpen(false)}
							>
								닫기
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{/* 삭제 확인 다이얼로그 */}
			{currentPersona && (
				<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>페르소나 삭제</DialogTitle>
							<DialogDescription>
								정말로 "{currentPersona.name}" 페르소나를 삭제하시겠습니까?
								<br />이 작업은 되돌릴 수 없습니다.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsDeleteDialogOpen(false)}
							>
								취소
							</Button>
							<Button variant="destructive" onClick={handleConfirmDelete}>
								삭제
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</AdminPageLayout>
	);
}
