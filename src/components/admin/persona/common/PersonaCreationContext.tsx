import React, { createContext, useContext, useState } from "react"; // useEffect 및 uuidv4 임포트 제거
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
	const [data, setData] = useState<PersonaCreationData>({ // uuid 관련 초기화 제거
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

	const updateData = ( // 원래의 updateData 함수로 복원
		step: keyof PersonaCreationData,
		newData: any
	) => {
		setData((prev) => ({
			...prev,
			[step]: { ...(prev[step] as object), ...newData }, // prev[step]이 객체임을 단언
		}));
	};

	// 초기화 함수
	const resetData = () => { // uuid 관련 로직 제거
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
		resetData, // resetData 함수를 context 값에 추가
	};

	return (
		<PersonaCreationContext.Provider value={contextValue}>
			{children}
		</PersonaCreationContext.Provider>
	);
}
