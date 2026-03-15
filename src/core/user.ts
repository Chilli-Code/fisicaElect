export type UserRole = 'student' | 'teacher' | 'hobby'

export interface UserProfile {
  id: string
  name: string
  avatar: string
  role: UserRole
  institution: string
  createdAt: number
  experimentsHistory: string[]
}