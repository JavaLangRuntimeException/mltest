# ER図

```mermaid
erDiagram
"products" {
bigint id PK
string name
string description
string image_url
string model_url
datetime created_at
datetime updated_at
}
"logs" {
string session_id PK
string product_id FK
string location
datetime created_at
datetime updated_at
}

"products" 1 -- zero or more "logs" : "1--n"
```


