export interface User {
  email: string
  token: string
  username: string
  bio: string
  image: string
}

export interface Profile {
  username: string
  bio: string
  image: string
  following: boolean
}

export interface Article {
  slug: string
  title: string
  description: string
  body: string
  tagList: string[]
  createdAt: string
  updatedAt: string
  favorited: boolean
  favoritesCount: number
  author: Profile
}

export interface Comment {
  id: number
  createdAt: string
  updatedAt: string
  body: string
  author: Profile
}

export interface ArticlesResponse {
  articles: Article[]
  articlesCount: number
}

export interface SingleArticleResponse {
  article: Article
}

export interface CommentResponse {
  comment: Comment
}

export interface CommentsResponse {
  comments: Comment[]
}

export interface TagsResponse {
  tags: string[]
}

export interface ProfileResponse {
  profile: Profile
}

export interface UserResponse {
  user: User
}
