"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

// Go API から返却される感情情報の型
interface Emotion {
    id: number;
    emotion: string;
    score: number;
}

// Go API から返却される解析結果の型
interface AnalysisResult {
    id: number;
    bucket: string;
    image_key: string;
    selected_product: string;
    dominant_emotion: string;
    created_at: string;
    Emotions: Emotion[];
}

/**
 * ModelViewer コンポーネント
 *
 * 解析結果の selected_product (FBX ファイル名) をもとに，
 * Next.js API Route (/api/fbx) から FBX ファイルを取得し，
 * Webカメラ映像を背景とする Three.js で3Dモデルを表示します．
 */
const ModelViewer: React.FC<{ product: string }> = ({ product }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [modelLoaded, setModelLoaded] = useState<boolean>(false);

    useEffect(() => {
        if (!containerRef.current) return;

        let currentBlobUrl: string | null = null;
        let model: THREE.Group | undefined;
        let videoStream: MediaStream | null = null;
        let videoElement: HTMLVideoElement | null = null;

        // シーン、カメラ、レンダラーの生成
        const scene = new THREE.Scene();
        // 初期背景はダミーの色（以降ビデオテクスチャで上書き）
        scene.background = new THREE.Color(0x000000);

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(0, 200, 300);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        containerRef.current.appendChild(renderer.domElement);

        // 環境光と方向光の追加
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 1, 1);
        scene.add(directionalLight);

        // Webカメラの映像を背景に設定（PCの内蔵カメラで動作）
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                videoStream = stream;
                videoElement = document.createElement("video");
                videoElement.srcObject = stream;
                videoElement.muted = true; // 自動再生時にミュート
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

        // API Route (/api/fbx) から FBX ファイルを取得して読み込む
        fetch(`/api/fbx?product=${encodeURIComponent(product + ".fbx")}`)
            .then((res) => {
                if (!res.ok) throw new Error("FBX fetch failed");
                return res.blob();
            })
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                currentBlobUrl = url;

                const loader = new FBXLoader();
                loader.load(
                    url,
                    (fbx) => {
                        model = fbx;
                        // 必要に応じてモデルのスケール調整
                        model.scale.set(0.1, 0.1, 0.1);
                        scene.add(model);
                        setModelLoaded(true);
                        // モデル読み込み後、作成した Blob URL を解放する
                        URL.revokeObjectURL(url);
                    },
                    undefined,
                    (error) => {
                        console.error("FBX モデルの読み込みに失敗:", error);
                    }
                );
            })
            .catch((error) => {
                console.error("FBX ファイルの取得に失敗:", error);
            });

        const animate = () => {
            requestAnimationFrame(animate);
            if (model) {
                model.rotation.y += 0.01;
            }
            renderer.render(scene, camera);
        };
        animate();

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

        return () => {
            window.removeEventListener("resize", handleResize);
            renderer.dispose();
            if (containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
            if (currentBlobUrl) {
                URL.revokeObjectURL(currentBlobUrl);
            }
            // ビデオストリームの各トラックを停止してリソースを解放
            if (videoStream) {
                videoStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [product]);

    return (
        <div>
            <div ref={containerRef} style={{ width: "100%", height: "500px" }} />
            {!modelLoaded && <p>モデルを読み込み中...</p>}
        </div>
    );
};

// AnalyzePage 内で searchParams を使用する部分を別コンポーネントに切り出す
function AnalyzePageContent() {
    const searchParams = useSearchParams();
    // クエリパラメータ "image" から画像名を取得（存在しない場合は "image.jpeg" をデフォルト値とする）
    const imageKey = searchParams.get("image") || "image.jpeg";
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const handleStart = async (): Promise<void> => {
        setError(null);
        setResult(null);
        setLoading(true);

        try {
            // 固定の bucket と画像名 (imageKey) を使用して解析リクエストを送信
            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bucket: "ml-test-image-bucket", image_key: imageKey }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(
                    `API エラー: ${errorData.error || "Unknown error"} (ステータス: ${response.status})`
                );
            } else {
                const json: AnalysisResult = await response.json();
                setResult(json);
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError("通信エラー: " + err.message);
            } else {
                setError("通信エラー: Unknown error");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ margin: "20px", fontFamily: "sans-serif" }}>
            <h1>画像解析の実行</h1>
            <p>アップロード済みの画像（{imageKey}）を対象に解析を実行します。</p>
            <button onClick={handleStart} style={{ padding: "8px 16px", fontSize: "16px" }}>
                {loading ? "送信中..." : "Start"}
            </button>

            {error && (
                <div style={{ color: "red", marginTop: "10px" }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && (
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
            {JSON.stringify(result, null, 2)}
          </pre>

                    <h2>3D Model Viewer (WebCam Background)</h2>
                    {/* 解析結果の selected_product（FBX ファイル名）を用いて 3D モデルをレンダリング */}
                    <ModelViewer product={result.selected_product} />
                </div>
            )}
        </div>
    );
}

// AnalyzePageContent を Suspense でラップしてエラー回避
export default function AnalyzePage() {
    return (
        <Suspense fallback={<div>ページを読み込み中...</div>}>
            <AnalyzePageContent />
        </Suspense>
    );
}