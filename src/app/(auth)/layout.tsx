import Logo from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
       <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Logo className="h-10 text-primary" />
        </div>
        {children}
      </div>
    </div>
  );
}
