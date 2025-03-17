"use client";

import { useState, ChangeEvent, FormEvent } from "react";

/**
 * ProductUploadPage コンポーネント
 *
 * FBX ファイルをアップロードするページ
 * このページは本番環境では用意しない
 * ローカルのS3(localstack)ではコンテナを落とすとデータやバケットが消えるのでデータアップロード用に作成
 */
export default function ProductUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!file) {
            alert("FBX ファイルを選択してください");
            return;
        }

        // FBXファイルアップロード用の FormData を作成
        const formData = new FormData();
        // キーはアップロード API 側で受けるキー名（ここでは "fbx" としています）
        formData.append("fbx", file);

        const response = await fetch("/api/uploadProduct", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            setMessage("アップロード成功: " + JSON.stringify(data));
        } else {
            setMessage("アップロード失敗: " + JSON.stringify(data));
        }
    };

    return (
        <main style={{ padding: "2rem" }}>
            <h1>[ローカル環境用]FBXファイルのアップロード用</h1>
            <p>ml-test-product-bucket に FBX ファイルをアップロードするページ</p>
            <p>localstackに awslocal s3 mb s3://ml-test-product-bucket で作成してからuploadしてください</p>
            <p>※ 本番環境では使用しないでください</p>
            <form onSubmit={handleSubmit}>
                <input type="file" accept=".fbx" onChange={handleFileChange} />
                <button type="submit">アップロード</button>
            </form>
            {message && <p>{message}</p>}
        </main>
    );
}