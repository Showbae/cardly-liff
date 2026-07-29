import { BottomTabBar } from '@/components/liff/BottomTabBar'
import { LiffSwipeLock } from '@/components/liff/LiffSwipeLock'

export default function LiffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <LiffSwipeLock />
      {/* extra 32px past the tab-bar padding guarantees every page has real
          scroll overflow, even short ones — LiffSwipeLock needs that room to
          pin scrollTop away from 0 and block LINE's native swipe-to-close */}
      <main className="flex-1" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px) + 32px)' }}>{children}</main>
      <BottomTabBar />
    </div>
  )
}
