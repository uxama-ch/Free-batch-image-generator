// This file provides a polyfill for JSZip in the browser environment
// It dynamically imports JSZip only when needed to reduce bundle size

let jszipPromise: Promise<any> | null = null

export async function getJSZip() {
  if (!jszipPromise) {
    jszipPromise = import("jszip").then((module) => module.default)
  }
  return jszipPromise
}
