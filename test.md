# Моя схема базы данных

```dbml
Project "Мой Проект" {
  database_type: 'PostgreSQL'
  Note: 'Это демонстрационный проект с поддержкой русского языка'
}

Table "пользователи" {
  id int [pk, increment]
  имя varchar
  email varchar
  создан_в timestamp
}

Table "посты" {
  id int [pk, increment]
  заголовок varchar
  текст text
  автор_id int [ref: > пользователи.id]
  создан_в timestamp
}
```
