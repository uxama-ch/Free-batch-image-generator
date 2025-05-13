"use client"

import type React from "react"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  homeHref?: string
}

export function Breadcrumb({ items, homeHref = "/" }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
        <li>
          <Link href={homeHref} className="flex items-center hover:text-foreground">
            <Home className="h-4 w-4 mr-1" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            {index === items.length - 1 || !item.href ? (
              <span className="font-medium text-foreground" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export const BreadcrumbList = ({ children }: { children: React.ReactNode }) => (
  <ol className="flex items-center space-x-2 text-sm text-muted-foreground">{children}</ol>
)

export const BreadcrumbItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-center">{children}</li>
)

export const BreadcrumbLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="hover:text-foreground">
    {children}
  </Link>
)

export const BreadcrumbPage = ({ children }: { children: React.ReactNode }) => (
  <span className="font-medium text-foreground" aria-current="page">
    {children}
  </span>
)

export const BreadcrumbSeparator = () => <ChevronRight className="h-4 w-4 mx-1" />

export const BreadcrumbEllipsis = () => <span>...</span>
