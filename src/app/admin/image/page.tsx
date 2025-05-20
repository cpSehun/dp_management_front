"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ImagePage() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/admin/image/list");
	}, [router]);

	return (
		<div className="flex items-center justify-center h-32">
			<div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
		</div>
	);
}
