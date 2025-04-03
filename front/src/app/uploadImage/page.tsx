"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { analysisAtom, APIResponse } from "@/atoms/analysisAtom";

const UploadImagePage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const [, setAnalysisResult] = useAtom(analysisAtom);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: FormEvent) => {
        e.preventDefault();
        if (!file) {
            alert("ファイルを選択してください");
            return;
        }
        // FileReader でファイルを Base64 エンコード
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
            setLoading(true);
            setError(null);

            try {
                const response = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        file_name: file.name,
                        content_type: file.type,
                        image_data: base64Data,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    setError(
                        `API エラー: ${errorData.error || "Unknown error"} (ステータス: ${response.status})`
                    );
                } else {
                    const json: APIResponse = await response.json();
                    // 解析結果を atom にセットして解析ページへ遷移
                    setAnalysisResult(json);
                    router.push("/analyze");
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
    };

    return (
        <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
            <h1>画像アップロード</h1>
            <p>画像ファイルを選択してアップロードしてください。</p>
            <form onSubmit={handleUpload}>
                <input type="file" onChange={handleFileChange} accept="image/*" />
                <button
                    type="submit"
                    style={{
                        marginLeft: "10px",
                        padding: "8px 16px",
                        fontSize: "16px",
                    }}
                >
                    {loading ? "送信中..." : "アップロード"}
                </button>
            </form>
            {error && (
                <div style={{ color: "red", marginTop: "10px" }}>
                    <strong>Error:</strong> {error}
                </div>
            )}
        </main>
    );
};

export default UploadImagePage;