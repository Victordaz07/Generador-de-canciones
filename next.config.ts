import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @napi-rs/canvas incluye un binario nativo (.node); Turbopack no sabe
  // empaquetarlo, así que se deja fuera del bundle y se resuelve con el
  // require nativo de Node en runtime.
  serverExternalPackages: ["@napi-rs/canvas"],
};

export default nextConfig;
