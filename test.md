# Моя схема базы данных

```dbml
Project "MyProject" {
  database_type: 'PostgreSQL'
}

Table "users" {
  id int [pk, increment]
  name varchar
  email varchar
  created_at timestamp
}

Table "posts" {
  id int [pk, increment]
  title varchar
  text text
  author_id int [ref: > users.id]
  created_at timestamp
}
```
