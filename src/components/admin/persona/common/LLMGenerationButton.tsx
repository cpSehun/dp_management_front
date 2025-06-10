import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface LLMGenerationButtonProps {
	onGenerate: () => Promise<void>;
	disabled?: boolean;
	children?: React.ReactNode;
	variant?: "default" | "outline" | "secondary";
	size?: "default" | "sm" | "lg";
	className?: string;
}

export function LLMGenerationButton({
	onGenerate,
	disabled = false,
	children = "생성",
	variant = "default",
	size = "default",
	className = "",
}: LLMGenerationButtonProps) {
	const [isGenerating, setIsGenerating] = useState(false);

	const handleGenerate = async () => {
		if (isGenerating || disabled) return;

		setIsGenerating(true);
		try {
			await onGenerate();
		} catch (error) {
			console.error("생성 중 오류:", error);
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<Button
			onClick={handleGenerate}
			disabled={isGenerating || disabled}
			variant={variant}
			size={size}
			className={className}
		>
			{isGenerating ? (
				<>
					<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
					생성 중...
				</>
			) : (
				<>
					<Wand2 className="h-4 w-4 mr-2" />
					{children}
				</>
			)}
		</Button>
	);
}
