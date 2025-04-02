import os
import logging
import boto3

# --- ログ設定 ---
logging.basicConfig(level=logging.DEBUG)
boto3.set_stream_logger('botocore', level=logging.DEBUG)

# --- S3 クライアントの作成 ---
s3_endpoint = os.getenv('S3_ENDPOINT_URL', 'http://localstack:4566')
region_name = os.getenv('AWS_REGION', 'us-east-1')
aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID', 'test')
aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY', 'test')

s3_client = boto3.client(
    's3',
    endpoint_url=s3_endpoint,
    region_name='dummy',
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key,
)