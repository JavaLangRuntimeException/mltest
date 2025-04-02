"use client";

import React, { useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import ThreeCanvas from "./ThreeCanvas";

interface ModelViewerProps {
    product: string;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ product }) => {
    const [modelLoaded, setModelLoaded] = useState(false);

    // ThreeCanvas 作成完了時のコールバック
    const handleCreated = ({
                               scene,
                           }: {
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        container: HTMLDivElement;
    }) => {
        // /api/fbx から FBX ファイルを取得して読み込み
        fetch(`/api/fbx?product=${encodeURIComponent(product + ".fbx")}`)
            .then((res) => {
                if (!res.ok) throw new Error("FBX fetch failed");
                return res.blob();
            })
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                const loader = new FBXLoader();
                loader.load(
                    url,
                    (fbx) => {
                        // 必要に応じてモデリングのスケール調整
                        fbx.scale.set(0.1, 0.1, 0.1);
                        scene.add(fbx);
                        setModelLoaded(true);
                        // Blob URL の開放
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
    };

    return (
        <div>
            <ThreeCanvas
                width={window.innerWidth}
                height={500}
                useWebcamBackground
                onCreated={handleCreated}
            />
            {!modelLoaded && <p>モデルを読み込み中...</p>}
        </div>
    );
};

export default ModelViewer;