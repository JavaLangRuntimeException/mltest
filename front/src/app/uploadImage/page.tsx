"use client";

import { useState, ChangeEvent, FormEvent } from "react";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  /**
   * imageファイルアップロード処理をするコンポーネント
   *
   * aws s3 にimageをアップロードする
   * ローカル環境ではlocalstackを使用しているのでバケットを作成してから実行して欲しいです
   * awslocal s3 mb s3://ml-test-image-bucket で作成
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
    } else {
      setMessage("アップロード失敗: " + JSON.stringify(data));
    }
  };

  return (
      <main style={{ padding: "2rem" }}>
        <h1>S3 image Upload</h1>
        <p>ここは画像アップロードページです．解析する画像をアップロードしてください</p>
        <p>ローカル環境ではlocalstackに awslocal s3 mb s3://ml-test-image-bucket で作成してからuploadしてください</p>
        <p>
          <a href="/analyze">解析実行ページ</a>
          <a href="/uploadProduct">（ローカル専用）3Dモデル(fbx)アップロードページ</a>
        </p>
        <form onSubmit={handleSubmit}>
          <input type="file" onChange={handleFileChange} />
          <button type="submit">アップロード</button>
        </form>
        {message && <p>{message}</p>}
      </main>
  );
}