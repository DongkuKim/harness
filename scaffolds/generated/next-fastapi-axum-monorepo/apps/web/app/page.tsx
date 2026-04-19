import { Button } from "@workspace/ui/ui/button"

export default function Page() {
  return (
    <main className="flex min-h-svh items-center p-6">
      <section className="flex w-full max-w-xl flex-col gap-6 rounded-2xl border bg-background p-8 shadow-sm">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Starter fixture
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Project ready!
          </h1>
          <p className="max-w-prose text-sm leading-6 text-muted-foreground">
            This page gives agents a fast validation target for the shared UI
            shell, a real button import, and the dark mode hotkey.
          </p>
        </div>
        <ul className="grid gap-2 text-sm leading-6">
          <li>Shared button component renders</li>
          <li>Dark mode hotkey flips the theme</li>
          <li>Accessibility checks stay green</li>
        </ul>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Button</Button>
          <p className="text-xs text-muted-foreground">
            Press <kbd>d</kbd> to toggle dark mode
          </p>
        </div>
      </section>
    </main>
  )
}
