"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, User, Eye } from "lucide-react";
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
	CHAR: "캐릭터",
	STORY: "스토리",
};

// 상태 라벨 맵핑
const STATUS_LABELS: Record<string, string> = {
	ACTIVE: "활성",
	INACTIVE: "비활성",
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
	const [currentPage, setCurrentPage] = useState(1);
	const [paginatedPersonas, setPaginatedPersonas] = useState<Persona[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// 🔥 users 패턴: 상태 필터 추가
	const [activeFilter, setActiveFilter] = useState<
		"all" | "active" | "inactive" | "char" | "story"
	>("all");

	// 페르소나 생성 다이얼로그 상태
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

	// 🔥 users 패턴: 상세보기 다이얼로그 상태 추가
	const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

	// 기존 모달 상태들 유지
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);

	// t_persona 테이블에서 데이터 조회
	const fetchPersonas = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const token = localStorage.getItem("access_token");
			if (!token) {
				throw new Error("로그인이 필요합니다.");
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

	// 🔥 users 패턴: 필터링 로직 강화
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

		// 🔥 상태 필터 적용
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

	// 🔥 users 패턴: 상세보기 핸들러 추가
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
	const handleConfirmDelete = () => {
		if (currentPersona) {
			// 실제 삭제 API 호출은 여기서 구현 필요
			console.log("페르소나 삭제:", currentPersona);

			// 임시로 로컬 상태에서만 제거
			const updatedPersonas = personas.filter(
				(p) => p.seq !== currentPersona.seq
			);
			setPersonas(updatedPersonas);
			setIsDeleteDialogOpen(false);
			setCurrentPersona(null);
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

	// 🔥 users 패턴: 액션 메뉴 생성
	const getPersonaActions = (persona: Persona): ActionItem[] => [
		{
			label: "상세보기",
			icon: <Eye className="h-4 w-4" />,
			onClick: () => handleViewPersona(persona),
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

	// 에러 상태 처리
	if (error) {
		return (
			<AdminPageLayout>
				<AdminPageHeader
					title="페르소나 관리"
					searchPlaceholder="이름, ID, 타입, 상태, 사용자ID 등 검색..."
					searchValue={searchTerm}
					onSearchChange={setSearchTerm}
					onCreateClick={handleCreatePersona}
					createButtonText="페르소나 생성"
				/>
				<div className="flex flex-col items-center justify-center p-8 text-center">
					<div className="text-red-500 text-lg font-medium mb-2">오류 발생</div>
					<div className="text-gray-600 mb-4">{error}</div>
					<Button onClick={fetchPersonas} variant="outline">
						다시 시도
					</Button>
				</div>
			</AdminPageLayout>
		);
	}

	// 초기 로딩 상태
	if (isLoading) {
		return (
			<AdminPageLayout>
				<AdminPageHeader
					title="페르소나 관리"
					searchPlaceholder="이름, ID, 타입, 상태, 사용자ID 등 검색..."
					searchValue={searchTerm}
					onSearchChange={setSearchTerm}
					onCreateClick={handleCreatePersona}
					createButtonText="페르소나 생성"
				/>
				<AdminTable>
					<AdminTableHeader>
						<AdminTableHeaderCell>SEQ</AdminTableHeaderCell>
						<AdminTableHeaderCell>ID</AdminTableHeaderCell>
						<AdminTableHeaderCell>타입</AdminTableHeaderCell>
						<AdminTableHeaderCell>이름</AdminTableHeaderCell>
						<AdminTableHeaderCell>사용자ID</AdminTableHeaderCell>
						<AdminTableHeaderCell>상태</AdminTableHeaderCell>
						<AdminTableHeaderCell>모델ID</AdminTableHeaderCell>
						<AdminTableHeaderCell>생성일</AdminTableHeaderCell>
						<AdminTableHeaderCell>수정일</AdminTableHeaderCell>
						<AdminTableHeaderCell className="text-right">
							관리
						</AdminTableHeaderCell>
					</AdminTableHeader>
					<AdminTableBody>
						<AdminTableEmptyRow
							colSpan={10}
							message="데이터를 불러오는 중입니다..."
						/>
					</AdminTableBody>
				</AdminTable>
			</AdminPageLayout>
		);
	}

	return (
		<AdminPageLayout>
			<AdminPageHeader
				title="페르소나 관리"
				searchPlaceholder="이름, ID, 타입, 상태, 사용자ID 등 검색..."
				searchValue={searchTerm}
				onSearchChange={setSearchTerm}
				onCreateClick={handleCreatePersona}
				createButtonText="페르소나 생성"
			/>

			{/* 🔥 users 패턴: 필터 탭 추가 */}
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
					<AdminTableHeaderCell>SEQ</AdminTableHeaderCell>
					<AdminTableHeaderCell>ID</AdminTableHeaderCell>
					<AdminTableHeaderCell>타입</AdminTableHeaderCell>
					<AdminTableHeaderCell>이름</AdminTableHeaderCell>
					<AdminTableHeaderCell>사용자ID</AdminTableHeaderCell>
					<AdminTableHeaderCell>상태</AdminTableHeaderCell>
					<AdminTableHeaderCell>모델ID</AdminTableHeaderCell>
					<AdminTableHeaderCell>생성일</AdminTableHeaderCell>
					<AdminTableHeaderCell>수정일</AdminTableHeaderCell>
					<AdminTableHeaderCell className="text-right">
						관리
					</AdminTableHeaderCell>
				</AdminTableHeader>
				<AdminTableBody>
					{paginatedPersonas.length === 0 ? (
						<AdminTableEmptyRow
							colSpan={10}
							message={
								searchTerm || activeFilter !== "all"
									? "검색 결과가 없습니다."
									: "등록된 페르소나가 없습니다."
							}
						/>
					) : (
						paginatedPersonas.map((persona) => (
							<AdminTableRow key={persona.seq}>
								<AdminTableCell className="font-medium">
									{persona.seq}
								</AdminTableCell>
								<AdminTableCell className="font-mono text-sm">
									{persona.id || "-"}
								</AdminTableCell>
								<AdminTableCell>
									{persona.type ? (
										persona.type === "CHAR" ? (
											<Badge className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 border border-blue-200">
												CHAR
											</Badge>
										) : persona.type === "STORY" ? (
											<Badge className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 border border-purple-200">
												STORY
											</Badge>
										) : (
											<Badge variant="outline">
												{TYPE_LABELS[persona.type] || persona.type}
											</Badge>
										)
									) : (
										"-"
									)}
								</AdminTableCell>
								<AdminTableCell className="font-medium">
									{persona.name}
								</AdminTableCell>
								<AdminTableCell>{persona.user_id || "-"}</AdminTableCell>
								<AdminTableCell>
									{persona.status === "ACTIVE" ? (
										<Badge className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 border border-green-200">
											ACTIVE
										</Badge>
									) : (
										<Badge className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 border border-red-200">
											INACTIVE
										</Badge>
									)}
								</AdminTableCell>
								<AdminTableCell className="font-mono text-sm">
									{persona.model_id ? (
										<span className="truncate block max-w-24">
											{persona.model_id}
										</span>
									) : (
										"-"
									)}
								</AdminTableCell>
								<AdminTableCell className="text-sm text-muted-foreground">
									{formatDate(persona.created_at)}
								</AdminTableCell>
								<AdminTableCell className="text-sm text-muted-foreground">
									{formatDate(persona.updated_at)}
								</AdminTableCell>
								<AdminTableCell className="text-right">
									<ActionDropdown actions={getPersonaActions(persona)} />
								</AdminTableCell>
							</AdminTableRow>
						))
					)}
				</AdminTableBody>
			</AdminTable>

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

			{/* 🔥 users 패턴: 상세보기 다이얼로그 추가 */}
			{selectedPersona && (
				<Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
					<DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>페르소나 상세 정보</DialogTitle>
							<DialogDescription>
								{selectedPersona.name}의 상세 정보입니다.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-3 items-center gap-4">
								<Label className="font-medium">SEQ:</Label>
								<span className="col-span-2 text-sm text-slate-700">
									{selectedPersona.seq}
								</span>
							</div>
							<div className="grid grid-cols-3 items-center gap-4">
								<Label className="font-medium">ID:</Label>
								<span className="col-span-2 text-sm text-slate-700 font-mono">
									{selectedPersona.id || "설정되지 않음"}
								</span>
							</div>
							<div className="grid grid-cols-3 items-center gap-4">
								<Label className="font-medium">이름:</Label>
								<span className="col-span-2 text-sm text-slate-700 font-medium">
									{selectedPersona.name}
								</span>
							</div>
							<div className="grid grid-cols-3 items-center gap-4">
								<Label className="font-medium">타입:</Label>
								<div className="col-span-2">
									{selectedPersona.type === "CHAR" ? (
										<Badge className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 border border-blue-200">
											캐릭터
										</Badge>
									) : selectedPersona.type === "STORY" ? (
										<Badge className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 border border-purple-200">
											스토리
										</Badge>
									) : (
										<Badge variant="outline">
											{TYPE_LABELS[selectedPersona.type] ||
												selectedPersona.type}
										</Badge>
									)}
								</div>
							</div>
							<div className="grid grid-cols-3 items-center gap-4">
								<Label className="font-medium">상태:</Label>
								<div className="col-span-2">
									{selectedPersona.status === "ACTIVE" ? (
										<Badge className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 border border-green-200">
											활성
										</Badge>
									) : (
										<Badge className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 border border-red-200">
											비활성
										</Badge>
									)}
								</div>
							</div>
							<div className="grid grid-cols-3 items-center gap-4">
								<Label className="font-medium">사용자ID:</Label>
								<span className="col-span-2 text-sm text-slate-700">
									{selectedPersona.user_id || "설정되지 않음"}
								</span>
							</div>
							<div className="grid grid-cols-3 items-center gap-4">
								<Label className="font-medium">모델ID:</Label>
								<span className="col-span-2 text-sm text-slate-700 font-mono">
									{selectedPersona.model_id || "설정되지 않음"}
								</span>
							</div>
							<div className="grid grid-cols-3 items-center gap-4">
								<Label className="font-medium">요약:</Label>
								<span className="col-span-2 text-sm text-slate-700">
									{selectedPersona.summary || "설정되지 않음"}
								</span>
							</div>
							<div className="grid grid-cols-3 items-start gap-4">
								<Label className="font-medium">프롬프트:</Label>
								<div className="col-span-2 text-sm text-slate-700 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
									{selectedPersona.llm_prompt || "설정되지 않음"}
								</div>
							</div>
							<div className="grid grid-cols-3 items-start gap-4">
								<Label className="font-medium">시작멘트:</Label>
								<div className="col-span-2 text-sm text-slate-700 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
									{selectedPersona.chat_opening || "설정되지 않음"}
								</div>
							</div>
							<div className="grid grid-cols-3 items-start gap-4">
								<Label className="font-medium">배경설정:</Label>
								<div className="col-span-2 text-sm text-slate-700 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
									{selectedPersona.background || "설정되지 않음"}
								</div>
							</div>
							<div className="grid grid-cols-3 items-center gap-4">
								<Label className="font-medium">생성일:</Label>
								<span className="col-span-2 text-sm text-slate-700">
									{formatDate(selectedPersona.created_at)}
								</span>
							</div>
							<div className="grid grid-cols-3 items-center gap-4">
								<Label className="font-medium">수정일:</Label>
								<span className="col-span-2 text-sm text-slate-700">
									{formatDate(selectedPersona.updated_at)}
								</span>
							</div>
							{selectedPersona.tags && (
								<div className="grid grid-cols-3 items-start gap-4">
									<Label className="font-medium">태그:</Label>
									<div className="col-span-2 text-sm text-slate-700">
										{JSON.stringify(selectedPersona.tags, null, 2)}
									</div>
								</div>
							)}
							{selectedPersona.properties && (
								<div className="grid grid-cols-3 items-start gap-4">
									<Label className="font-medium">속성:</Label>
									<div className="col-span-2 text-sm text-slate-700 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50 font-mono">
										{JSON.stringify(selectedPersona.properties, null, 2)}
									</div>
								</div>
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
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>페르소나 삭제</DialogTitle>
						<DialogDescription>
							'{currentPersona?.name}' 페르소나를 삭제하시겠습니까? 이 작업은
							되돌릴 수 없습니다.
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
		</AdminPageLayout>
	);
}
