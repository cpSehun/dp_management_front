"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/utils/auth";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	// 이미 로그인된 사용자는 대시보드로 리다이렉트
	useEffect(() => {
		if (isLoggedIn()) {
			router.replace("/admin/dashboard");
		}
	}, [router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/v1/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});
			if (!res.ok) {
				const data = await res.json();
				setError(data.detail || "로그인 실패");
				setLoading(false);
				return;
			}
			const data = await res.json();
			// JWT 토큰을 localStorage에 저장
			localStorage.setItem("access_token", data.access_token);
			// 로그인 성공 후 /admin/dashboard로 이동
			router.push("/admin/dashboard");
		} catch {
			setError("네트워크 오류");
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50">
			<form
				onSubmit={handleSubmit}
				className="bg-white p-8 rounded shadow-md w-full max-w-sm"
			>
				<h2 className="text-2xl font-bold mb-6 text-center">로그인</h2>
				<div className="mb-4">
					<label className="block mb-1 text-sm font-medium">아이디</label>
					<input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
						required
						autoFocus
					/>
				</div>
				<div className="mb-4">
					<label className="block mb-1 text-sm font-medium">비밀번호</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
						required
					/>
				</div>
				{error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
				<button
					type="submit"
					className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
					disabled={loading}
				>
					{loading ? "로그인 중..." : "로그인"}
				</button>
				<button
					type="button"
					onClick={() => {
						// 환경 변수 또는 현재 위치 기반으로 URL 생성
						const baseURL =
							process.env.NEXT_PUBLIC_API_BASE_URL ||
							(typeof window !== "undefined" ? window.location.origin : "");
						const googleLoginUrl = `${baseURL}/api/v1/auth/google/login`;

						// 해당 URL로 페이지 이동
						window.location.href = googleLoginUrl;
					}}
					className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition mt-4"
				>
					Google로 로그인
				</button>
			</form>
		</div>
	);
}
