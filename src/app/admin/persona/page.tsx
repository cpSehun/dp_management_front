"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, User } from "lucide-react";
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

	// 페르소나 생성 다이얼로그 상태
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

	// 기존 모달 상태들 유지
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);

	// t_persona 테이블에서 데이터 조회
	const fetchPersonas = async () => {
		setIsLoading(true);
		try {
			const token = localStorage.getItem("access_token");
			if (!token) {
				console.error("No access token found");
				return;
			}

			// 외부 DB의 t_persona 테이블 데이터 조회 API 호출
			const response = await fetch("/api/v1/persona/", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: Persona[] = await response.json();
			setPersonas(data);
		} catch (error) {
			console.error("Error fetching personas:", error);
			// 에러 발생 시 빈 배열로 설정
			setPersonas([]);
		} finally {
			setIsLoading(false);
		}
	};

	// 컴포넌트 마운트 시 데이터 로드
	useEffect(() => {
		fetchPersonas();
	}, []);

	// 검색 및 페이지네이션 기능
	useEffect(() => {
		if (searchTerm.trim() === "") {
			setFilteredPersonas(personas);
		} else {
			const lowercasedSearch = searchTerm.toLowerCase();
			const filtered = personas.filter((persona) => {
				return (
					persona.name.toLowerCase().includes(lowercasedSearch) ||
					(persona.id && persona.id.toLowerCase().includes(lowercasedSearch)) ||
					persona.type.toLowerCase().includes(lowercasedSearch) ||
					persona.status.toLowerCase().includes(lowercasedSearch) ||
					(persona.model_id &&
						persona.model_id.toLowerCase().includes(lowercasedSearch)) ||
					(persona.summary &&
						persona.summary.toLowerCase().includes(lowercasedSearch))
				);
			});
			setFilteredPersonas(filtered);
		}
		setCurrentPage(1);
	}, [searchTerm, personas]);

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

	// 각 페르소나의 액션 메뉴 생성
	const getPersonaActions = (persona: Persona): ActionItem[] => [
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

	// 초기 로딩 상태
	if (isLoading) {
		return (
			<AdminPageLayout>
				<AdminPageHeader
					title="페르소나 관리"
					searchPlaceholder="이름, ID, 타입, 상태 등 검색..."
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
				searchPlaceholder="이름, ID, 타입, 상태 등 검색..."
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
					{paginatedPersonas.length === 0 ? (
						<AdminTableEmptyRow
							colSpan={10}
							message={
								searchTerm
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
										<Badge variant="outline">
											{TYPE_LABELS[persona.type] || persona.type}
										</Badge>
									) : (
										"-"
									)}
								</AdminTableCell>
								<AdminTableCell className="font-medium">
									{persona.name}
								</AdminTableCell>
								<AdminTableCell>{persona.user_id || "-"}</AdminTableCell>
								<AdminTableCell>
									<Badge
										variant={
											persona.status === "ACTIVE" ? "default" : "secondary"
										}
									>
										{STATUS_LABELS[persona.status] || persona.status}
									</Badge>
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
