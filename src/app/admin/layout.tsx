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
	console.log("--- AdminLayout FUNCTION EXECUTION (SERVER-SIDE if SSR) ---");
	const router = useRouter();
	const pathname = usePathname();
	const [username, setUsername] = useState<string | null>(null);
	const [isClient, setIsClient] = useState(false);

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
				console.log("[Layout Effect] Token expired?", isExpired);
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

	const handleLogout = () => {
		localStorage.removeItem("access_token");
		window.location.href = "/login";
	};

	// 현재 경로에 따라 해당 메뉴가 열려있는지 확인하는 함수
	const isMenuOpen = (menuPath: string) => {
		return pathname.startsWith(menuPath);
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
							<TerminalSquare className="h-6 w-6" />
							<span className="">Daepa Admin</span>
						</Link>
						{/* <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button> */}
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
								Dashboard
							</Link>
							<Link
								href="/admin/persona"
								className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
									pathname === "/admin/persona" ? "bg-muted text-primary" : ""
								}`}
							>
								<User className="h-4 w-4" />
								Persona
							</Link>

							{/* 프롬프트 아코디언 서브메뉴 */}
							<div className="flex flex-col">
								<div
									className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
										pathname.startsWith("/admin/prompts")
											? "bg-muted text-primary"
											: ""
									}`}
								>
									<Link
										href="/admin/prompts/image"
										className="flex items-center gap-3"
									>
										<TerminalSquare className="h-4 w-4" />
										<span>Prompts</span>
									</Link>
									{isMenuOpen("/admin/prompts") ? (
										<ChevronUp className="h-4 w-4" />
									) : (
										<ChevronDown className="h-4 w-4" />
									)}
								</div>

								{isMenuOpen("/admin/prompts") && (
									<div className="ml-7 mt-1 border-l border-gray-200 pl-3 flex flex-col gap-1">
										<Link
											href="/admin/prompts/image"
											className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:text-primary ${
												pathname === "/admin/prompts/image"
													? "bg-muted/70 text-primary"
													: ""
											}`}
										>
											Image Prompts
										</Link>
										<Link
											href="/admin/prompts/persona"
											className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:text-primary ${
												pathname === "/admin/prompts/persona"
													? "bg-muted/70 text-primary"
													: ""
											}`}
										>
											Persona Prompts
										</Link>
									</div>
								)}
							</div>

							{/* 이미지 아코디언 서브메뉴 */}
							<div className="flex flex-col">
								<div
									className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
										pathname.startsWith("/admin/image")
											? "bg-muted text-primary"
											: ""
									}`}
								>
									<Link href="/admin/image" className="flex items-center gap-3">
										<Image className="h-4 w-4" />
										<span>Images</span>
									</Link>
									{isMenuOpen("/admin/image") ? (
										<ChevronUp className="h-4 w-4" />
									) : (
										<ChevronDown className="h-4 w-4" />
									)}
								</div>

								{isMenuOpen("/admin/image") && (
									<div className="ml-7 mt-1 border-l border-gray-200 pl-3 flex flex-col gap-1">
										<Link
											href="/admin/image/list"
											className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:text-primary ${
												pathname === "/admin/image/list"
													? "bg-muted/70 text-primary"
													: ""
											}`}
										>
											Image List
										</Link>
										<Link
											href="/admin/image-generator"
											className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:text-primary ${
												pathname === "/admin/image-generator"
													? "bg-muted/70 text-primary"
													: ""
											}`}
										>
											Image Generation
										</Link>
									</div>
								)}
							</div>

							<Link
								href="/admin/users"
								className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
									pathname === "/admin/users" ? "bg-muted text-primary" : ""
								}`}
							>
								<Users className="h-4 w-4" />
								Users
							</Link>
						</nav>
					</div>
					<div className="mt-auto p-4">
						<Card x-chunk="dashboard-02-chunk-0">
							<CardHeader className="p-2 pt-0 md:p-4">
								<CardTitle>Upgrade to Pro</CardTitle>
								<CardDescription>
									Unlock all features and get unlimited access to our support
									team.
								</CardDescription>
							</CardHeader>
							<CardContent className="p-2 pt-0 md:p-4 md:pt-0">
								<Button size="sm" className="w-full">
									Upgrade
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
			<div className="flex flex-col">
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
