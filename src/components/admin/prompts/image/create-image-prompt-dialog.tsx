"use client";

import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CreateImagePromptDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (
		name: string,
		llm_prompt: string // image_prompt에서 llm_prompt로 변경, tags와 content 제거
	) => Promise<void>;
	isSubmitting: boolean;
}

export function CreateImagePromptDialog({
	isOpen,
	onClose,
	onCreate,
	isSubmitting,
}: CreateImagePromptDialogProps) {
	const [name, setName] = useState("");
	const [llmPrompt, setLlmPrompt] = useState(""); // imagePrompt에서 llmPrompt로 변경

	useEffect(() => {
		if (isOpen) {
			setName("");
			setLlmPrompt(""); // 초기화
		}
	}, [isOpen]);

	const handleSubmit = async () => {
		if (!name.trim()) {
			toast.error("프롬프트 이름은 필수입니다.");
			return;
		}
		if (!llmPrompt.trim()) {
			// imagePrompt에서 llmPrompt로 변경
			toast.error("프롬프트 내용은 필수입니다.");
			return;
		}
		await onCreate(name, llmPrompt); // tags와 content 파라미터 제거
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>새 이미지 프롬프트 생성</DialogTitle>
					<DialogDescription>
						이미지 생성에 사용될 프롬프트의 이름과 내용을 입력하세요.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="prompt-name" className="text-right col-span-1">
							이름*
						</Label>
						<Input
							id="prompt-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="col-span-3"
							placeholder="예: 미래 도시 풍경"
							disabled={isSubmitting}
						/>
					</div>
					<div className="grid grid-cols-4 items-start gap-4">
						<Label
							htmlFor="llm-prompt" // id 변경
							className="text-right col-span-1 pt-2"
						>
							프롬프트* {/* 라벨 변경 */}
						</Label>
						<Textarea
							id="llm-prompt" // id 변경
							value={llmPrompt} // state 변경
							onChange={(e) => setLlmPrompt(e.target.value)} // handler 변경
							className="col-span-3 min-h-[150px]"
							placeholder="이미지 생성에 사용될 프롬프트 내용을 입력하세요..."
							disabled={isSubmitting}
						/>
					</div>
					{/* 버전 내용 입력 필드 제거 */}
					{/* 태그 입력 필드 제거 */}
				</div>
				<DialogFooter>
					<DialogClose asChild>
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={onClose}
						>
							취소
						</Button>
					</DialogClose>
					<Button
						type="submit"
						onClick={handleSubmit}
						disabled={isSubmitting || !name.trim() || !llmPrompt.trim()} // 조건 변경
					>
						{isSubmitting ? "저장 중..." : "프롬프트 저장"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
