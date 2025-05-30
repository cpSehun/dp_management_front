"use client";

import { Suspense } from "react";
import CallbackHandler from "./CallbackHandler";

function Loading() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-100">
			<div className="p-8 bg-white shadow-md rounded-lg text-center">
				<p className="text-lg font-semibold text-gray-700">
					Google 계정으로 로그인 처리 중입니다...
				</p>
				<p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요.</p>
				<div className="mt-4">
					<svg
						className="animate-spin h-8 w-8 text-blue-500 mx-auto"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				</div>
			</div>
		</div>
	);
}

export default function GoogleCallbackReceiverPage() {
	return (
		<Suspense fallback={<Loading />}>
			<CallbackHandler />
		</Suspense>
	);
}
