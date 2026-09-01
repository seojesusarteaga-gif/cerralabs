/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Lo rellena el middleware cuando hay sesión válida en /admin. */
    usuario?: {
      id: string;
      email: string;
      nombre: string;
    };
  }
}
