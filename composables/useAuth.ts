import { ref } from 'vue'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import type { Auth, User } from 'firebase/auth'

// コールバック関数の型定義
type OnLoginSuccess = (user: User) => Promise<void> | void
type OnLogoutSuccess = () => Promise<void> | void
type OnAuthStateChange = (user: User | null) => Promise<void> | void

export const useAuth = () => {
  // ユーザーのログイン状態と情報を管理する変数
  const isLoggedIn = ref<boolean>(false)
  const currentUser = ref<User | null>(null)

  // Googleアカウントでのログイン処理
  const login = async (auth: Auth, onLoginSuccess?: OnLoginSuccess): Promise<User> => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      currentUser.value = result.user
      isLoggedIn.value = true
      if (onLoginSuccess) {
        await onLoginSuccess(result.user)
      }
      return result.user
    } catch (error) {
      console.error('ログインエラー:', error)
      throw error
    }
  }

  // ログアウト処理
  const logout = async (auth: Auth, onLogoutSuccess?: OnLogoutSuccess): Promise<void> => {
    try {
      await signOut(auth)
      currentUser.value = null
      isLoggedIn.value = false
      if (onLogoutSuccess) {
        await onLogoutSuccess()
      }
    } catch (error) {
      console.error('ログアウトエラー:', error)
      throw error
    }
  }

  // 認証状態の監視と初期化
  const initAuth = (auth: Auth, onAuthStateChange?: OnAuthStateChange): void => {
    onAuthStateChanged(auth, async (user) => {
      currentUser.value = user
      isLoggedIn.value = !!user
      if (onAuthStateChange) {
        await onAuthStateChange(user)
      }
    })
  }

  return {
    isLoggedIn,
    currentUser,
    login,
    logout,
    initAuth
  }
} 