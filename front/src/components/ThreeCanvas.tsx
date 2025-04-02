"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";

export interface ThreeCanvasProps {
    width?: number;
    height?: number;
    preserveDrawingBuffer?: boolean;
    useWebcamBackground?: boolean;
    onCreated?: (params: {
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        container: HTMLDivElement;
    }) => void;
}

const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
                                                     width = 640,
                                                     height = 480,
                                                     preserveDrawingBuffer = false,
                                                     useWebcamBackground = false,
                                                     onCreated,
                                                 }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;

        // シーンの生成
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        // コンテナサイズからレンダラーサイズを決定
        const w = container.clientWidth || width;
        const h = container.clientHeight || height;

        // カメラの生成
        const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
        camera.position.set(0, 200, 300);

        // レンダラーの生成
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer,
        });
        renderer.setSize(w, h);
        container.appendChild(renderer.domElement);

        // 環境光と方向光の追加
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 1, 1);
        scene.add(directionalLight);

        // Webカメラ映像を背景に設定（オプション）
        if (useWebcamBackground) {
            navigator.mediaDevices
                .getUserMedia({ video: true })
                .then((stream) => {
                    const videoElement = document.createElement("video");
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
                    console.error("Webカメラの取得に失敗:", error);
                });
        }

        // onCreated コールバックを呼び出して、作成済みのオブジェクトを提供
        if (onCreated) {
            onCreated({ scene, camera, renderer, container });
        }

        // リサイズ対応
        const handleResize = () => {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };
        window.addEventListener("resize", handleResize);

        // アニメーションループ
        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            window.removeEventListener("resize", handleResize);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [width, height, preserveDrawingBuffer, useWebcamBackground, onCreated]);

    return (
        <div
            ref={containerRef}
            style={{ width, height, position: "relative", margin: "0 auto" }}
        />
    );
};

export default ThreeCanvas;