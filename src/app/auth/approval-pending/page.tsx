"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Mail, Shield } from "lucide-react";
import Link from "next/link";

export default function ApprovalPendingPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center space-y-4">
					<div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
						<Clock className="h-8 w-8 text-amber-600" />
					</div>
					<CardTitle className="text-2xl text-slate-900">
						승인 요청 완료
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="text-center space-y-4">
						<p className="text-slate-600 leading-relaxed">
							회원가입 승인 요청이 완료되었습니다.
							<br />
							관리자 승인 후 로그인 가능합니다.
						</p>

						<div className="bg-slate-50 rounded-lg p-4 space-y-3">
							<div className="flex items-center gap-3 text-sm text-slate-600">
								<Shield className="h-4 w-4 text-slate-400" />
								<span>관리자가 계정을 검토 중입니다</span>
							</div>
							<div className="flex items-center gap-3 text-sm text-slate-600">
								<Mail className="h-4 w-4 text-slate-400" />
								<span>승인 완료 시 알림을 받으실 수 있습니다</span>
							</div>
						</div>

						<div className="text-xs text-slate-500 bg-blue-50 p-3 rounded border-l-4 border-blue-200">
							<p className="font-medium text-blue-800 mb-1">안내사항</p>
							<p className="text-blue-700">
								승인 과정은 보통 1-2일 정도 소요됩니다. 급한 경우 관리자에게
								직접 문의해 주세요.
							</p>
						</div>
					</div>

					<div className="space-y-3">
						<Button asChild className="w-full bg-slate-900 hover:bg-slate-800">
							<Link href="/login">로그인 페이지로 돌아가기</Link>
						</Button>

						<Button variant="outline" asChild className="w-full">
							<Link href="/">홈페이지로 이동</Link>
						</Button>
					</div>

					<div className="text-center">
						<p className="text-xs text-slate-500">
							이미 승인된 계정이 있으신가요?{" "}
							<Link
								href="/login"
								className="text-blue-600 hover:text-blue-800 font-medium"
							>
								로그인 시도하기
							</Link>
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
