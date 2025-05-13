"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // 라우터 임포트 (토큰 없을 시 리다이렉션용)
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
	created_at: string; // 날짜/시간 타입은 string으로 받을 수 있음
	updated_at: string | null;
}

export default function AdminUsersPage() {
	console.log("--- AdminUsersPage FUNCTION EXECUTION (SERVER-SIDE if SSR) ---");
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter(); // 라우터 초기화
	const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

	const [newUserName, setNewUserName] = useState("");
	const [newUserEmail, setNewUserEmail] = useState("");
	const [newUserRole, setNewUserRole] = useState<string | undefined>(undefined);

	useEffect(() => {
		const fetchUsers = async () => {
			console.log("fetchUsers function started"); // <-- 로그 추가 1
			const token = localStorage.getItem("access_token");
			if (!token) {
				console.log("No token found, returning early."); // <-- 로그 추가 3
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
				console.log("Calling fetchAPI for users..."); // <-- 로그 추가 4
				// 여기가 fetchAPI로 대체되었는지 확인!
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
						// localStorage.removeItem('access_token'); // 토큰 제거
						// router.push('/login'); // 로그인 페이지로 리다이렉션
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
				console.error("Error fetching users:", err); // <-- 로그 추가 5
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
	}, [router]); // router를 의존성 배열에 추가

	const handleAddUser = () => {
		if (!newUserName || !newUserEmail || !newUserRole) {
			alert("Please fill in all fields.");
			return;
		}
		const newUser = {
			id: users.length + 1,
			username: newUserName,
			email: newUserEmail,
			full_name: null,
			is_active: true,
			is_superuser: false,
			created_at: new Date().toISOString().split("T")[0],
			updated_at: null,
		};
		setUsers([...users, newUser]);

		setNewUserName("");
		setNewUserEmail("");
		setNewUserRole(undefined);
		setIsAddUserDialogOpen(false);
	};

	if (loading) {
		return <div className="p-4">사용자 목록을 불러오는 중...</div>;
	}

	if (error) {
		return <div className="p-4 text-red-500">오류: {error}</div>;
	}

	if (users.length === 0) {
		return <div className="p-4">등록된 사용자가 없습니다.</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">User Management</h1>
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
					<DialogTrigger asChild>
						<Button onClick={() => setIsAddUserDialogOpen(true)}>
							Add User
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Add New User</DialogTitle>
							<DialogDescription>
								Fill in the details for the new user. Click save when
								you&apos;re done.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="name" className="text-right">
									Name
								</Label>
								<Input
									id="name"
									placeholder="John Doe"
									className="col-span-3"
									value={newUserName}
									onChange={(e) => setNewUserName(e.target.value)}
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="email" className="text-right">
									Email
								</Label>
								<Input
									id="email"
									type="email"
									placeholder="john.doe@example.com"
									className="col-span-3"
									value={newUserEmail}
									onChange={(e) => setNewUserEmail(e.target.value)}
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="role" className="text-right">
									Role
								</Label>
								<Select value={newUserRole} onValueChange={setNewUserRole}>
									<SelectTrigger className="col-span-3">
										<SelectValue placeholder="Select a role" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Admin">Admin</SelectItem>
										<SelectItem value="Editor">Editor</SelectItem>
										<SelectItem value="Viewer">Viewer</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<DialogFooter>
							<DialogClose asChild>
								<Button type="button" variant="outline">
									Cancel
								</Button>
							</DialogClose>
							<Button type="button" onClick={handleAddUser}>
								Save User
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<Table>
				<TableCaption>A list of your users.</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[100px]">ID</TableHead>
						<TableHead>Name</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Joined Date</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.map((user) => (
						<TableRow key={user.id}>
							<TableCell className="font-medium">{user.id}</TableCell>
							<TableCell>{user.username}</TableCell>
							<TableCell>{user.email}</TableCell>
							<TableCell>{user.is_superuser ? "Admin" : "Editor"}</TableCell>
							<TableCell>{user.created_at}</TableCell>
							<TableCell className="text-right">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" className="h-8 w-8 p-0">
											<span className="sr-only">Open menu</span>
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuLabel>Actions</DropdownMenuLabel>
										<DropdownMenuItem
											onClick={() => alert(`Editing user ${user.id}`)}
										>
											Edit
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => alert(`Viewing user ${user.id}`)}
										>
											View details
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="text-red-600 hover:!text-red-600 hover:!bg-red-50"
											onClick={() => {
												if (confirm(`Delete user ${user.username}?`)) {
													setUsers(users.filter((u) => u.id !== user.id));
												}
											}}
										>
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
