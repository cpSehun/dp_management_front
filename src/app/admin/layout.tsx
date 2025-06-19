"use client";
import Link from "next/link";
import {
	// Bell,
	Home,
	Users,
	BarChart3,
	TerminalSquare,
	Image,
	// Settings,
	User,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import NextImage from "next/image";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

console.log("--- AdminLayout.tsx SERVER-SIDE LOG (file top) ---");

function parseJwt(token: string) {
	try {
		return JSON.parse(atob(token.split(".")[1]));
	} catch {
		return null;
	}
}

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const [username, setUsername] = useState<string | null>(null);
	const [isClient, setIsClient] = useState(false);

	// Images 메뉴 토글 상태만 유지
	const [isImagesMenuOpen, setIsImagesMenuOpen] = useState(false);

	useEffect(() => {
		setIsClient(true);
		if (typeof window !== "undefined") {
			const token = localStorage.getItem("access_token");

			if (!token && pathname !== "/login" && !pathname.startsWith("/auth")) {
				console.log("[Layout Effect] No token, redirecting to login.");
				router.replace("/login");
				return;
			}
			if (token) {
				const payload = parseJwt(token);
				if (!payload) {
					console.log(
						"[Layout Effect] Invalid token payload, removing token and redirecting."
					);
					localStorage.removeItem("access_token");
					if (pathname !== "/login" && !pathname.startsWith("/auth"))
						router.replace("/login");
					return;
				}
				const isExpired = payload.exp * 1000 < Date.now();
				if (isExpired) {
					console.log(
						"[Layout Effect] Token expired, removing token and redirecting."
					);
					localStorage.removeItem("access_token");
					alert("로그인 세션이 만료되었습니다. 다시 로그인 해주세요.");
					if (pathname !== "/login" && !pathname.startsWith("/auth"))
						router.replace("/login");
					return;
				}
				setUsername(payload.sub);
			}
		}
	}, [router, pathname]);

	// 현재 경로에 따라 메뉴 열림 상태 설정 (Images 메뉴만)
	useEffect(() => {
		if (pathname.startsWith("/admin/image")) {
			setIsImagesMenuOpen(true);
		}
	}, [pathname]);

	const handleLogout = () => {
		localStorage.removeItem("access_token");
		window.location.href = "/login";
	};

	// Images 메뉴 토글
	const handleImagesMenuToggle = () => {
		setIsImagesMenuOpen(!isImagesMenuOpen);
	};

	return (
		<div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
			<div className="hidden border-r bg-muted/40 md:block">
				<div className="flex h-full max-h-screen flex-col gap-2">
					<div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
						<Link
							href="/admin/dashboard"
							className="flex items-center gap-2 font-semibold"
						>
							<NextImage src="/logo.png" alt="Logo" width={70} height={18.05} />
							<span className="">관리자 페이지</span>
						</Link>
					</div>
					<div className="flex-1">
						<nav className="grid items-start px-2 text-sm font-medium lg:px-4">
							<Link
								href="/admin/dashboard"
								className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
									pathname === "/admin/dashboard" ? "bg-muted text-primary" : ""
								}`}
							>
								<BarChart3 className="h-4 w-4" />
								대시보드
							</Link>
							<Link
								href="/admin/persona"
								className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
									pathname === "/admin/persona" ? "bg-muted text-primary" : ""
								}`}
							>
								<User className="h-4 w-4" />
								페르소나 관리
							</Link>

							{/* Prompts 단일 링크 */}
							<Link
								href="/admin/prompts"
								className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
									pathname === "/admin/prompts" ? "bg-muted text-primary" : ""
								}`}
							>
								<TerminalSquare className="h-4 w-4" />
								프롬프트 관리
							</Link>

							{/* 이미지 아코디언 서브메뉴 (기존 유지) */}
							<div className="flex flex-col">
								<button
									onClick={handleImagesMenuToggle}
									className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
										pathname.startsWith("/admin/image")
											? "bg-muted text-primary"
											: ""
									}`}
								>
									<div className="flex items-center gap-3">
										<Image className="h-4 w-4" />
										<span>이미지 관리</span>
									</div>
									{isImagesMenuOpen ? (
										<ChevronUp className="h-4 w-4" />
									) : (
										<ChevronDown className="h-4 w-4" />
									)}
								</button>

								{isImagesMenuOpen && (
									<div className="ml-7 mt-1 border-l border-gray-200 pl-3 flex flex-col gap-1">
										<Link
											href="/admin/image/list"
											className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:text-primary ${
												pathname === "/admin/image/list"
													? "bg-muted/70 text-primary"
													: ""
											}`}
										>
											이미지 목록
										</Link>
										<Link
											href="/admin/image-generator"
											className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:text-primary ${
												pathname === "/admin/image-generator"
													? "bg-muted/70 text-primary"
													: ""
											}`}
										>
											이미지 생성
										</Link>
									</div>
								)}
							</div>

							{/* Users 메뉴 복원 */}
							<Link
								href="/admin/users"
								className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
									pathname === "/admin/users" ? "bg-muted text-primary" : ""
								}`}
							>
								<Users className="h-4 w-4" />
								관리자 목록
							</Link>
						</nav>
					</div>
				</div>
			</div>
			<div className="flex flex-col">
				{/* 우측 상단 헤더에 사용자 정보/로그아웃 버튼 복원 */}
				<header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
					{/* TODO: Add Mobile Nav Toggle */}
					<div className="w-full flex-1">
						{/* TODO: Add Search or other header elements */}
					</div>
					{isClient && username && (
						<div className="flex items-center gap-3 text-sm">
							<span className="text-gray-700">👤 {username}</span>
							<button
								onClick={handleLogout}
								className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
							>
								로그아웃
							</button>
						</div>
					)}
					{isClient &&
						!username &&
						pathname !== "/login" &&
						!pathname.startsWith("/auth") && (
							<Link
								href="/login"
								className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-sm"
							>
								로그인
							</Link>
						)}
				</header>
				<main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
					{children}
				</main>
			</div>
		</div>
	);
}
