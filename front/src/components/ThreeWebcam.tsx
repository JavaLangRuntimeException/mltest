"use client";

import React from "react";
import * as THREE from "three";
import ThreeCanvas from "./ThreeCanvas";

export interface ThreeWebcamProps {
    onDetect?: (detectionData: { base64: string }) => void;
    overlaySrc?: string;
    width?: number;
    height?: number;
}

const ThreeWebcam: React.FC<ThreeWebcamProps> = ({
                                                     onDetect,
                                                     overlaySrc,
                                                     width = 640,
                                                     height = 480,
                                                 }) => {
    // キャプチャ処理用のコールバックを ThreeCanvas の onCreated で実装
    const handleCreated = ({
                               renderer,
                           }: {
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        container: HTMLDivElement;
    }) => {
        const detectInterval = window.setInterval(() => {
            const dataUrl = renderer.domElement.toDataURL("image/jpeg");
            const base64Data = dataUrl.split(",")[1];
            if (onDetect) {
                onDetect({ base64: base64Data });
            }
        }, 2000);

        return () => {
            clearInterval(detectInterval);
        };
    };

    return (
        <div style={{ position: "relative", width: `${width}px`, height: `${height}px` }}>
            {/* ThreeCanvas をレンダリング（背景に Webカメラ映像） */}
            <ThreeCanvas
                width={width}
                height={height}
                preserveDrawingBuffer
                useWebcamBackground
                onCreated={handleCreated}
            />
            {/* オーバーレイ画像（ロゴ）を絶対配置で重ねる。opacity を低くして薄く表示 */}
            {overlaySrc && (
                <img
                    src={overlaySrc}
                    alt="Logo Overlay"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        opacity: 0.2, // ここで薄く表示（透過度を調整）
                        zIndex: 10,
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    );
};

export default ThreeWebcam;