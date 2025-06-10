import React, { useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

import {
	PersonaCreationProvider,
	usePersonaCreation,
} from "./common/PersonaCreationContext";
import { StepIndicator } from "./common/StepIndicator";
import { ConceptGenerationStep } from "./steps/ConceptGenerationStep";
import { PersonaInfoStep } from "./steps/PersonaInfoStep";
import { SummaryAndTagsStep } from "./steps/SummaryAndTagsStep";
import { ImageGenerationStep } from "./steps/ImageGenerationStep";
import { FinalReviewStep } from "./steps/FinalReviewStep";

// 임시 4단계 컴포넌트 제거됨 - 실제 구현으로 대체

// 메인 다이얼로그 내용 컴포넌트
function PersonaCreationDialogContent({ onClose }: { onClose: () => void }) {
	const { currentStep, setCurrentStep } = usePersonaCreation();

	const renderCurrentStep = () => {
		switch (currentStep) {
			case 1:
				return <ConceptGenerationStep />;
			case 2:
				return <PersonaInfoStep />;
			case 3:
				return <SummaryAndTagsStep />;
			case 4:
				return <ImageGenerationStep />;
			case 5:
				return <FinalReviewStep />;
			default:
				return <ConceptGenerationStep />;
		}
	};

	return (
		<DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
			<DialogHeader>
				<DialogTitle className="flex items-center gap-2">
					<User className="h-5 w-5" />
					페르소나 생성 - {currentStep}단계
				</DialogTitle>
				<DialogDescription>
					총 5단계로 구성된 페르소나 생성 과정입니다.
				</DialogDescription>
			</DialogHeader>

			<div className="py-4">
				{/* 진행 단계 표시 */}
				<StepIndicator currentStep={currentStep} />

				{/* 현재 단계 렌더링 */}
				{renderCurrentStep()}
			</div>

			<DialogFooter className="flex justify-between">
				<div className="flex gap-2">
					{currentStep > 1 && (
						<Button
							variant="outline"
							onClick={() => setCurrentStep(currentStep - 1)}
						>
							이전 단계
						</Button>
					)}
				</div>
				<Button variant="outline" onClick={onClose}>
					취소
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}

// 페르소나 생성 다이얼로그 Props
interface PersonaCreationDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onPersonaCreated?: (persona: any) => void;
}

// 메인 다이얼로그 컴포넌트
export function PersonaCreationDialog({
	isOpen,
	onClose,
	onPersonaCreated,
}: PersonaCreationDialogProps) {
	return (
		<PersonaCreationProvider>
			<Dialog open={isOpen} onOpenChange={onClose}>
				<PersonaCreationDialogContent onClose={onClose} />
			</Dialog>
		</PersonaCreationProvider>
	);
}
