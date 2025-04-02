"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ThreeWebcam, { ThreeWebcamProps } from "../components/ThreeWebcam";

export default function LogoDetectionPage() {
    const [isStarted, setIsStarted] = useState(false);
    const router = useRouter();

    // ThreeWebcam から定期キャプチャデータを受け取り、 /api/detect に送信する処理
    const handleDetection: ThreeWebcamProps["onDetect"] = async ({ base64 }) => {
        try {
            const response = await fetch("/api/detect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: base64 }),
            });
            const result = await response.json();
            console.log("API 結果:", result);
            if (result.logo_detected) {
                router.push("/uploadImage");
            }
        } catch (err) {
            console.error("画像認識API呼び出しエラー:", err);
        }
    };

    return (
        <div style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: "20px" }}>
            {!isStarted && (
                <button
                    onClick={() => setIsStarted(true)}
                    style={{ padding: "8px 16px", fontSize: "16px" }}
                >
                    Start
                </button>
            )}
            {isStarted && (
                <ThreeWebcam onDetect={handleDetection} overlaySrc="/logo/logo.png" />
            )}
        </div>
    );
}