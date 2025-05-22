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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface CreateImagePromptDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (
		name: string,
		description: string,
		tags: string,
		content: string
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
	const [description, setDescription] = useState("");
	const [content, setContent] = useState("");
	const [tags, setTags] = useState("");

	useEffect(() => {
		if (isOpen) {
			setName("");
			setDescription("");
			setContent("");
			setTags("");
		}
	}, [isOpen]);

	const handleSubmit = async () => {
		if (!name.trim()) {
			toast.error("프롬프트 이름은 필수입니다.");
			return;
		}
		if (!content.trim()) {
			toast.error("프롬프트 내용은 필수입니다.");
			return;
		}
		await onCreate(name, description, tags, content);
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
						이미지 생성에 사용될 프롬프트의 이름, 설명, 첫 버전 내용, 태그를
						입력하세요.
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
					<div className="grid grid-cols-4 items-center gap-4">
						<Label
							htmlFor="prompt-description"
							className="text-right col-span-1"
						>
							설명
						</Label>
						<Input
							id="prompt-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="col-span-3"
							placeholder="이 프롬프트에 대한 간략한 설명"
							disabled={isSubmitting}
						/>
					</div>
					<div className="grid grid-cols-4 items-start gap-4">
						<Label htmlFor="content" className="text-right col-span-1 pt-2">
							프롬프트*
						</Label>
						<Textarea
							id="content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="실제 이미지 프롬프트 내용을 입력하세요..."
							className="col-span-3 min-h-[150px]"
							disabled={isSubmitting}
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="prompt-tags" className="text-right col-span-1">
							태그 (쉼표 구분)
						</Label>
						<Input
							id="prompt-tags"
							value={tags}
							onChange={(e) => setTags(e.target.value)}
							className="col-span-3"
							placeholder="예: SF, 미래, 도시, 밤"
							disabled={isSubmitting}
						/>
					</div>
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
						disabled={isSubmitting || !name.trim() || !content.trim()}
					>
						{isSubmitting ? "저장 중..." : "프롬프트 저장"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
