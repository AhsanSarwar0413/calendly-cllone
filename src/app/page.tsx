import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { CalendarRange, Github } from "lucide-react";
import { redirect } from "next/navigation";

export default function HomePage() {
  const { userId } = auth();
  if (userId != null) redirect('/events');

  return (
    <>
      <header className="flex py-2 border-b bg-card">
        <nav className="font-medium flex items-center text-sm gap-6 container">
          <div className="flex items-center gap-2 font-semibold mr-auto">
            <CalendarRange className="size-6" />
            <span className="sr-only md:not-sr-only">Calendor</span>
          </div>
          <div className="ml-auto size-10 mr-5 xl:mr-0">
            <Button asChild variant="outline"><SignInButton /></Button>
          </div>
        </nav>
      </header>
      <div className="flex flex-col h-[calc(100vh_-_67px)]">
        <div className="text-center container mx-auto flex flex-col mt-[15%] lg:mt-[10%] md:mt-[5%] flex-grow">
          <h1 className="lg:text-6xl text-5xl font-semibold mb-10">Welcome To Calendor</h1>
          <p className="text-muted-foreground mb-10">Introducing a groundbreaking scheduling app that streamlines how you manage appointments and meetings. Effortlessly set your availability and share personalized booking links with clients and colleagues. Experience enhanced productivity with automated reminders and seamless calendar integration!</p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline"><SignInButton /></Button>
            <Button asChild className="bg-slate-500 hover:bg-slate-800"><SignUpButton /></Button>
          </div>
        </div>
        <footer className="container flex justify-end">
          <a href="https://github.com/AhsanSarwar0413" className="flex gap-2">
            <span>&copy; Made By</span> <Github className="hover:text-red-500" />
          </a>
        </footer>
      </div>
    </>
  );
}