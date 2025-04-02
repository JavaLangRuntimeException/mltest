import { atom } from "jotai";

export interface APIAnalysis {
    dominant_emotion: string;
    emotions: Record<string, number>;
}

export interface APIResponse {
    selected_product: string;
    analysis: APIAnalysis;
}

export const analysisAtom = atom<APIResponse | null>(null);