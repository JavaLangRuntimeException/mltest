import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // フロント側から送信された JSON ボディを取得（例: { image: "data:image/jpeg;base64,..." }）
        const body = await request.json();
        const { image } = body;
        if (!image) {
            return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
        }

        // バックエンドのURLを環境変数から取得（なければデフォルトで http://localhost:8080）
        const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

        // Python 側の画像認識 API に POST リクエストを送信
        const response = await fetch(backendURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image })
        });

        // バックエンドからのレスポンスをそのままフロントに返す
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}