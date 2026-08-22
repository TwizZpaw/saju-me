import './App.css'
import { LoginScreen } from './components/auth/LoginScreen'
import { ErrorMessage } from './components/common/ErrorMessage'
import { StatusScreen } from './components/common/StatusScreen'
import { AppShell } from './components/layout/AppShell'
import { Hero } from './components/layout/Hero'
import { ReadingsSidebar } from './components/layout/ReadingsSidebar'
import { ReadingArchive } from './components/reading/ReadingArchive'
import { ResultPanel } from './components/reading/ResultPanel'
import { SajuForm } from './components/reading/SajuForm'
import { ShareView } from './components/share/ShareView'
import { useSajuApp } from './hooks/useSajuApp'

export default function App() {
  const app = useSajuApp()

  if (!app.isSupabaseConfigured) {
    return (
      <AppShell withGlow={false}>
        <main className="shell">
          <ErrorMessage message="Supabase 환경 변수가 없습니다. Netlify에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 넣고 재배포하세요." />
        </main>
      </AppShell>
    )
  }

  if (app.authLoading || app.shareLoading) {
    return (
      <StatusScreen
        message={app.shareLoading ? '친구의 운명을 불러오는 중…' : '별을 맞추는 중…'}
      />
    )
  }

  if (app.isShareView) {
    return (
      <ShareView
        user={app.user}
        error={app.error}
        sharedReading={app.sharedReading}
        authBusy={app.authBusy}
        onLogin={app.handleGoogleLogin}
      />
    )
  }

  if (!app.user) {
    return (
      <LoginScreen
        readingsCount={app.readingsCount}
        authBusy={app.authBusy}
        error={app.error}
        onLogin={app.handleGoogleLogin}
      />
    )
  }

  return (
    <AppShell>
      <ReadingsSidebar
        readings={app.readings}
        selectedId={app.selectedId}
        user={app.user}
        authBusy={app.authBusy}
        onSelectReading={app.handleSelectReading}
        onSignOut={app.handleSignOut}
      />

      <main className="shell">
        <Hero
          headline="나의 운명을 읽어 보세요"
          lede="생년월일과 시간을 입력하면, 당신만의 사주를 풀어 드립니다."
        />

        {app.selectedReading && (
          <ReadingArchive
            reading={app.selectedReading}
            showActions
            deleting={app.deleting}
            shareNotice={app.shareNotice}
            onDelete={app.handleDelete}
            onShare={app.handleShare}
          />
        )}

        {!app.selectedReading && (
          <SajuForm
            name={app.name}
            birthDate={app.birthDate}
            birthTime={app.birthTime}
            gender={app.gender}
            calendarType={app.calendarType}
            loading={app.loading}
            error={app.error}
            onNameChange={app.setName}
            onBirthDateChange={app.setBirthDate}
            onBirthTimeChange={app.setBirthTime}
            onGenderChange={app.setGender}
            onCalendarTypeChange={app.setCalendarType}
            onSubmit={app.handleAnalyze}
          />
        )}

        {app.selectedReading && (
          <ErrorMessage message={app.error} />
        )}

        {!app.selectedReading && (
          <ResultPanel result={app.result} />
        )}
      </main>
    </AppShell>
  )
}
