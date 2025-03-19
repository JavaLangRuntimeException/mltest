import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // フロント側から送信された JSON ボディを取得（例: { image: "data:image/jpeg;base64,..." }）
        const body = await request.json();
        const { image } = body;
        if (!image) {
            return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
        }

        // Go サービスの URL を環境変数から取得（なければデフォルトで http://localhost:8081）
        // ※ Go サービスの /detect エンドポイントに接続します。
        const goServiceURL =
            (process.env.NEXT_PUBLIC_GO_SERVICE_URL || "http://localhost:8080") + "/detect";

        // Go サービスへ POST リクエストを送信
        const response = await fetch(goServiceURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image }),
        });

        // Go サービスからのレスポンスをそのまま返却
        const data = await response.json();
        // フロント側では logo_detected の真偽値をチェックするので、
        // そのキーを含めたレスポンスとして返します。
        return NextResponse.json({ logo_detected: data.logo_detected }, { status: response.status });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}
