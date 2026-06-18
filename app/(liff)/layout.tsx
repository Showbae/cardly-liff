import { BottomTabBar } from '@/components/liff/BottomTabBar'

export default function LiffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <main className="flex-1 pb-20">{children}</main>
      <BottomTabBar />
    </div>
  )
}
