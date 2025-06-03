"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ThreeWebcam, { ThreeWebcamProps } from "../components/ThreeWebcam";

export default function LogoDetectionPage() {
    const [isStarted, setIsStarted] = useState(false);
    const [detected, setDetected] = useState(false);
    // 【Todo: やまちゃん】位置情報の取得を行うためのStateを追加する

    const router = useRouter();

    // 【Todo: やまちゃん】位置情報の取得を行うための関数を追加する
    // isStarted が true のときに位置情報を取得するようにする
    // 位置情報の取得はブラウザの Geolocation API を使用することを想定
    // 位置情報の取得は非同期で行うため、useCallback を使用して関数を定義する
    // 位置情報の取得は、ユーザーの許可が必要なため、ユーザーが Start ボタンを押したタイミングで行う
    // 位置情報の取得に失敗した場合は、エラーメッセージを表示する


    // 引数に型 { base64: string } を明示的に指定することで TS7031 を解消
    const handleDetection: ThreeWebcamProps["onDetect"] = useCallback(
        async ({ base64 }: { base64: string }) => {
            // すでに検出済みの場合、これ以上 API コールしない
            if (detected) return;

            const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;

            try {
                const response = await fetch("/api/detect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        // 【Todo: やまちゃん】位置情報の追加
                        image_data: base64Data
                    }),
                });
                const result = await response.json();
                console.log("API 結果:", result);
                if (result.logo_detected) {
                    setDetected(true);
                    router.push("/uploadImage");
                }
            } catch (err) {
                console.error("画像認識API呼び出しエラー:", err);
            }
        },
        [detected, router]
    );

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