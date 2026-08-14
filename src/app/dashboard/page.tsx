import { redirect } from 'next/navigation'

// The Studio replaced the dashboard as the post-login landing page. This route
// stays as a redirect so bookmarks and older links still resolve; /studio owns
// the session + onboarding guards.
export default function DashboardPage() {
  redirect('/studio')
}
