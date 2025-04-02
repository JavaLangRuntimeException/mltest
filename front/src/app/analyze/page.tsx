"use client";

import React from "react";
import { useAtom } from "jotai";
import { analysisAtom } from "@/atoms/analysisAtom";
import ModelViewer from "../../components/ModelViewer";

const AnalyzePage: React.FC = () => {
    const [analysisResult] = useAtom(analysisAtom);

    if (!analysisResult) {
        return (
            <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
                <p>解析結果がありません。最初に画像をアップロードしてください。</p>
            </main>
        );
    }

    return (
        <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
            <h1>解析結果</h1>
            <div style={{ marginTop: "20px" }}>
                <h2>API Response</h2>
                <pre
                    style={{
                        background: "#f4f4f4",
                        padding: "10px",
                        borderRadius: "4px",
                        maxWidth: "600px",
                        overflowX: "auto",
                    }}
                >
          {JSON.stringify(analysisResult, null, 2)}
        </pre>
                <h2>3D Model Viewer (WebCam Background)</h2>
                <ModelViewer product={analysisResult.selected_product} />
            </div>
        </main>
    );
};

export default AnalyzePage;