"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoDetection() {
    const [isStarted, setIsStarted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const router = useRouter();

    // Start ボタン押下時に Web カメラを起動する（ModelViewer の実装と同様に .then() で処理）
    const startWebcam = () => {
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.muted = true;
                    videoRef.current.playsInline = true;
                    return videoRef.current.play();
                }
            })
            .then(() => {
                setIsStarted(true);
            })
            .catch((error) => {
                console.error("Webカメラの取得に失敗:", error);
            });
    };

    // Webカメラ映像から定期的にフレームをキャプチャして API に送信
    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        if (isStarted) {
            intervalId = setInterval(async () => {
                if (videoRef.current && canvasRef.current) {
                    const video = videoRef.current;
                    const canvas = canvasRef.current;
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const context = canvas.getContext("2d");
                    if (!context) return;

                    // 現在のビデオフレームを canvas に描画
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    // canvas の画像を JPEG の Data URL に変換
                    const dataUrl = canvas.toDataURL("image/jpeg");

                    try {
                        // Next.js の API ルート (/api/detect) 経由でバックエンドへ送信
                        const response = await fetch("/api/detect", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ image: dataUrl }),
                        });
                        const result = await response.json();
                        console.log("API 結果:", result);

                        // API レスポンスによりロゴ検出された場合、/uploadImage へ遷移
                        if (result.logo_detected) {
                            router.push("/uploadImage");
                        }
                    } catch (err) {
                        console.error("画像認識API呼び出しエラー:", err);
                    }
                }
            }, 2000); // 2秒ごとにフレームを送信（必要に応じて調整）
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isStarted, router]);

    return (
        <div>
            {/* Webカメラ未起動時は Start ボタンを表示 */}
            {!isStarted && <button onClick={startWebcam}>Start</button>}

            {/* Webカメラ起動後は映像とロゴのオーバーレイを表示 */}
            {isStarted && (
                <div style={{ position: "relative", width: "640px", height: "480px" }}>
                    <video
                        ref={videoRef}
                        style={{
                            width: "640px",
                            height: "480px",
                            backgroundColor: "#000",
                        }}
                        autoPlay
                        muted
                        playsInline
                    />
                    <img
                        src="/logo/logo.png"
                        alt="Logo Overlay"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "640px",
                            height: "480px",
                            opacity: 0.1, // 10% の不透明度で表示
                            pointerEvents: "none", // ユーザー操作の妨げを防ぐ
                        }}
                    />
                </div>
            )}

            {/* API リクエスト用の canvas（非表示） */}
            <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
    );
}