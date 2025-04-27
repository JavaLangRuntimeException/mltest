"use client";

import React from "react";
import { useAtom } from "jotai";
import { analysisAtom } from "@/atoms/analysisAtom";
import ModelViewer from "../../components/ModelViewer";


// 位置情報を取得する関数
function getLocation(): Promise<GeolocationCoordinates> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by this browser."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position: GeolocationPosition) => {
                // 成功時の処理
                const { latitude, longitude } = position.coords;
                console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
                resolve(position.coords);
            },
            (error: GeolocationPositionError) => {
                // エラー時の処理
                console.error('Error obtaining location:', error);
                reject(error);
            }
        );
    });
}
const AnalyzePage: React.FC = () => {
    const [analysisResult] = useAtom(analysisAtom);

    if (!analysisResult) {
        return (
            <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
                <p>解析結果がありません。最初に画像をアップロードしてください。</p>
            </main>
        );
    }
    // TODO: (ZONO)位置情報を取得する
    console.log(getLocation())

    // getLocation()
    // .then((coords) => {
    //     console.log(`取得した位置情報: 緯度 ${coords.latitude}, 経度 ${coords.longitude}`);
    // })
    // .catch((error) => {
    //     console.error('位置情報の取得に失敗しました:', error);
    // });

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
