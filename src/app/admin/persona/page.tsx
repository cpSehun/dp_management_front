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

// 기존 타입들 유지
interface Persona {
	id: number;
	name: string;
	ageGroup: string;
	gender: string;
	personality: string;
	statusMessage: string;
	tags: string[];
	imagePrompt?: string;
	personalityPrompt?: string;
	createdAt: string;
}

// 기존 샘플 데이터 유지 (추후 DB 연동)
const initialPersonas: Persona[] = [
	{
		id: 1,
		name: "김철수",
		ageGroup: "20대 초반",
		gender: "남성",
		personality: "활발함, 사교적",
		statusMessage: "오늘도 열심히 살아보자!",
		tags: ["대학생", "취준생", "운동", "게임"],
		personalityPrompt:
			"당신은 활발하고 사교적인 20대 초반 대학생입니다. 운동과 게임을 좋아하며 항상 긍정적인 에너지를 가지고 있습니다.",
		createdAt: "2023-08-15T10:30:00Z",
	},
	{
		id: 2,
		name: "이영희",
		ageGroup: "30대 후반",
		gender: "여성",
		personality: "차분함, 논리적",
		statusMessage: "행복은 일상 속에 있어요",
		tags: ["직장인", "여행", "요리", "독서"],
		personalityPrompt:
			"당신은 차분하고 논리적인 30대 후반 직장인 여성입니다. 여행과 요리, 독서를 좋아하며 일상 속 작은 행복을 소중히 여깁니다.",
		createdAt: "2023-09-05T14:20:00Z",
	},
];

const ITEMS_PER_PAGE = 5;

// 날짜 포맷팅 함수
const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
		2,
		"0"
	)}-${String(date.getDate()).padStart(2, "0")}`;
};

export default function PersonaPage() {
	const [personas, setPersonas] = useState<Persona[]>(initialPersonas);
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>(personas);
	const [currentPage, setCurrentPage] = useState(1);
	const [paginatedPersonas, setPaginatedPersonas] = useState<Persona[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// 페르소나 생성 다이얼로그 상태
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

	// 기존 모달 상태들 유지
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);

	// 검색 및 페이지네이션 기능
	useEffect(() => {
		if (searchTerm.trim() === "") {
			setFilteredPersonas(personas);
		} else {
			const lowercasedSearch = searchTerm.toLowerCase();
			const filtered = personas.filter((persona) => {
				return (
					persona.name.toLowerCase().includes(lowercasedSearch) ||
					persona.ageGroup.toLowerCase().includes(lowercasedSearch) ||
					persona.gender.toLowerCase().includes(lowercasedSearch) ||
					persona.personality.toLowerCase().includes(lowercasedSearch) ||
					persona.statusMessage.toLowerCase().includes(lowercasedSearch) ||
					persona.tags.some((tag) =>
						tag.toLowerCase().includes(lowercasedSearch)
					)
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
			const updatedPersonas = personas.filter(
				(p) => p.id !== currentPersona.id
			);
			setPersonas(updatedPersonas);
			setIsDeleteDialogOpen(false);
			setCurrentPersona(null);
		}
	};

	// 페르소나 생성 완료 핸들러
	const handlePersonaCreated = (newPersona: any) => {
		// 실제로는 DB에서 생성된 페르소나를 가져와야 함
		console.log("새 페르소나 생성됨:", newPersona);

		// 목록 새로고침 (임시)
		// fetchPersonas();

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
					searchPlaceholder="이름, 태그, 특성 등 검색..."
					searchValue={searchTerm}
					onSearchChange={setSearchTerm}
					onCreateClick={handleCreatePersona}
					createButtonText="페르소나 생성"
				/>
				<AdminTable>
					<AdminTableHeader>
						<AdminTableHeaderCell>이름</AdminTableHeaderCell>
						<AdminTableHeaderCell>나이대</AdminTableHeaderCell>
						<AdminTableHeaderCell>성별</AdminTableHeaderCell>
						<AdminTableHeaderCell>성격</AdminTableHeaderCell>
						<AdminTableHeaderCell>상태메시지</AdminTableHeaderCell>
						<AdminTableHeaderCell>태그</AdminTableHeaderCell>
						<AdminTableHeaderCell>생성일</AdminTableHeaderCell>
						<AdminTableHeaderCell className="text-right">
							관리
						</AdminTableHeaderCell>
					</AdminTableHeader>
					<AdminTableBody>{/* 로딩 행 표시 */}</AdminTableBody>
				</AdminTable>
			</AdminPageLayout>
		);
	}

	return (
		<AdminPageLayout>
			<AdminPageHeader
				title="페르소나 관리"
				searchPlaceholder="이름, 태그, 특성 등 검색..."
				searchValue={searchTerm}
				onSearchChange={setSearchTerm}
				onCreateClick={handleCreatePersona}
				createButtonText="페르소나 생성"
			/>

			<AdminTable>
				<AdminTableHeader>
					<AdminTableHeaderCell>이름</AdminTableHeaderCell>
					<AdminTableHeaderCell>나이대</AdminTableHeaderCell>
					<AdminTableHeaderCell>성별</AdminTableHeaderCell>
					<AdminTableHeaderCell>성격</AdminTableHeaderCell>
					<AdminTableHeaderCell>상태메시지</AdminTableHeaderCell>
					<AdminTableHeaderCell>태그</AdminTableHeaderCell>
					<AdminTableHeaderCell>생성일</AdminTableHeaderCell>
					<AdminTableHeaderCell className="text-right">
						관리
					</AdminTableHeaderCell>
				</AdminTableHeader>
				<AdminTableBody>
					{paginatedPersonas.length === 0 ? (
						<AdminTableEmptyRow
							colSpan={8}
							message={
								searchTerm
									? "검색 결과가 없습니다."
									: "등록된 페르소나가 없습니다."
							}
						/>
					) : (
						paginatedPersonas.map((persona) => (
							<AdminTableRow key={persona.id}>
								<AdminTableCell className="font-medium">
									{persona.name}
								</AdminTableCell>
								<AdminTableCell>{persona.ageGroup}</AdminTableCell>
								<AdminTableCell>{persona.gender}</AdminTableCell>
								<AdminTableCell>{persona.personality}</AdminTableCell>
								<AdminTableCell className="max-w-xs">
									<div className="truncate" title={persona.statusMessage}>
										{persona.statusMessage}
									</div>
								</AdminTableCell>
								<AdminTableCell>
									<div className="flex flex-wrap gap-1">
										{persona.tags.slice(0, 2).map((tag) => (
											<Badge key={tag} variant="outline" className="text-xs">
												{tag}
											</Badge>
										))}
										{persona.tags.length > 2 && (
											<Badge variant="secondary" className="text-xs">
												+{persona.tags.length - 2}
											</Badge>
										)}
									</div>
								</AdminTableCell>
								<AdminTableCell>{formatDate(persona.createdAt)}</AdminTableCell>
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
