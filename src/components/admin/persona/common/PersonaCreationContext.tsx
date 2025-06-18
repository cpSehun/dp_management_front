import React, { createContext, useContext, useState } from "react";
import {
	PersonaCreationData,
	PersonaCreationContextType,
} from "@/types/persona-creation.types";

// Context 생성
const PersonaCreationContext = createContext<PersonaCreationContextType | null>(
	null
);

// Context Hook
export const usePersonaCreation = () => {
	const context = useContext(PersonaCreationContext);
	if (!context) {
		throw new Error(
			"usePersonaCreation must be used within PersonaCreationProvider"
		);
	}
	return context;
};

// Provider 컴포넌트
interface PersonaCreationProviderProps {
	children: React.ReactNode;
}

export function PersonaCreationProvider({
	children,
}: PersonaCreationProviderProps) {
	const [data, setData] = useState<PersonaCreationData>({
		step1: { personaType: "character", model: "gemini-2.0-flash", concept: "" },
		step2: { personaInfo: "", regenerationNotes: "" },
		step3: { summary: "", tags: [] },
		step4: {
			imageDescription: "",
			imagePrompt: "",
			generatedImages: [],
			selectedImage: "",
		},
	});

	const [currentStep, setCurrentStep] = useState(1);

	const updateData = (step: keyof PersonaCreationData, newData: any) => {
		setData((prev) => ({
			...prev,
			[step]: { ...(prev[step] as object), ...newData },
		}));
	};

	// 초기화 함수
	const resetData = () => {
		setData({
			step1: {
				personaType: "character",
				model: "gemini-2.0-flash",
				concept: "",
			},
			step2: { personaInfo: "", regenerationNotes: "" },
			step3: { summary: "", tags: [] },
			step4: {
				imageDescription: "",
				imagePrompt: "",
				generatedImages: [],
				selectedImage: "",
			},
		});
		setCurrentStep(1);
	};

	const contextValue: PersonaCreationContextType = {
		data,
		updateData,
		currentStep,
		setCurrentStep,
		resetData,
	};

	return (
		<PersonaCreationContext.Provider value={contextValue}>
			{children}
		</PersonaCreationContext.Provider>
	);
}
