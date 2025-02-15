interface Grade {
    no: string;
    code: string;
    subject: string;
    instructor: string;
    year: string;
    semester: string;
    credit: number;
    grade: string;
    category: string;
    gp: number;
    rankingRate: string;
    numStudents: number;
    passFail: string;
}

interface CourseRequirement {
    id: string;
    name: string;
    totalCreditsRequired: number;
    mandatoryCredits: number;
    electiveCredits: number;
    detailedRequirements: DetailedRequirement[];
}

interface DetailedRequirement {
    category: string;
    requiredCredits: number;
    subjects?: SubjectConfig[];
}

interface SubjectConfig {
    name: string;
    genres: string[];
    credits: number;
    autoRegistered?: boolean;
}

interface RequirementResult {
    category: string;
    current: number;
    required: number;
    fulfilled: boolean;
    subjects: SubjectResult[];
}

interface SubjectResult {
    name: string;
    credits: number;
    completed: boolean;
    inProgress: boolean;
    autoRegistered?: boolean;
}

interface GraduationRequirementsResult {
    totalCredits: {
        current: number;
        required: number;
        fulfilled: boolean;
    };
    mandatoryCredits: {
        current: number;
        required: number;
        fulfilled: boolean;
    };
    electiveCredits: {
        current: number;
        required: number;
        fulfilled: boolean;
    };
    detailedRequirements: RequirementResult[];
}

export type {
    Grade,
    CourseRequirement,
    DetailedRequirement,
    SubjectConfig,
    RequirementResult,
    SubjectResult,
    GraduationRequirementsResult
};
