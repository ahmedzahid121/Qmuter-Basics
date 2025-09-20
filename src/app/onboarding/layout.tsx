export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4 dark:from-slate-900 dark:to-green-950">
      {children}
    </div>
  );
}
