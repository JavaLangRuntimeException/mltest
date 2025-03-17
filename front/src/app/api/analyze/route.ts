import { NextResponse } from "next/server";

/**
 *　Go APIを叩いて画像の解析結果を取得する
 * localhost:8080/analyze に POST リクエストを送信
 */
export async function POST(request: Request) {
    try {
        // NEXT_PUBLIC_BACKEND_URL で指定したバックエンド URL を取得
        const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

        // クライアントから送信された JSON ボディをパース
        const body = await request.json();

        // 環境変数のバックエンド URL を利用して Go API の /analyze エンドポイントにリクエスト
        const response = await fetch(`${backendURL}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            return NextResponse.json(
                { error: errorBody.error || "Unknown error" },
                { status: response.status }
            );
        }

        const result = await response.json();
        return NextResponse.json(result, { status: 200 });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}