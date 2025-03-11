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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("ファイルを選択してください");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
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
        <h1>Next.js S3 Upload Demo</h1>
        <form onSubmit={handleSubmit}>
          <input type="file" onChange={handleFileChange} />
          <button type="submit">アップロード</button>
        </form>
        {message && <p>{message}</p>}
      </main>
  );
}