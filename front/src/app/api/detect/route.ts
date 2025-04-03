import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // フロント側から送信された JSON ボディを取得（例: { image_data: ... }）
        const body = await request.json();
        const { image_data } = body;
        if (!image_data) {
            return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
        }

        // Go サービスの URL を環境変数から取得（なければデフォルトで http://localhost:8080）
        // Go サービスの /detect エンドポイントに接続する
        const goServiceURL =
            (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080") + "/detect";

        console.log(goServiceURL);
        // Go サービスへ POST リクエストを送信
        const response = await fetch(goServiceURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_data }),
        });

        // Go サービスからのレスポンスをそのまま返却
        const data = await response.json();
        // フロント側では logo_detected の真偽値をチェックするので，そのキーを含めたレスポンスとして返すようにする
        return NextResponse.json({ logo_detected: data.logo_detected }, { status: response.status });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}
