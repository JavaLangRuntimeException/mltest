"use client";

import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { useRouter } from "next/navigation";

export default function LogoDetectionPage() {
    const [isStarted, setIsStarted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (!isStarted) return;
        if (!containerRef.current) return;

        let videoStream: MediaStream | null = null;
        let videoElement: HTMLVideoElement | null = null;
        let animationFrameId: number;

        // シーン、カメラ、レンダラーの生成（ModelViewer と同じ方法）
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(0, 200, 300);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        containerRef.current.appendChild(renderer.domElement);

        // 環境光と方向光を追加
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 1, 1);
        scene.add(directionalLight);

        // Webカメラ映像を取得し、VideoTexture を作成してシーンの背景に設定
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                videoStream = stream;
                videoElement = document.createElement("video");
                videoElement.srcObject = stream;
                videoElement.muted = true;
                videoElement.playsInline = true;
                videoElement.play();
                const videoTexture = new THREE.VideoTexture(videoElement);
                videoTexture.minFilter = THREE.LinearFilter;
                videoTexture.magFilter = THREE.LinearFilter;
                videoTexture.format = THREE.RGBFormat;
                scene.background = videoTexture;
            })
            .catch((error) => {
                console.error("カメラの取得に失敗:", error);
            });

        // レンダリングループ
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        // ウィンドウリサイズ対応
        const handleResize = () => {
            if (containerRef.current) {
                const newWidth = containerRef.current.clientWidth;
                const newHeight = containerRef.current.clientHeight;
                camera.aspect = newWidth / newHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(newWidth, newHeight);
            }
        };
        window.addEventListener("resize", handleResize);

        // 2秒ごとにレンダラーの canvas から画像をキャプチャして /api/detect へ送信する
        const detectInterval = setInterval(async () => {
            const dataUrl = renderer.domElement.toDataURL("image/jpeg");
            try {
                const response = await fetch("/api/detect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: dataUrl }),
                });
                const result = await response.json();
                console.log("API 結果:", result);
                // ロゴが検出された場合は /uploadImage へ遷移
                if (result.logo_detected) {
                    router.push("/uploadImage");
                }
            } catch (err) {
                console.error("画像認識API呼び出しエラー:", err);
            }
        }, 2000);

        // クリーンアップ処理
        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);
            clearInterval(detectInterval);
            if (containerRef.current && renderer.domElement.parentElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
            if (videoStream) {
                videoStream.getTracks().forEach((track) => track.stop());
            }
            renderer.dispose();
        };
    }, [isStarted, router]);

    return (
        <div style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: "20px" }}>
            {!isStarted && (
                <button onClick={() => setIsStarted(true)} style={{ padding: "8px 16px", fontSize: "16px" }}>
                    Start
                </button>
            )}
            {isStarted && (
                <div
                    ref={containerRef}
                    style={{ width: "640px", height: "480px", position: "relative", margin: "0 auto" }}
                >
                    {/* ロゴオーバーレイ（必要に応じて表示） */}
                    <img
                        src="/logo/logo.png"
                        alt="Logo Overlay"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "640px",
                            height: "480px",
                            opacity: 0.1,
                            pointerEvents: "none",
                        }}
                    />
                </div>
            )}
        </div>
    );
}