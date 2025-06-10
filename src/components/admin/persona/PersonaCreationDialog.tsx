// src/components/admin/persona/PersonaCreationDialog.tsx

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

// 임시 3단계, 4단계 컴포넌트
function SummaryAndTagsStep() {
	const { data, setCurrentStep } = usePersonaCreation();

	return (
		<div className="space-y-6">
			<div className="text-center space-y-4">
				<h3 className="text-xl font-semibold">
					3단계: 페르소나 요약, 태그 입력/수정
				</h3>
				<p className="text-gray-600">이전 단계 데이터:</p>
				<div className="p-4 bg-blue-50 rounded-lg text-left">
					<p className="font-medium mb-2">컨셉: {data.step1.concept}</p>
					<p className="text-sm text-gray-600 mb-2">
						페르소나 정보: {data.step2.personaInfo.substring(0, 100)}...
					</p>
				</div>
				<p className="text-gray-500">3단계 구현 예정...</p>
			</div>

			<div className="flex justify-end">
				<Button
					onClick={() => setCurrentStep(4)}
					className="bg-green-600 hover:bg-green-700"
				>
					다음 단계
				</Button>
			</div>
		</div>
	);
}

function ImageGenerationStep() {
	const { data } = usePersonaCreation();

	return (
		<div className="space-y-6">
			<div className="text-center space-y-4">
				<h3 className="text-xl font-semibold">
					4단계: 페르소나 프로필 이미지 생성
				</h3>
				<p className="text-gray-600">모든 단계 데이터:</p>
				<div className="p-4 bg-blue-50 rounded-lg text-left">
					<p className="font-medium mb-2">컨셉: {data.step1.concept}</p>
					<p className="text-sm text-gray-600 mb-2">
						페르소나 정보: {data.step2.personaInfo.substring(0, 100)}...
					</p>
				</div>
				<p className="text-gray-500">4단계 구현 예정...</p>
			</div>

			<div className="flex justify-end">
				<Button
					onClick={() => console.log("페르소나 생성 완료 (구현 예정)")}
					className="bg-green-600 hover:bg-green-700"
				>
					페르소나 생성 완료
				</Button>
			</div>
		</div>
	);
}

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
					총 4단계로 구성된 페르소나 생성 과정입니다.
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
