
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LandingFooter from "@/components/LandingFooter";
import LandingHeader from "@/components/LandingHeader";

const blogPosts = [
    {
        title: "5 Simple Ways to Make Your Commute Greener",
        description: "From sharing rides to checking your tire pressure, here are five practical tips to make your commute more sustainable.",
        image: "https://placehold.co/600x400.png",
        imageHint: "green leaf car",
        link: "#",
        date: "October 26, 2023",
        category: "Sustainable Living"
    },
    {
        title: "Community Spotlight: The Top Qmuter Route in Wellington",
        description: "Learn about the most popular shared commute and the people who make it happen every day.",
        image: "https://placehold.co/600x400.png",
        imageHint: "wellington city",
        link: "#",
        date: "October 22, 2023",
        category: "Community Stories"
    },
    {
        title: "User Story: How a Student Saved $120 a Month",
        description: "Meet Mark, a uni student who's saving over a hundred dollars on petrol by sharing his commute.",
        image: "https://placehold.co/600x400.png",
        imageHint: "happy student",
        link: "#",
        date: "October 18, 2023",
        category: "User Story"
    },
    {
        title: "New Feature: Route Voting & Community Goals",
        description: "We're excited to announce our latest update, making it easier than ever to have a say in new routes and track our collective impact.",
        image: "https://placehold.co/600x400.png",
        imageHint: "app interface community",
        link: "#",
        date: "October 15, 2023",
        category: "App Updates"
    },
];

export default function BlogPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <LandingHeader />
        <main className="flex-1">
            <div className="container mx-auto max-w-5xl p-4 py-12">
                <header className="my-8 text-center">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Qmuter Blog</h1>
                    <p className="mt-2 text-lg text-muted-foreground">
                    Tips, stories, and updates from the Qmuter community.
                    </p>
                </header>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {blogPosts.map((post) => (
                        <Card key={post.title} className="overflow-hidden flex flex-col">
                             <Link href={post.link} className="block">
                                <Image src={post.image} alt={post.title} width={600} height={400} className="w-full h-48 object-cover" data-ai-hint={post.imageHint} />
                            </Link>
                            <div className="p-6 flex flex-col flex-grow">
                                <p className="text-sm text-muted-foreground">{post.category} &middot; {post.date}</p>
                                <h2 className="mt-2 text-xl font-semibold">
                                    <Link href={post.link} className="hover:text-primary">{post.title}</Link>
                                </h2>
                                <p className="mt-2 text-muted-foreground flex-grow">{post.description}</p>
                                <Button variant="link" asChild className="p-0 h-auto mt-4 self-start">
                                    <Link href={post.link}>Read More &rarr;</Link>
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
                 <div className="text-center mt-16">
                     <Button variant="outline" asChild>
                        <Link href="/">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to Home
                        </Link>
                    </Button>
                </div>
            </div>
        </main>
        <LandingFooter />
    </div>
  );
}
