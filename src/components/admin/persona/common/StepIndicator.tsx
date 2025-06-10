import React from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface StepIndicatorProps {
	currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
	const steps = [
		{ number: 1, label: "컨셉 입력" },
		{ number: 2, label: "정보 입력" },
		{ number: 3, label: "요약/태그" },
		{ number: 4, label: "이미지 생성" },
		{ number: 5, label: "최종 확인" },
	];

	return (
		<div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
			{steps.map((step, index) => (
				<React.Fragment key={step.number}>
					<Badge
						variant={
							currentStep === step.number
								? "default"
								: currentStep > step.number
								? "secondary"
								: "outline"
						}
					>
						{step.number}단계
					</Badge>
					<span className={currentStep === step.number ? "font-medium" : ""}>
						{step.label}
					</span>
					{index < steps.length - 1 && <ArrowRight className="h-4 w-4" />}
				</React.Fragment>
			))}
		</div>
	);
}
