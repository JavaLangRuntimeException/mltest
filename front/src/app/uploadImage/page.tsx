"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  /**
   * imageファイルアップロード処理
   * aws s3 に image をアップロードします．
   * ローカル環境の場合，awslocal s3 mb s3://ml-test-image-bucket でバケットを作成してから実行してください
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("ファイルを選択してください");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/uploadImage", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("アップロード成功: " + JSON.stringify(data));
      // 画像アップロード成功後，ファイル名をクエリパラメータとして/analyzeへ遷移する
      router.push(`/analyze?image=${encodeURIComponent(file.name)}`);
    } else {
      setMessage("アップロード失敗: " + JSON.stringify(data));
    }
  };

  return (
      <main style={{ padding: "2rem" }}>
        <h1>S3 image Upload</h1>
        <p>画像アップロードページです．解析する画像を選んでください。</p>
        <p>
          ローカル環境の場合は、awslocal s3 mb s3://ml-test-image-bucket でバケットを作成してからアップロードしてください
        </p>
        <form onSubmit={handleSubmit}>
          <input type="file" onChange={handleFileChange} />
          <button type="submit">アップロード</button>
        </form>
        {message && <p>{message}</p>}
      </main>
  );
}