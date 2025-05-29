"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Edit,
	Trash2,
	Eye,
	UserCheck,
	UserX,
	Shield,
	ShieldCheck,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "sonner";

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

	// 현재 사용자 정보 상태 추가
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [isCurrentUserSuperuser, setIsCurrentUserSuperuser] = useState(false);

	// 검색 및 페이지네이션 상태
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);

	// 필터 상태 추가
	const [activeFilter, setActiveFilter] = useState<
		"all" | "active" | "inactive" | "superuser"
	>("all");

	// 사용자 상세보기/수정 상태
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const [isSubmitting, setIsSubmitting] = useState(false);

	// 현재 사용자 정보 확인
	useEffect(() => {
		const checkCurrentUser = async () => {
			try {
				const token = localStorage.getItem("access_token");
				if (!token) return;

				console.log("현재 사용자 정보 요청 중...");
				const response = await fetchAPI("/api/v1/users/me", {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (response.ok) {
					const userData = await response.json();
					console.log("현재 사용자 정보:", userData);
					setCurrentUser(userData);
					setIsCurrentUserSuperuser(userData.is_superuser || false);
				} else {
					console.error(
						"현재 사용자 정보 조회 실패:",
						response.status,
						response.statusText
					);
				}
			} catch (error) {
				console.error("현재 사용자 정보 조회 실패:", error);
			}
		};

		checkCurrentUser();
	}, []);

	// 필터링 로직 수정
	useEffect(() => {
		let filtered = [...users];

		// 검색 필터 적용
		if (searchTerm && searchTerm.trim() !== "") {
			const lowercasedSearch = searchTerm.toLowerCase();
			filtered = filtered.filter((user) => {
				return (
					user.username.toLowerCase().includes(lowercasedSearch) ||
					user.email.toLowerCase().includes(lowercasedSearch) ||
					(user.full_name &&
						user.full_name.toLowerCase().includes(lowercasedSearch))
				);
			});
		}

		// 상태 필터 적용
		switch (activeFilter) {
			case "active":
				filtered = filtered.filter((user) => user.is_active);
				break;
			case "inactive":
				filtered = filtered.filter((user) => !user.is_active);
				break;
			case "superuser":
				filtered = filtered.filter((user) => user.is_superuser);
				break;
			default:
				break;
		}

		setFilteredUsers(filtered);
		setCurrentPage(1);
	}, [searchTerm, users, activeFilter]);

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

	// 사용자 삭제 확인 (최고관리자만)
	const handleDeleteUser = (user: User) => {
		if (!isCurrentUserSuperuser) {
			toast.error("최고관리자만 사용자를 삭제할 수 있습니다.");
			return;
		}
		setSelectedUser(user);
		setIsDeleteDialogOpen(true);
	};

	// 사용자 삭제 실행 (실제 API 호출) - 수정된 부분
	const handleConfirmDelete = async () => {
		if (!selectedUser) return;

		setIsSubmitting(true);
		try {
			const token = localStorage.getItem("access_token");
			if (!token) throw new Error("Access token not found.");

			const response = await fetchAPI(`/api/v1/users/${selectedUser.id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.detail || "사용자 삭제에 실패했습니다.");
			}

			// 삭제 성공 시 로컬 상태에서도 제거
			setUsers(users.filter((u) => u.id !== selectedUser.id));

			// 다이얼로그 닫기
			setIsDeleteDialogOpen(false);
			setSelectedUser(null);

			// 성공 메시지 표시
			toast.success(
				`사용자 '${selectedUser.username}'이(가) 성공적으로 삭제되었습니다.`
			);
		} catch (error) {
			console.error("사용자 삭제 오류:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "사용자 삭제 중 오류가 발생했습니다."
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	// 사용자 상태 변경 (확인 없이 직접 토글)
	const handleUpdateUserStatus = async (userId: number, isActive: boolean) => {
		if (!isCurrentUserSuperuser) {
			toast.error("최고관리자만 사용자 상태를 변경할 수 있습니다.");
			return;
		}

		// 본인 계정 체크
		if (currentUser && userId === currentUser.id) {
			toast.error("본인 계정의 상태는 변경할 수 없습니다.");
			return;
		}

		setIsSubmitting(true);
		try {
			const token = localStorage.getItem("access_token");
			if (!token) throw new Error("Access token not found.");

			const response = await fetchAPI(
				`/api/v1/users/${userId}/status?is_active=${isActive}`,
				{
					method: "PUT",
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.detail || "사용자 상태 변경에 실패했습니다.");
			}

			// 로컬 상태 업데이트
			setUsers(
				users.map((user) =>
					user.id === userId
						? {
								...user,
								is_active: isActive,
								updated_at: new Date().toISOString(),
						  }
						: user
				)
			);

			toast.success(`사용자가 ${isActive ? "활성화" : "비활성화"}되었습니다.`);
		} catch (error) {
			console.error("사용자 상태 변경 오류:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "사용자 상태 변경 중 오류가 발생했습니다."
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	// 사용자 권한 변경 (확인 없이 직접 토글)
	const handleUpdateUserRole = async (userId: number, isSuperuser: boolean) => {
		if (!isCurrentUserSuperuser) {
			toast.error("최고관리자만 사용자 권한을 변경할 수 있습니다.");
			return;
		}

		// 본인 계정 체크
		if (currentUser && userId === currentUser.id) {
			toast.error("본인 계정의 권한은 변경할 수 없습니다.");
			return;
		}

		setIsSubmitting(true);
		try {
			const token = localStorage.getItem("access_token");
			if (!token) throw new Error("Access token not found.");

			const response = await fetchAPI(
				`/api/v1/users/${userId}/role?is_superuser=${isSuperuser}`,
				{
					method: "PUT",
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.detail || "사용자 권한 변경에 실패했습니다.");
			}

			// 로컬 상태 업데이트
			setUsers(
				users.map((user) =>
					user.id === userId
						? {
								...user,
								is_superuser: isSuperuser,
								updated_at: new Date().toISOString(),
						  }
						: user
				)
			);

			toast.success(
				`사용자 권한이 ${
					isSuperuser ? "최고관리자" : "일반사용자"
				}로 변경되었습니다.`
			);
		} catch (error) {
			console.error("사용자 권한 변경 오류:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "사용자 권한 변경 중 오류가 발생했습니다."
			);
		} finally {
			setIsSubmitting(false);
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

	// 각 사용자의 액션 메뉴 생성 (권한에 따라 다르게)
	const getUserActions = (user: User): ActionItem[] => {
		const actions: ActionItem[] = [
			{
				label: "상세보기",
				icon: <Eye className="h-4 w-4" />,
				onClick: () => handleViewUser(user),
			},
		];

		// 최고관리자만 관리 기능 사용 가능
		if (isCurrentUserSuperuser) {
			// 본인이 아닌 경우에만 상태/권한 변경 가능
			if (currentUser && user.id !== currentUser.id) {
				actions.push({
					label: user.is_active ? "비활성화" : "활성화",
					icon: user.is_active ? (
						<UserX className="h-4 w-4" />
					) : (
						<UserCheck className="h-4 w-4" />
					),
					onClick: () => {
						// 직접 상태 변경 (토글 방식)
						handleUpdateUserStatus(user.id, !user.is_active);
					},
				});

				actions.push({
					label: user.is_superuser ? "일반사용자로 변경" : "최고관리자로 변경",
					icon: user.is_superuser ? (
						<Shield className="h-4 w-4" />
					) : (
						<ShieldCheck className="h-4 w-4" />
					),
					onClick: () => {
						// 직접 권한 변경 (토글 방식)
						handleUpdateUserRole(user.id, !user.is_superuser);
					},
				});
			}

			// 기존 수정/삭제 기능 (본인이 아닌 경우에만)
			if (currentUser && user.id !== currentUser.id) {
				actions.push({
					label: "수정",
					icon: <Edit className="h-4 w-4" />,
					onClick: () => handleEditUser(user),
				});

				actions.push({
					label: "삭제",
					icon: <Trash2 className="h-4 w-4" />,
					variant: "destructive",
					onClick: () => handleDeleteUser(user),
				});
			}
		} else {
			// 최고관리자가 아닌 경우에도 기본 수정/삭제 버튼 표시 (기존 동작 유지)
			actions.push({
				label: "수정",
				icon: <Edit className="h-4 w-4" />,
				onClick: () => handleEditUser(user),
			});

			actions.push({
				label: "삭제",
				icon: <Trash2 className="h-4 w-4" />,
				variant: "destructive",
				onClick: () => handleDeleteUser(user),
			});
		}

		return actions;
	};

	if (loading) {
		return (
			<AdminPageLayout>
				<AdminPageHeader
					title="사용자 관리"
					searchPlaceholder="사용자명, 이메일 검색..."
					searchValue={searchTerm}
					onSearchChange={setSearchTerm}
					showCreateButton={false}
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
					showCreateButton={false}
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
				showCreateButton={false}
			/>

			{/* 필터 탭 추가 */}
			<Tabs
				value={activeFilter}
				onValueChange={(value) => setActiveFilter(value as any)}
				className="w-full mb-6"
			>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="all">전체 ({users.length})</TabsTrigger>
					<TabsTrigger value="active" className="text-green-600">
						활성 ({users.filter((u) => u.is_active).length})
					</TabsTrigger>
					<TabsTrigger value="inactive" className="text-red-600">
						비활성 ({users.filter((u) => !u.is_active).length})
					</TabsTrigger>
					<TabsTrigger value="superuser" className="text-blue-600">
						관리자 ({users.filter((u) => u.is_superuser).length})
					</TabsTrigger>
				</TabsList>
			</Tabs>

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
								searchTerm || activeFilter !== "all"
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
								<AdminTableCell>
									{user.username}
									{currentUser && user.id === currentUser.id && (
										<span className="ml-2 text-xs text-blue-600">(본인)</span>
									)}
								</AdminTableCell>
								<AdminTableCell>{user.email}</AdminTableCell>
								<AdminTableCell>{user.full_name || "-"}</AdminTableCell>
								<AdminTableCell>
									{user.is_superuser ? (
										<Badge className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 border border-blue-200">
											관리자
										</Badge>
									) : (
										<Badge className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 border border-gray-200">
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
										<Badge className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 border border-blue-200">
											관리자
										</Badge>
									) : (
										<Badge className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 border border-gray-200">
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

			{/* 삭제 확인 다이얼로그 - 수정된 부분 */}
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
							disabled={isSubmitting}
						>
							취소
						</Button>
						<Button
							variant="destructive"
							onClick={handleConfirmDelete}
							disabled={isSubmitting}
						>
							{isSubmitting ? "삭제 중..." : "삭제"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</AdminPageLayout>
	);
}
