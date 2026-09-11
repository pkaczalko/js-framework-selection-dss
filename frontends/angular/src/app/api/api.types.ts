export interface Author {
  username: string;
  bio: string;
  image: string;
  following: boolean;
}

export interface User {
  email: string;
  token: string;
  username: string;
  bio: string;
  image: string;
}

export interface Profile {
  username: string;
  bio: string;
  image: string;
  following: boolean;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: Author;
}

export interface Comment {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: Author;
}

export interface ArticlesResponse {
  articles: Article[];
  articlesCount: number;
}

export interface TagsResponse {
  tags: string[];
}
