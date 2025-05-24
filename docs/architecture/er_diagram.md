# ER図

```mermaid
erDiagram
"products" { 
    bigint id PK
    string name
    string description
    string model_url
}

"logs" { 
    bigint id PK
    bigint session_id
    bigint products_id FK
    bigint recommended_regions_id FK
    bigint ar_regions_id FK
    bigint emotions_id FK
    datetime created_at
    datetime updated_at
}

"emotions" {
    bigint id PK
    float sad
    float happy
    float angry
    float neutral
    float surprise
    float fear
    float disgust
}

"regions" {
    bigint id PK
    string name
}
 
"emotions" 1 --1 "logs" : "1--1"
"products" 1 -- zero or more "logs" : "1--n"
"regions" 1 -- zero or more "logs" : "1--n"
```


