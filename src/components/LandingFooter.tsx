
import Link from "next/link";
import Logo from "@/components/Logo";

const footerLinks = [
  { href: "#", label: "About" },
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Contact" },
  { href: "#", label: "Support" },
];

export default function LandingFooter() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex flex-col items-center md:items-start">
                <Logo className="h-8 w-auto" />
                <p className="mt-2 text-sm text-muted-foreground">Smart route sharing for smarter commutes.</p>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                {footerLinks.map((link) => (
                    <Link key={link.label} href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                        {link.label}
                    </Link>
                ))}
            </nav>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Qmuter. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
