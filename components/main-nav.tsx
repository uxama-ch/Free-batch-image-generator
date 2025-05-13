"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { ImageIcon, HelpCircle, Info, Mail, SearchIcon } from "lucide-react"
import { Search } from "@/components/search"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export function MainNav() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: <ImageIcon className="h-4 w-4 mr-2" />,
    },
    {
      name: "How to Use",
      href: "/how-to-use",
      icon: <HelpCircle className="h-4 w-4 mr-2" />,
    },
    {
      name: "About",
      href: "/about",
      icon: <Info className="h-4 w-4 mr-2" />,
    },
    {
      name: "Contact",
      href: "/contact",
      icon: <Mail className="h-4 w-4 mr-2" />,
    },
  ]

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <ImageIcon className="h-6 w-6" />
            <span className="font-bold">Free Batch Image Generator</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="hidden md:flex items-center">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                asChild
                className={cn("mx-1", pathname === item.href && "bg-muted")}
              >
                <Link href={item.href}>
                  {item.icon}
                  {item.name}
                </Link>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <Search />
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <SearchIcon className="h-5 w-5" />
                  <span className="sr-only">Search</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top">
                <SheetHeader className="mb-4">
                  <SheetTitle>Search</SheetTitle>
                  <SheetDescription>Search for content across the site</SheetDescription>
                </SheetHeader>
                <Search />
              </SheetContent>
            </Sheet>

            <ModeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}
