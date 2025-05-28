"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, Eye } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogClose,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
	AdminTable,
	AdminTableHeader,
	AdminTableHeaderCell,
	AdminTableBody,
	AdminTableRow,
	AdminTableCell,
	AdminTableLoadingRow,
	AdminTableEmptyRow,
} from "@/components/admin/AdminTable";
import { ActionDropdown, ActionItem } from "@/components/admin/ActionDropdown";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { fetchAPI } from "@/utils/api";

console.log("--- AdminUsersPage.tsx SERVER-SIDE LOG (file top) ---");

// 사용자 데이터 타입을 정의 (백엔드 schemas.User 참고)
interface User {
	id: number;
	username: string;
	email: string;
	full_name: string | null;
	is_active: boolean;
	is_superuser: boolean;
	created_at: string;
	updated_at: string | null;
}

const ITEMS_PER_PAGE = 10;

export default function AdminUsersPage() {
	console.log("--- AdminUsersPage FUNCTION EXECUTION (SERVER-SIDE if SSR) ---");
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

	// 검색 및 페이지네이션 상태
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);

	// 사용자 추가 폼 상태
	const [newUserName, setNewUserName] = useState("");
	const [newUserEmail, setNewUserEmail] = useState("");
	const [newUserRole, setNewUserRole] = useState<string | undefined>(undefined);

	// 사용자 상세보기/수정 상태
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	// 검색 기능
	useEffect(() => {
		if (!searchTerm || searchTerm.trim() === "") {
			setFilteredUsers([...users]);
		} else {
			const lowercasedSearch = searchTerm.toLowerCase();
			const filtered = users.filter((user) => {
				return (
					user.username.toLowerCase().includes(lowercasedSearch) ||
					user.email.toLowerCase().includes(lowercasedSearch) ||
					(user.full_name &&
						user.full_name.toLowerCase().includes(lowercasedSearch))
				);
			});
			setFilteredUsers(filtered);
		}
		setCurrentPage(1);
	}, [searchTerm, users]);

	// 페이지네이션 처리
	useEffect(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		const endIndex = startIndex + ITEMS_PER_PAGE;
		setPaginatedUsers(filteredUsers.slice(startIndex, endIndex));
	}, [filteredUsers, currentPage]);

	useEffect(() => {
		const fetchUsers = async () => {
			console.log("fetchUsers function started");
			const token = localStorage.getItem("access_token");
			if (!token) {
				console.log("No token found, returning early.");
				setError("인증되지 않았습니다. 로그인 페이지로 이동합니다.");
				setLoading(false);
				return;
			}

			try {
				console.log("Trying direct fetch to localhost:8000...");

				// 테스트: 백엔드로 직접 요청 시도
				const directResponse = await fetch(
					"http://localhost:8000/api/v1/users/",
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);

				if (directResponse.ok) {
					const users = await directResponse.json();
					setUsers(users);
					setLoading(false);
					return;
				}
			} catch (err) {
				console.error("Direct fetch failed:", err);
			}

			try {
				console.log("Calling fetchAPI for users...");
				const response = await fetchAPI("/api/v1/users/", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					if (response.status === 401) {
						setError(
							"인증이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요."
						);
					} else {
						const errorData = await response.json();
						throw new Error(
							errorData.detail ||
								`사용자 목록을 가져오는데 실패했습니다: ${response.status}`
						);
					}
				}

				const data: User[] = await response.json();
				setUsers(data);
			} catch (err) {
				console.error("Error fetching users:", err);
				if (err instanceof Error) {
					setError(err.message);
				} else {
					setError("알 수 없는 오류가 발생했습니다.");
				}
			} finally {
				setLoading(false);
			}
		};

		fetchUsers();
	}, [router]);

	const handleAddUser = () => {
		if (!newUserName || !newUserEmail || !newUserRole) {
			alert("모든 필드를 입력해주세요.");
			return;
		}
		const newUser: User = {
			id: users.length + 1,
			username: newUserName,
			email: newUserEmail,
			full_name: newUserName,
			is_active: true,
			is_superuser: newUserRole === "Admin",
			created_at: new Date().toISOString(),
			updated_at: null,
		};
		setUsers([...users, newUser]);

		setNewUserName("");
		setNewUserEmail("");
		setNewUserRole(undefined);
		setIsAddUserDialogOpen(false);
	};

	// 페이지 변경 핸들러
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	// 총 페이지 수 계산
	const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

	// 사용자 상세보기
	const handleViewUser = (user: User) => {
		setSelectedUser(user);
		setIsDetailDialogOpen(true);
	};

	// 사용자 수정
	const handleEditUser = (user: User) => {
		alert(`${user.username} 수정 기능은 준비 중입니다.`);
	};

	// 사용자 삭제 확인
	const handleDeleteUser = (user: User) => {
		setSelectedUser(user);
		setIsDeleteDialogOpen(true);
	};

	// 사용자 삭제 실행
	const handleConfirmDelete = () => {
		if (selectedUser) {
			setUsers(users.filter((u) => u.id !== selectedUser.id));
			setIsDeleteDialogOpen(false);
			setSelectedUser(null);
		}
	};

	// 날짜 포맷팅
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
			2,
			"0"
		)}-${String(date.getDate()).padStart(2, "0")}`;
	};

	// 각 사용자의 액션 메뉴 생성
	const getUserActions = (user: User): ActionItem[] => [
		{
			label: "상세보기",
			icon: <Eye className="h-4 w-4" />,
			onClick: () => handleViewUser(user),
		},
		{
			label: "수정",
			icon: <Edit className="h-4 w-4" />,
			onClick: () => handleEditUser(user),
		},
		{
			label: "삭제",
			icon: <Trash2 className="h-4 w-4" />,
			variant: "destructive",
			onClick: () => handleDeleteUser(user),
		},
	];

	if (loading) {
		return (
			<AdminPageLayout>
				<AdminPageHeader
					title="사용자 관리"
					searchPlaceholder="사용자명, 이메일 검색..."
					searchValue={searchTerm}
					onSearchChange={setSearchTerm}
					onCreateClick={() => setIsAddUserDialogOpen(true)}
					createButtonText="사용자 추가"
				/>
				<AdminTable>
					<AdminTableHeader>
						<AdminTableHeaderCell>ID</AdminTableHeaderCell>
						<AdminTableHeaderCell>사용자명</AdminTableHeaderCell>
						<AdminTableHeaderCell>이메일</AdminTableHeaderCell>
						<AdminTableHeaderCell>전체 이름</AdminTableHeaderCell>
						<AdminTableHeaderCell>역할</AdminTableHeaderCell>
						<AdminTableHeaderCell>상태</AdminTableHeaderCell>
						<AdminTableHeaderCell>가입일</AdminTableHeaderCell>
						<AdminTableHeaderCell className="text-right">
							관리
						</AdminTableHeaderCell>
					</AdminTableHeader>
					<AdminTableBody>
						<AdminTableLoadingRow colSpan={8} />
					</AdminTableBody>
				</AdminTable>
			</AdminPageLayout>
		);
	}

	if (error) {
		return (
			<AdminPageLayout>
				<div className="text-red-500 text-center p-6">오류: {error}</div>
			</AdminPageLayout>
		);
	}

	if (users.length === 0) {
		return (
			<AdminPageLayout>
				<AdminPageHeader
					title="사용자 관리"
					searchPlaceholder="사용자명, 이메일 검색..."
					searchValue={searchTerm}
					onSearchChange={setSearchTerm}
					onCreateClick={() => setIsAddUserDialogOpen(true)}
					createButtonText="사용자 추가"
				/>
				<AdminTable>
					<AdminTableHeader>
						<AdminTableHeaderCell>ID</AdminTableHeaderCell>
						<AdminTableHeaderCell>사용자명</AdminTableHeaderCell>
						<AdminTableHeaderCell>이메일</AdminTableHeaderCell>
						<AdminTableHeaderCell>역할</AdminTableHeaderCell>
						<AdminTableHeaderCell>상태</AdminTableHeaderCell>
						<AdminTableHeaderCell>가입일</AdminTableHeaderCell>
						<AdminTableHeaderCell className="text-right">
							관리
						</AdminTableHeaderCell>
					</AdminTableHeader>
					<AdminTableBody>
						<AdminTableEmptyRow
							colSpan={7}
							message="등록된 사용자가 없습니다."
						/>
					</AdminTableBody>
				</AdminTable>
			</AdminPageLayout>
		);
	}

	return (
		<AdminPageLayout>
			<AdminPageHeader
				title="사용자 관리"
				searchPlaceholder="사용자명, 이메일 검색..."
				searchValue={searchTerm}
				onSearchChange={setSearchTerm}
				onCreateClick={() => setIsAddUserDialogOpen(true)}
				createButtonText="사용자 추가"
			/>

			<AdminTable>
				<AdminTableHeader>
					<AdminTableHeaderCell>ID</AdminTableHeaderCell>
					<AdminTableHeaderCell>사용자명</AdminTableHeaderCell>
					<AdminTableHeaderCell>이메일</AdminTableHeaderCell>
					<AdminTableHeaderCell>전체 이름</AdminTableHeaderCell>
					<AdminTableHeaderCell>역할</AdminTableHeaderCell>
					<AdminTableHeaderCell>상태</AdminTableHeaderCell>
					<AdminTableHeaderCell>가입일</AdminTableHeaderCell>
					<AdminTableHeaderCell className="text-right">
						관리
					</AdminTableHeaderCell>
				</AdminTableHeader>
				<AdminTableBody>
					{paginatedUsers.length === 0 ? (
						<AdminTableEmptyRow
							colSpan={8}
							message={
								searchTerm
									? "검색 결과가 없습니다."
									: "표시할 사용자가 없습니다."
							}
						/>
					) : (
						paginatedUsers.map((user) => (
							<AdminTableRow key={user.id}>
								<AdminTableCell className="font-medium">
									{user.id}
								</AdminTableCell>
								<AdminTableCell>{user.username}</AdminTableCell>
								<AdminTableCell>{user.email}</AdminTableCell>
								<AdminTableCell>{user.full_name || "-"}</AdminTableCell>
								<AdminTableCell>
									{user.is_superuser ? (
										<Badge className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 border border-purple-200">
											관리자
										</Badge>
									) : (
										<Badge className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 border border-blue-200">
											사용자
										</Badge>
									)}
								</AdminTableCell>
								<AdminTableCell>
									{user.is_active ? (
										<Badge className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 border border-green-200">
											활성
										</Badge>
									) : (
										<Badge className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 border border-red-200">
											비활성
										</Badge>
									)}
								</AdminTableCell>
								<AdminTableCell>{formatDate(user.created_at)}</AdminTableCell>
								<AdminTableCell className="text-right">
									<ActionDropdown actions={getUserActions(user)} />
								</AdminTableCell>
							</AdminTableRow>
						))
					)}
				</AdminTableBody>
			</AdminTable>

			<AdminPagination
				currentPage={currentPage}
				totalPages={totalPages}
				totalItems={filteredUsers.length}
				itemsPerPage={ITEMS_PER_PAGE}
				onPageChange={handlePageChange}
			/>

			{/* 사용자 추가 다이얼로그 */}
			<Dialog
				open={isAddUserDialogOpen}
				onOpenChange={(isOpen) => {
					setIsAddUserDialogOpen(isOpen);
					if (!isOpen) {
						setNewUserName("");
						setNewUserEmail("");
						setNewUserRole(undefined);
					}
				}}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>새 사용자 추가</DialogTitle>
						<DialogDescription>
							새로운 사용자의 정보를 입력하세요. 완료하면 저장을 클릭하세요.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="name" className="text-right">
								이름
							</Label>
							<Input
								id="name"
								placeholder="홍길동"
								className="col-span-3"
								value={newUserName}
								onChange={(e) => setNewUserName(e.target.value)}
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="email" className="text-right">
								이메일
							</Label>
							<Input
								id="email"
								type="email"
								placeholder="hong@example.com"
								className="col-span-3"
								value={newUserEmail}
								onChange={(e) => setNewUserEmail(e.target.value)}
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="role" className="text-right">
								역할
							</Label>
							<Select value={newUserRole} onValueChange={setNewUserRole}>
								<SelectTrigger className="col-span-3">
									<SelectValue placeholder="역할을 선택하세요" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Admin">관리자</SelectItem>
									<SelectItem value="User">사용자</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="outline">
								취소
							</Button>
						</DialogClose>
						<Button type="button" onClick={handleAddUser}>
							사용자 저장
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 사용자 상세보기 다이얼로그 */}
			{selectedUser && (
				<Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>사용자 상세 정보</DialogTitle>
							<DialogDescription>
								{selectedUser.username}님의 상세 정보입니다.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-3 items-center gap-4">
								<Label className="font-medium">ID:</Label>
								<span className="col-span-2 text-sm text-slate-700">
									{selectedUser.id}
								</span>
							</div>
							<div className="grid grid-cols-3 items-center gap-4">
								<Label className="font-medium">사용자명:</Label>
								<span className="col-span-2 text-sm text-slate-700">
									{selectedUser.username}
								</span>
							</div>
							<div className="grid grid-cols-3 items-center gap-4">
								<Label className="font-medium">이메일:</Label>
								<span className="col-span-2 text-sm text-slate-700">
									{selectedUser.email}
								</span>
							</div>
							<div className="grid grid-cols-3 items-center gap-4">
								<Label className="font-medium">전체 이름:</Label>
								<span className="col-span-2 text-sm text-slate-700">
									{selectedUser.full_name || "설정되지 않음"}
								</span>
							</div>
							<div className="grid grid-cols-3 items-center gap-4">
								<Label className="font-medium">역할:</Label>
								<div className="col-span-2">
									{selectedUser.is_superuser ? (
										<Badge className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 border border-purple-200">
											관리자
										</Badge>
									) : (
										<Badge className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 border border-blue-200">
											사용자
										</Badge>
									)}
								</div>
							</div>
							<div className="grid grid-cols-3 items-center gap-4">
								<Label className="font-medium">상태:</Label>
								<div className="col-span-2">
									{selectedUser.is_active ? (
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
								<Label className="font-medium">가입일:</Label>
								<span className="col-span-2 text-sm text-slate-700">
									{formatDate(selectedUser.created_at)}
								</span>
							</div>
							{selectedUser.updated_at && (
								<div className="grid grid-cols-3 items-center gap-4">
									<Label className="font-medium">최종 수정:</Label>
									<span className="col-span-2 text-sm text-slate-700">
										{formatDate(selectedUser.updated_at)}
									</span>
								</div>
							)}
						</div>
						<DialogFooter>
							<DialogClose asChild>
								<Button variant="outline">닫기</Button>
							</DialogClose>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{/* 삭제 확인 다이얼로그 */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>사용자 삭제</DialogTitle>
						<DialogDescription>
							'{selectedUser?.username}' 사용자를 삭제하시겠습니까? 이 작업은
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
