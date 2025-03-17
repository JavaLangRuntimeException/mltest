"use client";

import React, { useState, useRef, useEffect } from "react";
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
 * /api/analyze で取得したGo APIの解析結果の selected_product（FBX ファイル名）を元に、
 * Next.js API Route (/api/fbx) から FBX ファイルを取得し，
 * Webカメラの映像を背景として Three.js で FBX モデルを表示
 * 他にも解析結果の emotion も表示する
 * (Go 側ではどんな表情でも product1 を返すようにしている)
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

        // シーン、カメラ、レンダラーを生成
        const scene = new THREE.Scene();
        // 初期背景はダミーの色（後ほどビデオテクスチャで上書き）
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

        // 内蔵カメラ（Webカメラ）を起動して映像を背景に設定する．現状はパソコンのインカメで動く
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                videoStream = stream;
                videoElement = document.createElement("video");
                videoElement.srcObject = stream;
                videoElement.muted = true; // 自動再生時にミュートしておく
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

const AnalyzePage: React.FC = () => {
    // bucket の初期値を "ml-test-image-bucket" に設定
    const [bucket, setBucket] = useState<string>("ml-test-image-bucket");
    const [imageKey, setImageKey] = useState<string>("image.jpeg");
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();
        setError(null);
        setResult(null);
        setLoading(true);

        try {
            // 解析リクエストは Next.js API Route (/api/analyze) 経由で送信
            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bucket, image_key: imageKey }),
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
            <h1>GoのAnalyze API 呼び出し</h1>
            <p>バケット名や画像名はml-test-image-bucket，image.jpegであると仮定します．</p>
            <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
                <div style={{ marginBottom: "10px" }}>
                    <label htmlFor="bucket" style={{ marginRight: "10px" }}>
                        Bucket:
                    </label>
                    <input
                        id="bucket"
                        type="text"
                        value={bucket}
                        onChange={(e) => setBucket(e.target.value)}
                        placeholder="ml-test-image-bucket"
                        style={{ padding: "5px", width: "250px" }}
                    />
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <label htmlFor="imageKey" style={{ marginRight: "10px" }}>
                        Image Key:
                    </label>
                    <input
                        id="imageKey"
                        type="text"
                        value={imageKey}
                        onChange={(e) => setImageKey(e.target.value)}
                        placeholder="image.jpeg"
                        style={{ padding: "5px", width: "250px" }}
                    />
                </div>
                <button type="submit" style={{ padding: "8px 16px" }}>
                    {loading ? "送信中..." : "Analyze"}
                </button>
            </form>

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
};

export default AnalyzePage;