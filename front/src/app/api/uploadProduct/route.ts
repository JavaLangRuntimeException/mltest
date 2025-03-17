import { NextResponse } from "next/server";
import AWS from "aws-sdk";

// awslocal s3 mb s3://ml-test-product-bucket で作成
export async function POST(request: Request) {
    try {
        // リクエストから multipart/form-data をパース
        const formData = await request.formData();
        // フィールド名 "fbx" としてアップロードされたファイルを取得
        const fbxFile = formData.get("fbx");

        // fbxFile がオブジェクトでない場合や、Blob のメソッドと name プロパティが無い場合はエラーとする
        if (
            !fbxFile ||
            typeof fbxFile !== "object" ||
            typeof (fbxFile as Blob).arrayBuffer !== "function" ||
            !("name" in fbxFile)
        ) {
            return NextResponse.json(
                { error: "FBX ファイルが提供されていません" },
                { status: 400 }
            );
        }

        // 型アサーションを利用して Blob として扱い、必要な情報を取得
        const fileBlob = fbxFile as Blob;
        const fileBuffer = Buffer.from(await fileBlob.arrayBuffer());
        // ファイル名はアップロード時に付与された値を利用（存在しない場合はデフォルト名）
        const fileName = (fbxFile as { name?: string }).name || "uploaded.fbx";

        // AWS S3 の設定（環境変数 NEXT_PUBLIC_S3_* を利用）
        const s3 = new AWS.S3({
            endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT,
            s3ForcePathStyle: true,
            accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY || "test",
            secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_KEY || "test",
            region: process.env.NEXT_PUBLIC_S3_REGION || "ap-northeast-1",
        });

        // アップロード先のバケット名（環境変数がなければデフォルト値 "ml-test-product-bucket" を利用）
        const bucket =
            process.env.NEXT_PUBLIC_S3_PRODUCT_BUCKET || "ml-test-product-bucket";

        // S3 へアップロードするパラメーターを作成
        const params: AWS.S3.PutObjectRequest = {
            Bucket: bucket,
            Key: fileName, // オリジナルのファイル名をキーとして利用
            Body: fileBuffer,
            ContentType: (fbxFile as { type?: string }).type || "application/octet-stream",
        };

        // S3 にファイルアップロード
        await s3.putObject(params).promise();

        return NextResponse.json({
            message: "FBX ファイルのアップロードに成功しました",
            key: fileName,
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
}